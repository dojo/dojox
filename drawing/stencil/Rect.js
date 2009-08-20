dojo.provide("dojox.drawing.stencil.Rect");


dojox.drawing.stencil.Rect = dojox.drawing.util.oo.declare(
	// summary:
	//		Creates a dojox.gfx rectangle based on data or points provided.
	//
	dojox.drawing.stencil._Base,
	function(options){
		// summary:
		//		constructor
		if(this.points.length){
			//this.render();
		}
	},
	{
		type:"dojox.drawing.stencil.Rect",
		anchorType: "group",
		baseRender:true,
		
/*=====
StencilData: {
	// summary:
	//		The data used to create the dojox.gfx Shape
	// 	x: Number
	//		Left point x
	// 	y: Number
	//		Top point y
	// 	width: Number
	//		width of rectangle
	// 	height: Number
	//		height of rectangle
},

StencilPoints = [
	// summary:
	//		An Array of dojox.__StencilPoint objects that describe the Stencil
	// 	0: Object
	//		Top left point
	// 	1: Object
	//		Top right point
	// 	2: Object
	//		Bottom right point
	// 	3: Object
	//		Bottom left point
],
=====*/
		
		dataToPoints: function(/*Object*/d){
			//summary:
			//		Converts data to points.
			d = d || this.data;
			this.points = [
				{x:d.x, y:d.y}, 						// TL
				{x:d.x + d.width, y:d.y},				// TR
				{x:d.x + d.width, y:d.y + d.height},	// BR
				{x:d.x, y:d.y + d.height}				// BL
			];
			return this.points;
		},
		
		pointsToData: function(/*Array*/p){
			// summary:
			//		Converts points to data
			p = p || this.points;
			var s = p[0];
			var e = p[2];
			this.data = {
				x: s.x,
				y: s.y,
				width: e.x-s.x,
				height: e.y-s.y
			};
			return this.data;
			
		},
		
		_create: function(/*String*/shp, /*StencilData*/d, /*Object*/sty){
			// summary:
			//		Creates a dojox.gfx.shape based on passed arguments.
			//		Can be called many times by implementation to create
			//		multiple shapes in one stencil.
			//
			//console.log("render rect", d)
			this.remove(this[shp]);
			this[shp] = this.container.createRect(d)
				.setStroke(sty)
				.setFill(sty.fill);
			
			this._setNodeAtts(this[shp]);
		},
		
		render: function(){
			// summary:
			//		Renders the 'hit' object (the shape used for an expanded
			//		hit area and for highlighting) and the'shape' (the actual
			//		display object).
			//
			this.onBeforeRender(this);
			this.renderHit && this._create("hit", this.data, this.style.currentHit);
			this._create("shape", this.data, this.style.current);
		}
	}
);
