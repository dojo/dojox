dojo.provide("dojox.wire.ml.Action");
dojo.provide("dojox.wire.ml.ActionFilter");

dojo.require("dijit._Widget");
dojo.require("dijit._Container");
dojo.require("dojox.wire.Wire");
dojo.require("dojox.wire.ml.util");

dojo.declare("dojox.wire.ml.Action",
	[dijit._Widget, dijit._Container], {
	//	summary:
	//		A base widget to "run" a task on an event or a topic
	//	description:
	//		This widget represents a controller task to be run when an event
	//		(a function) or a topic is issued.
	//		Sub-classes must implement _run() method to implement their tasks.
	//		'trigger' specifies an event scope, an ID of a widget or an DOM
	//		element, or its property with the optional dotted notation.
	//		If this widget has child ActionFilter widgets, their filter()
	//		methods are called with the arguments to the event or the topic.
	//		If one of filter() methods returns false, run() won't be invoked.
	//		This widget also can serve as a composite task to run child
	//		Actions on an event or a topic specified to this widget.
	//	trigger:
	//		An event scope
	//	triggerEvent:
	//		An event (function) name
	//	triggerTopic:
	//		A topic name
	trigger: "",
	triggerEvent: "",
	triggerTopic: "",

	postCreate: function(){
		//	summary:
		//		Call _connect()
		//	description:
		//		See _connect().
		this._connect();
	},

	_connect: function(){
		//	summary:
		//		Connect run() method to an event or a topic
		//	description:
		//		If 'triggerEvent' and 'trigger' are specified, connect() is
		//		used to set up run() to be called on the event.
		//		If 'triggerTopic' is specified, subscribe() is used to set up
		//		run() to be called on the topic.
		if(this.triggerEvent){
			if(this.trigger){
				var scope = dojox.wire.ml._getValue(this.trigger);
				if(scope){
					if(!scope[this.triggerEvent]){
						// set a dummy function for an anonymous object
						scope[this.triggerEvent] = function(){};
					}
					this._triggerHandle = dojo.connect(scope, this.triggerEvent, this, "run");
				}
			}else{
				var event = this.triggerEvent.toLowerCase();
				if(event == "onload"){
					var self = this;
					dojo.addOnLoad(function(){
						self._run.apply(self, arguments);
					});
				}
			}
		}else if(this.triggerTopic){
			this._triggerHandle = dojo.subscribe(this.triggerTopic, this, "run");
		}
	},

	_disconnect: function(){
		//	summary:
		//		Disconnect run() method from an event or a topic
		//	description:
		//		If 'triggerEvent' and 'trigger' are specified, disconnect() is
		//		used to set up run() not to be called on the event.
		//		If 'triggerTopic' is specified, unsubscribe() is used to set up
		//		run() not to be called on the topic.
		if(this._triggerHandle){
			if(this.triggerTopic){
				dojo.unsubscribe(this.triggerTopic, this._triggerHandle);
			}else{
				dojo.disconnect(this._triggerHandle);
			}
		}
	},

	run: function(){
		//	summary:
		//		Run a task
		//	description:
		//		This method calls filter() method of child ActionFilter
		//		widgets.
		//		If one of them returns false, this method returns.
		//		Otherwise, _run() method is called.
		var children = this.getChildren();
		for(var i in children){
			var child = children[i];
			if(child instanceof dojox.wire.ml.ActionFilter){
				if(!child.filter.apply(child, arguments)){
					return;
				}
			}
		}
		this._run.apply(this, arguments);
	},

	_run: function(){
		//	summary:
		//		Call run() methods of child Action widgets
		//	description:
		//		If this widget has child Action widgets, their run() methods
		//		are called.
		var children = this.getChildren();
		for(var i in children){
			var child = children[i];
			if(child instanceof dojox.wire.ml.Action){
				child.run.apply(child, arguments);
			}
		}
	},

	_destroy: function(finalize /*boolean*/){
		//	summary:
		//		Over-ride of base widget _destroy function to do some connection cleanup.
		this._disconnect();
		dojox.wire.ml.Action.superclass._destroy.apply(this,arguments);
	}
});

dojo.declare("dojox.wire.ml.ActionFilter",
	dijit._Widget, {
	//	summary:
	//		A widget to define a filter for the parent Action to run
	//	description:
	//		This base class checks a required property specified with
	//		'required' attribute.
	//		If 'message' is specified, the message is set to a property
	//		specified with 'error'.
	//		Subclasses may implement their own filter() method.
	//	required:
	//		A property required
	//	message:
	//		An error message
	//	error:
	//		A property to store an error
	required: "",
	message: "",
	error: "",

	filter: function(){
		//	summary:
		//		Check if a required property is specified
		//	description:
		//		If a value is undefined for a property, specifieid with
		//		'required', this method returns false.
		//		If 'message' is specified, it is set to a proeprty specified
		//		with 'error' or shown with alert().
		//		If 'required' starts with "arguments", a property of
		//		the method arguments are checked.
		//	returns:
		//		True if a required property is specified, otherwise false
		if(!this.required){
			return true; //Boolean
		}
		var value = dojox.wire.ml._getValue(this.required);
		if(value){
			return true; //Boolean
		}
		if(this.message){
			if(this.error){
				dojox.wire.ml._setValue(this.error, this.message);
			}else{
				alert(this.message);
			}
		}
		return false; //Boolean
	}
});
