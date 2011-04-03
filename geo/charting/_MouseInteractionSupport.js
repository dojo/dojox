dojo.provide("dojox.geo.charting._MouseInteractionSupport");

dojo.declare("dojox.geo.charting._MouseInteractionSupport", null, {
	// summary: 
	//   class to handle mouse interactions on a dojox.geo.charting.Map widget
	// tags:
	//   private
	
	_map : null,
	_mapClickLocation : null,
	_screenClickLocation: null,
	_mouseDragListener: null,
	_mouseUpListener: null,
	_currentFeature: null,
	_cancelMouseClick: null,

	constructor : function(/* Map */map) {
		// summary: 
		//   Constructs a new _MouseInteractionSupport instance
		// map: dojox.geo.charting.Map
		//   the Map widget this class provides touch navigation for.
		this._map = map;
		this._mapClickLocation = {x: 0,y: 0};
		this._screenClickLocation = {x: 0,y: 0};
		this._cancelMouseClick = false;
		// install mouse listeners
		this._map.surface.connect("onmousemove", this, this._mouseMoveHandler);
		this._map.surface.connect("onmousedown", this, this._mouseDownHandler);
//		this._map.surface.connect("ondblclick", this, this._mouseDoubleClickHandler);
		var wheelEventName = !dojo.isMozilla ? "onmousewheel" : "DOMMouseScroll";
		this._map.surface.connect(wheelEventName, this, this._mouseWheelHandler);
		
		if (dojo.isIE) {
			dojo.connect(dojo.doc,"ondragstart",this,dojo.stopEvent);
			dojo.connect(dojo.doc,"onselectstart",this,dojo.stopEvent);			
		}
	},
	
	_mouseDoubleClickHandler: function(mouseEvent) {
		dojo.stopEvent(mouseEvent);

		
//		// event coords within component
//		var offX = mouseEvent.pageX - this._map.containerBounds.x,
//			offY = mouseEvent.pageY - this._map.containerBounds.y;
//		
//		// clicked map point before zooming
//		var mapPoint = this._map.screenCoordsToMapCoords(offX,offY);
//
//		// zoom increment power
//		this._map.setMapCenterAndScale(mapPoint.x, mapPoint.y,this._map.getMapScale()*2);
		
		var feature = this._getFeatureFromMouseEvent(mouseEvent);
		if (feature) {
			this._map.fitToMapArea(feature._bbox, 15, true);
		}
		
	},
	
	_mouseClickHandler: function(mouseEvent) {
		// summary: 
		//   action performed on the map when a mouse click was performed
		// mouseEvent: the mouse event
		// tags:
		//   private
		dojo.stopEvent(mouseEvent);
		var feature = this._getFeatureFromMouseEvent(mouseEvent);
		
		if (feature) {
			// call feature handler
			feature._onclickHandler(mouseEvent);
		}
			
	},
	
	_mouseDownHandler: function(mouseEvent){
		// summary: 
		//   action performed on the map when a mouse down was performed
		// mouseEvent: the mouse event
		// tags:
		//   private
		dojo.stopEvent(mouseEvent);
		

		// set various status parameters
		this._cancelMouseClick = false;
		this._screenClickLocation.x =  mouseEvent.pageX;
		this._screenClickLocation.y =  mouseEvent.pageY;

		// store map location where mouse down occurred
		var containerBounds = this._map._getContainerBounds();
		var offX = mouseEvent.pageX - containerBounds.x,
			offY = mouseEvent.pageY - containerBounds.y;
		var mapPoint = this._map.screenCoordsToMapCoords(offX,offY);
		this._mapClickLocation.x = mapPoint.x;
		this._mapClickLocation.y = mapPoint.y;
		
		// install drag and up listeners
		if (!dojo.isIE) {
			this._mouseDragListener = dojo.connect(dojo.doc,"onmousemove",this,this._mouseDragHandler);
			this._mouseUpListener = dojo.connect(dojo.doc,"onmouseup",this, this._mouseUpHandler);
		} else {
			var node = dojo.byId(this._map.container);
			this._mouseDragListener = dojo.connect(node,"onmousemove",this,this._mouseDragHandler);
			this._mouseUpListener = dojo.connect(node,"onmouseup",this, this._mouseUpHandler);
			node.setCapture(); 
		}

	},
	
	_mouseUpHandler: function(mouseEvent) {
		// summary: 
		//   action performed on the map when a mouse up was performed
		// mouseEvent: the mouse event
		// tags:
		//   private
		
		this._map.mapObj.marker._needTooltipRefresh = true;
		
		if (!this._cancelMouseClick) {
			// execute mouse click handler
			this._mouseClickHandler(mouseEvent);
		}
		this._cancelMouseClick = false;
		
		// disconnect listeners
		if (this._mouseDragListener) {
			dojo.disconnect(this._mouseDragListener);
			this._mouseDragListener = null;
		}
		if (this._mouseUpListener) {
			dojo.disconnect(this._mouseUpListener);
			this._mouseUpListener = null;
		}
		
		if (dojo.isIE) {
			dojo.byId(this._map.container).releaseCapture();
		}
	},
	
	_getFeatureFromMouseEvent: function(mouseEvent) {
		// summary: 
		//   utility function to return the feature located at this mouse event location
		// mouseEvent: the mouse event
		// returns: dojox.geo.charting._Feature
		//   the feature found if any, null otherwise.
		// tags:
		//   private
		var shapeID = mouseEvent.target.parentNode.id;
		return this._map.mapObj.features[shapeID];		
	},
	
	_mouseMoveHandler: function(mouseEvent) {
		// summary: 
		//   action performed on the map when a mouse move was performed
		// mouseEvent: the mouse event
		// tags:
		//   private
		

		
		// do nothing more if dragging
		if (this._mouseDragListener) {
			return;
		}
		
		// hover and highlight
		var feature = this._getFeatureFromMouseEvent(mouseEvent);

		// set/unset highlight
		if (feature != this._currentFeature) {
			if (this._currentFeature) {
				// mouse leaving component
				this._currentFeature._onmouseoutHandler();
			}
			this._currentFeature = feature;
			
			if (feature)
				feature._onmouseoverHandler();
		}

		if (feature)
			feature._onmousemoveHandler(mouseEvent);
	},

	
	_mouseDragHandler: function(mouseEvent){
		// summary: 
		//   action performed on the map when a mouse drag was performed
		// mouseEvent: the mouse event
		// tags:
		//   private
		
		// prevent browser interaction
		dojo.stopEvent(mouseEvent);
		
		
		// find out if this the movement discards the "mouse click" gesture
		var dx = Math.abs(mouseEvent.pageX - this._screenClickLocation.x);
		var dy = Math.abs(mouseEvent.pageY - this._screenClickLocation.y);
		if (!this._cancelMouseClick && (dx > 1 || dy > 1)) {
			// cancel mouse click
			this._cancelMouseClick = true;
			this._map.mapObj.marker.hide();
		}

		var cBounds = this._map._getContainerBounds();
		var offX = mouseEvent.pageX - cBounds.x,
		offY = mouseEvent.pageY - cBounds.y;
		
		// compute map offset
		var mapPoint = this._map.screenCoordsToMapCoords(offX,offY);
		var mapOffsetX = mapPoint.x - this._mapClickLocation.x;
		var mapOffsetY = mapPoint.y - this._mapClickLocation.y;

		// adjust map center
		var currentMapCenter = this._map.getMapCenter();
		this._map.setMapCenter(currentMapCenter.x - mapOffsetX, currentMapCenter.y - mapOffsetY);
		
	},
	
	_mouseWheelHandler: function(mouseEvent) {
		// summary: 
		//   action performed on the map when a mouse wheel up/down was performed
		// mouseEvent: the mouse event
		// tags:
		//   private
		

		// prevent browser interaction
		dojo.stopEvent(mouseEvent);
		
		// hide tooltip
		this._map.mapObj.marker.hide();
		
		// event coords within component
		var containerBounds = this._map._getContainerBounds();
		var offX = mouseEvent.pageX - containerBounds.x,
			offY = mouseEvent.pageY - containerBounds.y;
		
		// current map point before zooming
		var invariantMapPoint = this._map.screenCoordsToMapCoords(offX,offY);

		// zoom increment power
		var power  = mouseEvent[(dojo.isMozilla ? "detail" : "wheelDelta")] / (dojo.isMozilla ? - 3 : 120) ;
		var scaleFactor = Math.pow(1.2,power);
		this._map.setMapScaleAt(this._map.getMapScale()*scaleFactor ,invariantMapPoint.x,invariantMapPoint.y,false);
		this._map.mapObj.marker._needTooltipRefresh = true;
		
	}
});
