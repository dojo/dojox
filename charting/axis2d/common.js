dojo.provide("dojox.charting.axis2d.common");

dojo.require("dojox.gfx");

(function(){
	var g = dojox.gfx;
	
	var clearNode = function(s){
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
	};
	
	var getBoxWidth = function(n){
		// marginBox is incredibly slow, so avoid it if we can
		if(n["getBoundingClientRect"]){
			return n.getBoundingClientRect().width;
		}else{
			return dojo.marginBox(n).w;
		}
	};
	
	dojo.mixin(dojox.charting.axis2d.common, {
		createText: {
			gfx: function(chart, creator, x, y, align, text, font, fontColor){
				return creator.createText({
					x: x, y: y, text: text, align: align
				}).setFont(font).setFill(fontColor);
			},
			html: function(
				chart,
				creator,
				x,
				y,
				align,
				text,
				font,
				fontColor,
				labelWidth
			){
				// setup the text node
				var p = dojo.doc.createElement("div"), s = p.style;
				clearNode(s);
				s.font = font;
				p.innerHTML = String(text).replace(/\s/g, "&nbsp;");
				s.color = fontColor;
				// measure the size
				s.position = "absolute";
				s.left = "-10000px";
				dojo.body().appendChild(p);
				var size = g.normalizedLength(g.splitFontString(font).size);
				
				// new settings for the text node

				dojo.body().removeChild(p);
				
				s.position = "relative";
				if(labelWidth){
					s.width = labelWidth + "px";
					// s.border = "1px dotted grey";
					switch(align){
						case "middle":
							s.textAlign = "center";
							s.left = (x-(labelWidth/2))+"px";
							break;
						case "end":
							s.textAlign = "right";
							s.left = (x-labelWidth)+"px";
							break;
						default:
							s.left = x+"px";
							s.textAlign = "left";
							break;
					}
				}else{
					var boxWidth = getBoxWidth(p);
					switch(align){
						case "middle":
							s.left = Math.floor(x - boxWidth / 2) + "px";
							// s.left = Math.floor(x - p.offsetWidth / 2) + "px";
							break;
						case "end":
							s.left = Math.floor(x - boxWidth) + "px";
							// s.left = Math.floor(x - p.offsetWidth) + "px";
							break;
						//case "start":
						default:
							s.left = Math.floor(x) + "px";
							break;
					}
				}
				s.top = Math.floor(y - size) + "px";
				// setup the wrapper node
				var wrap = dojo.doc.createElement("div"), w = wrap.style;
				clearNode(w);
				w.width = "0px";
				w.height = "0px";
				// insert nodes
				wrap.appendChild(p)
				chart.node.insertBefore(wrap, chart.node.firstChild);
				return wrap;
			}
		}
	});
})();
