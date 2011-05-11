
define(["dojox/geo/openlayers/Geometry" ], function(geometryArg){

	return dojo.declare("dojox.geo.openlayers.Point", dojox.geo.openlayers.Geometry, {
		// summary:
		//   A Point geometry handles description of points to be rendered in a GfxLayer

		// summary:
		//  Sets the point for this geometry.
		// p : {x, y} Object
		//  The point geometry.
		setPoint : function(p){
			this.coordinates = p;
		},

		// summary:
		//   Gets the point defining this geometry.
		// returns: {x, y} Object
		//   The point defining this geometry.
		getPoint : function(){
			return this.coordinates;
		}
	});
});
