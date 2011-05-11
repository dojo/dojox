
define(["dojox/geo/openlayers/Geometry" ], function(geometryArg){
	return dojo.declare("dojox.geo.openlayers.LineString", dojox.geo.openlayers.Geometry, {
		// summary:
		//   The `dojox.geo.openlayers.LineString` geometry. This geometry holds an array
		// of coordinates.

		// summary:
		//   Sets the points for this geometry.
		// p : Array
		//   An array of {x, y} objects
		setPoints : function(p){
			this.coordinates = p;
		},

		// summary:
		//  Gets the points of this geometry.
		// returns: Array
		//  The points of this geometry.
		getPoints : function(){
			return this.coordinates;
		}

	});
});
