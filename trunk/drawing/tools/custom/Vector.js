dojo.provide("dojox.drawing.tools.custom.Vector");
dojo.require("dojox.drawing.tools.Arrow");
dojo.require("dojox.drawing.util.positioning");

dojox.drawing.tools.custom.Vector = dojox.drawing.util.oo.declare(
	// summary:
	//		Creates a Vector Stencil.
	// description:
	//		Generally the same as an arrow, except that the arrow
	//		head is only at the end. There is additionaly functionality
	//		to allow for a 'zero vector' - one with no length.
	//
	// 	TODO: Zero Vectors are less than the minimumSize. But if
	//	you get the radius, it will report a length.
	//
	dojox.drawing.tools.Arrow,
	function(options){
		this.minimumSize = this.style.arrows.length;
	},
	{
		draws:true,
		type:"dojox.drawing.tools.custom.Vector",
		minimumSize:30,
		showAngle:true,
		
		labelPosition: function(){
			// summary:
			//		The custom position used for the label
			//
			var d = this.data;
			var pt = dojox.drawing.util.positioning.label({x:d.x1,y:d.y1},{x:d.x2,y:d.y2});
			return {
				x:pt.x,
				y:pt.y
			}
		},
		
		_createZeroVector: function(shp, d, sty){
			// summary:
			//		Special creation function for the zero-vector shape
			//
			var s = shp=="hit" ? this.minimumSize : this.minimumSize/2;
			var f = shp=="hit" ? sty.fill : null;
			d = {
				cx:this.data.x1,
				cy:this.data.y1,
				rx:s,
				ry:s
			};
			
			this.remove(this[shp]);
			this[shp] = this.container.createEllipse(d)
				.setStroke(sty)
				.setFill(f);
			this.util.attr(this[shp], "drawingType", "stencil");
		},
		
		render: function(){
			// summary:
			//		Renders the 'hit' object (the shape used for an expanded
			//		hit area and for highlighting) and the'shape' (the actual
			//		display object). Additionally checks if Vector should be
			//		drawn as an arrow or a circle (zero-length)
			//
			this.onBeforeRender(this);
			if(this.getRadius() >= this.minimumSize){
				this._create("hit", this.data, this.style.currentHit);
				this._create("shape", this.data, this.style.current);
			}else{
				this._createZeroVector("hit", this.data, this.style.currentHit);
				this._createZeroVector("shape", this.data, this.style.current);
			}
		},
		onUp: function(/*EventObject*/obj){
			// summary: See stencil._Base.onUp
			//
			if(this.created || !this.shape){ return; }
			// if too small, need to reset
			// 		This sets the zero length vector to zero within the minimum size 
			if(this.getRadius()<this.minimumSize){
				var p = this.points; 
				this.setPoints([ 
					{x:p[0].x, y:p[0].y}, 
					{x:p[0].x, y:p[0].y} 
				]); 
			} else { 			
				//ace: needed as else to avoid zero length problem in snapAngle 
				var pt = this.util.snapAngle(obj, this.angleSnap/180);
				var p = this.points;
				this.setPoints([
					{x:p[0].x, y:p[0].y},
					{x:pt.x, y:pt.y}
				]);
				
			}
			this.renderedOnce = true;
			this.onRender(this);
		}
	}
	
);

dojox.drawing.tools.custom.Vector.setup = {
	// summary: See stencil._Base ToolsSetup
	//
	name:"dojox.drawing.tools.custom.Vector",
	tooltip:"Vector Tool",
	iconClass:"iconVector"
};
dojox.drawing.register(dojox.drawing.tools.custom.Vector.setup, "tool");