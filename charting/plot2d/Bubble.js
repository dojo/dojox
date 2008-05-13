dojo.provide("dojox.charting.plot2d.Bubble");

dojo.require("dojox.charting.plot2d.Default");
dojo.require("dojox.lang.functional");

(function(){
	var df = dojox.lang.functional,
		dc = dojox.charting.plot2d.common,
		purgeGroup = df.lambda("item.purgeGroup()");

	dojo.declare("dojox.charting.plot2d.Bubble", dojox.charting.plot2d.Default, {
		constructor: function(){
			this.opt.lines	= false;
			this.opt.markers= false;
		},

		//	override the render so that we are plotting only circles.
		render: function(dim, offsets){
			if(this.dirty){
				dojo.forEach(this.series, purgeGroup);
				this.cleanGroup();
				var s = this.group;
				df.forEachRev(this.series, function(item){ item.cleanGroup(s); });
			}
		
			var t = this.chart.theme, stroke, outline, color, shadowStroke, shadowColor;
			for(var i = this.series.length - 1; i >= 0; --i){
				var run = this.series[i];
				if(!this.dirty && !run.dirty){ continue; }
				run.cleanGroup();
				if(!run.data.length){
					run.dirty = false;
					continue;
				}

				if(typeof run.data[0] == "number"){
					console.warn("dojox.charting.plot2d.Bubble: the data in the following series cannot be rendered as a bubble chart; ", run);
					continue;
				}
				
				var s = run.group,
					ht = this._hScaler.scaler.getTransformerFromModel(this._hScaler),
					vt = this._vScaler.scaler.getTransformerFromModel(this._vScaler);
					points = dojo.map(run.data, function(v, i){
						return {
							x: ht(v.x) + offsets.l,
							y: dim.height - offsets.b - vt(v.y),
							radius: this._vScaler.bounds.scale * (v.size / 2)
						};
					}, this);

				if(run.fill){
					color = run.fill;
				}
				else if (run.stroke){
					color = run.stroke;
				}
				else {
					color = run.dyn.color = new dojo.Color(t.next("color"));
				}

				stroke = run.stroke ? dc.makeStroke(run.stroke) : dc.augmentStroke(t.series.stroke, color);

				if(this.opt.shadows && stroke){
					var sh = this.opt.shadows, shadowColor = new dojo.Color([0, 0, 0, 0.2]),
						shadowStroke = dojo.clone(outline ? outline : stroke);
					shadowStroke.color = shadowColor;
					shadowStroke.width += sh.dw ? sh.dw : 0;
				}

				//	run through the data and add the circles.
				dojo.forEach(points, function(item){
					if(this.opt.shadows && stroke){
						var sh=this.opt.shadows;
						s.createCircle({ 
							cx: item.x + sh.dx, cy: item.y + sh.dy, r: item.radius 
						}).setStroke(shadowStroke).setFill(shadowColor);
					}
					s.createCircle({ cx: item.x, cy: item.y, r: item.radius }).setStroke(stroke).setFill(color);
				}, this);
				run.dirty = false;
			}
			this.dirty = false;
			return this;
		}
	});
})();
