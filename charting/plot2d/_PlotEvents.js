dojo.provide("dojox.charting.plot2d._PlotEvents");

dojo.declare("dojox.charting.plot2d._PlotEvents", null, {
	constructor: function(){
		this._events = [];
		this._eventSeries = {};
	},
	destroy: function(){
		//	summary:
		//		Destroy any internal elements and event handlers.
		this.resetEvents();
		this.inherited(arguments);
	},
	plotEvent: function(o){
		//	summary:
		//		Stub function for use by specific plots.
		//	o: Object
		//		An object intended to represent event parameters.
	},
	raiseEvent: function(o){
		//	summary:
		//		Raises events in predefined order
		//	o: Object
		//		An object intended to represent event parameters.
		this.plotEvent(o);
		var t = dojo.delegate(o);
		t.originalEvent = o.type;
		t.originalPlot  = o.plot;
		t.type = "onindirect";
		dojo.forEach(this.chart.stack, function(plot){
			if(plot !== this && plot.plotEvent){
				t.plot = plot;
				plot.plotEvent(t);
			}
		}, this);
	},
	connect: function(object, method){
		//	summary:
		//		Helper function to connect any object's method to our plotEvent.
		//	object: Object
		//		The object to connect to.
		//	method: String|Function
		//		The method to fire when our plotEvent is fired.
		//	returns: Array
		//		The handle as returned from dojo.connect (see dojo.connect).
		this.dirty = true;
		return dojo.connect(this, "plotEvent", object, method);	//	Array
	},
	events: function(){
		//	summary:
		//		Find out if any event handlers have been connected to our plotEvent.
		//	returns: Boolean
		//		A flag indicating that there are handlers attached.
		var ls = this.plotEvent._listeners;
		if(!ls || !ls.length){ return false; }
		for(var i in ls){
			if(!(i in Array.prototype)){
				return true;
			}
		}
		return false;
	},
	resetEvents: function(){
		//	summary:
		//		Reset all events attached to our plotEvent (i.e. disconnect).
		if(this._events.length){
			dojo.forEach(this._events, dojo.disconnect);
			this._events = [];
		}
		this.raiseEvent({type: "onplotreset", plot: this});
	},
	_connectEvents: function(o){
		o.chart = this.chart;
		o.plot  = this;
		o.hAxis = this.hAxis || null;
		o.vAxis = this.vAxis || null;
		this._events.push(
			o.shape.connect("onmouseover", this, function(e){
				o.type  = "onmouseover";
				o.event = e;
				this.raiseEvent(o);
			}),
			o.shape.connect("onmouseout", this, function(e){
				o.type  = "onmouseout";
				o.event = e;
				this.raiseEvent(o);
			}),
			o.shape.connect("onclick", this, function(e){
				o.type  = "onclick";
				o.event = e;
				this.raiseEvent(o);
			})
		);
	},
	_reconnectEvents: function(seriesName){
		var a = this._eventSeries[seriesName];
		if(a){
			dojo.forEach(a, this._connectEvents, this);
		}
	},
	fireEvent: function(seriesName, eventName, index){
		var s = this._eventSeries[seriesName];
		if(s && s.length && index < s.length){
			var o = s[index];
			o.type  = eventName;
			o.event = null;
			this.raiseEvent(o);
		}
	}
});
