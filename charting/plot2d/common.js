dojo.provide("dojox.charting.plot2d.common");

dojo.require("dojo.colors");
dojo.require("dojox.gfx");
dojo.require("dojox.lang.functional");

(function(){
	var df = dojox.lang.functional, dc = dojox.charting.plot2d.common;
	
	dojo.mixin(dojox.charting.plot2d.common, {
		makeStroke: function(stroke){
			if(!stroke){ return stroke; }
			if(typeof stroke == "string" || stroke instanceof dojo.Color){
				stroke = {color: stroke};
			}
			return dojox.gfx.makeParameters(dojox.gfx.defaultStroke, stroke);
		},
		augmentColor: function(target, color){
			var t = new dojo.Color(target),
				c = new dojo.Color(color);
			c.a = t.a;
			return c;
		},
		augmentStroke: function(stroke, color){
			var s = dc.makeStroke(stroke);
			if(s){
				s.color = dc.augmentColor(s.color, color);
			}
			return s;
		},
		augmentFill: function(fill, color){
			var fc, c = new dojo.Color(color);
			if(typeof fill == "string" || fill instanceof dojo.Color){
				return dc.augmentColor(fill, color);
			}
			return fill;
		},
		
		defaultStats: {hmin: 1, hmax: 0, vmin: Number.POSITIVE_INFINITY, vmax: Number.NEGATIVE_INFINITY},
		
		collectSimpleStats: function(series){
			var stats = dojo.clone(dc.defaultStats);
			for(var i = 0; i < series.length; ++i){
				var run = series[i];
				stats.hmax = Math.max(stats.hmax, run.data.length);
				var haveMin = ("min" in run), haveMax = ("max" in run);
				if(haveMin){
					stats.vmin = Math.min(stats.vmin, run.min);
					if(haveMax){
						stats.vmax = Math.max(stats.vmax, run.max);
					}else{
						dojo.forEach(run.data, function(val){
							if(isNaN(val)){ val = 0; }
							stats.vmax = Math.max(stats.vmax, val);
						});
					}
				}else{
					if(haveMax){
						stats.vmax = Math.max(stats.vmax, run.max);
						dojo.forEach(run.data, function(val){
							if(isNaN(val)){ val = 0; }
							stats.vmin = Math.min(stats.vmin, val);
						});
					}else{
						dojo.forEach(run.data, function(val){
							if(isNaN(val)){ val = 0; }
							stats.vmin = Math.min(stats.vmin, val);
							stats.vmax = Math.max(stats.vmax, val);
						});
					}
				}
			}
			return stats;
		},
		
		collectStackedStats: function(series){
			// collect statistics
			var stats = dojo.clone(dc.defaultStats);
			if(series.length){
				// 1st pass: find the maximal length of runs
				stats.hmax = df.foldl(series, "seed, run -> Math.max(seed, run.data.length)", stats.hmax);
				// 2nd pass: stack values
				for(var i = 0; i < stats.hmax; ++i){
					var v = series[0].data[i];
					if(isNaN(v)){ v = 0; }
					stats.vmin = Math.min(stats.vmin, v);
					for(var j = 1; j < series.length; ++j){
						var t = series[j].data[i];
						if(isNaN(t)){ t = 0; }
						v += t;
					}
					stats.vmax = Math.max(stats.vmax, v);
				}
			}
			return stats;
		}
	});
})();
