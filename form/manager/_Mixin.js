dojo.provide("dojox.form.manager._Mixin");

dojo.require("dijit._Widget");

(function(){
	var fm = dojox.form.manager,

		aa = fm.actionAdapter = function(/* Function */ action){
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
		},

		ia = fm.inspectorAdapter = function(/* Function */ inspector){
			// summary:
			//		Adapter that applies an inspector only to the first item of the array.
			// inspector:
			//		Function that takes three parameters: a name, an object
			//		(usually node or widget), and a value.
			return function(name, elem, value){
				return inspector.call(this, name, dojo.isArray(elem) ? elem[0] : elem, value);
			};
		},

		ce = fm.changeEvent = function(/* Node */ node){
			// summary:
			//		Function that returns a valid "onchange" event for a given form node.
			// node:
			//		Form node.

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
					}
					break;
				// button, input/button, input/checkbox, input/radio,
				// input/file, input/image, input/submit, input/reset
				// use "onclick" (the default)
			}
			return eventName;	// String
		},

		skipNames = {domNode: 1, containerNode: 1, srcNodeRef: 1, bgIframe: 1},
		
		keys = function(o){
			// similar to dojox.lang.functional.keys
			var list = [], key;
			for(key in o){
				if(o.hasOwnProperty(key)){
					list.push(key);
				}
			}
			return list;
		},

		registerWidget = function(widget){
			var name = widget.attr("name");
			if(name && widget instanceof dijit.form._FormWidget){
				if(name in this.formWidgets){
					var a = this.formWidgets[name].widget;
					if(dojo.isArray(a)){
						a.push(widget);
					}else{
						this.formWidgets[name].widget = [a, widget];
					}
				}else{
					this.formWidgets[name] = {widget: widget, connections: []};
				}
			}else{
				name = null;
			}
			return name;
		},
		
		getObserversFromWidget = function(name){
			var observers = {};
			aa(function(_, w){
				var o = w.attr("observer");
				if(o && typeof o == "string"){
					dojo.forEach(o.split(","), function(o){
						o = dojo.trim(o);
						if(o && dojo.isFunction(this[o])){
							observers[o] = 1;
						}
					}, this);
				}
			}).call(this, null, this.formWidgets[name].widget);
			return keys(observers);
		},
		
		connectWidget = function(name, observers){
			var t = this.formWidgets[name], c = t.connections;
			if(c.length){
				dojo.forEach(c, dojo.disconnect);
				c = t.connections = [];
			}
			aa(function(_, w){
				// the next line is a crude workaround for dijit.form.Button that fires onClick instead of onChange
				var eventName = w.declaredClass == "dijit.form.Button" ? "onClick" : "onChange";
				dojo.forEach(observers, function(o){
					c.push(dojo.connect(w, eventName, this, function(evt){
						if(this.watch){
							this[o](this.formWidgetValue(name), name, w, evt);
						}
					}));
				}, this);
			}).call(this, null, t.widget);
		},

		registerNode = function(node){
			var name = dojo.attr(node, "name");
			if(name && !(name in this.formWidgets)){
				// verify that it is not part of any widget
				for(var n = node; n !== this.domNode; n = n.parentNode){
					if(dojo.attr(n, "widgetId") && dijit.byNode(n) instanceof dijit.form._FormWidget){
						// this is a child of some widget --- bail out
						return null;
					}
				}
				// register the node
				if(node.tagName.toLowerCase() == "input" && node.type.toLowerCase() == "radio"){
					var a = this.formNodes[name];
					a = a && a.node;
					if(a && dojo.isArray(a)){
						a.push(node);
					}else{
						this.formNodes[name] = {node: [node], connections: []};
					}
				}else{
					this.formNodes[name] = {node: node, connections: []};
				}
			}else{
				name = null;
			}
			return name;
		},
		
		getObserversFromNode = function(name){
			var observers = {};
			aa(function(_, n){
				var o = dojo.attr(n, "observer");
				if(o && typeof o == "string"){
					dojo.forEach(o.split(","), function(o){
						o = dojo.trim(o);
						if(o && dojo.isFunction(this[o])){
							observers[o] = 1;
						}
					}, this);
				}
			}).call(this, null, this.formNodes[name].node);
			return keys(observers);
		},
		
		connectNode = function(name, observers){
			var t = this.formNodes[name], c = t.connections;
			if(c.length){
				dojo.forEach(c, dojo.disconnect);
				c = t.connections = [];
			}
			aa(function(_, n){
				// the next line is a crude workaround for dijit.form.Button that fires onClick instead of onChange
				var eventName = ce(n);
				dojo.forEach(observers, function(o){
					c.push(dojo.connect(n, eventName, this, function(evt){
						if(this.watch){
							this[o](this.formNodeValue(name), name, n, evt);
						}
					}));
				}, this);
			}).call(this, null, t.node);
		};

	dojo.declare("dojox.form.manager._Mixin", null, {
		// summary:
		//		Mixin to orchestrate dynamic forms.
		// description:
		//		This mixin provideas a foundation for an enhanced form
		//		functionality: unified access to individual form elements,
		//		unified "onchange" event processing, general event
		//		processing, I/O orchestration, and common form-related
		//		functionality. See additional mixins in dojox.form.manager
		//		namespace.
		
		watch: true,

		startup: function(){
			// summary:
			//		Called after all the widgets have been instantiated and their
			//		dom nodes have been inserted somewhere under dojo.doc.body.

			if(this._started){ return; }

			// build the map of widgets
			this.formWidgets = {};
			dojo.forEach(this.getDescendants(), registerWidget, this);

			// build the map of nodes
			this.formNodes = {};
			dojo.query("input, select, textarea, button", this.domNode).forEach(registerNode, this);

			// process observers for widgets
			for(var name in this.formWidgets){
				connectWidget.call(this, name, getObserversFromWidget.call(this, name));
			}

			// process observers for nodes
			for(var name in this.formNodes){
				connectNode.call(this, name, getObserversFromNode.call(this, name));
			}

			this.inherited(arguments);
		},
		
		destroy: function(){
			// summary:
			//		Called when the widget is being destroyed
			
			for(var name in this.formWidgets){
				dojo.forEach(this.formWidgets[name].connections, dojo.disconnect);
			}
			this.formWidgets = {};
			
			for(var name in this.formNodes){
				dojo.forEach(this.formNodes[name].connections, dojo.disconnect);
			}
			this.formWidgets = {};

			this.inherited(arguments);
		},
		
		// register/unregister widgets and nodes
		
		registerWidget: function(widget){
			// summary:
			//		Register a widget with the form manager
			// widget: String|Node|dijit.form._FormWidget:
			//		A widget, or its widgetId, or its DOM node
			// returns: Object:
			//		Returns self
			if(typeof widget == "string"){
				widget = dijit.byId(widget);
			}else if(widget.tagName && widget.cloneNode){
				widget = dijit.byNode(widget);
			}
			var name = registerWidget.call(this, widget);
			if(name){
				connectWidget.call(this, name, getObserversFromWidget.call(this, name));
			}
			return this;
		},
		
		unregisterWidget: function(name){
			// summary:
			//		Removes the widget by name from internal tables unregistering
			//		connected observers
			// name: String:
			//		Name of the to unregister
			// returns: Object:
			//		Returns self
			if(name in this.formWidgets){
				dojo.forEach(this.formWidgets[name].connections, this.disconnect, this);
				delete this.formWidgets[name];
			}
			return this;
		},

		registerNode: function(node){
			// summary:
			//		Register a node with the form manager
			// node: String|Node:
			//		A node, or its id
			// returns: Object:
			//		Returns self
			if(typeof node == "string"){
				node = dojo.byId(node);
			}
			var name = registerNode.call(this, node);
			if(name){
				connectNode.call(this, name, getObserversFromNode.call(this, name));
			}
			return this;
		},
		
		unregisterNode: function(name){
			// summary:
			//		Removes the node by name from internal tables unregistering
			//		connected observers
			// name: String:
			//		Name of the to unregister
			// returns: Object:
			//		Returns self
			if(name in this.formNodes){
				dojo.forEach(this.formNodes[name].connections, this.disconnect, this);
				delete this.formNodes[name];
			}
			return this;
		},
		
		// value accessors

		formWidgetValue: function(elem, value){
			// summary:
			//		Set or get a form widget by name.
			// elem: String|Object|Array:
			//		Form element's name, widget object, or array or radio widgets.
			// value: Object?:
			//		Optional. The value to set.
			// returns: Object:
			//		For a getter it returns the value, for a setter it returns
			//		self. If the elem is not valid, null will be returned.

			var isSetter = arguments.length == 2 && value !== undefined, result;

			if(typeof elem == "string"){
				elem = this.formWidgets[elem];
				if(elem){
					elem = elem.widget;
				}
			}

			if(!elem){
				return null;	// Object
			}

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

		formNodeValue: function(elem, value){
			// summary:
			//		Set or get a form element by name.
			// elem: String|Node|Array:
			//		Form element's name, DOM node, or array or radio nodes.
			// value: Object?:
			//		Optional. The value to set.
			// returns: Object:
			//		For a getter it returns the value, for a setter it returns
			//		self. If the elem is not valid, null will be returned.

			var isSetter = arguments.length == 2 && value !== undefined, result;

			if(typeof elem == "string"){
				elem = this.formNodes[elem];
				if(elem){
					elem = elem.node;
				}
			}

			if(!elem){
				return null;	// Object
			}

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

		formPointValue: function(elem, value){
			// summary:
			//		Set or get a node context by name (using dojoAttachPoint).
			// elem: String|Object|Array:
			//		A node.
			// value: Object?:
			//		Optional. The value to set.
			// returns: Object:
			//		For a getter it returns the value, for a setter it returns
			//		self. If the elem is not valid, null will be returned.

			if(elem && typeof elem == "string"){
				elem = this[elem];
			}

			if(!elem || !elem.tagName || !elem.cloneNode){
				return null;	// Object
			}

			if(!dojo.hasClass(elem, "dojoFormValue")){
				// accessing the value of the attached point not marked with CSS class 'dojoFormValue'
				return null;
			}

			if(arguments.length == 2 && value !== undefined){
				// setter
				elem.innerHTML = value;
				return this;	// self
			}
			// getter
			return elem.innerHTML;	// String
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
						if(name in this.formWidgets){
							result[name] = inspector.call(this, name, this.formWidgets[name].widget, defaultValue);
						}
					}, this);
				}else{
					for(name in state){
						if(name in this.formWidgets){
							result[name] = inspector.call(this, name, this.formWidgets[name].widget, state[name]);
						}
					}
				}
			}else{
				for(name in this.formWidgets){
					result[name] = inspector.call(this, name, this.formWidgets[name].widget, defaultValue);
				}
			}

			return result;	// Object
		},

		inspectFormNodes: function(/* Function */ inspector, /* Object? */ state, /* Object? */ defaultValue){
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
						if(name in this.formNodes){
							result[name] = inspector.call(this, name, this.formNodes[name].node, defaultValue);
						}
					}, this);
				}else{
					for(name in state){
						if(name in this.formNodes){
							result[name] = inspector.call(this, name, this.formNodes[name].node, state[name]);
						}
					}
				}
			}else{
				for(name in this.formNodes){
					result[name] = inspector.call(this, name, this.formNodes[name].node, defaultValue);
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
				if(dojo.isArray(widget)){
					return inspector.call(this, name, dojo.map(widget, function(w){ return w.domNode; }), value);
				}
				return inspector.call(this, name, widget.domNode, value);
			}, state, defaultValue);
			dojo.mixin(result, this.inspectFormNodes(inspector, state, defaultValue));
			return dojo.mixin(result, this.inspectAttachedPoints(inspector, state, defaultValue));	// Object
		}
	});
})();

// These arguments can be specified for widgets which are used in forms.
// Since any widget can be specified as sub widgets, mix it into the base
// widget class.  (This is a hack, but it's effective.)
dojo.extend(dijit._Widget, {
	observer: ""
});
