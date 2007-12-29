dojo.provide("dojox.image.Magnifier");
dojo.experimental("dojox.image.Magnifier");

dojo.require("dojox.gfx");
dojo.require("dijit._Widget");

dojo.declare("dojox.image.Magnifier",
	[dijit._Widget],{
	// summary:	Adds magnification on a portion of an image element
	//
	// description: An unobtrusive way to add an unstyled overlay
	// 		above the srcNode image element. The overlay/glass is a 
	//		scaled version of the src image (so larger images sized down
	//		are clearer).
	//
	//		The logic behind requiring the src image to be large is
	//		"it's going to be downloaded, anyway" so this method avoids
	//		having to make thumbnails and 2 http requests among other things.
	//
	// glassSize: Int
	// 		the width and height of the bounding box
	glassSize: 125,

	// scale: Decimal
	// 		the multiplier of the Mangification. 
	scale: 6,

	postCreate: function(){
		this.inherited(arguments);
		
		// images are hard to make into workable templates, so just add outer overlay
		// and skip using dijit._Templated
		this.glassNode = dojo.doc.createElement('div');
		this.surfaceNode = this.glassNode.appendChild(dojo.doc.createElement('div'));
		dojo.addClass(this.glassNode,"glassNode");
		dojo.body().appendChild(this.glassNode);
		with(this.glassNode.style){
			position = "absolute";
			border = "1px solid #333";
			height = this.glassSize + "px";
			width = this.glassSize + "px";
			visibility = "hidden";
		}
		
		this._adjustScale();
		
		// we could probably use css and background-position, too. but I hope to make
		// the glass an SVG element, too
		this.surface = dojox.gfx.createSurface(this.surfaceNode, this.glassSize, this.glassSize);
		this.img = this.surface.createImage({
		   src:this.domNode.src,
		   width:this._zoomSize.w,
		   height:this._zoomSize.h
		});

		this.connect(this.domNode,"onmouseenter","_showGlass");
		this.connect(this.glassNode,"onmousemove","_placeGlass");
		this.connect(this.glassNode,"onmouseout","_hideGlass");
		
	},
	
	_adjustScale: function(){
		// summary: update the calculations should this.scale change
		
		// FIXME: does not alter gfx surface
		this.offset = dojo.coords(this.domNode,true);
		this._imageSize = { w: this.offset.w, h:this.offset.h };
		this._zoomSize = {
			w: this._imageSize.w * this.scale,
			h: this._imageSize.h * this.scale
		};
	},
	
	_showGlass: function(e){
		// summary: show the overlay
		this._placeGlass(e);		
		with(this.glassNode.style){
			visibility = "visible";
			display = "";
		}			
		
	},
	
	_hideGlass: function(e){
		// summary: hide the overlay
		this.glassNode.style.visibility = "hidden";
		this.glassNode.style.display = "none";
	},
	
	_placeGlass: function(e){
		// summary: position the overlay centered under the cursor
		var x = e.pageX - 2;
		var y = e.pageY - 2 ;
		var xMax = this.offset.x + this.offset.w + 2;
		var yMax = this.offset.y + this.offset.h + 2;
		
		if(x<this.offset.x || y<this.offset.y || x>xMax || y>yMax){
			this._hideGlass();
			return;  
		}

		this._setImage(e);

		var t = Math.floor(e.pageY - (this.glassSize/2));
		var l = Math.floor(e.pageX - (this.glassSize/2));

		dojo.style(this.glassNode,"top",t);
		dojo.style(this.glassNode,"left",l);

	},

	_setImage: function(e){
		// summary: set the image's offset in the clipping window relative to the mouse position
		var xOff = (e.pageX - this.offset.l) / this.offset.w;
		var yOff = (e.pageY - this.offset.t) / this.offset.h;

		var x = (this._zoomSize.w * xOff * -1)+(this.glassSize*xOff);
		var y = (this._zoomSize.h * yOff * -1)+(this.glassSize*yOff);

		this.img.setShape({ x: x, y:y });	

	}

});