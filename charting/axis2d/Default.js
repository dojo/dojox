dojo.provide("dojox.charting.axis2d.Default");

dojo.require("dojox.charting.scaler.linear");
dojo.require("dojox.charting.axis2d.common");
dojo.require("dojox.charting.axis2d.Base");

dojo.require("dojo.colors");
dojo.require("dojo.string");
dojo.require("dojox.gfx");
dojo.require("dojox.lang.functional");
dojo.require("dojox.lang.utils");

(function(){
	var dc = dojox.charting,
		df = dojox.lang.functional,
		du = dojox.lang.utils,
		g = dojox.gfx,
		lin = dc.scaler.linear,
		merge = du.merge,
		labelGap = 4;	// in pixels

	dojo.declare("dojox.charting.axis2d.Default", dojox.charting.axis2d.Base, {
		 defaultParams: {
			vertical:    false,		// true for vertical axis
			fixUpper:    "none",	// align the upper on ticks: "major", "minor", "micro", "none"
			fixLower:    "none",	// align the lower on ticks: "major", "minor", "micro", "none"
			natural:     false,		// all tick marks should be made on natural numbers
			leftBottom:  true,		// position of the axis, used with "vertical"
			includeZero: false,		// 0 should be included
			fixed:       true,		// all labels are fixed numbers
			majorLabels: true,		// draw major labels
			minorTicks:  true,		// draw minor ticks
			minorLabels: true,		// draw minor labels
			microTicks:  false,		// draw micro ticks
			htmlLabels:  true		// use HTML to draw labels
		},
		optionalParams: {
			min:			0,	// minimal value on this axis
			max:			1,	// maximal value on this axis
			from:			0,	// visible from this value
			to:				1,	// visible to this value
			majorTickStep:	4,	// major tick step
			minorTickStep:	2,	// minor tick step
			microTickStep:	1,	// micro tick step
			labels:			[],	// array of labels for major ticks
								// with corresponding numeric values
								// ordered by values
			labelFunc:		null, // function to compute label values
			maxLabelSize:	0,	// size in px. For use with labelFunc

			// TODO: add support for minRange!
			// minRange:		1,	// smallest distance from min allowed on the axis

			// theme components
			stroke:			{},	// stroke for an axis
			majorTick:		{},	// stroke + length for a tick
			minorTick:		{},	// stroke + length for a tick
			microTick:		{},	// stroke + length for a tick
			tick:           {},	// stroke + length for a tick
			font:			"",	// font for labels
			fontColor:		""	// color for labels as a string
		},

		constructor: function(chart, kwArgs){
			this.opt = dojo.delegate(this.defaultParams, kwArgs);
			// du.updateWithObject(this.opt, kwArgs);
			du.updateWithPattern(this.opt, kwArgs, this.optionalParams);
		},
		dependOnData: function(){
			return !("min" in this.opt) || !("max" in this.opt);
		},
		clear: function(){
			delete this.scaler;
			delete this.ticks;
			this.dirty = true;
			return this;
		},
		initialized: function(){
			return "scaler" in this && !(this.dirty && this.dependOnData());
		},
		setWindow: function(scale, offset){
			this.scale  = scale;
			this.offset = offset;
			return this.clear();
		},
		getWindowScale: function(){
			return "scale" in this ? this.scale : 1;
		},
		getWindowOffset: function(){
			return "offset" in this ? this.offset : 0;
		},
		_groupLabelWidth: function(labels, font){
			if(labels[0]["text"]){
				labels = df.map(labels, function(label){ return label.text; });
			}
			var s = labels.join("<br>");
			return dojox.gfx._base._getTextBox(s, {font: font}).w || 0;
		},
		calculate: function(min, max, span, labels){
			if(this.initialized()){
				return this;
			}
			var o = this.opt;
			this.labels = "labels" in o  ? o.labels : labels;
			this.scaler = lin.buildScaler(min, max, span, o);
			var tsb = this.scaler.bounds;
			if("scale" in this){
				// calculate new range
				o.from = tsb.lower + this.offset;
				o.to   = (tsb.upper - tsb.lower) / this.scale + o.from;
				// make sure that bounds are correct
				if( !isFinite(o.from) ||
					isNaN(o.from) ||
					!isFinite(o.to) ||
					isNaN(o.to) ||
					o.to - o.from >= tsb.upper - tsb.lower
				){
					// any error --- remove from/to bounds
					delete o.from;
					delete o.to;
					delete this.scale;
					delete this.offset;
				}else{
					// shift the window, if we are out of bounds
					if(o.from < tsb.lower){
						o.to += tsb.lower - o.from;
						o.from = tsb.lower;
					}else if(o.to > tsb.upper){
						o.from += tsb.upper - o.to;
						o.to = tsb.upper;
					}
					// update the offset
					this.offset = o.from - tsb.lower;
				}
				// re-calculate the scaler
				this.scaler = lin.buildScaler(min, max, span, o);
				tsb = this.scaler.bounds;
				// cleanup
				if(this.scale == 1 && this.offset == 0){
					delete this.scale;
					delete this.offset;
				}
			}
			var minMinorStep = 0, ta = this.chart.theme.axis,
				// TODO: we use one font --- of major tick, we need to use major and minor fonts
				taFont = o.font || (ta.majorTick && ta.majorTick.font) || (ta.tick && ta.tick.font),
				size = taFont ? g.normalizedLength(g.splitFontString(taFont).size) : 0;
			if(this.vertical){
				if(size){
					minMinorStep = size + labelGap;
				}
			}else{
				if(size){
					var labelWidth, i;
					if(o.labelFunc && o.maxLabelSize){
						labelWidth = o.maxLabelSize;
					}else if(this.labels){
						labelWidth = this._groupLabelWidth(this.labels, taFont);
					}else{
						var labelLength = Math.ceil(
								Math.log(
									Math.max(
										Math.abs(tsb.from),
										Math.abs(tsb.to)
									)
								) / Math.LN10
							),
							t = [];
						if(tsb.from < 0 || tsb.to < 0){
							t.push("-");
						}
						t.push(dojo.string.rep("9", labelLength));
						var precision = Math.floor(
							Math.log( tsb.to - tsb.from ) / Math.LN10
						);
						if(precision > 0){
							t.push(".");
							for(i = 0; i < precision; ++i){
								t.push("9");
							}
						}
						labelWidth = dojox.gfx._base._getTextBox(
							t.join(""),
							{ font: taFont }
						).w;
					}
					minMinorStep = labelWidth + labelGap;
				}
			}
			this.scaler.minMinorStep = minMinorStep;
			this.ticks = lin.buildTicks(this.scaler, o);
			return this;
		},
		getScaler: function(){
			return this.scaler;
		},
		getTicks: function(){
			return this.ticks;
		},
		getOffsets: function(){
			var o = this.opt;
			var offsets = { l: 0, r: 0, t: 0, b: 0 },
				labelWidth,
				a,
				b,
				c,
				d,
				gl = dc.scaler.common.getNumericLabel,
				offset = 0,
				ta = this.chart.theme.axis,
				// TODO: we use one font --- of major tick, we need to use major and minor fonts
				taFont = o.font || (ta.majorTick && ta.majorTick.font) || (ta.tick && ta.tick.font),
				taMajorTick = this.chart.theme.getTick("major", o),
				taMinorTick = this.chart.theme.getTick("minor", o),
				size = taFont ? g.normalizedLength(g.splitFontString(taFont).size) : 0,
				s = this.scaler;
			if(!s){
				return offsets;
			}
			var ma = s.major, mi = s.minor;
			if(this.vertical){
				if(size){
					if(o.labelFunc && o.maxLabelSize){
						labelWidth = o.maxLabelSize;
					}else if(this.labels){
						labelWidth = this._groupLabelWidth(
							this.labels,
							taFont
						);
					}else{
						labelWidth = this._groupLabelWidth([
							gl(ma.start, ma.prec, o),
							gl(ma.start + ma.count * ma.tick, ma.prec, o),
							gl(mi.start, mi.prec, o),
							gl(mi.start + mi.count * mi.tick, mi.prec, o)
						], taFont);
					}
					offset = labelWidth + labelGap;
				}
				offset += labelGap + Math.max(taMajorTick.length, taMinorTick.length);
				offsets[o.leftBottom ? "l" : "r"] = offset;
				offsets.t = offsets.b = size / 2;
			}else{
				if(size){
					offset = size + labelGap;
				}
				offset += labelGap + Math.max(taMajorTick.length, taMinorTick.length);
				offsets[o.leftBottom ? "b" : "t"] = offset;
				if(size){
					if(o.labelFunc && o.maxLabelSize){
						labelWidth = o.maxLabelSize;
					}else if(this.labels){
						labelWidth = this._groupLabelWidth(this.labels, taFont);
					}else{
						labelWidth = this._groupLabelWidth([
							gl(ma.start, ma.prec, o),
							gl(ma.start + ma.count * ma.tick, ma.prec, o),
							gl(mi.start, mi.prec, o),
							gl(mi.start + mi.count * mi.tick, mi.prec, o)
						], taFont);
					}
					offsets.l = offsets.r = labelWidth / 2;
				}
			}
			if(labelWidth){
				this._cachedLabelWidth = labelWidth;
			}
			return offsets;
		},
		render: function(dim, offsets){
			if(!this.dirty){
				return this;
			}
			// prepare variable
			var o = this.opt;
			var start,
				stop,
				axisVector,
				tickVector,
				labelOffset,
				labelAlign,
				ta = this.chart.theme.axis,
				
				// TODO: we use one font --- of major tick, we need to use major and minor fonts
				taFont = o.font || (ta.majorTick && ta.majorTick.font) || (ta.tick && ta.tick.font),
				// TODO: we use one font color --- we need to use different colors
				taFontColor = o.fontColor || (ta.majorTick && ta.majorTick.fontColor) || (ta.tick && ta.tick.fontColor) || "black",
				taMajorTick = this.chart.theme.getTick("major", o),
				taMinorTick = this.chart.theme.getTick("minor", o),
				taMicroTick = this.chart.theme.getTick("micro", o),

				tickSize = Math.max(taMajorTick.length, taMinorTick.length, taMicroTick.length),
				taStroke = "stroke" in o ? o.stroke : ta.stroke,
				size = taFont ? g.normalizedLength(g.splitFontString(taFont).size) : 0;
			if(this.vertical){
				start = { y: dim.height - offsets.b };
				stop  = { y: offsets.t };
				axisVector = { x: 0, y: -1 };
				if(o.leftBottom){
					start.x = stop.x = offsets.l;
					tickVector = { x: -1, y: 0 };
					labelAlign = "end";
				}else{
					start.x = stop.x = dim.width - offsets.r;
					tickVector = { x: 1, y: 0 };
					labelAlign = "start";
				}
				labelOffset = {
					x: tickVector.x * (tickSize + labelGap),
					y: size * 0.4
				};
			}else{
				start = { x: offsets.l };
				stop  = { x: dim.width - offsets.r };
				axisVector = { x: 1, y: 0 };
				labelAlign = "middle";
				if(o.leftBottom){
					start.y = stop.y = dim.height - offsets.b;
					tickVector = { x: 0, y: 1 };
					labelOffset = { y: tickSize + labelGap + size };
				}else{
					start.y = stop.y = offsets.t;
					tickVector = { x: 0, y: -1 };
					labelOffset = { y: -tickSize - labelGap };
				}
				labelOffset.x = 0;
			}

			// render shapes

			this.cleanGroup();

			try{
				var s = this.group,
					c = this.scaler,
					t = this.ticks,
					canLabel,
					f = lin.getTransformerFromModel(this.scaler),
					forceHtmlLabels = (dojox.gfx.renderer == "canvas"),
					labelType = forceHtmlLabels || this.opt.htmlLabels && !dojo.isIE && !dojo.isOpera ? "html" : "gfx",
					dx = tickVector.x * taMajorTick.length,
					dy = tickVector.y * taMajorTick.length;

				s.createLine({
					x1: start.x,
					y1: start.y,
					x2: stop.x,
					y2: stop.y
				}).setStroke(taStroke);

				dojo.forEach(t.major, function(tick){
					var offset = f(tick.value), elem,
						x = start.x + axisVector.x * offset,
						y = start.y + axisVector.y * offset;
						s.createLine({
							x1: x, y1: y,
							x2: x + dx,
							y2: y + dy
						}).setStroke(taMajorTick);
						if(tick.label){
							elem = dc.axis2d.common.createText[labelType](
								this.chart,
								s,
								x + labelOffset.x,
								y + labelOffset.y,
								labelAlign,
								tick.label,
								taFont,
								taFontColor,
								this._cachedLabelWidth
							);
							if(labelType == "html"){
								this.htmlElements.push(elem);
							}
						}
				}, this);

				dx = tickVector.x * taMinorTick.length;
				dy = tickVector.y * taMinorTick.length;
				canLabel = c.minMinorStep <= c.minor.tick * c.bounds.scale;
				dojo.forEach(t.minor, function(tick){
					var offset = f(tick.value), elem,
						x = start.x + axisVector.x * offset,
						y = start.y + axisVector.y * offset;
						s.createLine({
							x1: x, y1: y,
							x2: x + dx,
							y2: y + dy
						}).setStroke(taMinorTick);
						if(canLabel && tick.label){
							elem = dc.axis2d.common.createText[labelType](
								this.chart,
								s,
								x + labelOffset.x,
								y + labelOffset.y,
								labelAlign,
								tick.label,
								taFont,
								taFontColor,
								this._cachedLabelWidth
							);
							if(labelType == "html"){
								this.htmlElements.push(elem);
							}
						}
				}, this);

				dx = tickVector.x * taMicroTick.length;
				dy = tickVector.y * taMicroTick.length;
				dojo.forEach(t.micro, function(tick){
					var offset = f(tick.value), elem,
						x = start.x + axisVector.x * offset,
						y = start.y + axisVector.y * offset;
						s.createLine({
							x1: x, y1: y,
							x2: x + dx,
							y2: y + dy
						}).setStroke(taMicroTick);
				}, this);
			}catch(e){
				// squelch
			}

			this.dirty = false;
			return this;
		}
	});
})();
