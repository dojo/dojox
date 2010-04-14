dojo.provide("dojox.charting.plot2d.Bubble");

dojo.require("dojox.charting.plot2d.Base");
dojo.require("dojox.lang.functional");

(function(){
	var df = dojox.lang.functional, du = dojox.lang.utils,
		dc = dojox.charting.plot2d.common,
		purgeGroup = df.lambda("item.purgeGroup()");

	dojo.declare("dojox.charting.plot2d.Bubble", dojox.charting.plot2d.Base, {
		defaultParams: {
			hAxis: "x",		// use a horizontal axis named "x"
			vAxis: "y"		// use a vertical axis named "y"
		},
		optionalParams: {
			// theme component
			stroke:		{},
			outline:	{},
			shadow:		{},
			fill:		{},
			font:		"",
			fontColor:	""
		},

		constructor: function(chart, kwArgs){
			this.opt = dojo.clone(this.defaultParams);
			du.updateWithObject(this.opt, kwArgs);
			this.series = [];
			this.hAxis = this.opt.hAxis;
			this.vAxis = this.opt.vAxis;
		},
		
		calculateAxes: function(dim){
			this._calc(dim, dc.collectSimpleStats(this.series));
			return this;
		},

		//	override the render so that we are plotting only circles.
		render: function(dim, offsets){
			this.dirty = this.isDirty();
			if(this.dirty){
				dojo.forEach(this.series, purgeGroup);
				this.cleanGroup();
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}
		
			var t = this.chart.theme,
				ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
				vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler),
				events = this.events();

			this.resetEvents();

			for(var i = this.series.length - 1; i >= 0; --i){
				var run = this.series[i];
				if(!this.dirty && !run.dirty){
					t.skip();
					continue;
				}
				run.cleanGroup();
				if(!run.data.length){
					run.dirty = false;
					t.skip();
					continue;
				}

				if(typeof run.data[0] == "number"){
					console.warn("dojox.charting.plot2d.Bubble: the data in the following series cannot be rendered as a bubble chart; ", run);
					continue;
				}
				
				var theme = t.next("circle", [this.opt, run]), s = run.group,
					points = dojo.map(run.data, function(v, i){
						return {
							x: ht(v.x) + offsets.l,
							y: dim.height - offsets.b - vt(v.y),
							radius: this._vScaler.bounds.scale * (v.size / 2)
						};
					}, this);

				var frontCircles = null, outlineCircles = null, shadowCircles = null;

				// make shadows if needed
				if(theme.series.shadow){
					shadowCircles = dojo.map(points, function(item){
						var finalTheme = t.addMixin(theme, "circle", item, true),
							shadow = finalTheme.series.shadow;
						return s.createCircle({
							cx: item.x + shadow.dx, cy: item.y + shadow.dy, r: item.radius
						}).setStroke(shadow).setFill(shadow.color);
					}, this);
					if(shadowCircles.length){
						run.dyn.shadow = shadowCircles[shadowCircles.length - 1].getStroke();
					}
				}

				// make outlines if needed
				if(theme.series.outline){
					outlineCircles = dojo.map(points, function(item){
						var finalTheme = t.addMixin(theme, "circle", item, true),
							outline = dc.makeStroke(finalTheme.series.outline);
						outline.width = 2 * outline.width + theme.series.stroke.width;
						return s.createCircle({
							cx: item.x, cy: item.y, r: item.radius
						}).setStroke(outline);
					}, this);
					if(outlineCircles.length){
						run.dyn.outline = outlineCircles[outlineCircles.length - 1].getStroke();
					}
				}

				//	run through the data and add the circles.
				frontCircles = dojo.map(points, function(item){
					var finalTheme = t.addMixin(theme, "circle", item, true),
						rect = {
							x: item.x - item.radius,
							y: item.y - item.radius,
							width:  2 * item.radius,
							height: 2 * item.radius
						};
					var specialFill = this._plotFill(finalTheme.series.fill, dim, offsets);
					specialFill = this._shapeFill(specialFill, rect);
					return s.createCircle({
						cx: item.x, cy: item.y, r: item.radius
					}).setFill(specialFill).setStroke(finalTheme.series.stroke);
				}, this);
				if(frontCircles.length){
					run.dyn.fill   = frontCircles[frontCircles.length - 1].getFill();
					run.dyn.stroke = frontCircles[frontCircles.length - 1].getStroke();
				}
				
				if(events){
					dojo.forEach(frontCircles, function(s, i){
						var o = {
							element: "circle",
							index:   i,
							run:     run,
							plot:    this,
							hAxis:   this.hAxis || null,
							vAxis:   this.vAxis || null,
							shape:   s,
							outline: outlineCircles && outlineCircles[i] || null,
							shadow:  shadowCircles && shadowCircles[i] || null,
							x:       run.data[i].x,
							y:       run.data[i].y,
							r:       run.data[i].size / 2,
							cx:      points[i].x,
							cy:      points[i].y,
							cr:      points[i].radius
						};
						this._connectEvents(s, o);
					}, this);
				}
				
				run.dirty = false;
			}
			this.dirty = false;
			return this;
		}
	});
})();
