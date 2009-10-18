dojo.provide("dojox.drawing.tools.custom.Axes");
dojo.require("dojox.drawing.stencil.Path");


dojox.drawing.tools.custom.Axes = dojox.drawing.util.oo.declare(
	// summary:
	//		Draws a right-angle Axes (shaped like an L, not a +)
	// description:
	//		This Stencil is created with a Path so that the L shape
	//		is one continuous piece. Arrow heads are placed at the end
	// 		of each axis. The Axes can be rotated. There are custom
	// 		label methods.
	//
	dojox.drawing.stencil.Path,
	function(options){
		this.closePath = false;
		
		this.xArrow = new dojox.drawing.annotations.Arrow({stencil:this, idx1:0, idx2:1});
		this.yArrow = new dojox.drawing.annotations.Arrow({stencil:this, idx1:2, idx2:1});
		
		if(this.points && this.points.length){
			this.setPoints = this._postSetPoints;
			// need to call render again. It's already been called in the _Base
			// constructor by the time we get to this constructor
			this.render();
			// 	I don't know why Axes is different, but post-render calls won't
			// 	happen with pre-data unless we call this here. It *should* happen
			//	on first render.
			this.onRender();
		}
	},
	{
		draws:true,
		type:"dojox.drawing.tools.custom.Axes",
		minimumSize:30,
		showAngle:true,
		closePath:false,
		baseRender:false,

		createLabels: function(){
			// summary:
			//		Creates the label for each axis.
			//
			// NOTE: Not passing style into text because it's changing it
			var props = {align:"middle", valign:"middle", util:this.util, annotation:true, container:this.container, mouse:this.mouse, stencil:this};
			this.labelX = new dojox.drawing.annotations.Label(dojo.mixin(props,{
				labelPosition:this.setLabelX
			}));
			this.labelY = new dojox.drawing.annotations.Label(dojo.mixin(props,{
				labelPosition:this.setLabelY
			}));
		},
		
		setLabelX: function(){
			// summary:
			//		Custom placement for x-axis label
			//
			var ax = this.points[0];
			var c =  this.points[1];
			var ay = this.points[2];
			
			var dist = 40;
			var offdist = 20;
			var pt, px, py, pt2;
			
			pt = this.util.lineSub(c.x, c.y, ax.x, ax.y, dist);
			px = pt.x + (pt.y -ax.y);
			py = pt.y + (ax.x - pt.x);
			pt2 = this.util.lineSub(pt.x, pt.y, px, py, (dist-offdist));
			
			return {
				x:  pt2.x,
				y:  pt2.y,
				width:20
			};
		},
		setLabelY: function(){
			// summary:
			//		Custom placement for y-axis label
			//
			var ax = this.points[0];
			var c =  this.points[1];
			var ay = this.points[2];
			
			var dist = 40;
			var offdist = 20;
			var pt, px, py, pt2;
			pt = this.util.lineSub(c.x, c.y, ay.x, ay.y, dist);
			px = pt.x + ( ay.y-pt.y);
			py = pt.y + (pt.x - ay.x );
			pt2 = this.util.lineSub(pt.x, pt.y, px, py, (dist-offdist));
			pt2 = this.util.lineSub(pt.x, pt.y, px, py, (dist-offdist));
			return {
				x:  pt2.x,
				y:  pt2.y,
				width:20
			};
		},
		setLabel: function(/* ? String*/value){
			// summary:
			//		Set the text of the labels. The text would be
			//		broken up into the two labels.
			// arguments:
			//		value: [optional] String
			//			If no argument is passed, defaults to two labels
			//			'x' and 'y'. If an argument is passed, that
			//			text will be split on the word 'and' to determine
			//			the two labels.
			//
			if(this._labelsCreated){ return; }
			!this.labelX && this.createLabels();
			var x = "x";
			var y = "y";
			if(value){
				// match first "and" or "&" and trim whitespace.
				// Non-greedy matches are not supported in older
				// browsers such as Netscape Navigator 4 or
				// Microsoft Internet Explorer 5.0.
				value.replace(/^\s+/,"");
				value.replace(/\s+$/,"");
				var lbls = value.match(/(.*?)(and|&)(.*)/i);
				if(lbls.length>2){
					x = lbls[1].replace(/\s+$/,"");
					y = lbls[3].replace(/^\s+/,"");
				}
			}
			this.labelX.setLabel(x);
			this.labelY.setLabel(y);
			this._labelsCreated = true;
			
			


		},
		getLabel: function(){
			// summary:
			//		Getter for the labels. returns an object.
			//
			if(!this.labelX){ return {}; }
			return {
				x:this.labelX._text,
				y:this.labelY._text
			}; // Object
		},
		
		anchorPositionCheck: function(/*Number*/x, /*Number*/y, /*manager.Anchor*/anchor){
			// summary:
			//		Gets called from anchor to check if its current
			//		position is ok. If not, its x or y transform will
			// 		be changed until this passes.
			//
			var pm = this.container.getParent().getTransform();
			var am = anchor.shape.getTransform();
			
			// the xaxis point has changed and is not yet set as a point
			//	- but the center should be good (except for the transform).
			// Now check the yaxis point.
			
			var p = this.points;
			var o = {x:am.dx+anchor.org.x+pm.dx, y:am.dy+anchor.org.y+pm.dy};
			var c = {x:p[1].x+pm.dx, y:p[1].y+pm.dy};
			var ox = c.x - (c.y - o.y);
			var oy = c.y - (o.x - c.x);
			
			return {x:ox, y:oy};
			
		},
		
		onTransformBegin: function(/*manager.Anchor*/anchor){
			// summary:
			//		Overwrites _Base.onTransformBegin
			//
			// called from anchor point up mouse down
			this._isBeingModified = true;
		},
		
		onTransformEnd: function(/*manager.Anchor*/anchor){
			// summary:
			//		Overwrites _Base.onTransformEnd
			//
			// Gets called on anchor mouseup
			//	also gets called by checkBounds - we don't want that.
			if(!anchor){ return; }
			
			//	tell anchor to go to prev point if wrong
			// called from anchor point up mouse up
			
			this._isBeingModified = false;
			//this.deselect();
			this._toggleSelected();
			console.log("before:", Math.ceil(this.points[1].x), " x ", Math.ceil(this.points[1].y))
			
			var o = this.points[0];
			var c = this.points[1];
			var pt = this.util.constrainAngle({start:{x:c.x, y:c.y}, x:o.x, y:o.y}, 91, 180);
			
			if(pt.x==o.x && pt.y == o.y){
				// we're within the constraint, so now we snap
				var obj = {start:{x:c.x,y:c.y},x:o.x, y:o.y};
				pt = this.util.snapAngle(obj, this.angleSnap/180);
				
				obj.x = pt.x;
				obj.y = pt.y;
				var ox = obj.start.x - (obj.start.y - obj.y);
				var oy = obj.start.y - (obj.x - obj.start.x);
				
				if(ox<0 || oy<0){
					console.warn("AXES ERROR LESS THAN ZERO - ABORT");
					return;
				}
				this.points = [{x:obj.x, y:obj.y}, {x:obj.start.x, y:obj.start.y, noAnchor:true}];
				this.points.push({x:ox, y:oy, noAnchor:true});
				this.setPoints(this.points);
				
				//this.select();
				this.onModify(this);
				return;
			}
			
			// we're outside of the constraint. Set to the low or high.
			this.points[0].x = pt.x
			this.points[0].y = pt.y;
			o = this.points[0];
			
			var ox = c.x - (c.y - o.y);
			var oy = c.y - (o.x - c.x);
			
			this.points[2] = {x:ox, y:oy, noAnchor:true};
			this.setPoints(this.points);
			
			// reset handles render
			//anchor.reset(this);
			
			this.labelX.setLabel();
			this.labelY.setLabel();
			
			//this.select();
			this.onModify(this);
				
		},
		
		getBounds: function(/*Boolean*/absolute){
			// summary:
			//		Custom getBounds overwrites _Base.getBounds
			//
			var px = this.points[0],
				pc = this.points[1],
				py = this.points[2];
				
			if(absolute){
				return {
					x:pc.x,
					y:pc.y,
					x1:pc.x,
					y1:pc.y,
					x2:px.x,
					y2:px.y,
					x3:py.x,
					y3:py.y
				};
			}
			
			var	x1 = py.x,
				y1 = py.y < px.y ? py.y : px.y,
				x2 = px.x,
				y2 = pc.y;
			
			return {
				x1:x1,
				y1:y1,
				x2:x2,
				y2:y2,
				x:x1,
				y:y1,
				w:x2-x1,
				h:y2-y1
			};
		},
		
		_postSetPoints: function(/*Array*/pts){
			// summary:
			// 		Because Axes only has one anchor,
			// 		we substitute a special setPoints method
			//
			this.points[0] = pts[0];
			if(this.pointsToData){
				this.data = this.pointsToData();
			}
		},
		
		onTransform: function(/*Number*/anchor){
			// summary:
			//		Overwrites _Base.onTransform
			//
			// the xaxis point has changed - the center will not.
			// need to find the yaxis point.
			
			var o = this.points[0];
			var c = this.points[1];
			var ox = c.x - (c.y - o.y);
			var oy = c.y - (o.x - c.x);
			
			// 'noAnchor' on a point indicates an anchor should
			// not be rendered. This is the Y point being set.
			this.points[2] = {x:ox, y:oy, noAnchor:true};
			this.setPoints(this.points);
			if(!this._isBeingModified){
				this.onTransformBegin();
			}
			this.render();	
		},
		
		pointsToData: function(){
			//summary:
			//		Converts points to data. 
			var p = this.points;
			return {
				x1:p[1].x,
				y1:p[1].y,
				x2:p[0].x,
				y2:p[0].y,
				x3:p[2].x,
				y3:p[2].y
			};
		},
		
		dataToPoints: function(/* ? Object*/o){
			//summary:
			//		Converts data to points. 
			o = o || this.data;
			if(o.radius || o.angle){
				// instead of using x1,x2,y1,y1,
				// it's been set as x,y,angle,radius
				
				o.angle = (180-o.angle)<0 ? 180-o.angle+360 : 180-o.angle;
				var pt = this.util.pointOnCircle(o.x,o.y,o.radius,o.angle);
				var ox = o.x - (o.y - pt.y);
				var oy = o.y - (pt.x - o.x);
				
				this.data = o = {
					x2:o.x,
					y2:o.y,
					x1:pt.x,
					y1:pt.y,
					x3:ox,
					y3:oy
				}
				
			}
			this.points = [
				{x:o.x1, y:o.y1},
				{x:o.x2, y:o.y2, noAnchor:true},
				{x:o.x3, y:o.y3, noAnchor:true}
			];
			return this.points;
		},
		
		onDrag: function(/*EventObject*/obj){
			// summary: See stencil._Base.onDrag
			//
			var pt = this.util.constrainAngle(obj, 91, 180);
			obj.x = pt.x;
			obj.y = pt.y;
			var ox = obj.start.x - (obj.start.y - obj.y);
			var oy = obj.start.y - (obj.x - obj.start.x);
			
			if(ox<0 || oy<0){
				return;
			}
			this.points = [{x:obj.x, y:obj.y}, {x:obj.start.x, y:obj.start.y, noAnchor:true}];
			
			this.points.push({x:ox, y:oy, noAnchor:true});
			this.render();
		},
		
		onUp: function(/*EventObject*/obj){
			// summary: See stencil._Base.onUp
			//
			var p = this.points;
			if(!p.length){ return; }

			var len = this.util.distance(p[1].x ,p[1].y ,p[0].x ,p[0].y );
			if(!p || !p.length){
				return;
			}else if(len < this.minimumSize){
				this.remove(this.shape, this.hit);
				this.xArrow.remove(this.xArrow.shape, this.xArrow.hit);
				this.yArrow.remove(this.yArrow.shape, this.yArrow.hit);
				return;
			}
			
			var o = p[0];
			var c = p[1];
			obj = {start:{x:c.x,y:c.y},x:o.x,y:o.y};
			var pt = this.util.snapAngle(obj, this.angleSnap/180);
			obj.x = pt.x;
			obj.y = pt.y;
			var ox = obj.start.x - (obj.start.y - obj.y);
			var oy = obj.start.y - (obj.x - obj.start.x);
			
			if(ox<0 || oy<0){
				return;
			}
			this.points = [{x:obj.x, y:obj.y}, {x:obj.start.x, y:obj.start.y, noAnchor:true}];
			
			this.points.push({x:ox, y:oy, noAnchor:true});

			this.onRender(this);
			this.setPoints = this._postSetPoints;
		}
	}
);

dojox.drawing.tools.custom.Axes.setup = {
	// summary: See stencil._Base ToolsSetup
	//
	name:"dojox.drawing.tools.custom.Axes",
	tooltip:"Axes Tool",
	iconClass:"iconAxes"
};
dojox.drawing.register(dojox.drawing.tools.custom.Axes.setup, "tool");