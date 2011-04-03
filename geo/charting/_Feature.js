dojo.provide("dojox.geo.charting._Feature");
dojo.require("dojox.gfx.fx");

dojo.declare("dojox.geo.charting._Feature", null, {
	// summary: 
	//   class to encapsulate a map element.
	// tags:
	//   private

	_isZoomIn: false,
	_isSelected: false,
	markerText:null,

	constructor: function(parent, name, shapeData){
		this.id = name;
		this.shape = parent.mapObj.createGroup();
		this.parent = parent;
		this.mapObj = parent.mapObj;
		this._bbox = shapeData.bbox;
		//TODO: fill color would be defined by charting data and legend
		//this._defaultFill = ["#FFCE52", "#CE6342", "#63A584"][Math.floor(Math.random() * 3)];
		this._defaultFill = parent.defaultColor;
		this._highlightFill = parent.highlightColor;
		this._defaultStroke = {
			width: this._normalizeStrokeWeight(.5),
			color: "white"
		};
		
		var shapes = (dojo.isArray(shapeData.shape[0])) ? shapeData.shape : [shapeData.shape];
		dojo.forEach(shapes, function(points){
			this.shape.createPolyline(points).setStroke(this._defaultStroke).setFill(this._defaultFill);
		}, this);
	},
	setValue:function(value){
		this.value = value;
		if(this.parent.series.length != 0){
			for(var i = 0;i < this.parent.series.length;i++){
				var range = this.parent.series[i];
				if((value>=range.min)&&(value<range.max)){
					this._setFillWith(range.color);
					this._defaultFill = range.color;
				}
			}
		}
	},
	_setFillWith: function(color){
		var borders = (dojo.isArray(this.shape.children)) ? this.shape.children : [this.shape.children];
		dojo.forEach(borders, function(item){
			item.setFill(color);
		});
	},
	_setStrokeWith: function(stroke){
		var borders = (dojo.isArray(this.shape.children)) ? this.shape.children : [this.shape.children];
		dojo.forEach(borders, function(item){
			item.setStroke({
				color: stroke.color,
				width: stroke.width,
				join: "round"
			});
		});
	},
	_normalizeStrokeWeight: function(weight){
		var matrix = this.shape._getRealMatrix();
		return (dojox.gfx.renderer != "vml")?weight/(this.shape._getRealMatrix()||{xx:1}).xx:weight;
	},
	_onmouseoverHandler: function(evt){
		this.parent.onFeatureOver(this);
		this._setFillWith(this._highlightFill);
		this.mapObj.marker.show(this.id);
	},
	_onmouseoutHandler: function(){
		this._setFillWith(this._defaultFill);
		this.mapObj.marker.hide();
		dojo.style("mapZoomCursor", "display", "none");
	},
	_onmousemoveHandler: function(evt){
		if (this.mapObj.marker._needTooltipRefresh)
			this.mapObj.marker.show(this.id);
		if(this._isSelected){
			var evt = dojo.fixEvent(evt || window.event);
			dojo.style("mapZoomCursor", "left", evt.pageX + 12 + "px");
			dojo.style("mapZoomCursor", "top", evt.pageY + "px");
			dojo.byId("mapZoomCursor").className = (this._isZoomIn)?"mapZoomOut":"mapZoomIn";
			dojo.style("mapZoomCursor", "display", "block");
		}
	},
	_onclickHandler: function(evt){
		this.parent.onFeatureClick(this);
		if(!this._isSelected){
			for (var name in this.mapObj.features){
				this.mapObj.features[name].select(false);
			}
			this.select(true);
			this._onmousemoveHandler(evt);
		}
		else if (this._isZoomIn){
			this._zoomOut();
		}
		else {
			this._zoomIn();
		}

	},
	
	select: function(selected) {
		if (selected) {
			this.shape._moveToFront();
			this._setStrokeWith({color:"black",width:this._normalizeStrokeWeight(2)});
			this._setFillWith(this._highlightFill);
			this._isSelected = true;
		} else {
			this._setStrokeWith(this._defaultStroke);
			this._setFillWith(this._defaultFill);
			this._isSelected = false;
			this._isZoomIn = false;
		}
	},
	
	_zoomIn: function(){
		var marker = this.mapObj.marker;
		marker.hide();
		this.parent.fitToMapArea(this._bbox, 15,true,dojo.hitch(this,function(){
			this._setStrokeWith({color:"black",width:this._normalizeStrokeWeight(2)});
			marker._needTooltipRefresh = true;
			this.parent.onZoomEnd(this);
		}));
		this._isZoomIn = true;
		dojo.byId("mapZoomCursor").className = "";
	},
	_zoomOut: function(){
		var marker = this.mapObj.marker;
		marker.hide();
		this.parent.fitToMapContents(3,true,dojo.hitch(this,function(){
			this._setStrokeWith({color:"black",width:this._normalizeStrokeWeight(2)});
			marker._needTooltipRefresh = true;
			this.parent.onZoomEnd(this);
		}));
		this._isZoomIn = false;
		dojo.byId("mapZoomCursor").className = "";
	},
	
	init: function(){
		if (this.shape.rawNode)
			this.shape.rawNode.id = this.id;
		this.tooltip = null;
	}
});
