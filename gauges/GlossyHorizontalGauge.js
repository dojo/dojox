dojo.provide("dojox.gauges.GlossyHorizontalGauge");
dojo.require('dojox.gauges.BarCircleIndicator');
dojo.require("dojox.gfx");
dojo.require("dojox.gfx.matrix");
dojo.require("dojox.gauges.BarGauge");

dojo.declare("dojox.gauges.GlossyHorizontalGaugeMarker", [dojox.gauges.BarLineIndicator], {
	// summary:
	//		The marker for the dojox.gauges.GlossyHorizontalGauge.
	// description:
	//		This object defines the marker for the dojox.gauges.GlossyHorizontalGauge.
	//		Since the needle is created by the gauges class, you do not have to use this class directly.
	
	
	interactionMode: "gauge",
	
	color: 'black',
	
	_getShapes: function(group){
		// summary:
		//		Overrides BarLineIndicator._getShapes
		
		if (!this._gauge){
			return null;
		}
		var v = this.value;
		if (v < this._gauge.min){
			v = this._gauge.min;
		}
		if (v > this._gauge.max){
			v = this._gauge.max;
		}
		
		var pos = this._gauge._getPosition(v);
		var shapes = [];
		
		var color = new dojo.Color(this.color);
		color.a = .67;
		
		var lighterColor = dojo.blendColors(color, new dojo.Color('white'), 0.4);
		
		var top = shapes[0] = group.createGroup();
		var scale = this._gauge.height / 100;
		scale = Math.max(scale, .5);
		scale = Math.min(scale, 1);
		
		top.setTransform({
			xx: 1,
			xy: 0,
			yx: 0,
			yy: 1,
			dx: pos,
			dy: 0
		});
		var marker = top.createGroup().setTransform({
			xx: 1,
			xy: 0,
			yx: 0,
			yy: 1,
			dx: -scale * 10,
			dy: this._gauge.dataY + this.offset
		});
		var rescale = marker.createGroup().setTransform({
			xx: scale,
			xy: 0,
			yx: 0,
			yy: scale,
			dx: 0,
			dy: 0
		});
		
		rescale.createRect({
			x: .5,
			y: .0,
			width: 20,
			height: 47,
			r: 6
		}).setFill(color).setStroke(lighterColor);
		rescale.createPath({
			path: 'M 10.106 41 L 10.106 6 C 10.106 2.687 7.419 0 4.106 0 L 0.372 0 C -0.738 6.567 1.022 15.113 1.022 23.917 C 1.022 32.721 2.022 40.667 0.372 47 L 4.106 47 C 7.419 47 10.106 44.314 10.106 41 Z'
		}).setFill(lighterColor).setTransform({
			xx: 1,
			xy: 0,
			yx: 0,
			yy: 1,
			dx: 10.306,
			dy: 0.009
		});
		rescale.createRect({
			x: 9.5,
			y: 1.5,
			width: 2,
			height: 34,
			r: 0.833717
		}).setFill(color).setStroke(this.color);
		rescale.createRect({
			x: 9,
			y: 0,
			width: 3,
			height: 34,
			r: 6
		}).setFill({
			type: "linear",
			x1: 9,
			y1: 0,
			x2: 9,
			y2: 34,
			colors: [{
				offset: 0,
				color: 'white'
			}, {
				offset: 1,
				color: this.color
			}]
		});
		return shapes;
	}
	
});

dojo.declare("dojox.gauges.GlossyHorizontalGauge", [dojox.gauges.BarGauge], {
	// summary:
	//		Represents an horizontal bar gauge with a glossy appearance.
	// example:
	//	<div dojoType="dojox.gauges.GlossyHorizontalGauge"
	//				id="testGauge"
	//				width="500"
	//				height="100"
	//				min="0"
	//				max="100"
	//	            value="0" 
	//	            majorTicksInterval="10"
	//	            majorTicksColor="#c4c4c4"
	//	            minorTicksInterval="5"
	//	            minorTicksColor="#c4c4c4"
	//	            color="black" 
	//	            markerColor="#c4c4c4"
	//	            font="normal normal normal 10pt sans-serif"
	//              noChange="true"
	//              title="title"
	//              scalePrecision="0"
	//			>
	//		</div>
	
	
	// the type of default indicator to create
	_defaultIndicator: dojox.gauges.BarCircleIndicator,
	
	// color: String
	// The main color of the gauge.
	color: 'black',
	
	// needleColor: Color
	// The main color of the needle.
	markerColor: 'black',
	
	// majorTicksInterval: Number
	// Interval between major ticks
	majorTicksInterval: 10,
	
	// _majorTicksLength: Number
	// Major tick size, at design
	_majorTicksLength: 10,
	
	// majorTicksColor: Color
	// Color of major tick marks
	majorTicksColor: '#c4c4c4',
	
	// minorTicksInterval: Number
	// Interval between minor ticks
	minorTicksInterval: 5,
	
	// _minorTicksLength: Number
	// Minor tick size, at design
	_minorTicksLength: 6,
	
	// minorTicksColor : Color
	// Color of minor tick marks
	minorTicksColor: '#c4c4c4',
	
	// value: Number
	// The value of the gauge.
	value: 0,
	
	// noChange: Boolean
	// Indicates if the gauge reacts to touch events
	noChange: false,
	
	// title: String
	// The title displayed in the needle's tooltip
	title: "",
	
	// font: Object
	// The font of the gauge
	font: "normal normal normal 10pt serif",
	
	// scalePrecision: Number
	// The precision for the formating of numbers in the scale (default is 0)
	scalePrecision: 0,
	
	_font: null,
	
	_margin: 2,
	_minBorderWidth: 2,
	_maxBorderWidth: 6,
	_tickLabelOffset: 5,
	_designHeight: 100,
	
	constructor: function(){
		this.min = 0;
		this.max = 100;
	},
	
	startup: function(){
		this.inherited(arguments);
		this._started = true;
		
		var scale = this.height / this._designHeight;
		
		this._minorTicksLength = this._minorTicksLength * scale;
		this._majorTicksLength = this._majorTicksLength * scale;
		
		var font = this._font;
		this._computeDataRectangle();
		
		// computing scale height
		
		var th = dojox.gfx.normalizedLength(font.size);
		var scaleHeight = th + this._tickLabelOffset + Math.max(this._majorTicksLength, this._minorTicksLength);
		// indicator in the middle of the gauge
		var yOffset = Math.max(0, (this.height - scaleHeight) / 2);
		
		this.addRange({
			low: this.min ? this.min : 0,
			high: this.max ? this.max : 100,
			color: [0, 0, 0, 0]
		});
		
		this.setMajorTicks({
			fixedPrecision: true,
			precision: this.scalePrecision,
			font: font,
			labelPlacement: 'inside',
			offset: yOffset - this._majorTicksLength / 2,
			interval: this.majorTicksInterval,
			length: this._majorTicksLength,
			color: this.majorTicksColor
		
		});
		
		this.setMinorTicks({
			labelPlacement: 'inside',
			offset: yOffset - this._minorTicksLength / 2,
			interval: this.minorTicksInterval,
			length: this._minorTicksLength,
			color: this.minorTicksColor
		
		});
		this._needle = new dojox.gauges.GlossyHorizontalGaugeMarker({
			hideValue: true,
			title: this.title,
			noChange: this.noChange,
			offset: yOffset,
			color: this.markerColor,
			value: this.value
		});
		this.addIndicator(this._needle);
		
		dojo.connect(this._needle, "valueChanged", dojo.hitch(this, function(){
			this.value = this._needle.value;
			this.onValueChanged();
		}));
	},
	
	_layoutGauge: function(){
		// summary: 
		//		Layout the gauge elements depending on the various parameters (size, font, tick length..)
		
		if (!this._started) 
			return;
		
		var font = this._font;
		this._computeDataRectangle();
		var th = dojox.gfx.normalizedLength(font.size);
		var scaleHeight = th + this._tickLabelOffset + Math.max(this._majorTicksLength, this._minorTicksLength);
		// indicator in the middle of the gauge
		var yOffset = Math.max(0, (this.height - scaleHeight) / 2);
		
		
		this._setMajorTicksProperty({
			fixedPrecision: true,
			precision: this.scalePrecision,
			font: font,
			offset: yOffset - this._majorTicksLength / 2,
			interval: this.majorTicksInterval,
			length: this._majorTicksLength
		});
		
		this._setMinorTicksProperty({
			offset: yOffset - this._minorTicksLength / 2,
			interval: this.minorTicksInterval,
			length: this._minorTicksLength
		});
		
		this.removeIndicator(this._needle);
		this._needle.offset = yOffset;
		this.addIndicator(this._needle);
	},
	
	_formatNumber: function(val){
	
		if (dojo.number) // use internationalization if loaded
			return dojo.number.format(val, {
				places: this.scalePrecision
			})
		
		else 			
			return val.toFixed(this.scalePrecision);
		
	},
	
	_computeDataRectangle: function(){
		// summary: 
		//		Computes the rectangle that defines the data area of the gauge.
		
		
		if (!this._started) 
			return;
		
		var font = this._font;
		var leftTextMargin = this._getTextWidth(this._formatNumber(this.min), font) / 2;
		var rightTextMargin = this._getTextWidth(this._formatNumber(this.max), font) / 2;
		var textMargin = Math.max(leftTextMargin, rightTextMargin);
		
		var margin = this._getBorderWidth() + Math.max(this._majorTicksLength, this._majorTicksLength) / 2 + textMargin;
		this.dataHeight = this.height;
		this.dataY = 0;
		this.dataX = margin + this._margin;
		this.dataWidth = Math.max(0, this.width - 2 * this.dataX);
	},
	
	_getTextWidth: function(s, font){
		return dojox.gfx._base._getTextBox(s, {
			font: dojox.gfx.makeFontString(dojox.gfx.makeParameters(dojox.gfx.defaultFont, font))
		}).w ||
		0;
	},
	
	_getBorderWidth: function(){
		// summary: 
		//		Computes the width of the border surrounding the gauge
		return Math.max(this._minBorderWidth, Math.min(this._maxBorderWidth, this._maxBorderWidth * this.height / this._designHeight));
	},
	
	drawBackground: function(group){
		// summary: 
		//		Draws the background of the gauge
		if (this._gaugeBackground){
			return this._gaugeBackground;
		}
		
		var lighterColor = dojo.blendColors(new dojo.Color(this.color), new dojo.Color('white'), 0.4);
		this._gaugeBackground = group.createGroup();
		var scale = this.height / this._designHeight;
		var borderWidth = this._getBorderWidth();
		var margin = this._margin;
		var w = this.width;
		var h = this.height;
		var radius = Math.min(h / 4, 23);
		this._gaugeBackground.createRect({
			x: margin,
			y: margin,
			width: Math.max(0, w - 2 * margin),
			height: Math.max(0, h - 2 * margin),
			r: radius
		}).setFill(this.color);
		
		var left = margin + borderWidth;
		var right = w - borderWidth - margin;
		var top = margin + borderWidth;
		var w2 = w - 2 * borderWidth - 2 * margin;
		var h2 = h - 2 * borderWidth - 2 * margin;
		if (w2 <= 0 || h2 <= 0) 
			return;
		radius = Math.min(radius, w2 / 2);
		radius = Math.min(radius, h2 / 2);
		this._gaugeBackground.createRect({
			x: left,
			y: top,
			width: w2,
			height: h2,
			r: radius
		}).setFill({
			type: "linear",
			x1: left,
			y1: 0,
			x2: left,
			y2: h - borderWidth - margin,
			colors: [{
				offset: 0,
				color: lighterColor
			}, {
				offset: .2,
				color: this.color
			}, {
				offset: .8,
				color: this.color
			}, {
				offset: 1,
				color: lighterColor
			}]
		});
		
		var f = 4 * (Math.sqrt(2) - 1) / 3 * radius;
		this._gaugeBackground.createPath({
			path: 'M' + left + ' ' + (top + radius) +
			'C' +
			left +
			' ' +
			(top + radius - f) +
			' ' +
			(left + radius - f) +
			' ' +
			top +
			' ' +
			(left + radius) +
			' ' +
			top +
			'L' +
			(right - radius) +
			' ' +
			top +
			'C' +
			(right - radius + f) +
			' ' +
			top +
			' ' +
			right +
			' ' +
			(top + radius - f) +
			' ' +
			right +
			' ' +
			(top + radius) +
			'L' +
			right +
			' ' +
			(top + h / 2) +
			'L' +
			left +
			' ' +
			(top + h / 3) +
			'Z'
		}).setFill({
			type: "linear",
			x1: left,
			y1: top,
			x2: left,
			y2: top + this.height / 2,
			colors: [{
				offset: 0,
				color: lighterColor
			}, {
				offset: 1,
				color: dojo.blendColors(new dojo.Color(this.color), new dojo.Color('white'), 0.2)
			}]
		});
	},
	
	onValueChanged: function(){
		// summary:
		//		Callback when the value of the gauge has changed.
	
	},
	
	//*******************************************************************************************
	//* Property getters and setters
	//*******************************************************************************************
	
	_setColorAttr: function(color){
		// summary: 
		//		Sets the main color of the gauge
		// color : String
		//      The color		
		this.color = color ? color : 'black';
		if (this._gaugeBackground && this._gaugeBackground.parent) 
			this._gaugeBackground.parent.remove(this._gaugeBackground);
		
		this._gaugeBackground = null;
		this.draw();
	},
	
	_setMarkerColorAttr: function(color){
		// summary: 
		//		Sets the main color of the marker
		// color : String
		//      The color
		this.markerColor = color;
		if (this._needle){
			this.removeIndicator(this._needle);
			this._needle.color = color;
			this._needle.shape = null;
			this.addIndicator(this._needle);
		}
	},
	
	_setMajorTicksIntervalAttr: function(interval){
		// summary: 
		//		Sets the interval between major ticks
		this.majorTicksInterval = interval;
		this._setMajorTicksProperty({
			'interval': this.majorTicksInterval
		});
	},
	
	setMajorTicksLength: function(length){
		// summary: 
		//		Sets the size of the major ticks.
		this._majorTicksLength = length;
		this._layoutGauge();
		return this;
		
	},
	
	getMajorTicksLength: function(){
		// summary: 
		//		Returns the size of the major ticks.
		return this._majorTicksLength;
	},
	
	_setMajorTicksColorAttr: function(color){
		// summary: 
		//		Sets the color of the major ticks.
		this.majorTicksColor = color;
		this._setMajorTicksProperty({
			'color': this.majorTicksColor
		});
	},
	
	_setMajorTicksProperty: function(prop){
		if (this.majorTicks == null){
			return;
		}
		dojo.mixin(this.majorTicks, prop);
		this.setMajorTicks(this.majorTicks);
	},
	
	_setMinorTicksIntervalAttr: function(interval){
		// summary: 
		//		Sets the interval between minor ticks
		this.minorTicksInterval = interval;
		this._setMinorTicksProperty({
			'interval': this.minorTicksInterval
		});
	},
	
	setMinorTicksLength: function(length){
		// summary: 
		//		Sets the size of the minor ticks.
		this._minorTicksLength = length;
		this._layoutGauge();
		return this;
	},
	
	getMinorTicksLength: function(){
		// summary: 
		//		Return the size of the minor ticks.
		return this._minorTicksLength;
	},
	
	_setMinorTicksColorAttr: function(color){
		// summary: 
		//		Sets the color of the minor ticks.
		this.minorTicksColor = color;
		this._setMinorTicksProperty({
			'color': this.minorTicksColor
		});
	},
	
	_setMinorTicksProperty: function(prop){
		if (this.minorTicks == null){
			return;
		}
		dojo.mixin(this.minorTicks, prop);
		this.setMinorTicks(this.minorTicks);
	},
	
	_setMinAttr: function(min){
		this.min = min;
		this._computeDataRectangle();
		if (this.majorTicks != null) 
			this.setMajorTicks(this.majorTicks);
		if (this.minorTicks != null) 
			this.setMinorTicks(this.minorTicks);
		this.draw();
	},
	
	_setMaxAttr: function(max){
		this.max = max;
		this._computeDataRectangle();
		if (this.majorTicks != null) 
			this.setMajorTicks(this.majorTicks);
		if (this.minorTicks != null) 
			this.setMinorTicks(this.minorTicks);
		this.draw();
	},
	
	_setValueAttr: function(value){
		// summary: 
		//		Changes the value of the gauge
		// value: Number
		//		The new value for the gauge.			
		
		value = Math.min(this.max, value);
		value = Math.max(this.min, value);
		this.value = value;
		if (this._needle){
			// update will not work if noChange is true.
			var noChange = this._needle.noChange;
			this._needle.noChange = false;
			this._needle.update(value);
			this._needle.noChange = noChange;
		}
	},
	
	_setScalePrecisionAttr: function(value){
		// summary: 
		//		Changes precision of the numbers in the scale of the gauge
		// value: Number
		//		The new value
		this.scalePrecision = value;
		this._layoutGauge();
	},
	
	_setNoChangeAttr: function(value){
		// summary: 
		//		Indicates if the value of the gauge can be changed or not
		// value: boolean
		//		true indicates that the gauge's value cannot be changed	
		this.noChange = value;
		if (this._needle) 
			this._needle.noChange = this.noChange;
	},
	
	_setTitleAttr: function(value){
		// summary: 
		//		Sets the title displayed by the needle's tooltip .
		// value: String
		//		the title
		
		this.title = value;
		if (this._needle){
			this._needle.title = this.title;
		}
	},
	
	_setFontAttr: function(font){
		// summary: 
		//		Sets the font of the gauge
		// summary: 
		//		Sets the font of the gauge
		// font: String
		//		An string representing the font such as 'normal normal normal 10pt Helvetica,Arial,sans-serif'	
		// 
		
		this.font = font;
		this._font = dojox.gfx.splitFontString(font);
		this._layoutGauge();
	}
});

