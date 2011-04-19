dojo.provide("dojox.gauges.BarGauge");

dojo.require("dojox.gfx");
dojo.require("dojox.gauges._Gauge");

dojo.experimental("dojox.gauges.BarGauge");

dojo.declare("dojox.gauges.BarLineIndicator",[dojox.gauges._Indicator],{
	width: 1,
	_getShapes: function(/*dojox.gfx.Group*/ group){
		// summary:
		//		Private function for generating the shapes for this indicator. An indicator that behaves the 
		//		same might override this one and simply replace the shapes (such as BarIndicator).
		if(!this._gauge){
			return null;
		}
		var v = this.value;
		if(v < this._gauge.min){v = this._gauge.min;}
		if(v > this._gauge.max){v = this._gauge.max;}
		var pos = this._gauge._getPosition(v);
		var shapes = [];
		if(this.width > 1){
			shapes[0] = group.createRect({
				x:0, 
				y:this._gauge.dataY + this.offset,
				width:this.width, 
				height:this.length
			});
			shapes[0].setStroke({color: this.color});
			shapes[0].setFill(this.color);
			shapes[0].setTransform(dojox.gfx.matrix.translate(pos,0));
		}else{
			shapes[0] = group.createLine({
				x1:0, 
				y1:this._gauge.dataY + this.offset,
				x2:0, 
				y2:this._gauge.dataY + this.offset + this.length
			});
			shapes[0].setStroke({color: this.color});
			shapes[0].setTransform(dojox.gfx.matrix.translate(pos,0));
		}
		return shapes;
	},
	draw: function(/*dojox.gfx.Group*/group, /*Boolean?*/ dontAnimate){
		// summary: 
		//		Override of dojox.gauges._Indicator.draw
		// dontAnimate: Boolean
		//		Indicates if the drawing should not be animated (vs. the default of doing an animation)
		var i;
		if (this.shape){
			this._move(dontAnimate);
		}else{
			if (this.shape){
				this.shape.parent.remove(this.shape);
				this.shape = null;
			}
			if (this.text){
				this.text.parent.remove(this.text);
				this.text = null;
			}
			
			this.color = this.color || '#000000';
			this.length = this.length || this._gauge.dataHeight;
			this.width = this.width || 3;
			this.offset = this.offset || 0;
			this.highlight = this.highlight || '#4D4D4D';
			this.highlight2 = this.highlight2 || '#A3A3A3';
			
			var shapes = this._getShapes(group, this._gauge, this);
			
			if (shapes.length > 1){
				this.shape = group.createGroup();
				for (var s = 0; s < shapes.length; s++){
					this.shape.add(shapes[s]);
				}
			} else this.shape = shapes[0];
			
			if (this.label){
				var v = this.value;
				if (v < this._gauge.min){
					v = this._gauge.min;
				}
				if (v > this._gauge.max){
					v = this._gauge.max;
				}
				var pos = this._gauge._getPosition(v);
				
				if (this.direction == 'inside'){
					var font = this.font ? this.font : dojox.gfx.defaultFont;
					var fz = font.size;
					var th = dojox.gfx.normalizedLength(fz);
					
					this.text = this._gauge.drawText(group, '' + this.label, pos, this._gauge.dataY + this.offset + this.length + 5 + th, 'middle', this.color, this.font);
				} else this.text = this._gauge.drawText(group, '' + this.label, pos, this._gauge.dataY + this.offset - 5, 'middle', this.color, this.font);
			}
			
			this.shape.connect("onmouseover", this, this.handleMouseOver);
			this.shape.connect("onmouseout", this, this.handleMouseOut);
			this.shape.connect("onmousedown", this, this.handleMouseDown);
			this.shape.connect("touchstart", this, this.handleTouchStart);
			this.currentValue = this.value;
		}
	},
	
	_move: function(/*Boolean?*/ dontAnimate){
		// summary: 
		//		Moves this indicator (since it's already been drawn once)
		// dontAnimate: Boolean
		//		Indicates if the drawing should not be animated (vs. the default of doing an animation)
		var v = this.value ;
		if(v < this._gauge.min){v = this._gauge.min;}
		if(v > this._gauge.max){v = this._gauge.max;}
		var c = this._gauge._getPosition(this.currentValue);
		this.currentValue = v;
		v = this._gauge._getPosition(v);

		if(dontAnimate){
			this.shape.setTransform(dojox.gfx.matrix.translate(v,0));
		}else{
			var anim = new dojo.Animation({curve: [c, v], duration: this.duration, easing: this.easing});
			dojo.connect(anim, "onAnimate", dojo.hitch(this, function(jump){
				if (this.shape)
				 this.shape.setTransform(dojox.gfx.matrix.translate(jump,0));
			}));
			anim.play();
		}
	}
});
dojo.declare("dojox.gauges.BarGauge",dojox.gauges._Gauge,{
	// summary:
	//		a bar graph built using the dojox.gfx package.
	//
	// description:
	//		using dojo.gfx (and thus either SVG or VML based on what is supported), this widget
	//		builds a bar graph component, used to display numerical data in a familiar format.
	//
	// usage:
	//		<script type="text/javascript">
	//			dojo.require("dojox.gauges.BarGauge");
	//			dojo.require("dijit.util.parser");
	//		</script>
	//		...
	//		<div 	dojoType="dojox.gauges.BarGauge"
	//				id="testBarGauge"
	//				barGaugeHeight="55"
	//				dataY="25"
	//				dataHeight="25"
	//				dataWidth="225">
	//		</div>

	// dataX: Number
	// x position of data area (default 5)
	dataX: 5,

	// dataY: Number
	// y position of data area (default 5)
	dataY: 5,

	// dataWidth: Number
	// width of data area (default is bar graph width - 10)
	dataWidth: 0,

	// dataHeight: Number
	// height of data area (default is bar graph width - 10)
	dataHeight: 0,

	// _defaultIndicator: override of dojox.gauges._Gauge._defaultIndicator
	_defaultIndicator: dojox.gauges.BarLineIndicator,

	startup: function(){
		// handle settings from HTML by making sure all the options are
		// converted correctly to numbers 
		//
		// also connects mouse handling events

		if(this.getChildren){
			dojo.forEach(this.getChildren(), function(child){ child.startup(); });
		}

		if(!this.dataWidth){this.dataWidth = this.gaugeWidth - 10;}
		if(!this.dataHeight){this.dataHeight = this.gaugeHeight - 10;}

		this.inherited(arguments);
	},

	_getPosition: function(/*Number*/value){
		// summary:
		//		This is a helper function used to determine the position that represents
		//		a given value on the bar graph
		// value:	Number
		//			A value to be converted to a position for this bar graph.

		return this.dataX + Math.floor((value - this.min)/(this.max - this.min)*this.dataWidth);
	},

	_getValueForPosition: function(/*Number*/pos){
		// summary:
		//		This is a helper function used to determine the value represented by
		//		a position on the bar graph
		// pos:		Number
		//			A position to be converted to a value.
		return (pos - this.dataX)*(this.max - this.min)/this.dataWidth + this.min;
	},

	drawRange: function(/*dojox.gfx.Group*/ group, /*Object*/range){
		// summary:
		//		This function is used to draw (or redraw) a range
		// description:
		//		Draws a range (colored area on the background of the gauge) 
		//		based on the given arguments.
		// group:
		//      The GFX group where the range must be drawn.
		// range:
		//		A range is either a dojox.gauges.Range or an object
		//		with similar parameters (low, high, hover, etc.).
		if(range.shape){
			range.shape.parent.remove(range.shape);
			range.shape = null;
		}

		var x1 = this._getPosition(range.low);
		var x2 = this._getPosition(range.high);
		var path = group.createRect({
			x: x1,
			y: this.dataY,
			width: x2 - x1,
			height: this.dataHeight
		});	
		if(dojo.isArray(range.color) || dojo.isString(range.color)){
			path.setStroke({color: range.color});
			path.setFill(range.color);
		}else if(range.color.type){
			// Color is a gradient
			var y = this.dataY + this.dataHeight/2;
			range.color.x1 = x1;
			range.color.x2 = x2;
			range.color.y1 = y;
			range.color.y2 = y;
			path.setFill(range.color);
			path.setStroke({color: range.color.colors[0].color});
		}else if (dojox.gfx.svg){
			// We've defined a style rather than an explicit color
			path.setStroke({color: "green"});	// Arbitrary color, just have to indicate
			path.setFill("green");				// that we want it filled
			path.getEventSource().setAttribute("class", range.color.style);
		}
	
		path.connect("onmouseover", dojo.hitch(this, this._handleMouseOverRange, range));
		path.connect("onmouseout", dojo.hitch(this, this._handleMouseOutRange, range));
	
		range.shape = path;
	},

	getRangeUnderMouse: function(/*Object*/event){
		// summary:
		//		Determines which range the mouse is currently over
		// event:	Object
		//			The event object as received by the mouse handling functions below.
		var range = null;
		var pos = dojo.coords(this.gaugeContent);
		var x = event.clientX - pos.x;
		var value = this._getValueForPosition(x);
		if(this._rangeData){
			for(var i=0; (i<this._rangeData.length) && !range; i++){
				if((Number(this._rangeData[i].low) <= value) && (Number(this._rangeData[i].high) >= value)){
					range = this._rangeData[i];
				}
			}
		}
		return range;
	},


	_dragIndicator: function(/*Object*/widget, /*Object*/ event){
		// summary:
		// Handles the dragging of an indicator to the event position, including moving/re-drawing
		// get angle for mouse position
		this._dragIndicatorAt(widget, event.pageX, event.pageY);
		dojo.stopEvent(event);
	},
	
	_dragIndicatorAt: function(/*Object*/ widget, x, y){
		
		// summary:
		//		Handles the dragging of an indicator, including moving/re-drawing
		// get new value based on mouse position
		var pos = dojo.position(widget.gaugeContent, true);
		var xl = x - pos.x;
		var value = widget._getValueForPosition(xl);
		if(value < widget.min){value = widget.min;}
		if(value > widget.max){value = widget.max;}
		// update the indicator
		widget._drag.value = value;
		// callback
		widget._drag.onDragMove(widget._drag);
		// redraw/move indicator(s)
		widget._drag.draw(this._indicatorsGroup, true);
		widget._drag.valueChanged();
	}
});
