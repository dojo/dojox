dojo.provide("dojox.form.Manager");

dojo.require("dijit._Widget");

dojo.require("dojo.parser");

(function(){
	var aa = dojox.form.Manager.actionAdapter = function(/* Function */ action){
		// summary:
		//		Adapter that automates application of actions to arrays.
		// action:
		//		Function that takes three parameters: a name, an object
		//		(usually node or widget), and a value. This action will
		//		be applied to all elements of array.
		return function(name, elems, value){
			if(dojo.isArray(elems)){
				dojo.forEach(elems, function(elem){
					action.call(this, name, elem, value);
				}, this);
			}else{
				action.apply(this, arguments);
			}
		};
	};

	var ia = dojox.form.Manager.inspectorAdapter = function(/* Function */ inspector){
		// summary:
		//		Adapter that applies an inspector only to the first item of the array.
		// inspector:
		//		Function that takes three parameters: a name, an object
		//		(usually node or widget), and a value.
		return function(name, elem, value){
			return inspector.call(this, name, dojo.isArray(elem) ? elem[0] : elem, value);
		};
	};

	var skipNames = {domNode: 1, containerNode: 1, srcNodeRef: 1, bgIframe: 1},
		_w = dijit._Widget,

		registerWidget = function(widget){
			if(widget instanceof _w){
				var name = widget.attr("name");
				if(name){
					if(name in this._widgets){
						var a = this._widgets[name];
						if(dojo.isArray(a)){
							a.push(widget);
						}else{
							this._widgets[name] = [a, widget];
						}
					}else{
						this._widgets[name] = widget;
					}
				}
			}
		},

		registerNode = function(node){
			var name = dojo.attr(node, "name");
			if(name){
				// verify that it is not part of any widget
				for(var n = node; n !== this.domNode; n = n.parentNode){
					if(dojo.attr(n, "widgetId")){
						// this is a child of some widget --- bail out
						return;
					}
				}
				// register the node
				if(node.tagName.toLowerCase() == "input" && node.type.toLowerCase() == "radio"){
					var a = this._nodes[name];
					if(a && dojo.isArray(a)){
						a.push(node);
					}else{
						this._nodes[name] = [node];
					}
				}else{
					this._nodes[name] = node;
				}
			}
		};

	dojo.declare("dojox.form.Manager", dijit._Widget, {
		// summary:
		//		The widget to orchestrate dynamic forms
		// description:
		//		This widget is responsible for data reflection to individual
		//		form elements, unified "onchange" event processing, general
		//		event processing, I/O orchestration, and common form-related
		//		functionality.

		// HTML <FORM> attributes (if we are based on the form element)
		name: "",
		action: "",
		method: "",
		encType: "",
		"accept-charset": "",
		accept: "",
		target: "",

		buildRendering: function(){
			this.inherited(arguments);
			if(!this.containerNode){
				// all widgets with descendants must set containerNode
   				this.containerNode = this.domNode;
			}
		},

		startup: function(){
			// summary:
			//		Called after all the widgets have been instantiated and their
			//		dom nodes have been inserted somewhere under dojo.doc.body.

			if(this._started){ return; }

			// build the map of widgets
			this._widgets = {};
			dojo.forEach(this.getDescendants(), registerWidget, this);

			// build the map of nodes
			this._nodes = {};
			dojo.query("input, select, textarea, button", this.domNode).forEach(registerNode, this);

			// process observers for widgets
			for(var name in this._widgets){
				var widget = this._widgets[name], observer = null;
				if(dojo.isArray(widget)){
					dojo.some(widget, function(w){
						var o = w.attr("observer");
						if(o){
							observer = o;
							return true;
						}
						return false;
					});
					if(observer && this[observer] && dojo.isFunction(this[observer])){
						dojo.forEach(widget, function(w){
							this.connect(w, "onChange", observer);
						}, this);
					}
					continue;
				}
				observer = widget.attr("observer");
				if(observer && this[observer] && dojo.isFunction(this[observer])){
					this.connect(widget, "onChange", observer);
				}
			}

			// process observers for nodes
			for(var name in this._nodes){
				if(name in this._widgets){ continue; }
				var node = this._nodes[name], observer = null;
				if(dojo.isArray(node)){
					// input/radio array
					dojo.some(node, function(n){
						var o = dojo.attr(n, "observer");
						if(o){
							observer = o;
							return true;
						}
						return false;
					});
					if(observer && this[observer] && dojo.isFunction(this[observer])){
						dojo.forEach(node, function(n){
							this.connect(n, "onclick", observer);
						}, this);
					}
					continue;
				}
				var observer = dojo.attr(node, "observer");
				if(observer && this[observer] && dojo.isFunction(this[observer])){
					var eventName = "onclick";
					switch(node.tagName.toLowerCase()){
						case "textarea":
							eventName = "onkeyup";
							break;
						case "select":
							eventName = "onchange";
							break;
						case "input":
							switch(node.type.toLowerCase()){
								case "text":
								case "password":
									eventName = "onkeyup";
									break;
								// input/radio was already processed separately
							}
							break;
						// button, input/button, input/checkbox, input/file, input/image,
						// input/submit, input/reset use "onclick" (the default)
					}
					this.connect(node, eventName, observer);
				}
			}

			// see if we are based on the form element
			this.isForm = this.domNode.tagName.toLowerCase() == "form";
			if(this.isForm){
				this.connect(this.domNode, "onreset", "_onReset");
				this.connect(this.domNode, "onsubmit", "_onSubmit");
			}
		},

		// form-specific functionality

		_onReset: function(e){
			// NOTE: this function is taken from dijit.formForm, it works only
			// for form-based managers.

			// create fake event so we can know if preventDefault() is called
			var faux = {
				returnValue: true, // the IE way
				preventDefault: function(){  // not IE
							this.returnValue = false;
						},
				stopPropagation: function(){}, currentTarget: e.currentTarget, target: e.target
			};
			// if return value is not exactly false, and haven't called preventDefault(), then reset
			if(!(this.onReset(faux) === false) && faux.returnValue){
				this.reset();
			}
			dojo.stopEvent(e);
			return false;
		},

		onReset: function(/*Event?*/e){
			//	summary:
			//		Callback when user resets the form. This method is intended
			//		to be over-ridden. When the `reset` method is called
			//		programmatically, the return value from `onReset` is used
			//		to compute whether or not resetting should proceed
			return true; // Boolean
		},

		reset: function(){
			// summary:
			//		Resets form values. Use reflect() to set any values.
			if(this.isForm){
				this.domNode.reset();
			}
			for(var name in this._widgets){
				var widget = this._widgets[name];
				if(widget.reset){
					widget.reset();
				}
			}
			return this;
		},

		_onSubmit: function(e){
			// NOTE: this function is taken from dijit.formForm, it works only
			// for form-based managers.

			if(this.onSubmit(e) === false){ // only exactly false stops submit
				dojo.stopEvent(e);
			}
		},

		onSubmit: function(/*Event?*/e){
			//	summary:
			//		Callback when user submits the form. This method is
			//		intended to be over-ridden, but by default it checks and
			//		returns the validity of form elements. When the `submit`
			//		method is called programmatically, the return value from
			//		`onSubmit` is used to compute whether or not submission
			//		should proceed

			return this.isValid(); // Boolean
		},

		submit: function(){
			// summary:
			//		programmatically submit form if and only if the `onSubmit` returns true
			if(this.isForm){
				if(!(this.onSubmit() === false)){
					this.domNode.submit();
				}
			}
		},

	 	isValid: function(){
	 		// summary:
			//		Make sure that every widget that has a validator function returns true.
			for(var name in this._widgets){
				var widget = this._widgets[name];
				if(!widget.attr("disabled") && widget.isValid && !widget.isValid()){
					return false;
				}
			}
			return true;
		},

		// inspectors

		inspectFormWidgets: function(/* Function */ inspector, /* Object? */ state, /* Object? */ defaultValue){
			// summary:
			//		Run an inspector function on controlled widgets returning a result object.
			// inspector:
			//		A function to be called on a widget. Takes three arguments: a name, a widget object
			//		or an array of widget objects, and a supplied value. Runs in the context of
			//		the form manager. Returns a value that will be collected and returned as a state.
			// state:
			//		Optional. If a name-value dictionary --- only listed names will be processed.
			//		If an array, all names in the array will be processed with defaultValue.
			//		If omitted or null, all widgets will be processed with defaultValue.
			// defaultValue:
			//		Optional. The default state (true, if omitted).

			var name, result = {};

			if(state){
				if(dojo.isArray(state)){
					dojo.forEach(state, function(name){
						if(name in this._widgets){
							result[name] = inspector.call(this, name, this._widgets[name], defaultValue);
						}
					}, this);
				}else{
					for(name in state){
						if(name in this._widgets){
							result[name] = inspector.call(this, name, this._widgets[name], state[name]);
						}
					}
				}
			}else{
				for(name in this._widgets){
					result[name] = inspector.call(this, name, this._widgets[name], defaultValue);
				}
			}

			return result;	// Object
		},

		inspectFormElements: function(/* Function */ inspector, /* Object? */ state, /* Object? */ defaultValue){
			// summary:
			//		Run an inspector function on controlled form elements returning a result object.
			// inspector:
			//		A function to be called on a form element. Takes three arguments: a name, a node or
			//		an array of nodes, and a supplied value. Runs in the context of the form manager.
			//		Returns a value that will be collected and returned as a state.
			// state:
			//		Optional. If a name-value dictionary --- only listed names will be processed.
			//		If an array, all names in the array will be processed with defaultValue.
			//		If omitted or null, all form elements will be processed with defaultValue.
			// defaultValue:
			//		Optional. The default state (true, if omitted).

			var name, result = {};

			if(state){
				if(dojo.isArray(state)){
					dojo.forEach(state, function(name){
						if(name in this._nodes){
							result[name] = inspector.call(this, name, this._nodes[name], defaultValue);
						}
					}, this);
				}else{
					for(name in state){
						if(name in this._nodes){
							result[name] = inspector.call(this, name, this._nodes[name], state[name]);
						}
					}
				}
			}else{
				for(name in this._nodes){
					result[name] = inspector.call(this, name, this._nodes[name], defaultValue);
				}
			}

			return result;	// Object
		},

		inspectAttachedPoints: function(/* Function */ inspector, /* Object? */ state, /* Object? */ defaultValue){
			// summary:
			//		Run an inspector function on "dojoAttachPoint" nodes returning a result object.
			// inspector:
			//		A function to be called on a node. Takes three arguments: a name, a node or
			//		an array of nodes, and a supplied value. Runs in the context of the form manager.
			//		Returns a value that will be collected and returned as a state.
			// state:
			//		Optional. If a name-value dictionary --- only listed names will be processed.
			//		If an array, all names in the array will be processed with defaultValue.
			//		If omitted or null, all attached point nodes will be processed with defaultValue.
			// defaultValue:
			//		Optional. The default state (true, if omitted).

			var name, result = {};

			if(state){
				if(dojo.isArray(state)){
					dojo.forEach(state, function(name){
						var elem = this[name];
						if(elem && elem.tagName && elem.cloneNode){
							result[name] = inspector.call(this, name, elem, defaultValue);
						}
					}, this);
				}else{
					for(name in state){
						var elem = this[name];
						if(elem && elem.tagName && elem.cloneNode){
							result[name] = inspector.call(this, name, elem, state[name]);
						}
					}
				}
			}else{
				for(name in this){
					if(!(name in skipNames)){
						var elem = this[name];
						if(elem && elem.tagName && elem.cloneNode){
							result[name] = inspector.call(this, name, elem, defaultValue);
						}
					}
				}
			}

			return result;	// Object
		},

		inspect: function(/* Function */ inspector, /* Object? */ state, /* Object? */ defaultValue){
			// summary:
			//		Run an inspector function on controlled elements returning a result object.
			// inspector:
			//		A function to be called on a widget, form element, and an attached node.
			//		Takes three arguments: a name, a node (domNode in the case of widget) or
			//		an array of such objects, and a supplied value. Runs in the context of
			//		the form manager. Returns a value that will be collected and returned as a state.
			// state:
			//		Optional. If a name-value dictionary --- only listed names will be processed.
			//		If an array, all names in the array will be processed with defaultValue.
			//		If omitted or null, all controlled elements will be processed with defaultValue.
			// defaultValue:
			//		Optional. The default state (true, if omitted).

			var result = this.inspectFormWidgets(function(name, widget, value){
				return inspector.call(this, name, widget.domNode, value);
			}, state, defaultValue);
			dojo.mixin(result, this.inspectFormElements(inspector, state, defaultValue));
			return dojo.mixin(result, this.inspectAttachPoints(inspector, state, defaultValue));	// Object
		},

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
				if(arguments.length == 2 || value === undefined){
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
		},

		gatherEnableState: function(/* Object? */ names){
			// summary:
			//		Gather enable state of all form elements and return as a dictionary.
			// names:
			//		If it is an array, it is a list of names to be processed.
			//		If it is an object, dictionary keys are names to be processed.
			//		If it is omitted, all known form elements are to be processed.

			var result = this.inspectFormWidgets(ia(function(name, widget){
				return !widget.attr("disabled");
			}), names);

			dojo.mixin(result, this.inspectFormWidgets(ia(function(name, node){
				return !dojo.attr(node, "disabled");
			}), names));

			return result;	// Object
		},

		enable: function(/* Object? */ state, /* Boolean */ defaultState){
			// summary:
			//		Enable form controls according to the supplied state object.
			// state:
			//		Optional. If a name-value dictionary, the value is true
			//		to enable and false to disable. If an array, all names in the
			//		array will be set to defaultState. If omitted, all form
			//		elements will be set to defaultState.
			// defaultState:
			//		The default state (true, if omitted).

			if(arguments.length < 2){
				defaultState = true;
			}

			var defaultValue = !defaultState;

			this.inspectFormWidgets(aa(function(name, widget, value){
				widget.attr("disabled", value);
			}), state, defaultValue);

			this.inspectFormWidgets(aa(function(name, node, value){
				dojo.attr(node, "disabled", value);
			}), state, defaultValue);

			return this;	// self
		},

		disable: function(/* Object? */ state){
			// summary:
			//		Disable form controls according to the supplied state object
			//		returning the previous state.
			// state:
			//		Optional. If a name-value dictionary, the value is true
			//		to enable and false to disable. If an array, all names in the
			//		array will be disabled. If omitted, disables all.
			var state = this.gatherEnableState();
			this.enable(state, false);
			return state;	// Object
		},

		gatherDisplayState: function(/* Object? */ names){
			// summary:
			//		Gather display state of all attached elements and return as a dictionary.
			// names:
			//		If it is an array, it is a list of names to be processed.
			//		If it is an object, dictionary keys are names to be processed.
			//		If it is omitted, all known attach point nodes are to be processed.

			var result = this.inspectAttachPoints(function(name, node){
				return dojo.style(node, "display") != "none";
			}, names);

			return result;	// Object
		},

		show: function(/* Object? */ state, /* Boolean */ defaultState){
			// summary:
			//		Show attached nodes according to the supplied state object.
			// state:
			//		Optional. If a name-value dictionary, the value is true
			//		to show and false to hide. If an array, all names in the
			//		array will be set to defaultState. If omitted, all form
			//		elements will be set to defaultState.
			// defaultState:
			//		The default state (true, if omitted).

			if(arguments.length < 2){
				defaultState = true;
			}

			this.inspectAttachPoints(function(name, node, value){
				dojo.style(node, "display", value ? "" : "none");
			}, state, defaultState);

			return this;	// self
		},

		hide: function(/* Object? */ state){
			// summary:
			//		Hide attached nodes according to the supplied state object.
			// state:
			//		Optional. If a name-value dictionary, the value is true
			//		to show and false to hide. If an array, all names in the
			//		array will be hidden. If omitted, all form elements
			//		will be hidden.
			return this.show(state, false);	// self
		},

		gatherClassState: function(/* String */ className, /* Object? */ names){
			// summary:
			//		Gather the presence of a certain class in all controlled elements.
			// className:
			//		The class name to test for.
			// names:
			//		If it is an array, it is a list of names to be processed.
			//		If it is an object, dictionary keys are names to be processed.
			//		If it is omitted, all known form elements are to be processed.

			var result = this.inspect(ia(function(name, node){
				return dojo.hasClass(node, className);
			}), names);

			return result;	// Object
		},

		addClass: function(/* String */ className, /* Object? */ names){
			// summary:
			//		Add a class to nodes according to the supplied set of names
			// className:
			//		Class name to add.
			// names:
			//		If it is an array, it is a list of names to be processed.
			//		If it is an object, dictionary keys are names to be processed.
			//		If it is omitted, all known form elements are to be processed.

			this.inspect(aa(function(name, node){
				dojo.addClass(node, className);
			}), names);

			return this;	// self
		},

		removeClass: function(/* String */ className, /* Object? */ names){
			// summary:
			//		Remove a class from nodes according to the supplied set of names
			// className:
			//		Class name to remove.
			// names:
			//		If it is an array, it is a list of names to be processed.
			//		If it is an object, dictionary keys are names to be processed.
			//		If it is omitted, all known form elements are to be processed.

			this.inspect(aa(function(name, node){
				dojo.removeClass(node, className);
			}), names);

			return this;	// self
		}
	});
})();

// These arguments can be specified for widgets which are used in forms.
// Since any widget can be specified as sub widgets, mix it into the base
// widget class.  (This is a hack, but it's effective.)
dojo.extend(dijit._Widget,{
	observer: ""
});

