dojo.provide("dojox.charting.plot2d.axes");

dojo.require("dojo.colors");
dojo.require("dojox.gfx");
dojo.require("dojox.lang.functional");
dojo.require("dojox.charting.scaler");

(function(){
	var dc = dojox.charting, df = dojox.lang.functional;
	
	dojo.declare("dojox.charting.plot2d.axes.Base", null, {
		constructor: function(kwArgs, chart){
			this.chart = chart;
			this.vertical = kwArgs && kwArgs.vertical;
		},
		clear: function(){
			return this;
		},
		initialized: function(){
			return false;
		},
		calculate: function(min, max, span){
			return this;
		},
		getScaler: function(){
			return null;
		},
		getOffsets: function(){
			return {l: 0, r: 0, t: 0, b: 0};
		},
		render: function(dim, offsets){
			return this;
		}
	});

	dojo.declare("dojox.charting.plot2d.axes.Default", dojox.charting.plot2d.axes.Base, {
		constructor: function(kwArgs, chart){
			this.opt = dojo.mixin({
				fixUpper: "none",
				fixLower: "none",
				includeZero: false,
				barsMode:    false,
				natural:     false,
				majorLabels: true,
				minorLabels: true,
				lowerBottom: true
			}, kwArgs);
		},
		clear: function(){
			delete this.scaler;
			return this;
		},
		initialized: function(){
			return "scaler" in this;
		},
		calculate: function(min, max, span, labels){
			if(this.opt.includeZero){
				if(min > 0){ min = 0; }
				if(max < 0){ max = 0; }
			}
			//TODO: use non-zero label size
			this.scaler = dojox.charting.scaler(min, max, span, 0, {fixUpper: this.opt.fixUpper, fixLower: this.opt.fixLower});
			//TODO: fix the scaler to conform other kwArgs
			return this;
		},
		getScaler: function(){
			return this.scaler;
		},
		getOffsets: function(){
			var offsets = {l: 0, r: 0, t: 0, b: 0};
			//TODO: use real calculations to find margins
			if(this.vertical){
				if(this.opt.lowerBottom){
					offsets.l = 50;
				}else{
					offsets.r = 50;
				}
			}else{
				if(this.opt.lowerBottom){
					offsets.b = 20;
				}else{
					offsets.t = 20;
				}
			}
			return offsets;
		},
		render: function(dim, offsets){
			return this;
		}
	});
})();
