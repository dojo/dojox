dojo.provide("dojox.widget._Gauge");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit._Container");
dojo.require("dijit.Tooltip");
dojo.require("dojo.fx.easing");
dojo.require("dojox.gfx");

dojo.experimental("dojox.widgets._Gauge");

dojo.declare("dojox.widget._Gauge",[dijit._Widget, dijit._Templated, dijit._Container],{
	// summary:
	//		a gauge built using the dojox.gfx package.
	//
	// description:
	//		using dojo.gfx (and thus either SVG or VML based on what is supported), this widget
	//		builds a gauge component, used to display numerical data in a familiar format 
	//
	// usage:
	//		this widget is not to be used alone. it is meant to be subclassed, such as
	//		dojox.widget.BarGauge or dojox.widget.AnalogGauge

	// width: Number
	// the width of the gauge (default is 300)
	width: 0,

	// height: Number
	// the height of the gauge (default is 200)
	height: 0,

	// gaugeBackground: Object|String
	// background color.  if this parameter is an object, it is
	// interpreted as a 'fill' object to set a gradient on the background.
	gaugeBackground: '#e0e0e0',

	// min: Number
	// minimum value displayed by gauge (default is lowest range value)
	min: 0,

	// max: Number
	// maximum value displayed by gauge (default is largest range value)
	max: 0,

	// image: String
	// background image for gauge (default is no image)
	image: null,

	// imageX: Number
	// position of background image x coordinate (default is 0)
	imageX: -1,

	// imageY: Number
	// position of background image y coordinate (default is 0)
	imageY: -1,

	// imageWidth: Number
	// width of background image (default is gauge width)
	imageWidth: 0,

	// imageHeight: Number
	// height of background image (default is gauge width)
	imageHeight: 0,

	// imageOverlay: Boolean
	// indicates background image is overlay (default is false)
	imageOverlay: false,

	// useRangeStyles: Number
	// indicates whether to use given css classes (dojoxGaugeRangeXX)
	// to determine the color (and other style attributes?) of the ranges
	// this value should be the number of dojoxGaugeRange classes that are 
	// defined, starting at dojoxGaugeRange1 (0 indicates falling to default
	// hardcoded colors)
	useRangeStyles: 0,

	// useTooltip: Boolean
	// indicates whether tooltips should be displayed for ranges, indicators, etc.
	useTooltip: true,
	
	majorTicks: {},
	minorTicks: {},
//	image: {},

	// internal data
	gaugeContent: undefined,
	templatePath: dojo.moduleUrl("dojox.widget", "Gauge/_Gauge.html"),

	defaultColors: [[0x00,0x54,0xAA,1],
					[0x44,0x77,0xBB,1],
					[0x66,0x99,0xCC,1],
					[0x99,0xBB,0xEE,1],
					[0x99,0xCC,0xFF,1],
					[0xCC,0xEE,0xFF,1],
					[0xDD,0xEE,0xFF,1]],
	min: null,
	max: null,
	surface: null,
	rangeData: null,
	indicatorData: null,
	drag: null,
	img: null,
	overOverlay: false,
	lastHover: '',

	startup: function(){
		// handle settings from HTML by making sure all the options are
		// converted correctly to numbers and that we calculate defaults
		// for cx, cy and radius
		/*this.width = Number(this.width);
		this.height = Number(this.height);
		if(this.min){this.min = Number(this.min)};
		if(this.max){this.max = Number(this.max)};

		if(this.imageX != -1){this.imageX = Number(this.imageX)};
		if(this.imageY != -1){this.imageY = Number(this.imageY)};
		if(this.imageWidth){this.imageWidth = Number(this.imageWidth)};
		if(this.imageHeight){this.imageHeight = Number(this.imageHeight)};*/
		if(this.image === null){
			this.image={};
		}

		this.connect(this.gaugeContent, 'onmousemove', this.handleMouseMove);
		this.connect(this.gaugeContent, 'onmouseover', this.handleMouseOver);
		this.connect(this.gaugeContent, 'onmouseout', this.handleMouseOut);
		this.connect(this.gaugeContent, 'onmouseup', this.handleMouseUp);

		if(!dojo.isArray(this.ranges)){ this.ranges = []; }
		if(!dojo.isArray(this.indicators)){ this.indicators = []; }
		var ranges = [], indicators = [];
		var i;
		if(this.hasChildren()){
			var children = this.getChildren();
			for(i=0; i<children.length; i++){
				if(/dojox\.widget\..*Indicator/.test(children[i].declaredClass)){
					indicators.push(children[i]);
					//this.addIndicator(children[i]);
					continue;
				}
				switch(children[i].declaredClass){
					case "dojox.widget.Range":
						ranges.push(children[i]);
						/*this.addRange(children[i]);*/
						break;
					case "dojox.widget.Gradient":
						var tmp = children[i].getFillObject();
						if(tmp.x1 == -1){tmp.x1 = this.width;}
						if(tmp.x2 == -1){tmp.x2 = this.width;}
						if(tmp.y1 == -1){tmp.y1 = this.height;}
						if(tmp.y2 == -1){tmp.y2 = this.height;}
						this.gaugeBackground = tmp;
						break;
				}
			}
			this.ranges = this.ranges.concat(ranges);
			this.indicators = this.indicators.concat(indicators);
		}
		if (!this.surface){this.createSurface();}

		this.addRanges(this.ranges);
		if(this.minorTicks.interval){
			this.setMinorTicks(this.minorTicks);
		}
		if(this.majorTicks.interval){
			this.setMajorTicks(this.majorTicks);
		}
		for(i=0; i<this.indicators.length; i++){
			this.addIndicator(this.indicators[i]);
		}
	},
	
	_setTicks: function(/*Object*/ oldTicks, /*Object*/ newTicks, /*Boolean*/ label){
		var i;
		if(oldTicks && dojo.isArray(oldTicks._ticks)){
			for(i=0; i<oldTicks._ticks.length; i++){
				this.removeIndicator(oldTicks._ticks[i]);
			}
		}
		var t = { length: newTicks.length, 
				  offset: newTicks.offset,
				  noChange: true};
		if(newTicks.color){ t.color = newTicks.color; }
		newTicks._ticks = [];
		for(i=this.min; i<=this.max; i+=newTicks.interval){
			t.value = i;
			if(label){t.label = ''+i;}
			newTicks._ticks.push(this.addIndicator(t));
		}
		return newTicks;
	},
	
	setMinorTicks: function(/*Object*/ ticks){
		this.minorTicks = this._setTicks(this.minorTicks, ticks, false);
	},

	setMajorTicks: function(/*Object*/ ticks){
		this.majorTicks = this._setTicks(this.majorTicks, ticks, true);
	},

	postCreate: function(){
		if(this.hideValues){
			dojo.style(this.containerNode, "display", "none");
		}
		dojo.style(this.mouseNode, 'width', '0');
		dojo.style(this.mouseNode, 'height', '0');
		dojo.style(this.mouseNode, 'position', 'absolute');
		dojo.style(this.mouseNode, 'z-index', '100');
		if(this.useTooltip){
			dijit.showTooltip('test',this.mouseNode);
			dijit.hideTooltip(this.mouseNode);
		}
	},

	createSurface: function(){
		// summary:
		//		internal method used by the gauge to create the graphics surface area
		this.gaugeContent.style.width = this.width + 'px';
		this.gaugeContent.style.height = this.height + 'px';
		this.surface = dojox.gfx.createSurface(this.gaugeContent, this.width, this.height);
		var background = this.surface.createRect({x: 0, y: 0, width: this.width, height: this.height });
		background.setFill(this.gaugeBackground);

		if(this.image.url){
			this.img = this.surface.createImage({width: this.image.width || this.width, height: this.image.height || this.height, src: this.image.url});
			if(this.image.overlay){
				this.img.getEventSource().setAttribute('overlay',true);
			}
			if(dojox.gfx.vml && dojo.isIE < 7){
				var end = this.image.substring(this.image.url.length - 3);
				if((end == 'png') || (end == 'PNG')){
					// use DirectX filter to correctly handle PNG transparency
					this.img.rawNode.firstChild.src = dojo.moduleUrl('dojo.resources', 'blank.gif');
					this.img.rawNode.firstChild.style.filter = "progid:DXImageTransform.Microsoft.AlphaImageLoader(src='"+this.image.url+"',sizingMethod='scale');";
				}
			}
			if(this.image.x || this.image.y){
				this.img.setTransform({dx: this.image.x || 0, dy: this.image.y || 0});
			}
		}
	},

	addRange: function(/*Object*/range){
		// summary:
		//		This method is used to add a range to the gauge.
		// description:
		//		Creates a range (colored area on the background of the gauge)
		//		based on the given arguments.
		// range:
		//		A range is either a dojox.widget.Range object, or a object
		//		with similar parameters (low, high, hover, etc.).
		this.addRanges([range]);
	},

	addRanges: function(/*Array*/ranges){
		// summary:
		//		This method is used to add ranges to the gauge.
		// description:
		//		Creates a range (colored area on the background of the gauge) 
		//		based on the given arguments.
		// range:
		//		A range is either a dojox.widget.Range object, or a object 
		//		with similar parameters (low, high, hover, etc.).
		if(!this.rangeData){ 
			this.rangeData = [];
		}
		var range;
		for(var i=0; i<ranges.length; i++){
			range = ranges[i];
			if((this.min === null) || (range.low < this.min)){this.min = range.low;}
			if((this.max === null) || (range.high > this.max)){this.max = range.high;}

			if(!range.color){
				var colorIndex = this.rangeData.length % this.defaultColors.length;
				if(dojox.gfx.svg && this.useRangeStyles > 0){
					colorIndex = (this.rangeData.length % this.useRangeStyles)+1;
					range.color = {style: "dojoxGaugeRange"+colorIndex};
				}else{
					colorIndex = this.rangeData.length % this.defaultColors.length;
					range.color = this.defaultColors[colorIndex];
				}
			}
			this.rangeData[this.rangeData.length] = range;
		}
		this.draw();
	},

	addIndicator: function(/*Object*/indicator){
		// summary:
		//		This method is used to add an indicator to the bar graph.
		// description:
		//		This method adds an indicator, such as a tick mark or needle,
		//		to the bar graph.
		// indicator:
		//		A dojox.widget._Indicator or an object with similar parameters
		//		(value, color, offset, etc.).

		indicator._gauge = this;
		if(!indicator.declaredClass){// !== 'dojox.widget.Indicator'){
			// We were passed a plain object, need to make an indicator out of it.
			indicator = new this._defaultIndicator(indicator);
		}
		if(!indicator.hideValues){
			this.containerNode.appendChild(indicator.domNode);
		}
		if(!this.indicatorData){this.indicatorData = [];}
		this.indicatorData[this.indicatorData.length] = indicator;
		indicator.draw();
		return indicator;
	},

	removeIndicator: function(/*Object*/indicator){
		for(var i=0; i<this.indicatorData.length; i++){
			if(this.indicatorData[i] === indicator){
				this.indicatorData.splice(i, 1);
				indicator.remove();
				break;
			}
		}
	},

	moveIndicatorToFront: function(/*Object*/indicator){
		// summary:
		//		This function is used to move an indicator the the front (top)
		//		of the gauge
		// indicator:
		//		A dojox.widget._Indicator or an object with similar parameters
		//		(value, color, offset, etc.).
		if(indicator.shapes){
			for(var i=0; i<indicator.shapes.length; i++){
				indicator.shapes[i].moveToFront();
			}
		}
	},

	drawText: function(/*String*/txt, /*Number*/x, /*Number*/y, /*String?*/align, /*String?*/vAlign, /*String?*/color, /*Object?*/font){
		// summary:
		//		This function is used draw text onto the gauge.  The text object
		//		is also returned by the function so that may be removed later
		//		by calling removeText
		// txt:		String
		//			The text to be drawn
		// x:		Number
		//			The x coordinate at which to place the text
		// y:		Number
		//			The y coordinate at which to place the text
		// align?:	String
		//			Indicates how to align the text
		//			Valid value is 'right', otherwise text is left-aligned
		// vAlign?:	String
		//			Indicates how to align the text vertically.
		//			Valid value is 'top', otherwise text is bottom-aligned
		// color?:	String
		//			Indicates the color of the text
		// font?:	Object
		//			A font object, generally of the following format:
		//			{family: "Helvetica", style: "italic", size: "18pt", rotated: true}

		var t = this.surface.createText({x: x, y: y, text: txt, align: align});
		t.setFill(color);
		t.setFont(font);
		return t;
	},

	removeText:function(/*String*/t){
		// summary:
		//		Removes a text element from the gauge.
		// t:	String
		//		The text to remove.
		this.surface.rawNode.removeChild(t);
	},

	updateTooltip: function(/*String*/txt, /*Event*/ e){
		// summary:
		//		Updates the tooltip for the gauge to display the given text.
		// txt:		String
		//			The text to put in the tooltip.
		if(this.lastHover != txt){
			if(txt !== ''){ 
				dijit.hideTooltip(this.mouseNode);
				dijit.showTooltip(txt,this.mouseNode);
			}else{
				dijit.hideTooltip(this.mouseNode);
			}
			this.lastHover = txt;
		}
	},

	handleMouseOver: function(/*Object*/event){
		// summary:
		//		This is an internal handler used by the gauge to support 
		//		hover text
		// event:	Object
		//			The event object
		var hover = event.target.getAttribute('hover');
		if(event.target.getAttribute('overlay')){
			this.overOverlay = true;
			var r = this.getRangeUnderMouse(event);
			if(r && r.hover){
				hover = r.hover;
			}
		}
		if(this.useTooltip && !this.drag){
			if(hover){
				this.updateTooltip(hover, event);
			}else{
				this.updateTooltip('', event);
			}
		}
	},

	handleMouseOut: function(/*Object*/event){
		// summary:
		//		This is an internal handler used by the gauge to support 
		//		hover text
		// event:	Object
		//			The event object
		if(event.target.getAttribute('overlay')){
			this.overOverlay = false;
		}
		if(this.useTooltip && this.mouseNode){
			dijit.hideTooltip(this.mouseNode);
		}
	},

	handleMouseDown: function(/*Object*/event){
		// summary:
		//		This is an internal handler used by the gauge to support using
		//		the mouse to drag an indicator to modify it's value
		// event:	Object
		//			The event object

		// find the indicator being dragged
		for(var i=0; i<this.indicatorData.length; i++){
			var shapes = this.indicatorData[i].shapes;
			for(var s=0; s<shapes.length; s++){
				if(shapes[s].getEventSource() == event.target){
					 this.drag = this.indicatorData[i];
					 s = shapes.length;
					 i = this.indicatorData.length;
				}
			}
		}
		dojo.stopEvent(event);
	},

	handleMouseUp: function(/*Object*/event){
		// summary:
		//		This is an internal handler used by the gauge to support using
		//		the mouse to drag an indicator to modify it's value
		// event:	Object
		//			The event object
		this.drag = null;
		dojo.stopEvent(event);
	},

	handleMouseMove: function(/*Object*/event){
		// summary:
		//		This is an internal handler used by the gauge to support using
		//		the mouse to drag an indicator to modify it's value
		// event:	Object
		//			The event object
		if(event){
			dojo.style(this.mouseNode, 'left', event.pageX+1+'px');
			dojo.style(this.mouseNode, 'top', event.pageY+1+'px');
		}
		if(this.drag){
			this._dragIndicator(this, event);
		}else{
			if(this.useTooltip && this.overOverlay){
				var r = this.getRangeUnderMouse(event);
				if(r && r.hover){
					this.updateTooltip(r.hover, event);
				}else{
					this.updateTooltip('', event);
				}
			}
		}
	}
});

dojo.declare("dojox.widget.Range",[dijit._Widget, dijit._Container, dijit._Contained],{
	// summary:
	//		a range to be used in a _Gauge
	//
	// description:
	//		a range widget, which has given properties.  drawn by a _Gauge.
	//
	// usage:
	//		<script type="text/javascript">
	//			dojo.require("dojox.widget.AnalogGauge");
	//			dojo.require("dojox.widget.Range");
	//			dojo.require("dijit.util.parser");
	//		</script>
	//		...
	//		<div	dojoType="dojox.widget.AnalogGauge"
	//				id="testGauge"
	//				width="300"
	//				height="200"
	//				cx=150
	//				cy=175
	//				radius=125
	//				image="gaugeOverlay.png"
	//				imageOverlay="false"
	//				imageWidth="280"
	//				imageHeight="155"
	//				imageX="12"
	//				imageY="38">
	//			<div	dojoType="dojox.widget.Range"
	//					low=5
	//					high=10
	//					hover="5 - 10"
	//			></div>
	//			<div	dojoType="dojox.widget.Range"
	//					low=10
	//					high=20
	//					hover="10 - 20"
	//			></div>
	//		</div>
	
	// low: Number
	// the low value of the range 
	low: 0,
	
	// high: Numbe
	// the high value of the range
	high: 0,
	
	// hover: String
	// the text to put in the tooltip for the gauge
	hover: '',
	
	// color: String|Gradient
	// the color of the range.  this could be a string or a dojox.widget.Gradient
	color: '',
	
	// size: Number
	// for a circular gauge (such as an AnalogGauge), this dictates the size of the arc 
	size: 0,

	startup: function(){
		if(this.getChildren){
			dojo.forEach(this.getChildren(), function(child){ child.startup(); });
		}

		if(this.hasChildren()){
			var children = this.getChildren();
			for(var i=0; i<children.length; i++){
				if(children[i].declaredClass === "dojox.widget.Gradient"){
					this.color = children[i].getFillObject();
				}
			}
		}
	}
});

dojo.declare("dojox.widget.Gradient",[dijit._Widget, dijit._Templated, dijit._Container, dijit._Contained],{
	// summary:
	//		a gradient background, to be used by a _Gauge
	//
	// description:
	//		a gradient background, which has given properties.  drawn by a _Gauge.
	//
	// usage:
	//		<script type="text/javascript">
	//			dojo.require("dojox.widget.AnalogGauge");
	//			dojo.require("dojox.widget.Range");
	//			dojo.require("dijit.util.parser");
	//		</script>
	//		...
	//		<div	dojoType="dojox.widget.AnalogGauge"
	//				id="testGauge"
	//				width="300"
	//				height="200"
	//				cx=150
	//				cy=175
	//				radius=125
	//				image="gaugeOverlay.png"
	//				imageOverlay="false"
	//				imageWidth="280"
	//				imageHeight="155"
	//				imageX="12"
	//				imageY="38">
	//			<div	dojoType="dojox.widget.Gradient"
	//					type="linear"
	//					x1=0
	//					x2=0
	//					y2=0>
	//				<div	dojoType="dojox.widget.GradientColor"
	//						offset=0
	//						color="#ECECEC"></div>
	//				<div	dojoType="dojox.widget.GradientColor"
	//						offset=1
	//						color="white"></div>
	//			</div>
	//		</div>
	templateString: '<div type="${type}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" dojoattachpoint="containerNode"></div>',

	// type: String
	// type of gradient, see dojox.gfx.*
	type: "linear",

	// x1: Number?
	// x coordinate of where the gradient should start. if ommitted, during startup
	// this will be initialized to the parent gauge's width
	x1: -1,

	// x2: Number?
	// x coordinate of where the gradient should end.  if ommitted, during startup
	// this will be initialized to the parent gauge's width
	x2: -1,

	// y1: Number?
	// y coordinate of where the gradient should start.  if ommitted, during startup
	// this will be initialized to the parent gauge's height
	y1: -1,

	// y2: Number?
	// y coordinate of where the gradient should end.  if ommitted, during startup
	// this will be initialized to the parent gauge's height
	y2: -1,

	// colors: Array
	// array of colors to be used in the gradient.  this is initialized during startup()
	colors: null,

	startup: function(){
		if(this.getChildren){
			dojo.forEach(this.getChildren(), function(child){ child.startup(); });
		}

		this.colors = [];

		if(this.hasChildren()){
			var children = this.getChildren();
			for(var i=0; i<children.length; i++){
				if(children[i].declaredClass === "dojox.widget.GradientColor"){
					this.colors.push(children[i].getColorObject());
				}
			}
		}
	},

	getFillObject: function(){
		var fill = {
			'type': this.type,
			'x1': this.x1,
			'x2': this.x2,
			'y1': this.y1,
			'y2': this.y2,
			'colors': []
		};
		for(var i=0; i<this.colors.length; i++){
			fill.colors.push(this.colors[i]);
		}
		return fill ;
	}
});

dojo.declare("dojox.widget.GradientColor",[dijit._Widget, dijit._Contained],{
	// summary:
	//		a color to be used in a Gradient
	//
	// description:
	//		a gradient color widget, which has given properties.  drawn by a gradient. 
	//
	// usage:
	//		<script type="text/javascript">
	//			dojo.require("dojox.widget.AnalogGauge");
	//			dojo.require("dojox.widget.Range");
	//			dojo.require("dijit.util.parser");
	//		</script>
	//		...
	//		<div	dojoType="dojox.widget.AnalogGauge"
	//				id="testGauge"
	//				width="300"
	//				height="200"
	//				cx=150
	//				cy=175
	//				radius=125
	//				image="gaugeOverlay.png"
	//				imageOverlay="false"
	//				imageWidth="280"
	//				imageHeight="155"
	//				imageX="12"
	//				imageY="38">
	//			<div	dojoType="dojox.widget.Gradient"
	//					type="linear"
	//					x1=0
	//					x2=0
	//					y2=0>
	//				<div	dojoType="dojox.widget.GradientColor"
	//						offset=0
	//						color="#ECECEC"></div>
	//				<div	dojoType="dojox.widget.GradientColor"
	//						offset=1
	//						color="white"></div>
	//			</div>
	//		</div>

	// offset: Number
	// the offset of this color (normally 0 or 1)
	offset: -1,

	// color: String
	// the color!
	color: "white",

	getColorObject: function(){
		return {offset: this.offset, color: this.color};
	}
});

dojo.declare("dojox.widget._Indicator",[dijit._Widget, dijit._Contained, dijit._Templated],{
	// summary:
	//		a indicator to be used in a gauge
	//
	// description:
	//		an indicator widget, which has given properties.  drawn by a gauge. 
	//
	// usage:
	//		<script type="text/javascript">
	//			dojo.require("dojox.widget.AnalogGauge");
	//			dojo.require("dojox.widget.Range");
	//			dojo.require("dijit.util.parser");
	//		</script>
	//		...
	//		<div	dojoType="dojox.widget.AnalogGauge"
	//				id="testGauge"
	//				width="300"
	//				height="200"
	//				cx=150
	//				cy=175
	//				radius=125
	//				image="gaugeOverlay.png"
	//				imageOverlay="false"
	//				imageWidth="280"
	//				imageHeight="155"
	//				imageX="12"
	//				imageY="38">
	//			<div 	dojoType="dojox.widget.Indicator"
	//					value=17
	//					type="arrow"
	//					length=135
	//					width=3
	//					hover="Value: 17"
	//					onDragMove="handleDragMove">
	//			</div>
	//		</div>

	// value: Number
	// The value (on the gauge) that this indicator should be placed at
	value: 0,

	// type: String
	// The type of indicator to draw.  Varies by gauge type.  Some examples include
	// "line", "arrow", and "bar"
	type: '',

	// color: String
	// The color of the indicator.
	color: 'black',

	// label: String
	// The text label for the indicator.
	label: '',

	// font: Object
	// Generally in a format similar to:
	// {family: "Helvetica", weight: "bold", style: "italic", size: "18pt", rotated: true}
	font: {family: "sans-serif", size: "12px"},

	// length: Number
	// The length of the indicator.  In the above example, the radius of the AnalogGauge
	// is 125, but the length of the indicator is 135, meaning it would project beyond
	// the edge of the AnalogGauge
	length: 0,

	// width: Number
	// The width of the indicator.
	width: 0,

	// offset: Number
	// The offset of the indicator
	offset: 0,

	// hover: String
	// The string to put in the tooltip when this indicator is hovered over.
	hover: '',

	// front: boolean
	// Keep this indicator at the front
	front: false,

	// onDragMove: String
	// The function to call when this indicator is moved by dragging.
	//onDragMove: '',

	// easing: String|Object
	// indicates the easing function to be used when animating the of an indicator.
	easing: dojo._defaultEasing,

	// duration: Number
	// indicates how long an animation of the indicator should take
	duration: 1000,

	// hideValues: Boolean
	// indicates whether the text boxes showing the value of the indicator (as text 
	// content) should be hidden or shown.  Default is not hidden, aka shown.
	hideValues: false,

	// noChange: Boolean
	// indicates whether the indicator's value can be changed.  Useful for 
	// a static target indicator.  Default is false (that the value can be changed).
	noChange: false,

	_gauge: null,
	title: "",

	templatePath: dojo.moduleUrl("dojox.widget", "Gauge/Indicator.html"),

	startup: function() {
		if(this.onDragMove){
			this.onDragMove = dojo.hitch(this.onDragMove);
		}
	},

	postCreate: function() {
		if(this.title === ""){
			dojo.style(this.domNode, "display", "none");
		}
		if(dojo.isString(this.easing)){
			this.easing = dojo.getObject(this.easing);
		}
	},

	_update: function(event){
		var value = this.valueNode.value;
		if(value == ''){
			this.value = null;
		}else{
			this.value = Number(value);
			this.hover = this.title+': '+value;
		}
		if(this._gauge){
			this.draw();
			this.valueNode.value = this.value;
			if((this.title == 'Target' || this.front) && this._gauge.moveIndicator){
				// if re-drawing value, make sure target is still on top
				this._gauge.moveIndicatorToFront(this);
			}
		}
	},

	update: function(value){
		if(!this.noChange){
			this.valueNode.value = value;
			this._update();
		}
	},

	onDragMove: function(){
		this.value = Math.floor(this.value);
		this.valueNode.value = this.value;
		this.hover = this.title+': '+this.value;
	},

	// draw: function
	//	performs the initial drawing of the indicator.
	draw: function(){},

	remove: function(){
		for(var i=0; i<this.shapes.length; i++){
			this._gauge.surface.remove(this.shapes[i]);
		}
		if(this.text){
			this._gauge.surface.remove(this.text);
		}
	}
});
