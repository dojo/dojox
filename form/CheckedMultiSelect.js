dojo.provide("dojox.form.CheckedMultiSelect");

dojo.require("dijit.form.MultiSelect");
dojo.require("dijit.form.CheckBox");

dojo.setObject("dojox.form.util.getScrollbarWidth", function(){
	// summary:
	//		A function to return the calculated width of scroll bars
	if(dojox.form.util._scrollBarWidth){
		return dojox.form.util._scrollBarWidth;
	}
	dojo.setObject("dojox.form.util._scrollBarWidth", 18);
	try{
		var e = document.createElement("div");
		e.style.cssText = "top:0;left:0;width:100px;height:100px;overflow:scroll;position:absolute;visibility:hidden;";
		document.body.appendChild(e);
		dojox.form.util._scrollBarWidth = e.offsetWidth - e.clientWidth;
		document.body.removeChild(e);
		delete e;
	}catch (ex){}
	return dojox.form.util._scrollBarWidth;
});

dojo.declare("dojox.form._CheckedMultiSelectItem", 
	[dijit._Widget, dijit._Templated],
	{
	// summary:
	//		The individual items for a CheckedMultiSelect

	widgetsInTemplate: true,
	templatePath: dojo.moduleUrl("dojox.form", "resources/_CheckedMultiSelectItem.html"),

	// option: Element
	//		The option that is associated with this item
	option: null,

	_changeBox: function(){
		// summary:
		//		Called to force the select to match the state of the check box
		//		(only on click of the checkbox)
		this.option.selected = this.checkBox.getValue() && true;
	},

	_labelClick: function(){
		// summary:
		//		Called when the label portion is clicked
		var cb = this.checkBox;
		cb.setValue(!cb.getValue());
		this._changeBox();
	},

	_updateBox: function(){
		// summary:
		//		Called to force the box to match the state of the select
		this.checkBox.setValue(this.option.selected);
	}
});

dojo.declare("dojox.form.CheckedMultiSelect", dijit.form.MultiSelect, {
	// summary:
	//		Extends the core dijit MultiSelect to provide a "checkbox" selector

	templateString: "",
	templatePath: dojo.moduleUrl("dojox.form", "resources/CheckedMultiSelect.html"),

	// children: dojox.form._CheckedMultiSelectItem[]
	//		Array of all our children (for updating them)
	children: [],

	_updateChildren: function(){
		// summary:
		//		Called to update the checked states of my children to match me
		dojo.forEach(this.children,function(i){
			i._updateBox();
		});
	},
	
	_addChild: function(/*Element*/ option){
		// summary:
		//		Adds and returns a child for the given option.
		var item = new dojox.form._CheckedMultiSelectItem({option: option});
		this.selectBody.appendChild(item.domNode);
		return item;
	},

	_loadChildren: function(){
		// summary:
		//		Reloads the children to match our box.

		// Destroy any existing children before loading them again
		dojo.forEach(this.children, function(i){
			i.destroyRecursive();
		});
		this.children = dojo.query("option", this.domNode).map(function(i){
			return this._addChild(i);
		}, this);
		
		// Update our width and scroll bar display
		var len = this.children.length,
			scr = (len > this.size),
			d = this.wrapperDiv,
			sw = dojox.form.util.getScrollbarWidth();

		d.style.overflowY = (scr ? "scroll" : "");

		dojo.contentBox(d,{
			w: (dojo.marginBox(this.tableDiv).w + (scr ? sw : 0) + (len === 0 ? 20 : 0))
		});
		
		// Update the statuses of the children
		this._updateChildren();
	},

	addSelected: function(select){
		this.inherited(arguments);
		
		// Reload my children and the children of the guy pointing to me
		if(select._loadChildren){
			select._loadChildren();
		}
		this._loadChildren();
	},

	postCreate: function(){
		this.inherited(arguments);

		// Create children to find our max height
		this.children = [];
		for(var i = 0; i < this.size; i++){
			this.children.push(this._addChild({ innerHTML: "" + i}));
		}
		
		// Hack safari since for some reason it's calculating 10 pixels too 
		// high.
		// TODO: Figure out why this is happening
		dojo.contentBox(this.wrapperDiv, {
			h: dojo.marginBox(this.tableDiv).h - (dojo.isSafari ? 10 : 0)
		});

	},

	startup: function(){
		if(this._started){ return; }
		this.inherited(arguments);

		// Load children and make connections
		this._loadChildren();
		dojo.connect(this, "setValue", this, "_updateChildren");
		dojo.connect(this, "invertSelection", this, "_updateChildren");
		this._started = true;
	}
});