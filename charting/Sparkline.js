dojo.provide("dojox.charting.Sparkline");

dojo.require("dojox.gfx");

(function(){
	var dxc=dojox.charting;

	//	expand as needed
	var parts=[ "surface", "plotarea", "plots", "axes", "data" ];

	dxc.Sparkline=function(){
		//	public properties.
		this.theme=kwArgs.theme||new dojox.charting.Theme();
		this.plots=[];

		//	private properties
		this._key="dojoxChartingSparkline"+dxc.Sparkline.count++;
		this._handles={};
		this._node=null;
		this._surface=null;
	};
	dxc.Sparkline.count=0;	//	for unique key generation.

	dojo.extend(dxc.Sparkline, {
		//	plots
		//	the following two handlers are placeholders for the chart to react if something
		//	changes in a plot.
		_onPlotAdd: function(plot, series){
			//	generic handler, probably invalidate the plot afterwards.
			this.invalidate([ "data" ]);
		},
		_onPlotSet: function(plot, what, obj){
			//	generic handler to figure out what was set on a plot, and what to do about it.
			var invalid=what.split("-");
			var a=[];
			switch(invalid[0]){
				case "plot": a.push("plots");
				case "axes": a.push("axes");
				default: a.push("data");
			}
			this.invalidate(a);
		},

		//	add and remove plots from the chart
		//	make sure we disconnect any handlers we attached.
		add: function(plot){
			this.plots.push(plot);

			if(!this._handles[plot._key]){
				this._handles[plot._key]=[];
			}
			this._handles[plot._key].push(dojo.connect(plot, "onSet", this, "_onPlotSet"));
			this._handles[plot._key].push(dojo.connect(plot, "onAdd", this, "_onPlotAdd"));
			this.onAdd(plot);
			this.invalidate("plots");
			return this;
		},
		remove: function(plot){
			var idx=-1;
			for(var i=0; i<this.plots.length; i++){
				if(this.plots[i]==plot){
					idx=i;
					break;
				}
			}
			if(idx>-1){
				this.plots.splice(idx,1);
				if(this._handles[plot._key]){
					dojo.forEach(this._handles[plot._key], function(handle){
						dojo.disconnect(handle);
					});
					this._handles[plot._key]=null;
				}
				this.onRemove(plot);
				this.invalidate("plots");
			}
			return this;
		},

		//	get the unique axes for the chart.  Note that plots may share axes
		//	which is why we have this method.
		getUniqueAxes: function(){
			var axes={};
			var ret=[];
			dojo.forEach(this.plots, function(plot){
				for(var p in plot.axes){
					if(!axes[plot.axes[p]._key]){
						axes[plot.axes[p]._key]=plot.axes[p];
						ret.push(plot.axes[p]);
					}
				}
			});
			return ret;
		},

		//	change the theme on the fly.
		setTheme: function(theme){
			this.theme=theme;
			this.onSetTheme(theme);
			this.invalidate();
		},

		//	internal rendering methods.
		//	DO NOT CALL THESE DIRECTLY.

		//	each property corresponds to an array element passed to invalidate.
		//	some are hierarchical (i.e. if you redraw the plotarea, you need to redraw
		//	the plots); no checks are made here, it's assumed that the authors of the
		//	function will force any subelements to redraw as needed.
		_draw: {
			surface: function(){ },
			plotarea: function(){ },
			plots: function(){ },
			axes: function(){ },
			data: function(){ }
		},

		//	this is the main rendering function.  You should ALWAYS call this, and not
		//	go to the rendering functions directly!
		
		//	We use this instead of providing direct access to rendering methods.  This
		//	way if we need to do something drastic, like do timed rendering (or if we
		//	are already on a timer for rendering), we don't need to worry about something
		//	like dojo.data firing off a lot of events very quickly, and not being able
		//	to keep up.

		//	To use, pass an array of names of the things to invalidate; the engine will
		//	pick them up on the next render sweep and redraw them.  If you are looking
		//	to redraw the entire thing (say, if you resize the surface), pass nothing
		//	to the method and it will trigger a full redraw.
		invalidate: function(args){
			if(!args){ args=parts; }
			dojo.forEach(args, function(item){
				if(this._draw[item]){
					this._draw[item]();
				}
			});
			this.onInvalidate(args);
		},

		onAdd: function(plot){ },
		onRemove: function(plot){ },
		onSetTheme: function(theme){ },
		onInvalidate: function(args){ }
	});
})();
