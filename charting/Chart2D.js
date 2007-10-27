dojo.provide("dojox.charting.Chart2D");

dojo.require("dojox.gfx");
dojo.require("dojox.lang.functional");
dojo.require("dojox.charting.plot2d.axes");
dojo.require("dojox.charting.plot2d.renderers");
dojo.require("dojox.charting.Theme");

(function(){
	var df = dojox.lang.functional, dc = dojox.charting, 
		clear = df.lambda("item.clear()");

	dojo.declare("dojox.charting.Chart2D", null, {
		constructor: function(node, kwArgs){
			// initialize parameters
			this.margins = kwArgs && kwArgs.margins ? kwArgs.margins : {l: 10, t: 10, r: 10, b: 10};
			
			// default initialization
			this.theme = null;
			this.axes = {};
			this.stack = [];
			this.renderers = {};
			this.series = [];
			this.runs = {};
			
			// create a surface
			this.node = dojo.byId(node);
			var box = dojo.marginBox(node);
			this.surface = dojox.gfx.createSurface(this.node, box.w, box.h);
		},
		setTheme: function(theme){
			this.theme = theme;
			return this;
		},
		addAxis: function(name, kwArgs){
			if(!kwArgs || !("type" in kwArgs)){
				this.axes[name] = new dc.plot2d.axes.Default(kwArgs, this);
			}else{
				this.axes[name] = typeof kwArgs.type == "string" ?
					new dc.plot2d.axes[kwArgs.type](kwArgs, this) :
					new kwArgs.type(kwArgs, this);
			}
			return this;
		},
		addPlot: function(name, kwArgs){
			var renderer;
			if(!kwArgs || !("type" in kwArgs)){
				renderer = new dc.plot2d.renderers.Default(kwArgs, this);
			}else{
				renderer = typeof kwArgs.type == "string" ?
					new dc.plot2d.renderers[kwArgs.type](kwArgs, this) :
					new kwArgs.type(kwArgs, this);
			}
			renderer.name = name;
			if(name in this.renderers){
				this.stack[this.renderers[name]] = renderer;
			}else{
				this.renderers[name] = this.stack.length;
				this.stack.push(renderer);
			}
			return this;
		},
		addSeries: function(name, data, kwArgs){
			var run = {name: name, data: data}, i;
			if(kwArgs){ dojo.mixin(run, kwArgs); }
			if(typeof run.plot != "string"){ run.plot = "default"; }
			if(name in this.runs){
				this.series[this.runs[name]] = run;
			}else{
				this.runs[name] = this.series.length;
				this.series.push(run);
			}
			return this;
		},
		resize: function(width, height){
			var box;
			switch(arguments.length){
				case 0:
					box = dojo.marginBox(this.node);
					break;
				case 1: 
					box = width;
					break;
				default:
					box = {w: width, h: height};
					break;
			}
			dojo.marginBox(this.node, box);
			this.surface.setDimensions(box.w, box.h);
			return this.render();
		},
		render: function(){
			// clear old values
			
			dojo.forEach(this.stack, clear);
			this.surface.clear();
			//if(this.theme){ this.theme.clear(); }
			
			// rebuild new connections, and add defaults
			
			// assign series
			dojo.forEach(this.series, function(run){
				if(!(run.plot in this.renderers)){
					var plot = new dc.plot2d.renderers.Default({}, this);
					plot.name = run.plot;
					this.renderers[run.plot] = this.stack.length;
					this.stack.push(plot);
				}
				this.stack[this.renderers[run.plot]].addSeries(run);
			}, this);
			// assign axes
			dojo.forEach(this.stack, function(plot){
				if("hAxis" in plot){
					plot.setAxis(this.axes[plot.hAxis]);
				}
				if("vAxis" in plot){
					plot.setAxis(this.axes[plot.vAxis]);
				}
			}, this);
			// set up a theme
			if(!this.theme){
				this.theme = new dojox.charting.Theme(dojox.charting._def);
			}
			this.theme.defineColors({num: this.series.length, cache: false});
			
			// calculate geometry
			
			var dim = this.surface.getDimensions();
			dim.width  = dojox.gfx.normalizedLength(dim.width);
			dim.height = dojox.gfx.normalizedLength(dim.height);
			df.forIn(this.axes, clear);
			dojo.forEach(this.stack, function(plot){ plot.calculateAxes(dim); });
			// assumption: we don't have stacked axes yet
			var offsets = {l: 0, r: 0, t: 0, b: 0};
			df.forIn(this.axes, function(axis){
				df.forIn(axis.getOffsets(), function(o, i){ offsets[i] += o; });
			});
			// add margins
			df.forIn(this.margins, function(o, i){ offsets[i] += o; });
			// second run with realistic dimensions
			var plotArea = {width: dim.width - offsets.l - offsets.r, height: dim.height - offsets.t - offsets.b};
			df.forIn(this.axes, clear);
			dojo.forEach(this.stack, function(plot){ plot.calculateAxes(plotArea); });
			
			// generate shapes
			
			// draw a chart background
			var t = this.theme;
			if(("chart" in t)){
				if("fill" in t.chart){
					this.surface.createRect({
						width:  dim.width, 
						height: dim.height
					}).setFill(t.chart.fill);
				}
				if("stroke" in t.chart){
					this.surface.createRect({
						width:  dim.width - 1, 
						height: dim.height - 1
					}).setStroke(t.chart.stroke);
				}
			}
			// draw a plot background
			if(("plotarea" in t)){
				if("fill" in t.plotarea){
					this.surface.createRect({
						x: offsets.l, y: offsets.t,
						width:  dim.width  - offsets.l - offsets.r, 
						height: dim.height - offsets.t - offsets.b
					}).setFill(t.plotarea.fill);
				}
				if("stroke" in t.plotarea){
					this.surface.createRect({
						x: offsets.l, y: offsets.t,
						width:  dim.width  - offsets.l - offsets.r - 1, 
						height: dim.height - offsets.t - offsets.b - 1
					}).setStroke(t.plotarea.stroke);
				}
			}
			// go over the stack backwards
			df.foldr(this.stack, function(z, plot){ return plot.render(dim, offsets), 0; }, 0);
			// go over axes
			df.forIn(this.axes, function(axis){ axis.render(dim, offsets); });
			
			return this;
		}
	});
})();
