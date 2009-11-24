dojo.provide("dojox.drawing.annotations.BoxShadow");

dojox.drawing.annotations.BoxShadow = dojox.drawing.util.oo.declare(
	// summary:
	//		Creates a box shadow under solid objects. Can change the
	//		shadow direction, color, size, and intensity. Can center
	//		the shadow and make it a Glow.
	// description:
	//		This is a psuedo shadow, created by duplicating the
	//		original stencil and increasing the line weight while
	//		reducing the opacity. Therefore it will not work with
	//		text. Also won't look very good if the Stencil has no
	//		fill or is transparent. Can't do knockouts or inner
	//		shadows. Currently can't do paths - while doable, it
	//		will most likely choke IE into certain death.
	//
	function(/*Object*/options){
		this.stencil = options.stencil;
		this.util = options.stencil.util;
		this.mouse = options.stencil.mouse;
		this.style = options.stencil.style;
		
		var shadowDefaults = {
			// summary:
			//		When passing a shadow object into a stencil, that shadow
			//		object will be mixed in with these defaults.
			//
			// size: Number, mult: Number
			//		These two props work together. Both affect the size and quality
			//		of the shadow. size affects the actual size and mult affects the
			//		lineWidths that overlap to make the shadow. Generally you want a
			//		bigger 'size' than 'mult'. The defaults are good for a shadow, but
			//		you will want to increase them when making a glow.
			//	TODO: Make this more clear or use other properties.
			size:6,
			mult:4,
			// alpha: Float
			//		Affects the alpha of the shadow. Because this is multiple shapes
			//		overlapped, you want much less than you may think. .1 is pretty
			//		dark and . is black. Higher numbers also give a sharper edge.
			alpha:.05,
			//	place: String
			//		Tells the position of the shadow:
			//			B: bottom
			//			T: top
			//			L: left
			//			R: right
			//			C: center, or a glow
			//		Can be used in combinations such as BR, BL, L, T, etc. 'C' should
			//		be used by itself.
			place:"BR",
			//	color: String
			//		The color of the shadow or glow.
			color:"#646464"
		}
		
		delete options.stencil;
		this.options = dojo.mixin(shadowDefaults, options);
		this.options.color = new dojo.Color(this.options.color)
		this.options.color.a = this.options.alpha;
		
		switch(this.stencil.shortType){
			case "image":
			case "rect":
				this.method = "createForRect"; break;
			case "ellipse":
				this.method = "createForEllipse"; break;
			case "line":
				this.method = "createForLine"; break;
			case "path":
				this.method = "createForPath"; break;
				// 	path is a bit of a hassle. Plus I think in IE it would be
				//slower than than the political process. Maybe TODO.
			default:
				console.warn("A shadow cannot be made for Stencil type ", this.stencil.type);
		}
		
		if(this.method){
			this.render();
			this.stencil.connectMult([
				[this.stencil, "onTransform", this, "onTransform"],
				[this.stencil, "render", this, "onRender"],
				[this.stencil, "onDelete", this, "destroy"]
			]);
		}
	},
	{
		showing:true,
		render: function(){
			if(this.container){
				this.container.removeShape();
			}
			this.container = this.stencil.container.createGroup();
			this.container.moveToBack();
			
			var o = this.options,
				size = o.size,
				mult = o.mult,
				d = this.method == "createForPath"
					? this.stencil.points
					: this.stencil.data,
				r = d.r || 1,
				p = o.place,
				c = o.color;
			
			this[this.method](o, size, mult, d, r, p, c);	
		},
		
		hide: function(){
			if(this.showing){
				this.showing = false;
				this.container.removeShape();
			}
		},
		
		show: function(){
			if(!this.showing){
				this.showing = true;
				this.stencil.container.add(this.container);
			}
		},
		
		createForPath: function(o, size, mult, pts, r, p, c){
			var sh = size * mult / 4,
				shy = /B/.test(p) ? sh : /T/.test(p) ? sh*-1 : 0,
				shx = /R/.test(p) ? sh : /L/.test(p) ? sh*-1 : 0;
			
			var closePath = true;
			
			for(var i=1;i<=size;i++){
				var lineWidth = i * mult;
				//var rect = this.container.createLine({x1:d.x1+shx, y1:d.y1+shy, x2:d.x2+shx, y2:d.y2+shy})
				//	.setStroke({width:lineWidth, color:c, cap:"round"})		
			
				if(dojox.gfx.renderer=="svg"){
					var strAr = [];
					dojo.forEach(pts, function(o, i){
						if(i==0){
							strAr.push("M " + (o.x+shx) +" "+ (o.y+shy));
						}else{
							var cmd = o.t || "L ";
							strAr.push(cmd + (o.x+shx) +" "+ (o.y+shy)); // Z + undefined works here
						}
					}, this);
					if(closePath){
						strAr.push("Z");
					}
					this.container.createPath(strAr.join(", ")).setStroke({width:lineWidth, color:c, cap:"round"})	
					
				}else{
					// Leaving this code for VML. It seems slightly faster but times vary.
					var pth = this.container.createPath({}).setStroke({width:lineWidth, color:c, cap:"round"})	
					
					dojo.forEach(this.points, function(o, i){
						if(i==0 || o.t=="M"){
							pth.moveTo(o.x+shx, o.y+shy);
						}else if(o.t=="Z"){
							closePath && pth.closePath();
						}else{
							pth.lineTo(o.x+shx, o.y+shy);
						}
					}, this);
					
					closePath && pth.closePath();
				}
			
			
			}
		},
		
		createForLine: function(o, size, mult, d, r, p, c){
			
			var sh = size * mult / 4,
				shy = /B/.test(p) ? sh : /T/.test(p) ? sh*-1 : 0,
				shx = /R/.test(p) ? sh : /L/.test(p) ? sh*-1 : 0;
			for(var i=1;i<=size;i++){
				var lineWidth = i * mult;
				this.container.createLine({x1:d.x1+shx, y1:d.y1+shy, x2:d.x2+shx, y2:d.y2+shy})
					.setStroke({width:lineWidth, color:c, cap:"round"})		
			}
		},
		createForEllipse: function(o, size, mult, d, r, p, c){
		
			var sh = size * mult / 8,
				shy = /B/.test(p) ? sh : /T/.test(p) ? sh*-1 : 0,
				shx = /R/.test(p) ? sh*.8 : /L/.test(p) ? sh*-.8 : 0;
			
			for(var i=1;i<=size;i++){
				var lineWidth = i * mult;
				this.container.createEllipse({cx:d.cx+shx, cy:d.cy+shy, rx:d.rx-sh, ry:d.ry-sh, r:r})
					.setStroke({width:lineWidth, color:c})		
			}
		},
		
		createForRect: function(o, size, mult, d, r, p, c){
			
			var sh = size * mult / 2,
				shy = /B/.test(p) ? sh : /T/.test(p) ? 0 : sh /2,
				shx = /R/.test(p) ? sh : /L/.test(p) ? 0 : sh /2;
			
			for(var i=1;i<=size;i++){
				var lineWidth = i * mult;
				this.container.createRect({x:d.x+shx, y:d.y+shy, width:d.width-sh, height:d.height-sh, r:r})
					.setStroke({width:lineWidth, color:c})		
			}
		},
		onTransform: function(){
			this.render();
		},
		onRender: function(){
			this.container.moveToBack();
		},
		destroy: function(){
			if(this.container){
				this.container.removeShape();
			}
		}
	}
);