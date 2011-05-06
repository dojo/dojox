// dojo.provide allows pages to use all of the types declared in this resource.
dojo.provide("dojox.geo.openlayers.Point");
dojo.require("dojox.geo.openlayers.Geometry");

dojo.declare("dojox.geo.openlayers.Point", dojox.geo.openlayers.Geometry, {
	// summary:
	//   A Point geometry handles description of points to be rendered in a GfxLayer
	
	// summary:
	//  Sets the point for this geometry.
	// p : {x, y} Object
	//  The point geometry.
	setPoint : function(p) {
		this.coordinates = p;
	},
	
	// summary:
	//   Gets the point defining this geometry.
	// returns: {x, y} Object
	//   The point defining this geometry.
	getPoint : function() {
		return this.coordinates;
	}

});
