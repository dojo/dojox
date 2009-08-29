dojo.provide("dojox.drawing.tools.Path");

dojox.drawing.tools.Path = dojox.drawing.util.oo.declare(
	// summary:
	//		Class for a drawable Path
	//
	dojox.drawing.stencil.Path,
	function(){
		// summary: constructor
		this.revertRenderHit = this.renderHit;
		this.renderHit = false;
		//this.closePath = false;
	},
	{
		draws:true,
		closeRadius:10,
		closeColor:{r:255,g:255,b:0,a:.5},
		startedDrawing:false,
		
		onDown: function(obj){
			if(!obj.withinCanvas){ return; }
			this.closePath = false;
			this.startedDrawing = true;
			this.mouse.setEventMode("PathEdit");
			
			this.connect(this.keys, "onEsc", this, "onStop");
		},
		
		onStop: function(){
			// summary:
			// 		Stop drawing Path. If more than one point has been
			//		created, then we leave the open path. If one or less,
			//		destroy the shape.
			if(this.points.length>1){
				// REDUNDANT
				this.remove(this.closeGuide, this.guide);
				this.renderHit = this.revertRenderHit;
				this.renderedOnce = true;
				this.onRender(this);
				this.onMove = function(){}
				this.onDrag = function(){}
				this.onUp = function(){}
				this.mouse.setEventMode("");
				this.render();
			}else{
				this.remove(this.shape, this.closeGuide, this.guide);
			}
		},
		
		onUp: function(/*EventObject*/obj){
			console.log("   Path UP", obj.mid, "within:", obj.withinCanvas)
					
				
			if(!this.startedDrawing || !obj.withinCanvas){ return; }
			
			
			if(this.points.length>2 && this.closeRadius>this.util.distance(obj.x, obj.y, this.points[0].x, this.points[0].y)){
				this.remove(this.closeGuide, this.guide);
				this.renderHit = this.revertRenderHit;
				
				this.closePath = true;
				this.renderedOnce = true;
				this.onRender(this);
				this.onMove = function(){}
				this.onDrag = function(){}
				this.onUp = function(){}
				this.mouse.setEventMode("");
				this.render();
				
			}else {
				this.points.push({
					x:obj.x,
					y:obj.y
				});
				if(this.points.length>1){
					this.remove(this.guide);
					this.render();
				}
			}
		},
		createGuide: function(obj){
			if(this.points.length){
				this.remove(this.guide);
				var p = this.points[this.points.length-1];
				var d = {
					x1:p.x,
					y1:p.y,
					x2:obj.x,
					y2:obj.y
				}
				this.guide = this.container.createLine(d)
				.setStroke(this.style.current);
			
				var dist = this.util.distance(obj.x, obj.y, this.points[0].x, this.points[0].y);
				if(this.points.length>1){
					if(dist<this.closeRadius && !this.closeGuide){
						var c = {
							cx:this.points[0].x,
							cy:this.points[0].y,
							rx:this.closeRadius,
							ry:this.closeRadius
						}
						this.closeGuide = this.container.createEllipse(c)
							.setFill(this.closeColor);
							
					}else if(dist>this.closeRadius && this.closeGuide){
						this.remove(this.closeGuide);
						this.closeGuide = null;
					}
				}
			}
		},
		onMove: function(obj){
			if(!this.startedDrawing){ return; }
			this.createGuide(obj);
		},
		onDrag: function(obj){
			if(!this.startedDrawing){ return; }
			this.createGuide(obj);
		}
	}
);

dojox.drawing.tools.Path.setup = {
	// summary: See Base ToolsSetup
	//
	name:"dojox.drawing.tools.Path",
	tooltip:"Path Tool",
	iconClass:"iconLine"
};

dojox.drawing.register(dojox.drawing.tools.Path.setup, "tool");