dojo.provide("dojox.gfx.canvas");

dojo.require("dojox.gfx._base");
dojo.require("dojox.gfx.shape");
dojo.require("dojox.gfx.path");
dojo.require("dojox.gfx.arc");
dojo.require("dojox.gfx.decompose");

dojo.experimental("dojox.gfx.canvas");

(function(){
	var g = dojox.gfx, gs = g.shape, m = g.matrix, twoPI = 2 * Math.PI;
	
	dojo.extend(g.Shape, {
		render: function(/* Object */ ctx){
			// summary: render the shape
			ctx.save();
			this._renderTransform(ctx);
			this._renderShape(ctx);
			this._renderFill(ctx, true);
			this._renderStroke(ctx, true);
			ctx.restore();
		},
		_renderTransform: function(/* Object */ ctx){
			if("canvasTransform" in this){
				var t = this.canvasTransform;
				ctx.translate(t.dx, t.dy);
				ctx.rotate(t.angle2);
				ctx.scale(t.sx, t.sy);
				ctx.rotate(t.angle1);
				// The future implementation when vendors catch up with the spec:
				// var t = this.matrix;
				// ctx.transform(t.xx, t.yx, t.xy, t.yy, t.dx, t.dy);
			}
		},
		_renderShape: function(/* Object */ ctx){
			// nothing
		},
		_renderFill: function(/* Object */ ctx, /* Boolean */ apply){
			if("canvasFill" in this){
				ctx.fillStyle = this.canvasFill;
				if(apply){ ctx.fill(); }
			}else{
				ctx.fillStyle = "rgba(0,0,0,0.0)";
			}
		},
		_renderStroke: function(/* Object */ ctx, /* Boolean */ apply){
			var s = this.strokeStyle;
			if(s){
				ctx.strokeStyle = s.color.toString();
				ctx.lineWidth = s.width;
				ctx.lineCap = s.cap;
				if(typeof s.join == "number"){
					ctx.lineJoin = "miter";
					ctx.miterLimit = s.join;
				}else{
					ctx.lineJoin = s.join;
				}
				if(apply){ ctx.stroke(); }
			}else if(!apply){
				ctx.strokeStyle = "rgba(0,0,0,0.0)";
			}
		},
		
		// events are not implemented
		getEventSource: function(){ return null; },
		connect:		function(){},
		disconnect:		function(){}
	});
	
	var modifyMethod = function(shape, method, extra){
			var old = shape.prototype[method];
			shape.prototype[method] = extra ?
				function(){
					this.surface.makeDirty();
					old.apply(this, arguments);
					extra.call(this);
					return this;
				} :
				function(){
					this.surface.makeDirty();
					return old.apply(this, arguments);
				};
		};

	modifyMethod(g.Shape, "setTransform", 		
		function(){
			// prepare Canvas-specific structures
			if(this.matrix){
				this.canvasTransform = g.decompose(this.matrix);
			}else{
				delete this.canvasTransform;
			}
		});

	modifyMethod(g.Shape, "setFill",
		function(){
			// prepare Canvas-specific structures
			var fs = this.fillStyle, f;
			if(fs){
				if(typeof(fs) == "object" && "type" in fs){
					var ctx = this.surface.rawNode.getContext("2d");
					switch(fs.type){
						case "linear":
						case "radial":
							f = fs.type == "linear" ? 
								ctx.createLinearGradient(fs.x1, fs.y1, fs.x2, fs.y2) :
								ctx.createRadialGradient(fs.cx, fs.cy, 0, fs.cx, fs.cy, fs.r);
							dojo.forEach(fs.colors, function(step){
								f.addColorStop(step.offset, g.normalizeColor(step.color).toString());
							});
							break;
						case "pattern":
							var image = Image(fs.width, fs.height);
							image.src = fs.src;
							f = ctx.createPattern(image, "repeat");
					}
				}else{
					// Set fill color using CSS RGBA func style
					f = fs.toString();
				}
				this.canvasFill = f;
			}else{
				delete this.canvasFill;
			}
		});
	
	modifyMethod(g.Shape, "setStroke");
	modifyMethod(g.Shape, "setShape");
		
	dojo.declare("dojox.gfx.Group", g.Shape, {
		// summary: a group shape (Canvas), which can be used 
		//	to logically group shapes (e.g, to propagate matricies)
		constructor: function(){
			gs.Container._init.call(this);
		},
		render: function(/* Object */ ctx){
			// summary: render the group
			ctx.save();
			this._renderTransform(ctx);
			this._renderFill(ctx);
			this._renderStroke(ctx);
			for(var i = 0; i < this.children.length; ++i){
				this.children[i].render(ctx);
			}
			ctx.restore();
		}
	});

	dojo.declare("dojox.gfx.Rect", gs.Rect, {
		// summary: a rectangle shape (Canvas)
		_renderShape: function(/* Object */ ctx){
			var s = this.shape, r = Math.min(s.r, s.height / 2, s.width / 2),
				xl = s.x, xr = xl + s.width, yt = s.y, yb = yt + s.height,
				xl2 = xl + r, xr2 = xr - r, yt2 = yt + r, yb2 = yb - r;
			ctx.beginPath();
			ctx.moveTo(xl2, yt);
			ctx.lineTo(xr2, yt);
			if(r){ ctx.arcTo(xr, yt, xr, yt2, r); }
			ctx.lineTo(xr, yb2);
			if(r){ ctx.arcTo(xr, yb, xr2, yb, r); }
			ctx.lineTo(xl2, yb);
			if(r){ ctx.arcTo(xl, yb, xl, yb2, r); }
			ctx.lineTo(xl, yt2);
			if(r){ ctx.arcTo(xl, yt, xl2, yt, r); }
	 		ctx.closePath();
		}
	});
	
	dojo.declare("dojox.gfx.Ellipse", gs.Ellipse, {
		// summary: an ellipse shape (Canvas)
		_renderShape: function(/* Object */ ctx){
			var s = this.shape, r = Math.max(s.rx, s.ry);
			ctx.scale(s.rx / r, s.ry / r);
			ctx.beginPath();
			ctx.arc(s.cx, s.cy, r, 0, twoPI, 1);
		}
	});

	dojo.declare("dojox.gfx.Circle", gs.Circle, {
		// summary: a circle shape (Canvas)
		_renderShape: function(/* Object */ ctx){
			var s = this.shape;
			ctx.beginPath();
			ctx.arc(s.cx, s.cy, s.r, 0, twoPI, 1);
		}
	});

	dojo.declare("dojox.gfx.Line", gs.Line, {
		// summary: a line shape (Canvas)
		_renderShape: function(/* Object */ ctx){
			var s = this.shape;
			ctx.beginPath();
			ctx.moveTo(s.x1, s.y1);
			ctx.lineTo(s.x2, s.y2);
		}
	});

	dojo.declare("dojox.gfx.Polyline", gs.Polyline, {
		// summary: a polyline/polygon shape (Canvas)
		setShape: function(){
			gs.Polyline.prototype.setShape.apply(this, arguments);
			var p = this.shape.points, f = p[0], r = [], c, i;
			if(p.length){
				if(typeof f == "number"){
					r.push(f, p[1]);
					i = 2;
				}else{
					r.push(f.x, f.y);
					i = 1;
				}
				for(; i < p.length; ++i){
					c = p[i];
					if(typeof c == "number"){
						r.push(c, p[++i]);
					}else{
						r.push(c.x, c.y);
					}
				}
			}
			this.canvasPolyline = r;
			return this;
		},
		_renderShape: function(/* Object */ ctx){
			var p = this.canvasPolyline;
			if(p.length){
				ctx.beginPath();
				ctx.moveTo(p[0], p[1]);
				for(var i = 2; i < p.length; i += 2){
					ctx.lineTo(p[i], p[i + 1]);
				}
			}
		}
	});
	
	dojo.declare("dojox.gfx.Image", gs.Image, {
		// summary: an image shape (Canvas)
		_renderShape: function(/* Object */ ctx){
			var s = this.shape;
			// nothing for the moment
		}
	});
	
	dojo.declare("dojox.gfx.Text", gs.Text, {
		// summary: a text shape (Canvas)
		_renderShape: function(/* Object */ ctx){
			var s = this.shape;
			// nothing for the moment
		}
	});
	modifyMethod(g.Text, "setFont");
	
	var pathRenderers = {
		M: "_moveToA", m: "_moveToR", 
		L: "_lineToA", l: "_lineToR", 
		H: "_hLineToA", h: "_hLineToR", 
		V: "_vLineToA", v: "_vLineToR", 
		C: "_curveToA", c: "_curveToR", 
		S: "_smoothCurveToA", s: "_smoothCurveToR", 
		Q: "_qCurveToA", q: "_qCurveToR", 
		T: "_qSmoothCurveToA", t: "_qSmoothCurveToR", 
		A: "_arcTo", a: "_arcTo", 
		Z: "_closePath", z: "_closePath"
	};
	
	dojo.declare("dojox.gfx.Path", g.path.Path, {
		// summary: a path shape (Canvas)
		constructor: function(){
			this.last = {};
			this.lastControl = {};
		},
		_renderShape: function(/* Object */ ctx){
			var p = this.shape.path.match(g.pathSvgRegExp),
				action = "", args = [], l = p.length;
			this.last = {}, this.lastControl = {};
			ctx.beginPath();
			for(var i = 0; i < l; ++i){
				var t = p[i], x = parseFloat(t);
				if(isNaN(x)){
					if(action in pathRenderers){
						this[pathRenderers[action]](ctx, action, args);
					}
					args = [];
					action = t;
				}else{
					args.push(x);
				}
			}
			if(action in pathRenderers){
				this[pathRenderers[action]](ctx, action, args);
			}
		},
		_moveToA: function(ctx, action, args){
			ctx.moveTo(args[0], args[1]);
			for(var i = 2; i < args.length; i += 2){
				ctx.lineTo(args[i], args[i + 1]);
			}
			this.last.x = args[args.length - 2];
			this.last.y = args[args.length - 1];
			this.lastControl = {};
		},
		_moveToR: function(ctx, action, args){
			if("x" in this.last){
				ctx.moveTo(this.last.x += args[0], this.last.y += args[1]);
			}else{
				ctx.moveTo(this.last.x = args[0], this.last.y = args[1]);
			}
			for(var i = 2; i < args.length; i += 2){
				ctx.lineTo(this.last.x += args[i], this.last.y += args[i + 1]);
			}
			this.lastControl = {};
		},
		_lineToA: function(ctx, action, args){
			for(var i = 0; i < args.length; i += 2){
				ctx.lineTo(args[i], args[i + 1]);
			}
			this.last.x = args[args.length - 2];
			this.last.y = args[args.length - 1];
			this.lastControl = {};
		},
		_lineToR: function(ctx, action, args){
			for(var i = 0; i < args.length; i += 2){
				ctx.lineTo(this.last.x += args[i], this.last.y += args[i + 1]);
			}
			this.lastControl = {};
		},
		_hLineToA: function(ctx, action, args){
			for(var i = 0; i < args.length; ++i){
				ctx.lineTo(args[i], this.last.y);
			}
			this.last.x = args[args.length - 1];
			this.lastControl = {};
		},
		_hLineToR: function(ctx, action, args){
			for(var i = 0; i < args.length; ++i){
				ctx.lineTo(this.last.x += args[i], this.last.y);
			}
			this.lastControl = {};
		},
		_vLineToA: function(ctx, action, args){
			for(var i = 0; i < args.length; ++i){
				ctx.lineTo(this.last.x, args[i]);
			}
			this.last.y = args[args.length - 1];
			this.lastControl = {};
		},
		_vLineToR: function(ctx, action, args){
			for(var i = 0; i < args.length; ++i){
				ctx.lineTo(this.last.x, this.last.y += args[i]);
			}
			this.lastControl = {};
		},
		_curveToA: function(ctx, action, args){
			for(var i = 0; i < args.length; i += 6){
				ctx.bezierCurveTo(
					args[i], 
					args[i + 1], 
					args[i + 2], 
					args[i + 3], 
					args[i + 4], 
					args[i + 5]
				);
			}
			this.last.x = args[args.length - 2];
			this.last.y = args[args.length - 1];
			this.lastControl.x = args[args.length - 4];
			this.lastControl.y = args[args.length - 3];
			this.lastControl.type = "C";
		},
		_curveToR: function(ctx, action, args){
			for(var i = 0; i < args.length; i += 6){
				ctx.bezierCurveTo(
					this.last.x + args[i], 
					this.last.y + args[i + 1], 
					this.lastControl.x = this.last.x + args[i + 2], 
					this.lastControl.y = this.last.y + args[i + 3], 
					this.last.x + args[i + 4], 
					this.last.y + args[i + 5]
				);
				this.last.x += args[i + 4];
				this.last.y += args[i + 5];
			}
			this.lastControl.type = "C";
		},
		_smoothCurveToA: function(ctx, action, args){
			for(var i = 0; i < args.length; i += 4){
				var valid = this.lastControl.type == "C";
				ctx.bezierCurveTo(
					valid ? 2 * this.last.x - this.lastControl.x : this.last.x, 
					valid ? 2 * this.last.y - this.lastControl.y : this.last.y, 
					args[i], 
					args[i + 1], 
					args[i + 2], 
					args[i + 3]
				);
				this.lastControl.x = args[i];
				this.lastControl.y = args[i + 1];
				this.lastControl.type = "C";
			}
			this.last.x = args[args.length - 2];
			this.last.y = args[args.length - 1];
		},
		_smoothCurveToR: function(ctx, action, args){
			for(var i = 0; i < args.length; i += 4){
				var valid = this.lastControl.type == "C";
				ctx.bezierCurveTo(
					valid ? 2 * this.last.x - this.lastControl.x : this.last.x, 
					valid ? 2 * this.last.y - this.lastControl.y : this.last.y, 
					this.last.x + args[i], 
					this.last.y + args[i + 1], 
					this.last.x + args[i + 2], 
					this.last.y + args[i + 3]
				);
				this.lastControl.x = this.last.x + args[i];
				this.lastControl.y = this.last.y + args[i + 1];
				this.lastControl.type = "C";
				this.last.x += args[i + 2];
				this.last.y += args[i + 3];
			}
		},
		_qCurveToA: function(ctx, action, args){
			for(var i = 0; i < args.length; i += 4){
				ctx.quadraticCurveTo(
					args[i], 
					args[i + 1], 
					args[i + 2], 
					args[i + 3]
				);
			}
			this.last.x = args[args.length - 2];
			this.last.y = args[args.length - 1];
			this.lastControl.x = args[args.length - 4];
			this.lastControl.y = args[args.length - 3];
			this.lastControl.type = "Q";
		},
		_qCurveToR: function(ctx, action, args){
			for(var i = 0; i < args.length; i += 4){
				ctx.quadraticCurveTo(
					this.lastControl.x = this.last.x + args[i], 
					this.lastControl.y = this.last.y + args[i + 1], 
					this.last.x + args[i + 2], 
					this.last.y + args[i + 3]
				);
				this.last.x += args[i + 2];
				this.last.y += args[i + 3];
			}
			this.lastControl.type = "Q";
		},
		_qSmoothCurveToA: function(ctx, action, args){
			for(var i = 0; i < args.length; i += 2){
				var valid = this.lastControl.type == "Q";
				ctx.quadraticCurveTo(
					this.lastControl.x = valid ? 2 * this.last.x - this.lastControl.x : this.last.x, 
					this.lastControl.y = valid ? 2 * this.last.y - this.lastControl.y : this.last.y, 
					args[i], 
					args[i + 1]
				);
				this.lastControl.type = "Q";
			}
			this.last.x = args[args.length - 2];
			this.last.y = args[args.length - 1];
		},
		_qSmoothCurveToR: function(ctx, action, args){
			for(var i = 0; i < args.length; i += 2){
				var valid = this.lastControl.type == "Q";
				ctx.quadraticCurveTo(
					this.lastControl.x = valid ? 2 * this.last.x - this.lastControl.x : this.last.x, 
					this.lastControl.y = valid ? 2 * this.last.y - this.lastControl.y : this.last.y, 
					this.last.x + args[i], 
					this.last.y + args[i + 1]
				);
				this.lastControl.type = "Q";
				this.last.x += args[i];
				this.last.y += args[i + 1];
			}
		},
		_arcTo: function(ctx, action, args){
			var relative = action == "a";
			for(var i = 0; i < args.length; i += 7){
				var x1 = args[i + 5], y1 = args[i + 6];
				if(relative){
					x1 += this.last.x;
					y1 += this.last.y;
				}
				var result = g.arc.arcAsBezier(
					this.last, args[i], args[i + 1], args[i + 2], 
					args[i + 3] ? 1 : 0, args[i + 4] ? 1 : 0,
					x1, y1
				);
				dojo.forEach(result, function(p){
					ctx.bezierCurveTo(p[0], p[1], p[2], p[3], p[4], p[5]);
				});
				this.last.x = x1;
				this.last.y = y1;
			}
			this.lastControl = {};
		},
		_closePath: function(ctx, action, args){
			ctx.closePath();
			this.lastControl = {};
		}
	});
	dojo.forEach(["moveTo", "lineTo", "hLineTo", "vLineTo", "curveTo", 
		"smoothCurveTo", "qCurveTo", "qSmoothCurveTo", "arcTo", "closePath"], 
		function(method){ modifyMethod(g.Path, method); }
	);

	dojo.declare("dojox.gfx.TextPath", g.path.TextPath, {
		// summary: a text shape (Canvas)
		_renderShape: function(/* Object */ ctx){
			var s = this.shape;
			// nothing for the moment
		}
	});
	
	dojo.declare("dojox.gfx.Surface", gs.Surface, {
		// summary: a surface object to be used for drawings (Canvas)
		constructor: function(){
			gs.Container._init.call(this);
			this.dirty = false;
			this.makeDirty();
		},
		setDimensions: function(width, height){
			// summary: sets the width and height of the rawNode
			// width: String: width of surface, e.g., "100px"
			// height: String: height of surface, e.g., "100px"
			this.width  = g.normalizedLength(width);	// in pixels
			this.height = g.normalizedLength(height);	// in pixels
			if(!this.rawNode) return this;
			this.rawNode.width = width;
			this.rawNode.height = height;
			this.makeDirty();
			return this;	// self
		},
		getDimensions: function(){
			// summary: returns an object with properties "width" and "height"
			return this.rawNode ? {width:  this.rawNode.width, height: this.rawNode.height} : null;	// Object
		},
		render: function(){
			// summary: render the all shapes
			var ctx = this.rawNode.getContext("2d");
			ctx.save();
			ctx.clearRect(0, 0, this.rawNode.width, this.rawNode.height);
			for(var i = 0; i < this.children.length; ++i){
				this.children[i].render(ctx);
			}
			ctx.restore();
			this.dirty = false;
		},
		makeDirty: function(){
			// summary: internal method, which is called when we may need to redraw
			if(!this.dirty){
				setTimeout(dojo.hitch(this, this.render), 0);
				this.dirty = true;
			}
		},

		// events are not implemented
		getEventSource: function(){ return null; },
		connect:		function(){},
		disconnect:		function(){}
	});

	g.createSurface = function(parentNode, width, height){
		// summary: creates a surface (Canvas)
		// parentNode: Node: a parent node
		// width: String: width of surface, e.g., "100px"
		// height: String: height of surface, e.g., "100px"

		if(!width){ width = "100%"; }
		if(!height){ height = "100%"; }
		var s = new g.Surface(),
			p = dojo.byId(parentNode),
			c = p.ownerDocument.createElement("canvas");
		c.width  = width;
		c.height = height;
		p.appendChild(c);
		s.rawNode = c;
		s.surface = s;
		return s;	// dojox.gfx.Surface
	};
	
	// Extenders
	
	var C = gs.Container, Container = {
		add: function(shape){
			this.surface.makeDirty();
			return C.add.apply(this, arguments);
		},
		remove: function(shape, silently){
			this.surface.makeDirty();
			return C.remove.apply(this, arguments);
		},
		clear: function(){
			this.surface.makeDirty();
			return C.clear.apply(this, arguments);
		},
		_moveChildToFront: function(shape){
			this.surface.makeDirty();
			return C._moveChildToFront.apply(this, arguments);
		},
		_moveChildToBack: function(shape){
			this.surface.makeDirty();
			return C._moveChildToBack.apply(this, arguments);
		}
	};

	dojo.mixin(gs.Creator, {
		// summary: Canvas shape creators
		createObject: function(shapeType, rawShape) {
			// summary: creates an instance of the passed shapeType class
			// shapeType: Function: a class constructor to create an instance of
			// rawShape: Object: properties to be passed in to the classes "setShape" method
			// overrideSize: Boolean: set the size explicitly, if true
			var shape = new shapeType();
			shape.surface = this.surface;
			shape.setShape(rawShape);
			this.add(shape);
			return shape;	// dojox.gfx.Shape
		}
	});

	dojo.extend(g.Group, Container);
	dojo.extend(g.Group, gs.Creator);

	dojo.extend(g.Surface, Container);
	dojo.extend(g.Surface, gs.Creator);
})();
