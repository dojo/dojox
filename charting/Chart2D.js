dojo.provide("dojox.charting.Chart2D");

dojo.require("dojox.gfx");
dojo.require("dojox.lang.functional");
dojo.require("dojox.charting.plot2d.axes");
dojo.require("dojox.charting.plot2d.renderers");
dojo.require("dojox.charting.Theme");

(function(){
	var n = dojox.gfx.normalizedLength, df = dojox.lang.functional,
		dc = dojox.charting, clear = df.lambda("item.clear()"), o = {};

	dojo.declare("dojox.charting.Chart2D", null, {
		constructor: function(node, kwArgs){
			// default initialization
			this.theme = null;
			this.axes = {};
			this.stack = [];
			this.renderers = {};
			this.series = [];
			
			// create a surface
			this.node = dojo.byId(node);
			this.surface = dojox.gfx.createSurface(this.node, n(this.node.style.width), n(this.node.style.height));
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
			this.stack.push(renderer);
			this.renderers[name] = renderer;
			return this;
		},
		addSeries: function(name, data, kwArgs){
			var run = {name: name, data: data};
			if(kwArgs){ dojo.mixin(run, kwArgs); }
			if(typeof run.plot != "string"){ run.plot = "default"; }
			this.series.push(run);
			return this;
		},
		render: function(){
			// clear old values
			
			dojo.forEach(this.stack, clear);
			this.surface.clear();
			//if(this.theme){ this.theme.clear(); }
			
			// rebuild new connections, and add defaults
			
			// assign series
			for(var i = 0; i < this.series.length; ++i){
				var run = this.series[i];
				if(!(run.plot in this.renderers)){
					var renderer = new dc.plot2d.renderers.Default({}, this);
					this.stack.push(renderer);
					this.renderers[run.plot] = renderer;
				}
				this.renderers[run.plot].addSeries(run);
			}
			// assign axes
			for(var i = 0; i < this.stack.length; ++i){
				var renderer = this.stack[i];
				if("hAxis" in renderer){
					renderer.setAxis(this.axes[renderer.hAxis]);
				}
				if("vAxis" in renderer){
					renderer.setAxis(this.axes[renderer.vAxis]);
				}
			}
			// set up a theme
			if(!this.theme){
				this.theme = new dojox.charting.Theme(dojox.charting._def);
			}
			
			// calculate geometry
			
			var dim = this.surface.getDimensions();
			df.forIn(this.axes, clear);
			for(var i = 0; i < this.stack.length; ++i){
				var renderer = this.stack[i];
				// use the current dimension as an approximation
				renderer.calculateAxes(dim);
			}
			// assumption: we don't have stacked axes yet
			var offsets = {l: 0, r: 0, t: 0, b: 0};
			for(var i in this.axes){
				if(i in o){ continue; }
				var offs = this.axes[i].getOffsets();
				offsets.l = Math.max(offsets.l, offs.l);
				offsets.r = Math.max(offsets.r, offs.r);
				offsets.t = Math.max(offsets.t, offs.t);
				offsets.b = Math.max(offsets.b, offs.b);
			}
			// add some standard margins
			offsets.l += 10;
			offsets.r += 10;
			offsets.t += 10;
			offsets.b += 10;
			// second run with realistic dimensions
			var plotArea = {width: dim.width - offsets.l - offsets.r, height: dim.height - offsets.t - offsets.b};
			df.forIn(this.axes, clear);
			for(var i = 0; i < this.stack.length; ++i){
				var renderer = this.stack[i];
				// use the current dimension as an approximation
				renderer.calculateAxes(plotArea);
			}
			
			// generate shapes
			
			// draw a chart background
			var t = this.theme;
			if(("chart" in t)){
				var chartArea = this.surface.createRect({width: dim.width - 1, height: dim.height - 1});
				if("fill" in t.chart){ chartArea.setFill(t.chart.fill); }
				if("stroke" in t.chart){ chartArea.setStroke(t.chart.stroke); }
			}
			// draw a plot background
			if(("plotarea" in t)){
				var plotArea = this.surface.createRect({
					x: offsets.l, y: offsets.t,
					width: dim.width - offsets.l - offsets.r - 1, 
					height: dim.height - offsets.t - offsets.b - 1
				});
				if("fill" in t.plotarea){ plotArea.setFill(t.plotarea.fill); }
				if("stroke" in t.plotarea){ plotArea.setStroke(t.plotarea.stroke); }
			}
			// go over the stack backwards
			for(var i = this.stack.length - 1; i >= 0; --i){
				this.stack[i].render(dim, offsets);
			}
			// go over axes
			for(var i in this.axes){
				if(i in o){ continue; }
				this.axes[i].render(dim, offsets);
			}
			
			return this;
		}
	});
})();
