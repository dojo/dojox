dojo.provide("dojox.widget.FilePicker");

dojo.require("dojox.widget.RollingList");

dojo.require("dojo.i18n"); 
dojo.requireLocalization("dojox.widget", "FilePicker"); 

dojo.declare("dojox.widget._FileInfoPane", 
	[dojox.widget._StoreBasedRollingListPane, dijit._Templated], {
	// summary: a pane to display the information for the currently-selected
	//	file
	
	// templatePath: string
	//	Our template path
	templatePath: dojo.moduleUrl("dojox.widget", "FilePicker/_FileInfoPane.html"),
	
	postMixInProperties: function(){
		this._messages = dojo.i18n.getLocalization("dojox.widget", "FilePicker", this.lang);
		this.inherited(arguments);
	},

	onItems: function(){
		// summary:
		//	called after a fetch or load - at this point, this.items should be
		//  set and loaded.
		var store = this.store, item = this.items[0];
		if(!item){
			this._onError("Load", new Error("No item defined"));
		}else{
			this.nameNode.innerHTML = store.getLabel(item);
			this.pathNode.innerHTML = store.getIdentity(item);
			this.sizeNode.innerHTML = store.getValue(item, "size");
			this.parentWidget.scrollIntoView(this);
			this.inherited(arguments);
		}
	}
});

dojo.declare("dojox.widget.FilePicker", dojox.widget.RollingList, {
	// summary: a specialized version of RollingList that handles file information
	//  in a store
	
	getChildItems: function(item){
		var ret = this.inherited(arguments);
		if(!ret && this.store.getValue(item, "directory")){
			// It's an empty directory - so pass through an empty array
			ret = [];
		}
		return ret;
	},
	
	getPaneForItem: function(item, parentPane, children){
		var ret = this.inherited(arguments);
		if(!ret && this.store.isItem(item) && !this.store.getValue(item, "directory")){
			// return back a file info pane
			ret = new dojox.widget._FileInfoPane({store: this.store,
											items: [item],
											parentWidget: this,
											parentPane: parentPane});
		}
		return ret;
	}
});