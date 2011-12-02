define(["dojo/_base/lang", "dojo/_base/declare", "dojo/_base/connect", "dojo/_base/array",
		"../Element", "./common", "dojox/lang/utils", "dojox/gfx/fx"], 
	function(lang, declare, hub, arr, Element, dc, du, fx){

	/*=====
	dojo.declare("dojox.charting.plot2d.__GridCtorArgs", dojox.charting.plot2d.__DefaultCtorArgs, {
		//	summary:
		//		A special keyword arguments object that is specific to a grid "plot".
	
		//	majorHLine: dojox.gfx.Stroke?
		//		An optional dojox.gfx.Stroke for a major horizontal line. By default major lines use major tick stroke.
		majorHLine,
		
		//	minorHLine: dojox.gfx.Stroke?
		//		An optional dojox.gfx.Stroke for a minor horizontal line. By default minor lines use minor tick stroke.
		minorHLine,
		
		//	majorVLine: dojox.gfx.Stroke?
		//		An optional dojox.gfx.Stroke for a major vertical line. By default major lines use major tick stroke.
		majorVLine,
		
		//	minorVLine: dojox.gfx.Stroke?
		//		An optional dojox.gfx.Stroke for a minor vertical line. By default major lines use major tick stroke.
		minorVLine,
	
		//	hMajorLines: Boolean?
		//		Whether to show lines at the major ticks along the horizontal axis. Default is true.
		hMajorLines: true,
	
		//	hMinorLines: Boolean?
		//		Whether to show lines at the minor ticks along the horizontal axis. Default is false.
		hMinorLines: false,
	
		//	vMajorLines: Boolean?
		//		Whether to show lines at the major ticks along the vertical axis. Default is true.
		vMajorLines: true,
	
		//	vMinorLines: Boolean?
		//		Whether to show lines at the major ticks along the vertical axis. Default is false.
		vMinorLines: false,
		
		//	enableCache: Boolean?
		//		Whether the grid lines are cached from one rendering to another. This improves the rendering performance of
		//		successive rendering but penalize the first rendering.  Default false.
		enableCache: false,
		
		//	renderOnAxis: Boolean?
		//		Whether or not the grid is rendered when drawn at horizontal or vertical axis position. Default is true.
		renderOnAxis: true
	});
	var Element = dojox.charting.plot2d.Element;
	=====*/

	return declare("dojox.charting.plot2d.Grid", Element, {
		//	summary:
		//		A "faux" plot that can be placed behind other plots to represent
		//		a grid against which other plots can be easily measured.
		defaultParams: {
			hAxis: "x",			// use a horizontal axis named "x"
			vAxis: "y",			// use a vertical axis named "y"
			hMajorLines: true,	// draw horizontal major lines
			hMinorLines: false,	// draw horizontal minor lines
			vMajorLines: true,	// draw vertical major lines
			vMinorLines: false,	// draw vertical minor lines
			hStripes: false,	// TBD, stripes are not implemented
			vStripes: false,	// TBD, stripes are not implemented
			animate: null,   // animate bars into place
			enableCache: false,
			renderOnAxis: true
		},
		
		optionalParams: {
			majorHLine: {},
			minorHLine: {},
			majorVLine: {},
			minorVLine: {}
		},	

		constructor: function(chart, kwArgs){
			//	summary:
			//		Create the faux Grid plot.
			//	chart: dojox.charting.Chart
			//		The chart this plot belongs to.
			//	kwArgs: dojox.charting.plot2d.__GridCtorArgs?
			//		An optional keyword arguments object to help define the parameters of the underlying grid.
			this.opt = lang.clone(this.defaultParams);
			du.updateWithObject(this.opt, kwArgs);
			du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
			this.hAxis = this.opt.hAxis;
			this.vAxis = this.opt.vAxis;
			this.dirty = true;
			this.animate = this.opt.animate;
			this.zoom = null,
			this.zoomQueue = [];	// zooming action task queue
			this.lastWindow = {vscale: 1, hscale: 1, xoffset: 0, yoffset: 0};
			if(this.opt.enableCache){
				this._lineFreePool = [];
				this._lineUsePool = [];
			}
		},
		clear: function(){
			//	summary:
			//		Clear out any parameters set on this plot.
			//	returns: dojox.charting.plot2d.Grid
			//		The reference to this plot for functional chaining.
			this._hAxis = null;
			this._vAxis = null;
			this.dirty = true;
			return this;	//	dojox.charting.plot2d.Grid
		},
		setAxis: function(axis){
			//	summary:
			//		Set an axis for this plot.
			//	returns: dojox.charting.plot2d.Grid
			//		The reference to this plot for functional chaining.
			if(axis){
				this[axis.vertical ? "_vAxis" : "_hAxis"] = axis;
			}
			return this;	//	dojox.charting.plot2d.Grid
		},
		addSeries: function(run){
			//	summary:
			//		Ignored but included as a dummy method.
			//	returns: dojox.charting.plot2d.Grid
			//		The reference to this plot for functional chaining.
			return this;	//	dojox.charting.plot2d.Grid
		},
		getSeriesStats: function(){
			//	summary:
			//		Returns default stats (irrelevant for this type of plot).
			//	returns: Object
			//		{hmin, hmax, vmin, vmax} min/max in both directions.
			return lang.delegate(dc.defaultStats);
		},
		initializeScalers: function(){
			//	summary:
			//		Does nothing (irrelevant for this type of plot).
			return this;
		},
		isDirty: function(){
			//	summary:
			//		Return whether or not this plot needs to be redrawn.
			//	returns: Boolean
			//		If this plot needs to be rendered, this will return true.
			return this.dirty || this._hAxis && this._hAxis.dirty || this._vAxis && this._vAxis.dirty;	//	Boolean
		},
		performZoom: function(dim, offsets){
			//	summary:
			//		Create/alter any zooming windows on this plot.
			//	dim: Object
			//		An object of the form { width, height }.
			//	offsets: Object
			//		An object of the form { l, r, t, b }.
			//	returns: dojox.charting.plot2d.Grid
			//		A reference to this plot for functional chaining.

			// get current zooming various
			var vs = this._vAxis.scale || 1,
				hs = this._hAxis.scale || 1,
				vOffset = dim.height - offsets.b,
				hBounds = this._hAxis.getScaler().bounds,
				xOffset = (hBounds.from - hBounds.lower) * hBounds.scale,
				vBounds = this._vAxis.getScaler().bounds,
				yOffset = (vBounds.from - vBounds.lower) * vBounds.scale,
				// get incremental zooming various
				rVScale = vs / this.lastWindow.vscale,
				rHScale = hs / this.lastWindow.hscale,
				rXOffset = (this.lastWindow.xoffset - xOffset)/
					((this.lastWindow.hscale == 1)? hs : this.lastWindow.hscale),
				rYOffset = (yOffset - this.lastWindow.yoffset)/
					((this.lastWindow.vscale == 1)? vs : this.lastWindow.vscale),

				shape = this.group,
				anim = fx.animateTransform(lang.delegate({
					shape: shape,
					duration: 1200,
					transform:[
						{name:"translate", start:[0, 0], end: [offsets.l * (1 - rHScale), vOffset * (1 - rVScale)]},
						{name:"scale", start:[1, 1], end: [rHScale, rVScale]},
						{name:"original"},
						{name:"translate", start: [0, 0], end: [rXOffset, rYOffset]}
					]}, this.zoom));

			lang.mixin(this.lastWindow, {vscale: vs, hscale: hs, xoffset: xOffset, yoffset: yOffset});
			//add anim to zooming action queue,
			//in order to avoid several zooming action happened at the same time
			this.zoomQueue.push(anim);
			//perform each anim one by one in zoomQueue
			hub.connect(anim, "onEnd", this, function(){
				this.zoom = null;
				this.zoomQueue.shift();
				if(this.zoomQueue.length > 0){
					this.zoomQueue[0].play();
				}
			});
			if(this.zoomQueue.length == 1){
				this.zoomQueue[0].play();
			}
			return this;	//	dojox.charting.plot2d.Grid
		},
		getRequiredColors: function(){
			//	summary:
			//		Ignored but included as a dummy method.
			//	returns: Number
			//		Returns 0, since there are no series associated with this plot type.
			return 0;	//	Number
		},
		cleanGroup: function(){
			this.inherited(arguments);
			if(this.opt.enableCache){
				this._lineFreePool = this._lineFreePool.concat(this._lineUsePool);
				this._lineUsePool = [];
			}
		},
		createLine: function(creator, params){
			var line;
			if(this.opt.enableCache && this._lineFreePool.length > 0){
				line = this._lineFreePool.pop();
				line.setShape(params);
				// was cleared, add it back
				creator.add(line);
			}else{
				line = creator.createLine(params);
			}
			if(this.opt.enableCache){
				this._lineUsePool.push(line);
			}
			return line;
		},
		render: function(dim, offsets){
			//	summary:
			//		Render the plot on the chart.
			//	dim: Object
			//		An object of the form { width, height }.
			//	offsets: Object
			//		An object of the form { l, r, t, b }.
			//	returns: dojox.charting.plot2d.Grid
			//		A reference to this plot for functional chaining.
			if(this.zoom){
				return this.performZoom(dim, offsets);
			}
			this.dirty = this.isDirty();
			if(!this.dirty){ return this; }
			this.cleanGroup();
			var s = this.group, ta = this.chart.theme, lineStroke;
			var renderOnAxis = this.opt.renderOnAxis;
			if(this._vAxis){
				var vScaler = this._vAxis.getScaler();				
				if(vScaler){
					var vt = vScaler.scaler.getTransformerFromModel(vScaler);
					var ticks;
					// draw horizontal stripes and lines
					ticks = this._vAxis.getTicks();
					if(ticks != null){
						if(this.opt.hMinorLines){
							lineStroke = this.opt.minorHLine || (ta.grid && ta.grid.minorLine) || ta.axis.minorTick;		
							arr.forEach(ticks.minor, function(tick){
								if(!renderOnAxis && tick.value == (this._vAxis.opt.leftBottom?vScaler.bounds.from:vScaler.bounds.to)){
									return;
								}
								var y = dim.height - offsets.b - vt(tick.value);
								var hMinorLine = this.createLine(s, {
									x1: offsets.l,
									y1: y,
									x2: dim.width - offsets.r,
									y2: y
								}).setStroke(lineStroke);
								if(this.animate){
									this._animateGrid(hMinorLine, "h", offsets.l, offsets.r + offsets.l - dim.width);
								}
							}, this);
						}
						if(this.opt.hMajorLines){
							lineStroke = this.opt.majorHLine || (ta.grid && ta.grid.majorLine) || ta.axis.majorTick;	
							arr.forEach(ticks.major, function(tick){
								if(!renderOnAxis && tick.value == (this._vAxis.opt.leftBottom?vScaler.bounds.from:vScaler.bounds.to)){
									return;
								}							
								var y = dim.height - offsets.b - vt(tick.value);
								var hMajorLine = this.createLine(s, {
									x1: offsets.l,
									y1: y,
									x2: dim.width - offsets.r,
									y2: y
								}).setStroke(lineStroke);
								if(this.animate){
									this._animateGrid(hMajorLine, "h", offsets.l, offsets.r + offsets.l - dim.width);
								}
							}, this);
						}
					}
				}
			}
			if(this._hAxis){
				var hScaler = this._hAxis.getScaler();				
				if(hScaler){
					var ht = hScaler.scaler.getTransformerFromModel(hScaler);
					// draw vertical stripes and lines
					ticks = this._hAxis.getTicks();
					if(this != null){
						if(ticks && this.opt.vMinorLines){
							lineStroke = this.opt.minorVLine || (ta.grid && ta.grid.minorLine) || ta.axis.minorTick;	
							arr.forEach(ticks.minor, function(tick){
								if(!renderOnAxis && tick.value == (this._hAxis.opt.leftBottom?hScaler.bounds.from:hScaler.bounds.to)){
									return;
								}								
								var x = offsets.l + ht(tick.value);
								var vMinorLine = this.createLine(s, {
									x1: x,
									y1: offsets.t,
									x2: x,
									y2: dim.height - offsets.b
								}).setStroke(lineStroke);
								if(this.animate){
									this._animateGrid(vMinorLine, "v", dim.height - offsets.b, dim.height - offsets.b - offsets.t);
								}
							}, this);
						}
						if(ticks && this.opt.vMajorLines){
							lineStroke = this.opt.majorVLine || (ta.grid && ta.grid.majorLine) || ta.axis.majorTick;	
							arr.forEach(ticks.major, function(tick){
								if(!renderOnAxis && tick.value == (this._hAxis.opt.leftBottom?hScaler.bounds.from:hScaler.bounds.to)){
									return;
								}								
								var x = offsets.l + ht(tick.value);
								var vMajorLine = this.createLine(s, {
									x1: x,
									y1: offsets.t,
									x2: x,
									y2: dim.height - offsets.b
								}).setStroke(lineStroke);
								if(this.animate){
									this._animateGrid(vMajorLine, "v", dim.height - offsets.b, dim.height - offsets.b - offsets.t);
								}
							}, this);
						}
					}
				}
			}
			this.dirty = false;
			return this;	//	dojox.charting.plot2d.Grid
		},
		_animateGrid: function(shape, type, offset, size){
			var transStart = type == "h" ? [offset, 0] : [0, offset];
			var scaleStart = type == "h" ? [1/size, 1] : [1, 1/size];
			fx.animateTransform(lang.delegate({
				shape: shape,
				duration: 1200,
				transform: [
					{name: "translate", start: transStart, end: [0, 0]},
					{name: "scale", start: scaleStart, end: [1, 1]},
					{name: "original"}
				]
			}, this.animate)).play();
		}
	});
});
