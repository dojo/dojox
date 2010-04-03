dojo.provide("dojox.gfx.gradutils");

dojo.require("dojox.gfx.matrix");

// Various generic utilities to deal with a linear gradient

(function(){
	var d = dojo, m = dojox.gfx.matrix, C = d.Color;

	dojox.gfx.gradutils.getColor = function(grad, pt){
		// summary:
		//		sample a color from a linear gradient using a point
		// grad: Object:
		//		linear gradient object
		// pt: dojox.gfx.Point:
		//		point where to sample a color
		var angle = Math.atan2(grad.y2 - grad.y1, grad.x2 - grad.x1),
			rotation = m.rotate(-angle),
			projection = m.project(grad.x2 - grad.x1, grad.y2 - grad.y1),
			p = m.multiplyPoint(projection, pt),
			pf1 = m.multiplyPoint(projection, grad.x1, grad.y1),
			pf2 = m.multiplyPoint(projection, grad.x2, grad.y2),
			scale = m.multiplyPoint(rotation, pf2.x - pf1.x, pf2.y - pf1.y).x,
			o = m.multiplyPoint(rotation, p.x - pf1.x, p.y - pf1.y).x / scale,
			c = grad.colors, len = c.length;
		if(o <= 0){
			return c[0].color;
		}
		if(o >= 1){
			return c[len - 1].color;
		}
		//TODO: use binary search
		for(var i = 0; i < len; ++i){
			var stop = c[i];
			if(stop.offset >= o){
				if(i){
					var prev = c[i - 1];
					return d.blendColors(new C(prev.color), new C(stop.color),
						(o - prev.offset) / (stop.offset - prev.offset));
				}
				return stop.color;
			}
		}
		return c[len - 1].color;
	}
})();