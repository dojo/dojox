dojo.provide("dojox.form._FormSelectWidget");

dojo.require("dijit.form._FormWidget");

dojo.declare("dojox.form._FormSelectWidget", dijit.form._FormWidget, {
	// multiple: Boolean
	//		Matches the select's "multiple=" value
	multiple: "",
	
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
	//		The set of options for our select item.  Roughly corresponds to
	//      the html <option> tag.
	options: null,
	
	getOptions: function(/* anything */ valueOrIdx){
		// summary:
		//		Returns a given option (or options).
		// valueOrIdx:
		//		If passed in as a string, that string is used to look up the option
		//		in the array of options - based on the value property. 
		//		(See dojox.form.__SelectOption).
		//
		//		If passed in a number, then the option with the given index (0-based)
		//		within this select will be returned.
		//		
		//		If passed in a dojox.form.__SelectOption, the same option will be
		//		returned if and only if it exists within this select.
		//		
		//		If passed an array, then an array will be returned with each element
		//		in the array being looked up.
		//
		//		If not passed a value, then the current value of the widget will
		//		be used for the lookup
		//
		// returns:
		//		The option corresponding with the given value or index.  null
		//		is returned if any of the following are true:
		//			- A string value is passed in which doesn't exist
		//			- An index is passed in which is outside the bounds of the array of options
		//			- A dojox.form.__SelectOption is passed in which is not a part of the select
		
		// NOTE: the compare for passing in a dojox.form.__SelectOption checks
		//		if the value property matches - NOT if the exact option exists
		// NOTE: if passing in an array, null elements will be placed in the returned
		//		array when a value is not found.
		var lookupValue = valueOrIdx || this.getValue(), 
			opts = this.options, l = opts.length;
		
		if(dojo.isArray(lookupValue)){
			return dojo.map(lookupValue, "return this.getOptions(item);", this); // dojox.form.__SelectOption[]
		}
		if(dojo.isObject(valueOrIdx) && valueOrIdx.value){ 
			lookupValue = valueOrIdx.value;
		}
		if(typeof lookupValue == "string"){
			for(var i=0; i<l; i++){
				if(opts[i].value === lookupValue){
					lookupValue = i;
					break;
				}
			}
		}
		if(typeof lookupValue == "number" && lookupValue >= 0 && lookupValue < l){
			return this.options[lookupValue] // dojox.form.__SelectOption
		}
		return null; // null
	},
	
	addOption: function(/* dojox.form.__SelectOption or string, optional */ value, /* string? */ label){
		// summary:
		//		Adds an option to the end of the select.  If value is empty or 
		//		missing, a separator is created instead.
		
		this.options.push(dojo.isObject(value) ? value : { value:value, label:label });
		this._loadChildren();
	},
	
	removeOption: function(/* string, dojox.form.__SelectOption or number */ valueOrIdx){
		// summary:
		//		Removes the given option
		this.options = dojo.filter(this.options, function(node, idx){
			return !((typeof valueOrIdx === "number" && idx === valueOrIdx) ||
					(typeof valueOrIdx === "string" && node.value === valueOrIdx) ||
					(valueOrIdx.value && node.value === valueOrIdx.value));
		});
		this._loadChildren();
	},
	
	setOptionLabel: function(/*string*/ value, /*string*/ label){
		// summary:
		//		Sets the label for the given option.
		dojo.forEach(this.options, function(node){
			if(node.value === value){
				node.label = label;
			}
		});
		this._loadChildren();
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
		newValue = dojo.filter(newValue, function(i){ return i && i.value; });
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
		this.value = this._getValueFromOpts();
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
		this._handleOnChange(this.value);
	},
	
	_getValueFromOpts: function(){
		if(!this._multiValue && this.options.length){
			// Mirror what a select does - choose the first one
			var opt = dojo.filter(this.options, function(i){
				return i.selected;
			})[0];
			if(opt && opt.value){
				return opt.value
			}else{
				this.options[0].selected = true;
				return this.options[0].value;
			}
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
	
	postMixInProperties: function(){
		this._multiValue = (this.multiple.toLowerCase() === "true");
		this.inherited(arguments);
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
		this.connect(this, "onChange", "_updateSelection");
		this.connect(this, "startup", "_loadChildren");
		
		this.setValue(this.value, null);
	},
	
	_addOptionItem: function(/* dojox.form.__SelectOption */ option){
		// summary:
		//		User-overridable function which, for the given option, adds an 
		//		item to the select.  If the option doesn't have a value, then a 
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
