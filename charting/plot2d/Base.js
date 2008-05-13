dojo.provide("dojox.charting.plot2d.Base");

dojo.require("dojox.charting.scaler.primitive");
dojo.require("dojox.charting.Element");
dojo.require("dojox.charting.plot2d.common");

dojo.declare("dojox.charting.plot2d.Base", dojox.charting.Element, {
	clear: function(){
		this.series = [];
		this._hAxis = null;
		this._vAxis = null;
		this.dirty = true;
		return this;
	},
	setAxis: function(axis){
		if(axis){
			this[axis.vertical ? "_vAxis" : "_hAxis"] = axis;
		}
		return this;
	},
	addSeries: function(run){
		this.series.push(run);
		return this;
	},
	calculateAxes: function(dim){
		return this;
	},
	isDirty: function(){
		return this.dirty || this._hAxis && this._hAxis.dirty || this._vAxis && this._vAxis.dirty;
	},
	render: function(dim, offsets){
		return this;
	},
	getRequiredColors: function(){
		return this.series.length;
	},
	
	// utilities
	_calc: function(dim, stats){
		// calculate scaler
		if(this._hAxis){
			if(!this._hAxis.initialized()){
				this._hAxis.calculate(stats.hmin, stats.hmax, dim.width);
			}
			this._hScaler = this._hAxis.getScaler();
		}else{
			this._hScaler = dojox.charting.scaler.primitive.buildScaler(stats.hmin, stats.hmax, dim.width);
		}
		if(this._vAxis){
			if(!this._vAxis.initialized()){
				this._vAxis.calculate(stats.vmin, stats.vmax, dim.height);
			}
			this._vScaler = this._vAxis.getScaler();
		}else{
			this._vScaler = dojox.charting.scaler.primitive.buildScaler(stats.vmin, stats.vmax, dim.height);
		}
	}
});
