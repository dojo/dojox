dojo.provide("dojox.geo.charting.Map");

dojo.require("dojox.gfx");
dojo.require("dojox.geo.charting._base");
dojo.require("dojox.geo.charting._Feature");
dojo.require("dojox.geo.charting._Marker");
dojo.require("dojox.geo.charting._MouseInteractionSupport");
dojo.require("dojox.geo.charting._TouchInteractionSupport");

dojo.declare("dojox.geo.charting.Map", null, {
	//	summary:
	//		Map widget interacted with charting.
	//	description:
	//		Support rendering Americas, AsiaPacific, ContinentalEurope, EuropeMiddleEastAfrica,
	//		USStates, WorldCountries, and WorldCountriesMercator by default.
	//	example:
	//	|	var usaMap = new dojox.geo.charting.Map(srcNode, "dojotoolkit/dojox/geo/charting/resources/data/USStates.json");
	//	|	<div id="map" style="width:600px;height:400px;"></div>
	
	//	defaultColor: String
	//		Default map feature color, e.g: "#B7B7B7"
	defaultColor:"#B7B7B7",
	//	highlightColor: String
	//		Map feature color when mouse over it, e.g: "#"
	highlightColor:"#D5D5D5",
	//	series: Array
	//		stack to data range, e.g: [{name:'label 1', min:20, max:70, color:'#DDDDDD'},{...},...]
	series:[],
	constructor: function(/*HTML Node*/container, /*String*/shapeFile){
		//	container:
		//		map container html node/id
		//	shapeFile:
		//		map shape data url, handled as json style
		//		data format:
		
		dojo.style(container, "display", "block");
		
		this.container = container;
		var containerBounds = this._getContainerBounds();
		// get map container coords
		this.surface = dojox.gfx.createSurface(container, containerBounds.w, containerBounds.h);
		
		this._createZoomingCursor();
		
		this.mapObj = this.surface.createGroup();
		this.mapObj.features = {};
        // load map shape file
		dojo.xhrGet({
			url: shapeFile,
			handleAs: "json",
			sync:true,
			load: dojo.hitch(this, "_init")
		});
		
		if (this._isMobileDevice()) {
			// install touch support
			this._touchInteractionSupport = new dojox.geo.charting._TouchInteractionSupport(this);
		} else {
			// install mouse support
			this._mouseInteractionSupport = new dojox.geo.charting._MouseInteractionSupport(this);
		}

	},
	
	_getContainerBounds: function() {
		// summary: 
		//   returns the bounds {x:, y:, w: ,h:} of the DOM node container in absolute coordinates 
		// tags:
		//   private
		
		var coords = dojo.coords(this.container);
		var marginBox = dojo.marginBox(this.container);
		// use contentBox for correct width and height - surface spans outside border otherwise
		var contentBox = dojo.contentBox(this.container);
		return {
			x: coords.x,
			y:coords.y,
			w: contentBox.w || 100,
			h: contentBox.h || 100
		};
	},
	
	_isMobileDevice: function() {
		// summary: 
		//   tests whether the application is running on a mobile device (android or iOS)
		// tags:
		//   private
		return (dojo.isSafari
				&& (navigator.userAgent.indexOf("iPhone") > -1 ||
					navigator.userAgent.indexOf("iPod") > -1 ||
					navigator.userAgent.indexOf("iPad") > -1
				)) || (navigator.userAgent.toLowerCase().indexOf("android") > -1);
	},
	
	
	setMarkerData: function(/*String*/ markerFile){
		//	summary:
		//		import markers from outside file, associate with map feature by feature id
		//		which identified in map shape file, e.g: "NY":"New York"
		//	markerFile:
		//		outside marker data url, handled as json style.
		//		data format: {"NY":"New York",.....}
		dojo.xhrGet({
			url: markerFile,
			handleAs: "json",
			handle: dojo.hitch(this, "_appendMarker")
		});
	},
	setDataStore: function(/*ItemFileReadStore*/ dataStore, /*Object*/ query){
		//	summary:
		//		populate data for each map feature from fetched data store
		//  dataStore:
		//      the dataStore to fetch the information from
		//  query:
		//      query the query executed when fetching data from the dataStore
		this.dataStore = dataStore;
		var self = this;
		this.dataStore.fetch({
			query: query,
			onComplete: function(items){
				var item = items[0];
				var attributes = self.dataStore.getAttributes(item);
				dojo.forEach(attributes, function(name){
					if(self.mapObj.features[name]){
						self.mapObj.features[name].setValue(self.dataStore.getValue(item, name));
					}
				});
			}
		});
	},
	
	
	addSeries: function(series){
		// summary: 
		//   sets ranges of data values (associated with label, color) to style map data values
		// series:
		//   array of range objects such as : [{name:'label 1', min:20, max:70, color:'#DDDDDD'},{...},...]
		this.series = series;
	},
	
	fitToMapArea: function(/*bbox: {x,y,w,h}*/mapArea,pixelMargin,animate,/* callback function */onAnimationEnd){
		// summary: 
		//   set this component's transformation so that the specified area fits in the component (centered)
		// mapArea: 
		//   the map area that needs to fill the component
		// pixelMargin: int
		//   a margin (in pixels) from the borders of the Map component.
		// animate: boolean
		//   true if the transform change should be animated
		// onAnimationEnd: function
		//   a callback function to be executed when the animation completes (if animate set to true).
		
		if (!pixelMargin) {
			var pixelMargin = 0;
		}
		var width = mapArea.w;
		var height = mapArea.h;
		var containerBounds = this._getContainerBounds();
		var scale = Math.min((containerBounds.w - 2 * pixelMargin) / width,
							(containerBounds.h - 2 * pixelMargin) / height);
		
		this.setMapCenterAndScale(mapArea.x + mapArea.w / 2,mapArea.y + mapArea.h / 2,scale,animate,onAnimationEnd);
	},
	
	fitToMapContents: function(pixelMargin,animate,/* callback function */onAnimationEnd){
		// summary: 
		//   set this component's transformation so that the whole map data fits in the component (centered)
		// pixelMargin: int
		//   a margin (in pixels) from the borders of the Map component.
		// animate: boolean
		//   true if the transform change should be animated
		// onAnimationEnd: function
		//   a callback function to be executed when the animation completes (if animate set to true).
		
		//transform map to fit container
		var bbox = this.mapObj.boundBox;
		this.fitToMapArea(bbox,pixelMargin,animate,onAnimationEnd);
		
	},
	
	setMapCenter: function(centerX,centerY,animate,/* callback function */onAnimationEnd) {
		// summary: 
		//   set this component's transformation so that the map is centered on the specified map coordinates
		// centerX: float
		//   the X coordinate (in map coordinates) of the new center
		// centerY: float
		//   the Y coordinate (in map coordinates) of the new center
		// animate: boolean
		//   true if the transform change should be animated
		// onAnimationEnd: function
		//   a callback function to be executed when the animation completes (if animate set to true).
		
		// call setMapCenterAndScale with current map scale 
		var currentScale = this.getMapScale();
		this.setMapCenterAndScale(centerX,centerY,currentScale,animate,onAnimationEnd);
		
	},
	
	_createAnimation: function(onShape,fromTransform,toTransform,/* callback function */onAnimationEnd) {
		// summary: 
		//   creates a transform animation object (between two transforms) used internally
		// fromTransform: dojox.gfx.matrix.Matrix2D
		//   the start transformation (when animation begins)
		// toTransform: dojox.gfx.matrix.Matrix2D
		//   the end transormation (when animation ends)
		// onAnimationEnd: function
		//   callback function to be executed when the animation completes.
		var anim = dojox.gfx.fx.animateTransform({
			duration: 1000,
			shape: onShape,
			transform: [{
				name: "translate",
				start: [fromTransform.dx,fromTransform.dy],
				end: [toTransform.dx, toTransform.dy]
			},
			{
				name: "scale",
				start: [fromTransform.xx],
				end: [toTransform.xx]
			}
			]
		});
		
		//install callback
		var listener = dojo.connect(anim,"onEnd",this,function(event){
			onAnimationEnd(event);
			dojo.disconnect(listener);
		});
		
		return anim;
	},

	
	setMapCenterAndScale: function(centerX,centerY,scale, animate,/* callback function */onAnimationEnd) {
		
		// summary: 
		//   set this component's transformation so that the map is centered on the specified map coordinates
		//   and scaled to the specified scale.
		// centerX: float
		//   the X coordinate (in map coordinates) of the new center
		// centerY: float
		//   the Y coordinate (in map coordinates) of the new center
		// scale: float
		//   the scale of the map
		// animate: boolean
		//   true if the transform change should be animated
		// onAnimationEnd: function
		//   a callback function to be executed when the animation completes (if animate set to true).
		
		
		// compute matrix parameters
		var bbox = this.mapObj.boundBox;
		var containerBounds = this._getContainerBounds();
		var offsetX = containerBounds.w/2 - scale * (centerX - bbox.x);
		var offsetY = containerBounds.h/2 - scale * (centerY - bbox.y);
		var newTransform = new dojox.gfx.matrix.Matrix2D({xx: scale, yy: scale, dx:offsetX, dy:offsetY});
		
		
		var currentTransform = this.mapObj.getTransform();
		
		// can animate only if specified AND curentTransform exists
		if (!animate || !currentTransform) {
			this.mapObj.setTransform(newTransform);
		} else {
			var anim = this._createAnimation(this.mapObj,currentTransform,newTransform,onAnimationEnd);
			anim.play();
		}
	},
	
	getMapCenter: function() {
		// summary: 
		//   returns the map coordinates of the center of this Map component.
		// returns: {x:,y:}
		//   the center in map coordinates
		var containerBounds = this._getContainerBounds();
		return this.screenCoordsToMapCoords(containerBounds.w/2,containerBounds.h/2);
	},
	
	setMapScale: function(scale,animate,/* callback function */onAnimationEnd) {
		// summary: 
		//   set this component's transformation so that the map is scaled to the specified scale.
		// animate: boolean
		//   true if the transform change should be animated
		// onAnimationEnd: function
		//   a callback function to be executed when the animation completes (if animate set to true).
		
		
		// default invariant is map center
		var containerBounds = this._getContainerBounds();
		invariantMapPoint = this.screenCoordsToMapCoords(containerBounds.w/2,containerBounds.h/2);
		this.setMapScaleAt(scale,invariantMapPoint.x,invariantMapPoint.y,animate,onAnimationEnd);
	},
	
	setMapScaleAt: function(scale,fixedMapX,fixedMapY,animate,/* callback function */onAnimationEnd) {
		// summary: 
	    //   set this component's transformation so that the map is scaled to the specified scale, and the specified 
		//   point (in map coordinates) stays fixed on this Map component
		// fixedMapX: float
		//   the X coordinate (in map coordinates) of the fixed screen point
		// fixedMapY: float
		//   the Y coordinate (in map coordinates) of the fixed screen point
		// animate: boolean
		//   true if the transform change should be animated
		// onAnimationEnd: function
		//   a callback function to be executed when the animation completes (if animate set to true).
		
		
		var invariantMapPoint = null;
		var invariantScreenPoint = null;

		invariantMapPoint = {x: fixedMapX, y: fixedMapY};
		invariantScreenPoint = this.mapCoordsToScreenCoords(invariantMapPoint.x,invariantMapPoint.y);
		
		// compute matrix parameters
		var bbox = this.mapObj.boundBox;
		var offsetX = invariantScreenPoint.x - scale * (invariantMapPoint.x - bbox.x);
		var offsetY = invariantScreenPoint.y - scale * (invariantMapPoint.y - bbox.y);
		var newTransform = new dojox.gfx.matrix.Matrix2D({xx: scale, yy: scale, dx:offsetX, dy:offsetY});

		var currentTransform = this.mapObj.getTransform();

		// can animate only if specified AND curentTransform exists
		if (!animate || !currentTransform) {
			this.mapObj.setTransform(newTransform);
		} else {
			var anim = this._createAnimation(this.mapObj,currentTransform,newTransform,onAnimationEnd);
			anim.play();
		}
	},
	
	getMapScale: function() {
		// summary: 
		//   returns the scale of this Map component.
		// returns: float
		//   the scale
		var mat = this.mapObj.getTransform();
		var scale = mat?mat.xx:1.0;
		return scale;
	},
	
	mapCoordsToScreenCoords: function(mapX,mapY) {
		// summary: 
		//   converts map coordinates to screen coordinates given the current transform of this Map component
		// returns: {x:,y:}
		//   the screen coordinates correspondig to the specified map coordinates.
		var matrix = this.mapObj.getTransform();
		var screenPoint = dojox.gfx.matrix.multiplyPoint(matrix, mapX, mapY);
		return screenPoint;
	},
	
	screenCoordsToMapCoords: function(screenX, screenY) {
		// summary: 
		//   converts screen coordinates to map coordinates given the current transform of this Map component
		// returns: {x:,y:}
		//   the map coordinates corresponding to the specified screen coordinates.
		var invMatrix = dojox.gfx.matrix.invert(this.mapObj.getTransform());
		var mapPoint = dojox.gfx.matrix.multiplyPoint(invMatrix, screenX, screenY);
		return mapPoint;
	},
	
	
	_init: function(shapeData){
		
		// summary: 
		//   inits this Map component.
		
		//transform map to fit container
		this.mapObj.boundBox = {x: shapeData.layerExtent[0],
								y: shapeData.layerExtent[1],
								w: (shapeData.layerExtent[2] - shapeData.layerExtent[0]),
								h: shapeData.layerExtent[3] - shapeData.layerExtent[1]};
		this.fitToMapContents(3);


		//	if there are "features", then implement them now.
		dojo.forEach(shapeData.featureNames, function(item){
			var featureShape = shapeData.features[item];
			featureShape.bbox.x = featureShape.bbox[0];
			featureShape.bbox.y = featureShape.bbox[1];
			featureShape.bbox.w = featureShape.bbox[2];
			featureShape.bbox.h = featureShape.bbox[3];
			var feature = new dojox.geo.charting._Feature(this, item, featureShape);
			feature.init();
			this.mapObj.features[item] = feature;
		}, this);
		

		//	set up a marker.
		this.mapObj.marker = new dojox.geo.charting._Marker({}, this);
	},
	_appendMarker: function(markerData){
		this.mapObj.marker = new dojox.geo.charting._Marker(markerData, this);
	},
	_createZoomingCursor: function(){
		if(!dojo.byId("mapZoomCursor")){
			var mapZoomCursor = dojo.doc.createElement("div");
			dojo.attr(mapZoomCursor,"id","mapZoomCursor");
			dojo.addClass(mapZoomCursor,"mapZoomIn");
			dojo.style(mapZoomCursor,"display","none");
			dojo.body().appendChild(mapZoomCursor);
		}
	},
	onFeatureClick: function(feature){
	},
	onFeatureOver: function(feature){
	},
	onZoomEnd:function(feature){
	}
});
