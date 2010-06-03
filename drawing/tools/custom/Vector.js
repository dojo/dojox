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
		if(this.style.zAxis || options.data.cosphi!=0)
		{
			this.cosphi = options.data.cosphi;
			this.style.zAxis = "true";
		}
		this.addShadow({size:3, mult:2});
	},
	{
		draws:true,
		type:"dojox.drawing.tools.custom.Vector",
		minimumSize:30,
		showAngle:true,
		cosphi:0,
		
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
		
		changeAxis: function(cosphi){
			//	summary:
			//		Converts a vector to and from the z axis.
			//		If passed a cosphi value that is used to set
			//		the axis, otherwise it is the opp of what it is.
			cosphi = cosphi!==undefined?cosphi:this.style.zAxis? 0 : 1;
			if(cosphi == 0){
				this.style.zAxis = false;
				this.cosphi = 0;
			}else{
				this.style.zAxis = true;
				var p = this.points;
				var pt = this.zPoints();
				this.setPoints([
					{x:p[0].x, y:p[0].y},
					{x:pt.x, y:pt.y}
				]);
			}
			this.render();
		},
		
		_createZeroVector: function(shp, d, sty){
			// summary:
			//		Special creation function for the zero-vector shape
			//
			var s = shp=="hit" ? this.minimumSize : this.minimumSize/6;
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
		
		_create: function(/*String*/shp, /*StencilData*/d, /*Object*/sty){
			// summary:
			//		Creates a dojox.gfx.shape based on passed arguments.
			//		Can be called many times by implementation to create
			//		multiple shapes in one stencil.
			//
			this.remove(this[shp]);
			this[shp] = this.container.createLine(d)
				.setStroke(sty);
			this._setNodeAtts(this[shp]);
		},
		
		onDrag: function(/*EventObject*/obj){
			// summary: See stencil._Base.onDrag
			//
			if(this.created){ return; }
			
			var x1 = obj.start.x,
				y1 = obj.start.y,
				x2 = obj.x,
				y2 = obj.y;
			
			if(this.keys.shift && !this.style.zAxis){
				var pt = this.util.snapAngle(obj, 45/180);
				x2 = pt.x;
				y2 = pt.y;
			}
			
			if(this.keys.alt){
				// FIXME:
				//	should double the length of the line
				// FIXME:
				//	if alt dragging past ZERO it seems to work
				//	but select/deselect shows bugs
				var dx = x2>x1 ? ((x2-x1)/2) : ((x1-x2)/-2);
				var dy = y2>y1 ? ((y2-y1)/2) : ((y1-y2)/-2);
				x1 -= dx;
				x2 -= dx;
				y1 -= dy;
				y2 -= dy;
			}
			
			if(this.style.zAxis){
				var pts = this.zPoints(obj);
				x2 = pts.x;
				y2 = pts.y;
			}
			
			this.setPoints([
				{x:x1, y:y1},
				{x:x2, y:y2}
			]);
			this.render();
		},
		
		onTransform: function(/* ? manager.Anchor */anchor){
			// summary:
			// 		Called from anchor point mouse drag
			// 		also called from plugins.Pan.checkBounds
			if(!this._isBeingModified){
				this.onTransformBegin();
			}
			// this is not needed for anchor moves, but it
			// is for stencil move:
			
			this.setPoints(this.points);
			if(this.style.zAxis){
				var angle = this.getAngle();
				this.cosphi = angle>135 && angle<315 ? 1 : -1;
			}
			this.render();			
		},
		
		anchorConstrain: function(x, y){
			//	summary:
			//		Called from anchor point mouse drag
			if(!this.style.zAxis){ return; }
			var radians = this.style.zAngle*Math.PI/180;
			//Constrain to angle
			var test = x<0 ? x>-y : x<-y;
			var dx = test ? x : -y/Math.tan(radians); 
			var dy = !test ? y : -Math.tan(radians)*x;
			return {x:dx, y:dy}
		},
		
		zPoints: function(obj){
			//	summary:
			//		Takes any point and converts it to
			//		be on the z-axis.
			if(obj===undefined){
				if(!this.points[0] || (this.getRadius()<this.minimumSize)){ return; };
				var d = this.pointsToData();
				var obj = {
					start:{
						x:d.x1,
						y:d.y1
					},
					x:d.x2,
					y:d.y2
				};
			}
			var radius = this.util.length(obj);
			var angle = this.util.angle(obj);
			angle<0 ? angle = 360 + angle : angle;
			
			if(angle > 135 && angle < 315){
				//Out angle
				angle = this.style.zAngle;
				this.cosphi = 1;
			}else{
				//In Angle
				angle = this.util.oppAngle(this.style.zAngle);
				this.cosphi = -1;
			}
			
			return this.util.pointOnCircle(obj.start.x, obj.start.y, radius, angle);
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
				this.cosphi = 0;
				this._createZeroVector("hit", this.data, this.style.currentHit);
				this._createZeroVector("shape", this.data, this.style.current);
			}
		},
		onUp: function(/*EventObject*/obj){
			// summary: See stencil._Base.onUp
			//
			if(this.created || !this._downOnCanvas){ return; }
			this._downOnCanvas = false;
			//Default vector for single click
			if(!this.shape){
				s = obj.start;
				obj.y = obj.start.y + 100;
				obj.x = obj.start.x
				this.setPoints([
					{x:s.x, y:s.y},
					{x:s.x, y:s.y+100}
				]);
				this.render();
			}
			
			// if too small, need to reset
			// 		This sets the zero length vector to zero within the minimum size 
			
			if(this.getRadius()<this.minimumSize){
				var p = this.points; 
				this.setPoints([ 
					{x:p[0].x, y:p[0].y}, 
					{x:p[0].x, y:p[0].y} 
				]); 
			} else { 			
				//needed as else to avoid zero length problem in snapAngle 
				var p = this.points;
				var pt = this.style.zAxis ? this.zPoints(obj) : this.util.snapAngle(obj, this.angleSnap/180);
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

if(dojox.drawing.defaults.zAxisEnabled) {
	dojox.drawing.tools.custom.Vector.setup.secondary = {
		// summary:
		//		Creates a secondary tool for the Vector Stencil.
		// description:
		//		See Toolbar.js makeButtons function.  The toolbar 
		//		checks Vector.setup for a secondary tool and requires
		//		name, label, and funct.  Currently it doesn't accept icon
		//		and only uses text from label for the button.  Funct is the
		//		function that fires when the button is clicked.
		//
		//		Setup and postSetup are optional
		//		and allow tool specific functions to be added to the
		//		Toolbar object as if they were written there.
		name: "vectorSecondary",
		label: "z-axis",
		funct: function(button){
			button.selected ? this.zDeselect(button) : this.zSelect(button);
			
			var stencils = this.drawing.stencils.selectedStencils;
			for(var nm in stencils){
				if(stencils[nm].shortType == "vector" && (stencils[nm].style.zAxis != dojox.drawing.defaults.zAxis)){
					var s = stencils[nm];
					s.changeAxis();
					//Reset anchors
					if(s.style.zAxis){ s.deselect(); s.select(); }
				}
			}
			
		},
		setup: function(){
			// summary:
			//		All functions, variables and connections defined here
			//		are treated as if they were added directly to toolbar.
			//		They are included with the tool because secondary buttons
			//		are tool specific.
			var zAxis = dojox.drawing.defaults.zAxis;
			this.zSelect = function(button){
				zAxis = true;
				dojox.drawing.defaults.zAxis = true;
				button.select();
				this.vectorTest();
				this.zSelected = button;
			};
			this.zDeselect = function(button){
				zAxis = false;
				dojox.drawing.defaults.zAxis = false;
				button.deselect();
				this.vectorTest();
				this.zSelected = null;
			};
			this.vectorTest = function(){
				dojo.forEach(this.buttons, function(b){
					if(b.toolType=="vector" && b.selected){
						this.drawing.currentStencil.style.zAxis = zAxis;
					} 
				},this);
			};
			dojo.connect(this, "onRenderStencil", this, function(){ if(this.zSelected){ this.zDeselect(this.zSelected)}});
			var c = dojo.connect(this.drawing, "onSurfaceReady", this, function(){
				dojo.disconnect(c);
				dojo.connect(this.drawing.stencils, "onSelect", this, function(stencil){
					if(stencil.shortType == "vector"){
						if(stencil.style.zAxis){
							//If stencil is on the z-axis, update button to reflect that
							dojo.forEach(this.buttons, function(b){
								if(b.toolType=="vectorSecondary"){
									this.zSelect(b);
								}
							},this);
							
						} else {
							//Update button to not be z-axis
							dojo.forEach(this.buttons, function(b){
								if(b.toolType=="vectorSecondary"){
									this.zDeselect(b);
								}
							},this);
						}
					};
				});
			});
		},
		postSetup: function(btn){
			// summary:
			//		Depending on the secondary tool, it may need
			//		extra functionality for some of the basic functions.
			//		Post is passed the button so those connections can
			//		be made.
			dojo.connect(btn, "enable", function(){ dojox.drawing.defaults.zAxisEnabled = true; });
			dojo.connect(btn, "disable", function(){ dojox.drawing.defaults.zAxisEnabled = false; });
		}
	};
}
dojox.drawing.register(dojox.drawing.tools.custom.Vector.setup, "tool");