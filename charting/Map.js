dojo.provide("dojox.charting.Map");

dojo.require("dojox.gfx");
dojo.require("dojox.charting.map._Feature");
dojo.require("dojox.charting.map._Marker");

dojo.declare("dojox.charting.Map", 
	null, 
	{
	//	summary:
	//		Map widget interacted with charting.
	//	description:
	//		Support rendering Americas, AsiaPacific, ContinentalEurope, EuropeMiddleEastAfrica, 
	//		USStates, WorldCountries, and WorldCountriesMercator by default.
	//	example:
	//	|	var usaMap = new dojox.charting.Map(srcNode, "dojo/dojox/charting/map/map_shape/USStates.json");
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
		
		// get map container coords
		dojo.style(container, "display", "block");
		this.containerSize = {
			x: dojo.coords(container).x,
			y: dojo.coords(container).y,
			w: dojo.coords(container).w || 100,
			h: dojo.coords(container).h || 100
		};
		this.surface = dojox.gfx.createSurface(container, this.containerSize.w, this.containerSize.h);
		this.container = container;
	    
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
	setDataStore:function(/*ItemFileReadStore*/dataStore,/*Object*/query){
		//	summary:
		//		populate data for each map feature from fetched data store
		this.dataStore = dataStore;
		var _this = this;
		this.dataStore.fetch({
			query:query,
			onComplete:function(items){
				var item = items[0];
				var attributes = _this.dataStore.getAttributes(item);
				dojo.forEach(attributes,function(name){
					if(_this.mapObj.features[name]){
						_this.mapObj.features[name].setValue(_this.dataStore.getValue(item,name));
					}
				})
			}
		})
	},
	addSeries:function(series){
		this.series = series;
	},
	_init: function(shapeData){
		//transform map to fit container
		var mapWidth = shapeData.layerExtent[2] - shapeData.layerExtent[0];
		var mapHeight = shapeData.layerExtent[3] - shapeData.layerExtent[1];
		this.mapObj.scale = Math.min(this.containerSize.w / mapWidth, this.containerSize.h / mapHeight);
		this.mapObj.currentScale = this.mapObj.scale;
		this.mapObj.boundBox = shapeData.layerExtent;
		this.mapObj.currentBBox = {x:shapeData.layerExtent[0],y:shapeData.layerExtent[1]};
		this.mapObj.setTransform([dojox.gfx.matrix.scale(this.mapObj.scale), dojox.gfx.matrix.translate(-shapeData.layerExtent[0], -shapeData.layerExtent[1])]);
		dojo.forEach(shapeData.featureNames,function(item){
			var featureShape = shapeData.features[item]

			featureShape.bbox.x = featureShape.bbox[0];
			featureShape.bbox.y = featureShape.bbox[1];
			featureShape.bbox.w = featureShape.bbox[2];
			featureShape.bbox.h = featureShape.bbox[3];
			
			var feature = new dojox.charting.map._Feature(this, item, featureShape);
			feature.init();
			this.mapObj.features[item] = feature;
		},this)

		this.mapObj.marker = new dojox.charting.map._Marker({}, this);
	},
	_appendMarker: function(markerData){
		this.mapObj.marker = new dojox.charting.map._Marker(markerData, this);
	},
	_createZoomingCursor:function(){
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


