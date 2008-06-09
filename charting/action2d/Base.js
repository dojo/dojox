dojo.provide("dojox.charting.action2d.Base");

dojo.require("dojox.fx.easing");
dojo.require("dojox.lang.functional.object");
dojo.require("dojox.gfx.fx");

(function(){
	var DEFAULT_DURATION = 400,	// ms
		DEFAULT_EASING   = dojox.fx.easing.elasticOut,

		dfo = dojox.lang.functional.object;
		
	dojo.declare("dojox.charting.action2d.Base", null, {
		
		overOutEvents: {onmouseover: 1, onmouseout: 1},
			
		constructor: function(chart, plot, kwargs){
			this.chart = chart;
			this.plot = plot ? plot : "default";
			this.anim = {};

			// process common optional named parameters
			if(!kwargs){ kwargs = {}; }
			this.duration = kwargs.duration ? kwargs.duration : DEFAULT_DURATION;
			this.easing   = kwargs.easing   ? kwargs.easing   : DEFAULT_EASING;
		},
		
		connect: function(){
			this.handle = this.chart.connectToPlot(this.plot, this, "process");
		},
		
		disconnect: function(){
			if(this.handle){
				dojo.disconnect(this.handle);
				this.handle = null;
			}
		},
		
		reset: function(){
			// nothing by default
		},
	
		destroy: function(){
			if(this.handle){
				this.disconnect();
			}
			dfo.forIn(this.anim, function(o){
				dfo.forIn(o, function(anim){
					anim.action.stop(true);
				});
			});
			this.anim = {};
		}
	});
})();
