dojo.provide("dojox.form.CheckedMultiSelect");

dojo.require("dijit.form.MultiSelect");
dojo.require("dijit.form.CheckBox");

dojo.declare("dojox.form._CheckedMultiSelectItem", 
	[dijit._Widget, dijit._Templated],
	{
	// summary:
	//		The individual items for a CheckedMultiSelect

	widgetsInTemplate: true,
	templatePath: dojo.moduleUrl("dojox.form", "resources/_CheckedMultiSelectItem.html"),

	baseClass: "dojoxMultiSelectItem",

	// option: Element
	//		The option that is associated with this item
	option: null,
	parent: null,
	
	// disabled: boolean
	//		Whether or not this widget is disabled
	disabled: false,

	_changeBox: function(){
		// summary:
		//		Called to force the select to match the state of the check box
		//		(only on click of the checkbox)
		this.option.selected = this.checkBox.getValue() && true;

		// fire the parent's change
		this.parent._onChange();
		
		// refocus the parent
		this.parent.focus();
	},

	_labelClick: function(){
		// summary:
		//		Called when the label portion is clicked
		dojo.stopEvent(e);
		if (this.disabled){
			return;
		}
		var cb = this.checkBox;
		cb.setValue(!cb.getValue());
		this._changeBox();
	},

	_onMouse: function(e){
		// summary:
		//		Sets the hover state depending on mouse state (passes through
		//		to the check box)
		this.checkBox._onMouse(e);
	},
	
	_onClick: function(e){
		// summary:
		//		Sets the click state (passes through to the check box)
		this.checkBox._onClick(e);
	},
	
	_updateBox: function(){
		// summary:
		//		Called to force the box to match the state of the select
		this.checkBox.setValue(this.option.selected);
	},
	
	setAttribute: function(attr, value){
		// summary:
		//		Disables (or enables) all the children as well
		this.inherited(arguments);
		switch(attr){
			case "disabled":
				this.checkBox.setAttribute(attr, value);
				break;
			default:
				break;
		}
	}
});

dojo.declare("dojox.form.CheckedMultiSelect", dijit.form.MultiSelect, {
	// summary:
	//		Extends the core dijit MultiSelect to provide a "checkbox" selector

	templateString: "",
	templatePath: dojo.moduleUrl("dojox.form", "resources/CheckedMultiSelect.html"),

	baseClass: "dojoxMultiSelect",

	// children: dojox.form._CheckedMultiSelectItem[]
	//		Array of all our children (for updating them)
	children: [],

	_mouseDown: function(e){
		// summary:
		//		Cancels the mousedown event to prevent others from stealing
		//		focus
		dojo.stopEvent(e);
	},

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
		var item = new dojox.form._CheckedMultiSelectItem({option: option, parent: this});
		this.wrapperDiv.appendChild(item.domNode);
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
		
		// Update the statuses of the children
		this._updateChildren();
	},

	addOption: function(/*Element*/ option){
		// summary: Adds the given option to the select
console.log("Adding");
console.debug(option);
		this.containerNode.appendChild(option);
		this._loadChildren();
	},
	
	addSelected: function(select){
		this.inherited(arguments);
		
		// Reload my children and the children of the guy pointing to me
		if(select._loadChildren){
			select._loadChildren();
		}
		this._loadChildren();
	},
	
	setAttribute: function(attr, value){
		// summary:
		//		Disable (or enable) all the children as well
		this.inherited(arguments);
		switch(attr){
			case "disabled":
				dojo.forEach(this.children, function(i){
					if (i && i.setAttribute){
						i.setAttribute(attr, value);
					}
				});
				break;
			default:
				break;
		}
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