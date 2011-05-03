// dojo.provide allows pages to use all of the types declared in this resource.
dojo.provide("dojox.geo.openlayers.GfxLayer");
dojo.experimental("dojox.geo.openlayers.GfxLayer");
dojo.require("dojox.gfx");
dojo.require("dojox.geo.openlayers.Feature");
dojo.require("dojox.geo.openlayers.Layer");

dojo.declare("dojox.geo.openlayers.GfxLayer", dojox.geo.openlayers.Layer, {
	// summary: 
	//   A layer dedicated to render dojox.geo.openlayers.GeometryFeature
	// description:
	//   A layer class for rendering geometries as dojox.gfx.Shape objects.
	//   This layer class accepts Features which encapsulates graphic objects to be added to the map.

	// All objects should be added to this group.
	// tags:
	//    private
	_viewport : null,

	constructor : function(name, options){
		// summary:
		//   Constructs a new GFX layer.
		var s = dojox.gfx.createSurface(this.olLayer.div, 1000, 1000);
		this._surface = s;
		if (options && options.viewport)
			this._viewport = options.viewport;
		else
			this._viewport = s.createGroup();
		dojo.connect(this.olLayer, "onMapResize", this, "onMapResize");
		this.olLayer.getDataExtent = this.getDataExtent;
	},

	getViewport : function(){
		// summary:
		//   Gets the viewport
		// tags:
		//   internal
		return this._viewport;
	},

	// summary:
	//   Sets the viewport
	// g: dojox.gfx.Group
	// tags:
	//   internal
	setViewport : function(g){
		if (this._viewport)
			this._viewport.removeShape();
		this._viewport = g;
		this._surface.add(g);
	},

	// summary:
	//   Called when map is resized.
	// tag:
	//   protected
	onMapResize : function(){
		this._surfaceSize();
	},

	// summary:
	//   Sets the map for this layer.
	// tag:
	//   protected
	setMap : function(map){
		this.inherited(arguments);
		this._surfaceSize();
	},

	// summary:
	//  get data extent
	// tags:
	//  private
	getDataExtent : function(){
		var ret = this._surface.getDimensions();;
		return ret;
	},

	// summary:
	//  get the underlying dojox.gfx.Surface
	// returns: dojox.gfx.Surface 
	//  The dojox.gfx.Surface this layer uses to draw its GFX rendering.
	getSurface : function(){
		return this._surface;
	},

	// summary:
	//   recomputes the surface size when being resized.
	// tags:
	//   private
	_surfaceSize : function(){
		var s = this.olLayer.map.getSize();
		this._surface.setDimensions(s.w, s.h);
	},

	// summary
	//   called when moved or zoommed.
	moveTo : function(event){
		var s = dojo.style(this.olLayer.map.layerContainerDiv);
		var left = parseInt(s.left);
		var top = parseInt(s.top);

		if (event.zoomChanged || left || top) {
			var d = this.olLayer.div;
			dojo.style(d, {
				left : -left + "px",
				top : -top + "px"
			});

			if (this._features == null)
				return;
			var vp = this.getViewport();
			
			vp.setTransform(dojox.gfx.matrix.translate(left, top));
			
			this.inherited(arguments);
			
			//			if (event.zoomChanged) {
			//				dojo.forEach(this._features, function(f){
			//					this.renderFeature(f);
			//				}, this);
			//			}
		}
	},

	// summary:
	//   Called when added to a map.
	added : function(){
		this.inherited(arguments);
		this._surfaceSize();
	}

});
