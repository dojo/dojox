define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom",
	"dojo/dom-construct",
	"dojo/_base/array",
	"dojo/query",
	"dijit/registry",
	"./_Container"
], function(declare, lang, dom, domconstruct, array, query, registry, _Container){
	/*=====
		declare = dojo.declare;
		dom = dojo.dom;
		_Container = dojox.mvc._Container;
	=====*/

	return declare("dojox.mvc.Repeat", _Container, {
		// summary:
		//		A model-bound container which binds to a collection within a data model
		//		and produces a repeating user-interface from a template for each
		//		iteration within the collection.
		//
		// description:
		//		A repeat is bound to an intermediate dojo.Stateful node corresponding
		//		to an array in the data model. Child dijits or custom view components
		//		inside it inherit their parent data binding context from it.

		// index: Integer
		//		An index used to track the current iteration when the repeating UI is
		//		produced. This may be used to parameterize the content in the repeat
		//		template for the current iteration.
		//
		//		For example, consider a collection of search or query results where
		//		each item contains a "Name" property used to prime the "Results" data
		//		model. Then, the following CRUD-style UI displays all the names in
		//		the search results in text boxes where they may be updated or such.
		//
		//		|	<div dojoType="dojox.mvc.Repeat" ref="Results">
		//		|		<div class="row" dojoType="dojox.mvc.Group" ref="${this.index}">
		//		|			<label for="nameInput${this.index}">Name:</label>
		//		|			<input dojoType="dijit.form.TextBox" id="nameInput${this.index}" ref="'Name'"></input>
		//		|		</div>
		//		|	</div>
		index : 0,

		// useParent: String
		//		id of the DOM node to use as the parent for the repeating items, similar to useParentId processed a little differently 
		useParent : "",
		
		// removeRepeatNode: boolean
		//		When true the dom node for the Repeat and Groups within the Repeat
		//		will be removed, their children will be placed into the parent node 
		//		of the Repeat node.  This should be set to true when working with 
		//		a Repeat inside of a dojox.mobile list.		
		removeRepeatNode : false,

		startup: function(){
			// This code needed for ticket 14423 is using removeRepeatNode to work with mobile.lists
			// this.select and this.onCheckStateChanged are called by ListItem so they need to be set
			// but it seems like a bit of a hack.
			if(this.removeRepeatNode){				
				var parent = null;
				if(lang.isFunction(this.getParent)){
					if(this.getParent()){
						this.select = this.getParent().select;
						this.onCheckStateChanged = this.getParent().onCheckStateChanged;
					}
				}			
			}
			this.inherited(arguments);			
		},

		// summary:
		//		Override and save template from body.
		postscript: function(params, srcNodeRef){
			//this.srcNodeRef = dom.byId(srcNodeRef);
			if(this.useParent && dom.byId(this.useParent)){
				this.srcNodeRef = dom.byId(this.useParent);				
			} else{
				this.srcNodeRef = dom.byId(srcNodeRef);
			}
			if(this.srcNodeRef){
				if(this.templateString == ""){ // only overwrite templateString if it has not been set
					this.templateString = this.srcNodeRef.innerHTML;
				}
				this.srcNodeRef.innerHTML = "";
			}
			this.inherited(arguments);
		},

		////////////////////// PRIVATE METHODS ////////////////////////

		_updateBinding: function(name, old, current){
			// summary:
			//		Rebuild repeating UI if data binding changes.
			// tags:
			//		private
			this.inherited(arguments);
			this._buildContained();
		},

		_buildContained: function(){
			// summary:
			//		Destroy any existing contained view, recreate the repeating UI
			//		markup and parse the new contents.
			// tags:
			//		private

			// TODO: Potential optimization: only create new widgets for insert, only destroy for delete.
			if(this.useParent && dom.byId(this.useParent)){
				this.srcNodeRef = dom.byId(this.useParent);				
			}

			this._destroyBody();
			this._updateAddRemoveWatch();

			var insert = "";
			for(this.index = 0; this.get("binding").get(this.index); this.index++){
				insert += this._exprRepl(this.templateString);
			}
			var repeatNode = this.srcNodeRef || this.domNode;
			repeatNode.innerHTML = insert;

			// srcNodeRef is used in _createBody, so in the programmatic create case where repeatNode was set  
			// from this.domNode we need to set srcNodeRef from repeatNode
			this.srcNodeRef = repeatNode;

			this._createBody();

			if(this.removeRepeatNode){				
				var repeatnode = this.domNode;
				if(!this.savedParentId && this.domNode.parentNode && this.domNode.parentNode.id){
					this.savedParentId = this.domNode.parentNode.id;
				}
				var repeatParent = dom.byId(this.savedParentId);			
				if(repeatnode && repeatnode.children){
					var t3 = registry.findWidgets(repeatnode);
					var parentcnt = t3.length;
					for(var j=parentcnt;j>0;j--){
						if(t3[j-1].declaredClass=="dojox.mvc.Group"){
							var cnt = repeatnode.children[j-1].children.length;
							var selForList = registry.byId(repeatParent.id).select;
							for(var i=cnt;i>0;i--){
								registry.byId(repeatnode.children[j-1].id).select = selForList;
								domconstruct.place(repeatnode.children[j-1].removeChild(repeatnode.children[j-1].children[i-1]), repeatParent, "first");
							}							
						}else{
							domconstruct.place(repeatnode.removeChild(repeatnode.children[j-1]), repeatParent, "first");							
						}
					}
					domconstruct.destroy(repeatnode);
				}
			}			
		},

		_updateAddRemoveWatch: function(){
			// summary:
			//		Updates the watch handle when binding changes.
			// tags:
			//		private
			if(this._addRemoveWatch){
				this._addRemoveWatch.unwatch();
			}
			var pThis = this;
			this._addRemoveWatch = this.get("binding").watch(function(name,old,current){
				if(/^[0-9]+$/.test(name.toString())){
					if(!old || !current){
						pThis._buildContained();
					} // else not an insert or delete, will get updated in above
				}
			});
		}
	});
});
