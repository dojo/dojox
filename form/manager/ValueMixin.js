dojo.provide("dojox.form.manager.ValueMixin");

dojo.declare("dojox.form.manager.ValueMixin", null, {
	// summary:
	//		Form manager's mixin for getting/setting form values in the unified manner.
	// description:
	//		This mixin adds unified access to form widgets and form elements
	//		in terms of name-value regardless of the underlying type of
	//		an element. It should be used together with dojox.form.manager.Mixin. 

	_formWidgetValue: function(/* Object|Array */ elem, /* Object? */ value){
		// summary:
		//		Set or get a form widget by name.
		// elem:
		//		Form element node or array or radio nodes.
		// value:
		//		Optional. The value to set.

		var isSetter = arguments.length == 2 && value !== undefined, result;

		if(dojo.isArray(elem)){
			// input/radio array of widgets
			if(isSetter){
				dojo.forEach(elem, function(widget){
					widget.attr("checked", false);
				});
				dojo.forEach(elem, function(widget){
					widget.attr("checked", widget.attr("value") === value);
				});
				return this;	// self
			}
			// getter
			dojo.some(elem, function(widget){
				if(widget.attr("checked")){
					result = widget;
					return true;
				}
				return false;
			});
			return result ? result.attr("value") : "";	// String
		}
		// all other elements
		if(isSetter){
			elem.attr("value", value);
			return this;	// self
		}
		return elem.attr("value");	// Object
	},

	_formElementValue: function(/* Node|Array */ elem, /* Object? */ value){
		// summary:
		//		Set or get a form element by name.
		// elem:
		//		Form element node or array or radio nodes.
		// value:
		//		Optional. The value to set.

		var isSetter = arguments.length == 2 && value !== undefined, result;

		if(dojo.isArray(elem)){
			// input/radio array
			if(isSetter){
				dojo.forEach(elem, function(node){
					node.checked = "";
				});
				dojo.forEach(elem, function(node){
					node.checked = node.value === value ? "checked" : "";
				});
				return this;	// self
			}
			// getter
			dojo.some(elem, function(node){
				if(node.checked){
					result = node;
					return true;
				}
				return false;
			});
			return result ? result.value : "";	// String
		}
		// all other elements
		switch(elem.tagName.toLowerCase()){
			case "select":
				if(elem.multiple){
					// multiple is allowed
					if(isSetter){
						if(dojo.isArray(value)){
							var dict = {};
							dojo.forEach(value, function(v){
								dict[v] = 1;
							});
							dojo.query("> option", elem).forEach(function(opt){
								opt.selected = opt.value in dict;
							});
							return this;	// self
						}
						// singular property
						dojo.query("> option", elem).forEach(function(opt){
							opt.selected = opt.value === value;
						});
						return this;	// self
					}
					// getter
					var result = dojo.query("> option", elem).filter(function(opt){
						return opt.selected;
					}).map(function(opt){
						return opt.value;
					});
					return result.length == 1 ? result[0] : result;	// Object
				}
				// singular
				if(isSetter){
					dojo.query("> option", elem).forEach(function(opt){
						opt.selected = opt.value === value;
					});
					return this;	// self
				}
				// getter
				var result = dojo.query("> option", elem).filter(function(opt){
					return opt.selected;
				}).map(function(opt){
					return opt.value;
				});
				return result.length == 1 ? result[0] : "";	// String
			case "textarea":
				if(isSetter){
					elem.value = "" + value;
					return this;
				}
				// getter
				return elem.value;
			case "button":
				if(isSetter){
					elem.innerHTML = "" + value;
					return this;
				}
				// getter
				return elem.innerHTML;
			case "input":
				if(elem.type.toLowerCase() == "checkbox"){
					// input/checkbox element
					if(isSetter){
						elem.checked = value ? "checked" : "";
						return this;
					}
					// getter
					return Boolean(elem.checked);
				}
		}
		// the rest of inputs
		if(isSetter){
			elem.value = "" + value;
			return this;
		}
		// getter
		return elem.value;
	},

	elementValue: function(/* String */ name, /* Object? */ value){
		// summary:
		//		Set or get a form widget/element or an attached point node by name.
		// name:
		//		The name.
		// value:
		//		Optional. The value to set.

		if(name in this._widgets){
			return this._formWidgetValue.apply(this, arguments);	// Object
		}

		if(name in this._nodes){
			return this._formElementValue.apply(this, arguments);	// Object
		}

		var elem = this[name];
		if(elem && elem.tagName && elem.cloneNode){
			if(arguments.length == 2 || value !== undefined){
				// setter
				elem.innerHTML = value;
				return this;	// self
			}
			// getter
			return elem.innerHTML;	// String
		}

		return null;	// Object
	},

	gatherFormValues: function(/* Object? */ names){
		// summary:
		//		Collect form values.
		// names:
		//		If it is an array, it is a list of names of form elements to be collected.
		//		If it is an object, dictionary keys are names to be collected.
		//		If it is omitted, all known form elements are to be collected.

		var result = this.inspectFormWidgets(function(name, widget){
			return this._formWidgetValue(widget);
		}, names);

		dojo.mixin(result, this.inspectFormElements(function(name, node){
			return this._formElementValue(node);
		}, names));

		return result;	// Object
	},

	setFormValues: function(/* Object */ values){
		// summary:
		//		Set values to form elements
		if(values){
			inspectFormWidgets(function(name, widget, value){
				this._formWidgetValue(widget, value);
			}, values);

			inspectFormElements(function(name, node, value){
				this._formElementValue(node, value);
			}, values);
		}
		return this;
	}
});
