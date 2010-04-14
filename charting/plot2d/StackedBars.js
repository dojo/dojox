dojo.provide("dojox.charting.plot2d.StackedBars");

dojo.require("dojox.charting.plot2d.common");
dojo.require("dojox.charting.plot2d.Bars");

dojo.require("dojox.lang.functional");
dojo.require("dojox.lang.functional.reversed");

(function(){
	var df = dojox.lang.functional, dc = dojox.charting.plot2d.common,
		purgeGroup = df.lambda("item.purgeGroup()");

	dojo.declare("dojox.charting.plot2d.StackedBars", dojox.charting.plot2d.Bars, {
		calculateAxes: function(dim){
			var stats = dc.collectStackedStats(this.series), t;
			this._maxRunLength = stats.hmax;
			stats.hmin -= 0.5;
			stats.hmax += 0.5;
			t = stats.hmin, stats.hmin = stats.vmin, stats.vmin = t;
			t = stats.hmax, stats.hmax = stats.vmax, stats.vmax = t;
			this._calc(dim, stats);
			return this;
		},
		render: function(dim, offsets){
			if(this._maxRunLength <= 0){
				return this;
			}

			// stack all values
			var acc = df.repeat(this._maxRunLength, "-> 0", 0);
			for(var i = 0; i < this.series.length; ++i){
				var run = this.series[i];
				for(var j = 0; j < run.data.length; ++j){
					var value = run.data[j], v = typeof value == "number" ? value : value.y;
					if(isNaN(v)){ v = 0; }
					acc[j] += v;
				}
			}
			// draw runs in backwards
			this.dirty = this.isDirty();
			if(this.dirty){
				dojo.forEach(this.series, purgeGroup);
				this.cleanGroup();
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}
			var t = this.chart.theme, f, gap, height,
				ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
				vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler),
				events = this.events();
			f = dc.calculateBarSize(this._vScaler.bounds.scale, this.opt);
			gap = f.gap;
			height = f.size;
			this.resetEvents();
			for(var i = this.series.length - 1; i >= 0; --i){
				var run = this.series[i];
				if(!this.dirty && !run.dirty){
					t.skip();
					continue;
				}
				run.cleanGroup();
				var theme = t.next("bar", [this.opt, run]), s = run.group;
				for(var j = 0; j < acc.length; ++j){
					var v = acc[j],
						width = ht(v),
						value = run.data[j],
						finalTheme = typeof value != "number" ?
							t.addMixin(theme, "bar", value, true) :
							t.post(theme, "bar");
					if(width >= 1 && height >= 1){
						var rect = {
							x: offsets.l,
							y: dim.height - offsets.b - vt(j + 1.5) + gap,
							width: width, height: height
						};
						var specialFill = this._plotFill(finalTheme.series.fill, dim, offsets);
						specialFill = this._shapeFill(specialFill, rect);
						var shape = s.createRect(rect).setFill(specialFill).setStroke(finalTheme.series.stroke);
						run.dyn.fill   = shape.getFill();
						run.dyn.stroke = shape.getStroke();
						if(events){
							var o = {
								element: "bar",
								index:   j,
								run:     run,
								plot:    this,
								hAxis:   this.hAxis || null,
								vAxis:   this.vAxis || null,
								shape:   shape,
								x:       v,
								y:       j + 1.5
							};
							this._connectEvents(shape, o);
						}
						if(this.animate){
							this._animateBar(shape, offsets.l, -width);
						}
					}
				}
				run.dirty = false;
				// update the accumulator
				for(var j = 0; j < run.data.length; ++j){
					var value = run.data[j], v = typeof value == "number" ? value : value.y;
					if(isNaN(v)){ v = 0; }
					acc[j] -= v;
				}
			}
			this.dirty = false;
			return this;
		}
	});
})();
