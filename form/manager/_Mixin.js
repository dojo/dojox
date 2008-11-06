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

		registerWidget = function(widget){
			var name = widget.attr("name");
			if(name && widget instanceof dijit.form._FormWidget){
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
		},

		registerNode = function(node){
			var name = dojo.attr(node, "name");
			if(name && !(name in this._widgets)){
				// verify that it is not part of any widget
				for(var n = node; n !== this.domNode; n = n.parentNode){
					if(dojo.attr(n, "widgetId") && dijit.byNode(n) instanceof dijit.form._FormWidget){
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
				var widget = this._widgets[name], observers = [];
				if(dojo.isArray(widget)){
					dojo.forEach(widget, function(w){
						var o = w.attr("observer");
						if(o && typeof o == "string"){
							observers = observers.concat(o.split(","));
						}
					});
					dojo.forEach(widget, function(w){
						dojo.forEach(observers, function(o){
							o = dojo.trim(o);
							if(o && this[o] && dojo.isFunction(this[o])){
								this.connect(w, "onChange", o);
							}
						}, this);
					}, this);
				}else{
					var o = widget.attr("observer");
					if(o && typeof o == "string"){
						// the next line is a crude workaround for dijit.form.Button that fires onClick instead of onChange
						var eventName = widget.declaredClass == "dijit.form.Button" ? "onClick" : "onChange";
						dojo.forEach(o.split(","), function(o){
							o = dojo.trim(o);
							if(o && this[o] && dojo.isFunction(this[o])){
								this.connect(widget, eventName, o);
							}
						}, this);
					}
				}
			}

			// process observers for nodes
			for(var name in this._nodes){
				if(name in this._widgets){ continue; }
				var node = this._nodes[name], observers = [];
				if(dojo.isArray(node)){
					// input/radio array
					dojo.forEach(node, function(n){
						var o = dojo.attr(n, "observer");
						if(o && typeof o == "string"){
							observers = observers.concat(o.split(","));
						}
					});
					dojo.forEach(node, function(n){
						dojo.forEach(observers, function(o){
							o = dojo.trim(o);
							if(o && this[o] && dojo.isFunction(this[o])){
								this.connect(n, "onclick", o);
							}
						}, this);
					}, this);
				}else{
					var o = dojo.attr(node, "observer");
					if(o && typeof o == "string"){
						var eventName = ce(node);
						dojo.forEach(o.split(","), function(o){
							o = dojo.trim(o);
							if(o && this[o] && dojo.isFunction(this[o])){
								this.connect(node, eventName, o);
							}
						}, this);
					}
				}
			}
			
			this.inherited(arguments);
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
				if(dojo.isArray(widget)){
					return inspector.call(this, name, dojo.map(widget, function(w){ return w.domNode; }), value);
				}
				return inspector.call(this, name, widget.domNode, value);
			}, state, defaultValue);
			dojo.mixin(result, this.inspectFormElements(inspector, state, defaultValue));
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
