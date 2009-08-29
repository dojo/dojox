dojo.provide("dojox.drawing.stencil.Path");


dojox.drawing.stencil.Path = dojox.drawing.util.oo.declare(
	// summary:
	//		Creates a dojox.gfx Path based on points provided.
	//
	dojox.drawing.stencil._Base,
	function(options){
		dojo.disconnect(this._postRenderCon);

		if(options.points){
			//this.points = options.points;
			//this.render();
		}
	},
	{
		type:"dojox.drawing.stencil.Path",
		closePath: true,
		baseRender:true,
		
/*=====
StencilData: {
	// NOT SUPPORTED FOR PATH
},

StencilPoints: [
	// summary:
	//		An Array of StencilPoint objects that describe the Stencil
	// 	0: Object
	//		First point
	// 	[1, 2, 3...] more points
],
=====*/
		
		_create: function(/*String*/shp, /*Object*/sty){
			// summary:
			//		Creates a dojox.gfx.shape based on passed arguments.
			//		Can be called many times by implementation to create
			//		multiple shapes in one stencil.
			//
			this.remove(this[shp]);
			if(!this.points.length){ return; }
			
			if(dojox.gfx.renderer=="svg"){
				// NOTE:
				// In order to avoid the Safari d="" errors,
				// we'll need to build a string and set that.
				var strAr = [];
				dojo.forEach(this.points, function(o, i){
					if(i==0){
						strAr.push("M " + o.x +" "+ o.y);
					}else{
						var cmd = o.t || "L ";
						strAr.push(cmd + o.x +" "+ o.y); // Z + undefined works here
					}
				}, this);
				if(this.closePath){
					strAr.push("Z");
				}
				this[shp] = this.container.createPath(strAr.join(", ")).setStroke(sty);
				this.closePath && this[shp].setFill(sty.fill);
				
			}else{
				// Leaving this code for VML. It seems slightly faster but times vary.
				this[shp] = this.container.createPath({}).setStroke(sty);
				
				this.closePath && this[shp].setFill(sty.fill);
				
				dojo.forEach(this.points, function(o, i){
					if(i==0 || o.t=="M"){
						this[shp].moveTo(o.x, o.y);
					}else if(o.t=="Z"){
						this.closePath && this[shp].closePath();
					}else{
						this[shp].lineTo(o.x, o.y);
					}
				}, this);
				
				this.closePath && this[shp].closePath();
			}
			
			this._setNodeAtts(this[shp]);
		},
		
		render: function(){
			// summary:
			//		Renders the 'hit' object (the shape used for an expanded
			//		hit area and for highlighting) and the'shape' (the actual
			//		display object).
			//
			this.onBeforeRender(this);
			this.renderHit && this._create("hit", this.style.currentHit);
			this._create("shape", this.style.current);
			//console.log("path render")
		}		
		
	}
);

dojox.drawing.register({
	name:"dojox.drawing.stencil.Path"	
}, "stencil");