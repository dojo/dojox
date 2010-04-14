dojo.provide("dojox.charting.Theme");

dojo.require("dojox.color");
dojo.require("dojox.color.Palette");
dojo.require("dojox.lang.utils");

dojo.declare("dojox.charting.Theme", null, {
	shapeSpaces: {shape: 1, shapeX: 1, shapeY: 1},
	
	constructor: function(kwArgs){
		kwArgs = kwArgs || {};
		
		// populate theme with defaults updating them if needed
		var def = dojox.charting.Theme.defaultTheme;
		dojo.forEach(["chart", "plotarea", "axis", "series", "marker"], function(name){
			this[name] = dojo.delegate(def[name], kwArgs[name]);
		}, this);
		
		// personalize theme
		if(kwArgs.seriesThemes && kwArgs.seriesThemes.length){
			this.seriesThemes = kwArgs.seriesThemes.slice(0);
			this.colors  = null;
		}else{
			this.seriesThemes = null;
			this.colors = (kwArgs.colors || dojox.charting.Theme.defaultColors).slice(0);
		}
		this.markerThemes = null;
		if(kwArgs.markerThemes && kwArgs.markerThemes.length){
			this.markerThemes = kwArgs.markerThemes.slice(0);
		}
		this.markers = dojo.delegate(dojox.charting.Theme.defaultMarkers, kwArgs.markers);

		// set flags
		this.noGradConv = kwArgs.noGradConv;
		this.noRadialConv = kwArgs.noRadialConv;

		//	private housekeeping
		this._current = 0;
		this._buildMarkerArray();
	},
	
	clone: function(){
		return new dojox.charting.Theme({
			// theme components
			chart: this.chart,
			plotarea: this.plotarea,
			axis: this.axis,
			series: this.series,
			marker: this.marker,
			// individual arrays
			colors: this.colors,
			markers: this.markers,
			seriesThemes: this.seriesThemes,
			markerThemes: this.markerThemes,
			// flags
			noGradConv: this.noGradConv,
			noRadialConv: this.noRadialConv
		});
	},
	
	clear: function(){
		this._current = 0;
	},
	
	next: function(elementType, mixin, doPost){
		// process theme components
		var merge = dojox.lang.utils.merge, series, marker;
		if(this.colors){
			series = dojo.delegate(this.series);
			marker = dojo.delegate(this.marker);
			var color = new dojo.Color(this.colors[this._current % this.colors.length]), old;
			// modify the stroke
			if(series.stroke && series.stroke.color){
				series.stroke = dojo.delegate(series.stroke);
				old = new dojo.Color(series.stroke.color);
				series.stroke.color = new dojo.Color(color);
				series.stroke.color.a = old.a;
			}else{
				series.stroke = {color: color};
			}
			if(marker.stroke && marker.stroke.color){
				marker.stroke = dojo.delegate(marker.stroke);
				old = new dojo.Color(marker.stroke.color);
				marker.stroke.color = new dojo.Color(color);
				marker.stroke.color.a = old.a;
			}else{
				marker.stroke = {color: color};
			}
			// modify the fill
			if(!series.fill || series.fill.type){
				series.fill = color;
			}else{
				old = new dojo.Color(series.fill);
				series.fill = new dojo.Color(color);
				series.fill.a = old.a;
			}
			if(!marker.fill || marker.fill.type){
				marker.fill = color;
			}else{
				old = new dojo.Color(marker.fill);
				marker.fill = new dojo.Color(color);
				marker.fill.a = old.a;
			}
		}else{
			series = this.seriesThemes ?
				merge(this.series, this.seriesThemes[this._current % this.seriesThemes.length]) :
				this.series;
			marker = this.markerThemes ?
				merge(this.marker, this.markerThemes[this._current % this.markerThemes.length]) :
				series;
		}
		var symbol = this._markers[this._current++ % this._markers.length]; // note the increment
		
		var theme = {series: series, marker: marker, symbol: symbol};
		if(mixin){
			if(dojo.isArray(mixin)){
				for(var i = 0; i < mixin.length; ++i){
					theme = this.addMixin(theme, elementType, mixin[i]);
				}
			}else{
				theme = this.addMixin(theme, elementType, mixin);
			}
		}
		if(doPost){
			theme = this.post(theme, elementType);
		}
		return theme;
	},
	
	skip: function(){
		++this._current;
	},
	
	addMixin: function(theme, elementType, mixin, doPost){
		var t = {};
		if("color" in mixin){
			if(elementType == "line"){
				dojo.setObject("series.stroke.color", mixin.color, t);
				dojo.setObject("marker.stroke.color", mixin.color, t);
			}else{
				dojo.setObject("series.fill", mixin.color, t);
			}
		}
		dojo.forEach(["stroke", "outline", "shadow", "fill", "font", "fontColor"], function(name){
			var markerName = "marker" + name.charAt(0).toUpperCase() + name.substr(1),
				b = markerName in mixin;
			if(name in mixin){
				dojo.setObject("series." + name, mixin[name], t);
				if(!b){
					dojo.setObject("marker." + name, mixin[name], t);
				}
			}
			if(b){
				dojo.setObject("marker." + name, mixin[markerName], t);
			}
		});
		if("marker" in mixin){
			t.symbol = mixin.marker;
		}
		var newTheme = dojox.lang.utils.merge(theme, t);
		if(doPost){
			newTheme = this.post(newTheme, elementType);
		}
		return newTheme;
	},
	
	post: function(theme, elementType){
		// process shape-space fills
		var fill = theme.series.fill, t;
		if(!this.noGradConv && this.shapeSpaces[fill.space] && fill.type == "linear"){
			if(elementType == "bar"){
				// transpose start and end points
				t = {
					x1: fill.y1,
					y1: fill.x1,
					x2: fill.y2,
					y2: fill.x2
				};
			}else if(!this.noRadialConv && fill.space == "shape" && (elementType == "slice" || elementType == "circle")){
				// switch to radial
				t = {
					type: "radial",
					cx: 0,
					cy: 0,
					r:  100
				};
			}
			if(t){
				return dojox.lang.utils.merge(theme, {series: {fill: t}});
			}
		}
		return theme;
	},
	
	getTick: function(name, mixin){
		//	summary:
		//		Calculates and merges tick parameters.
		//	name: String:
		//		Tick name, can be "major", "minor", or "micro".
		//	mixin: Object?:
		//		Optional object to mix in to the tick.
		var tick = this.axis.tick, tickName = name + "Tick";
			merge = dojox.lang.utils.merge;
		if(tick){
			if(this.axis[tickName]){
				tick = merge(tick, this.axis[tickName]);
			}
		}else{
			tick = this.axis[tickName];
		}
		if(mixin){
			if(tick){
				if(mixin[tickName]){
					tick = merge(tick, mixin[tickName]);
				}
			}else{
				tick = mixin[tickName];
			}
		}
		return tick;
	},

	addMarker:function(/*String*/ name, /*String*/ segment){
		//	summary:
		//		Add a custom marker to this theme.
		//	example:
		//	|	myTheme.addMarker("Ellipse", foo);
		this.markers[name] = segment;
		this._buildMarkerArray();
	},
	
	setMarkers:function(/*Object*/ obj){
		//	summary:
		//		Set all the markers of this theme at once.  obj should be a
		//		dictionary of keys and path segments.
		//
		//	example:
		//	|	myTheme.setMarkers({ "CIRCLE": foo });
		this.markers = obj;
		this._buildMarkerArray();
	},

	_buildMarkerArray: function(){
		this._markers = [];
		for(var p in this.markers){
			this._markers.push(this.markers[p]);
		}
	}
});

dojo.mixin(dojox.charting.Theme, {
	defaultMarkers: {
		CIRCLE:   "m-3,0 c0,-4 6,-4 6,0 m-6,0 c0,4 6,4 6,0", 
		SQUARE:   "m-3,-3 l0,6 6,0 0,-6 z", 
		DIAMOND:  "m0,-3 l3,3 -3,3 -3,-3 z", 
		CROSS:    "m0,-3 l0,6 m-3,-3 l6,0", 
		X:        "m-3,-3 l6,6 m0,-6 l-6,6", 
		TRIANGLE: "m-3,3 l3,-6 3,6 z", 
		TRIANGLE_INVERTED: "m-3,-3 l3,6 3,-6 z"
	},

	defaultColors:[
		// gray skies
		"#54544c", "#858e94", "#6e767a", "#948585", "#474747"
	],

	defaultTheme: {
		// all objects are structs used directly in dojox.gfx
		chart:{ 
			stroke: null,
			fill: "white"
		},
		plotarea:{ 
			stroke: null,
			fill: "white"
		},
		// TODO: label rotation on axis
		axis:{
			stroke:	{ // the axis itself
				color: "#333",
				width: 1
			},
			tick: {	// used as a foundation for all ticks
				color:     "#666",
				position:  "center",
				font:      "normal normal normal 7pt Tahoma",	// labels on axis
				fontColor: "#333"								// color of labels
			},
			majorTick:	{ // major ticks on axis, and used for major gridlines
				width:  1, 
				length: 6
			},
			minorTick:	{ // minor ticks on axis, and used for minor gridlines
				width:  0.8, 
				length: 3
			},	
			microTick:	{ // minor ticks on axis, and used for minor gridlines
				width:  0.5, 
				length: 1
			}
		},
		series: {
			// used as a "main" theme for series, sThemes augment it
			stroke:  {width: 1.5, color: "#333"},		// line
			outline: {width: 0.1, color: "#ccc"},		// outline
			//shadow:  {dx: 1, dy: 1, width: 2, color: [0, 0, 0, 0.3]},
			shadow: null,								// no shadow
			fill:    "#ccc",							// fill, if appropriate
			font:    "normal normal normal 8pt Tahoma",	// if there's a label
			fontColor: "#000"							// color of labels
		},
		marker: {	// any markers on a series
			stroke:  {width: 1.5, color: "#333"},		// stroke
			outline: {width: 0.1, color: "#ccc"},		// outline
			//shadow:  {dx: 1, dy: 1, width: 2, color: [0, 0, 0, 0.3]},
			shadow: null,								// no shadow
			fill:    "#ccc",							// fill if needed
			font:    "normal normal normal 8pt Tahoma",	// label
			fontColor: "#000"
		}
	},

	defineColors: function(kwArgs){
		//	summary:
		//		Generate a set of colors for the theme based on keyword
		//		arguments.
		kwArgs = kwArgs || {};
		var c = [], n = kwArgs.num || 5;	// the number of colors to generate
		if(kwArgs.colors){
			// we have an array of colors predefined, so fix for the number of series.
			var l = kwArgs.colors.length;
			for(var i = 0; i < n; i++){
				c.push(kwArgs.colors[i % l]);
			}
			return c;
		}
		if(kwArgs.hue){
			// single hue, generate a set based on brightness
			var s = kwArgs.saturation || 100;	// saturation
			var st = kwArgs.low || 30;
			var end = kwArgs.high || 90;
			// we'd like it to be a little on the darker side.
			var l = (end + st) / 2;
			// alternately, use "shades"
			return dojox.color.Palette.generate(
				dojox.color.fromHsv(kwArgs.hue, s, l), "monochromatic"
			).colors;
		}
		if(kwArgs.generator){
			//	pass a base color and the name of a generator
			return dojox.color.Palette.generate(kwArgs.base, kwArgs.generator).colors;
		}
		return c;
	}
});
