dojo.provide("dojox.form._FormSelectWidget");

dojo.require("dijit.form._FormWidget");

dojo.declare("dojox.form._FormSelectWidget", dijit.form._FormWidget, {
	// _multiValue: Boolean
	//		Whether or not we are multi-valued (for form)
	_multiValue: false,

	/*=====
	dojox.form.__SelectOption = function(){
		//	value: String
		//		The value of the option.  Setting to empty (or missing) will
		//		place a separator at that location
		//	label: String
		//		The label for our option.  It can contain html tags.
		//  selected: Boolean
		//		Whether or not we are a selected option
		this.value = value;
		this.label = label;
		this.selected = selected;
	}
	=====*/

	// options: dojox.form.__SelectOption[]
	//		our set of options
	options: null,
	
	// _connections: Object
	//		The connections we need to make for updating states
	_connections: {
		"_updateSelection": ["onChange"],
		"_loadChildren": ["startup"]
	},

	_delayedLoad: function(){
		// summary: 
		//		Launches "_loadChildren" on a slight delay to improve performance
		//		for a common case where you call "addOption" or "removeOption"
		//		repeatedly.  That way, we only need to iterate once for rapid-fire
		//		adds or removes.
		if(this._pendingLoad){
			window.clearTimeout(this._pendingLoad);
			this._pendingLoad = null;
		}
		this._pendingLoad = window.setTimeout(dojo.hitch(this, "_loadChildren"), 1);
	},

	addOption: function(/* dojox.form.__SelectOption or string, optional */ value, /* string? */ label){
		// summary:
		//		Adds an option to the end of the select.  If value is empty or 
		//		missing, a separator is created instead.
		
		this.options.push(value.value ? value : { value:value, label:label });
		this._delayedLoad();
	},
	
	removeOption: function(/* string, dojox.form.__SelectOption or number */ valueOrIdx){
		// summary:
		//		Removes the given option
		this.options = dojo.filter(this.options, function(node, idx){
			return !((typeof valueOrIdx === "number" && idx === valueOrIdx) ||
					(typeof valueOrIdx === "string" && node.value === valueOrIdx) ||
					(valueOrIdx.value && node.value === valueOrIdx.value));
		});
		this._delayedLoad();
	},
	
	setOptionLabel: function(/*string*/ value, /*string*/ label){
		// summary:
		//		Sets the label for the given option.
		dojo.forEach(this.options, function(node){
			if(node.value === value){
				node.label = label;
			}
		});
		this._delayedLoad();
	},

	setValue: function(/*anything*/ newValue, /*Boolean, optional*/ priorityChange){
		// summary: set the value of the widget.
		// If a string is passed, then we set our value from looking it up.
		if(!dojo.isArray(newValue)){
			newValue = [newValue];
		}
		dojo.forEach(newValue, function(i, idx){
			if(typeof i === "string"){
				newValue[idx] = dojo.filter(this.options, function(node){
					return node.value === i;
				})[0] || {value: "", label: ""};
			}
		}, this);
		
		// Make sure some sane default is set
		newValue = dojo.filter(newValue, function(i){ return i; });
		if(!this._multiValue && (!newValue[0] || !newValue[0].value) && this.options.length){
			newValue[0] = this.options[0];
		}
		dojo.forEach(this.options, function(i){
			i.selected = dojo.some(newValue, function(v){ return v.value === i.value; });
		});
		var val = dojo.map(newValue, function(i){ return i.value; }),
			disp = dojo.map(newValue, function(i){ return i.label; });
		
		this.value = this._multiValue ? val : val[0];
		this._setDisplay(this._multiValue ? disp : disp[0]);
		this._handleOnChange(this.value, priorityChange);
	},
	
	_getValueDeprecated: false, // remove when _FormWidget:getValue is removed
	getValue: function(){
		// summary: get the value of the widget.
		return this._lastValue;
	},

	getSelected: function(){
		// summary: gets the selected options of this widget
		return dojo.filter(this.options, function(i){return i.selected;});
	},
	
	undo: function(){
		// summary: restore the value to the last value passed to onChange
		this.setValue(this._lastValueReported, false);
	},

	_loadChildren: function(){
		// summary: 
		//		Loads the children represented by this widget's optiosn.
		// reset the menu to make it "populatable on the next click
		dojo.forEach(this._getChildren(), function(child){
			child.destroyRecursive();
		});	
		// Add each menu item
		dojo.forEach(this.options, this._addOptionItem, this);
		
		// Update states
		this._updateSelection();
	},

	_updateSelection: function(){
		// summary:
		//		Sets the "selected" class on the item for styling purposes
		var val = this.value;
		if(!dojo.isArray(val)){
			val = [val];
		}
		if(val && val[0]){
			dojo.forEach(this._getChildren(), function(child){
				dojo[dojo.some(val, function(v){
					return child.option && (v === child.option.value) || false;
				}) ? "addClass" : "removeClass"](child.domNode, this.baseClass + "SelectedOption");
			}, this);
		}
		this.value = this._getValueFromOpts();
		this._handleOnChange(this.value);
	},
	
	_getValueFromOpts: function(){
		if(!this._multiValue && this.options.length){
			// Mirror what a select does - choose the first one
			return dojo.filter(this.options, function(i){
				return i.selected;
			})[0].value || this.options[0].value;
		}else if(this._multiValue){
			// Set value to be the sum of all selected
			return dojo.map(dojo.filter(this.options, function(i){
				return i.selected;
			}), function(i){
				return i.value;
			}) || [];
		}
		return "";
	},
	
	_fillContent: function(){
		// summary:  
		//		Loads our options and sets up our dropdown correctly.  We 
		//		don't want any content, so we don't call any inherit chain
		//		function.
		var opts = this.options;
		if(!opts){
			opts = this.options = this.srcNodeRef ? dojo.query(">", 
						this.srcNodeRef).map(function(node){
							if(node.getAttribute("type") === "separator"){
								return { value: "", label: "", selected: false };
							}
							return { value: node.getAttribute("value"),
										label: String(node.innerHTML),
										selected: node.selected || false };
						}, this) : [];
		}
		if(!this.value){
			this.value = this._getValueFromOpts();
		}else if(this._multiValue && typeof this.value == "string"){
			this.value = this.value.split(",");
		}
	},

	postCreate: function(){
		// summary: sets up our event handling that we need for functioning
		//			as a select
		dojo.setSelectable(this.focusNode, false);
		this.inherited(arguments);

		// Make our event connections for updating state
		var i;
		for(i in this._connections){
			dojo.forEach(this._connections[i], function(tgt){
				this.connect(this, tgt, i);
			}, this);
		}
		this.setValue(this.value, null);
	},
	
	_addOptionItem: function(/* dojox.form.__SelectOption */ option){
		// summary:
		//		User-overridable function which, for the given option, adds an 
		//		to the select.  If the option doesn't have a value, then a 
		//		separator is added in that place.  Make sure to store the option
		//		in the created option widget.
	},
	
	_setDisplay: function(/*String or String[]*/ newDisplay){
		// summary: Overridable function which will set the display for the 
		//			widget.  newDisplay is either a string (in the case of 
		//			single selects) or array of strings (in the case of multi-
		//			selects)
	},
	
	_getChildren: function(){
		// summary: Overridable function to return the children that this widget
		//			contains.
		return [];
	}

});
