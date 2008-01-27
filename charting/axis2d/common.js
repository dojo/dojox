dojo.provide("dojox.charting.axis2d.common");

dojo.require("dojox.gfx");

(function(){
	var g = dojox.gfx;
	
	function clearNode(s){
		s.marginLeft   = "0px";
		s.marginTop    = "0px";
		s.marginRight  = "0px";
		s.marginBottom = "0px";
		s.paddingLeft   = "0px";
		s.paddingTop    = "0px";
		s.paddingRight  = "0px";
		s.paddingBottom = "0px";
		s.borderLeftWidth   = "0px";
		s.borderTopWidth    = "0px";
		s.borderRightWidth  = "0px";
		s.borderBottomWidth = "0px";
	}
	
	dojo.mixin(dojox.charting.axis2d.common, {
		createText: {
			gfx: function(chart, creator, x, y, align, text, font, fontColor){
				return creator.createText({
					x: x, y: y, text: text, align: align
				}).setFont(font).setFill(fontColor);
			},
			html: function(chart, creator, x, y, align, text, font, fontColor){
				var p = dojo.doc.createElement("div"), s = p.style,
					wrap = dojo.doc.createElement("div"), w = wrap.style;
				// setup the text node
				clearNode(s);
				s.font = font;
				p.innerHTML = text;
				s.color = fontColor;
				// measure the size
				s.position = "absolute";
				s.left = "-10000px";
				dojo.body().appendChild(p);
				var size = g.normalizedLength(g.splitFontString(font).size),
					box = dojo.marginBox(p);
				// reset the text node
				dojo.body().removeChild(p);
				s.position = "relative";
				// setup the wrapper node
				clearNode(w);
				w.width = "0px";
				w.height = "0px";
				wrap.appendChild(p)
				// insert nodes and setup positions
				chart.node.insertBefore(wrap, chart.node.firstChild);
				switch(align){
					case "middle":
						s.left = Math.floor(x - box.w / 2);
						break;
					case "end":
						s.left = Math.floor(x - box.w);
						break;
					//case "start":
					default:
						s.left = Math.floor(x);
						break;
				}
				s.top = Math.floor(y - size);
				return p;
			}
		}
	});
})();
