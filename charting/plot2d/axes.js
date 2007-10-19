dojo.provide("dojox.charting.plot2d.axes");

dojo.require("dojo.colors");
dojo.require("dojox.gfx");
dojo.require("dojox.lang.functional");
dojo.require("dojox.charting.scaler");

(function(){
	var dc = dojox.charting, df = dojox.lang.functional, g = dojox.gfx,
		labelGap = 4,				// in pixels
		labelFudgeFactor = 0.8;		// in percents (to convert font's heigth to label width)
	
	dojo.declare("dojox.charting.plot2d.axes.Base", null, {
		constructor: function(kwArgs, chart){
			this.chart = chart;
			this.vertical = kwArgs && kwArgs.vertical;
		},
		clear: function(){
			return this;
		},
		initialized: function(){
			return false;
		},
		calculate: function(min, max, span){
			return this;
		},
		getScaler: function(){
			return null;
		},
		getOffsets: function(){
			return {l: 0, r: 0, t: 0, b: 0};
		},
		render: function(dim, offsets){
			return this;
		}
	});

	dojo.declare("dojox.charting.plot2d.axes.Default", dojox.charting.plot2d.axes.Base, {
		constructor: function(kwArgs, chart){
			this.opt = dojo.mixin({
				fixUpper: "none",
				fixLower: "none",
				leftBottom:  true,
				includeZero: false,
				fixed:       true,
				minorTicks:  true,
				minorLabels: true
			}, kwArgs);
		},
		clear: function(){
			delete this.scaler;
			return this;
		},
		initialized: function(){
			return "scaler" in this;
		},
		calculate: function(min, max, span, labels){
			this.labels = labels;
			if(this.opt.includeZero){
				if(min > 0){ min = 0; }
				if(max < 0){ max = 0; }
			}
			var minMinorStep = 0, ta = this.chart.theme.axis, 
				size = ta.font ? g.normalizedLength(g.splitFontString(ta.font).size) : 0;
			if(this.vertical){
				if(size){
					minMinorStep = size + labelGap;
				}
			}else{
				var labelLength = 0;
				if(size){
					if(this.labels){
						labelLength = df.foldl(dojo.map(this.labels, df.pluck("length")), Math.max);
					}else{
						labelLength = Math.ceil(Math.log(Math.max(Math.abs(min), Math.abs(max))) / Math.LN10);
						if(min < 0 || max < 0){ ++labelLength; }
						var precision = Math.floor(Math.log(max - min) / Math.LN10);
						if(precision > 0){ labelLength += precision; }
					}
					minMinorStep = Math.floor(size * labelLength * labelFudgeFactor) + labelGap;
				}
			}
			this.scaler = dojox.charting.scaler(min, max, span, minMinorStep, {fixUpper: this.opt.fixUpper, fixLower: this.opt.fixLower});
			//TODO: fix the scaler to conform other kwArgs
			return this;
		},
		getScaler: function(){
			return this.scaler;
		},
		getOffsets: function(){
			var offsets = {l: 0, r: 0, t: 0, b: 0};
			var offset = 0, ta = this.chart.theme.axis,
				size = ta.font ? g.normalizedLength(g.splitFontString(ta.font).size) : 0;
			if(this.vertical){
				if(size){
					var labelLength = 0;
					if(this.labels){
						labelLength = df.foldl(dojo.map(this.labels, df.pluck("length")), Math.max);
					}else{
						var s = this.scaler,
							a = this._getLabel(s.majorStart, s.majorPrecision).length,
							b = this._getLabel(s.majorStart + s.nMajorTicks * s.majorTick, s.majorPrecision).length,
							c = this._getLabel(s.minorStart, s.minorPrecision).length,
							d = this._getLabel(s.minorStart + s.nMinorTicks * s.minorTick, s.minorPrecision).length;
						labelLength = Math.max(a, b, c, d);
					}
					offset = Math.floor(size * labelLength * labelFudgeFactor) + labelGap;
				}
				offset += labelGap + Math.max(ta.majorTick.length, ta.minorTick.length);
				offsets[this.opt.leftBottom ? "l" : "r"] = offset;
				offsets.t = offsets.b = size / 2;
			}else{
				if(size){
					offset = size + labelGap;
				}
				offset += labelGap + Math.max(ta.majorTick.length, ta.minorTick.length);
				offsets[this.opt.leftBottom ? "b" : "t"] = offset;
				if(size){
					var labelLength = 0;
					if(this.labels){
						labelLength = df.foldl(dojo.map(this.labels, df.pluck("length")), Math.max);
					}else{
						var s = this.scaler,
							a = this._getLabel(s.majorStart, s.majorPrecision).length,
							b = this._getLabel(s.majorStart + s.nMajorTicks * s.majorTick, s.majorPrecision).length,
							c = this._getLabel(s.minorStart, s.minorPrecision).length,
							d = this._getLabel(s.minorStart + s.nMinorTicks * s.minorTick, s.minorPrecision).length;
						labelLength = Math.max(a, b, c, d);
					}
					offsets.l = offsets.r = Math.floor(size * labelLength * labelFudgeFactor) / 2;
				}
			}
			return offsets;
		},
		render: function(dim, offsets){
			// prepare variable
			var start, stop, axisVector, tickVector, labelOffset, labelAlign,
				ta = this.chart.theme.axis, tickSize = Math.max(ta.majorTick.length, ta.minorTick.length),
				size = ta.font ? g.normalizedLength(g.splitFontString(ta.font).size) : 0;
			if(this.vertical){
				start = {y: dim.height - offsets.b};
				stop  = {y: offsets.t};
				axisVector = {x: 0, y: -1};
				if(this.opt.leftBottom){
					start.x = stop.x = offsets.l;
					tickVector = {x: -1, y: 0};
					labelAlign = "end";
				}else{
					start.x = stop.x = dim.width - offsets.r;
					tickVector = {x: 1, y: 0};
					labelAlign = "start";
				}
				labelOffset = {x: tickVector.x * (tickSize + labelGap), y: size * 0.4};
			}else{
				start = {x: offsets.l};
				stop  = {x: dim.width - offsets.r};
				axisVector = {x: 1, y: 0};
				labelAlign = "middle";
				if(this.opt.leftBottom){
					start.y = stop.y = dim.height - offsets.b;
					tickVector = {x: 0, y: 1};
					labelOffset = {y: tickSize + labelGap + size};
				}else{
					start.y = stop.y = offsets.t;
					tickVector = {x: 0, y: -1};
					labelOffset = {y: -tickSize - labelGap};
				}
				labelOffset.x = 0;
			}
			
			// render shapes
			var s = this.chart.surface, c = this.scaler,
				nextMajor = c.majorStart, nextMinor = c.minorStart;
			s.createLine({x1: start.x, y1: start.y, x2: stop.x, y2: stop.y}).setStroke(ta.stroke);
			while(nextMinor <= c.upperBound + 1/c.scale){
				var offset = (nextMinor - c.lowerBound) * c.scale,
					x = start.x + axisVector.x * offset,
					y = start.y + axisVector.y * offset;
				if(Math.abs(nextMinor - nextMajor) < c.minorTick / 2){
					// major tick
					s.createLine({
						x1: x, y1: y,
						x2: x + tickVector.x * ta.majorTick.length,
						y2: y + tickVector.y * ta.majorTick.length
					}).setStroke(ta.majorTick);
					s.createText({
						x: x + labelOffset.x,
						y: y + labelOffset.y,
						text: this._getLabel(nextMajor, c.majorPrecision),
						align: labelAlign
					}).setFont(ta.font).setFill(ta.fontColor);
					nextMajor += c.majorTick;
				}else{
					// minor tick
					if(this.opt.minorTicks){
						s.createLine({
							x1: x, y1: y,
							x2: x + tickVector.x * ta.minorTick.length,
							y2: y + tickVector.y * ta.minorTick.length
						}).setStroke(ta.minorTick);
						if(this.opt.minorLabels && (c.minMinorStep <= c.minorTick * c.scale)){
							s.createText({
								x: x + labelOffset.x,
								y: y + labelOffset.y,
								text: this._getLabel(nextMinor, c.minorPrecision),
								align: labelAlign
							}).setFont(ta.font).setFill(ta.fontColor);
						}
					}
				}
				nextMinor += c.minorTick;
			}
			return this;
		},
		
		// utilities
		_getLabel: function(number, precision){
			return this.opt.fixed ? number.toFixed(precision) : number.toString();
		}
	});
})();
