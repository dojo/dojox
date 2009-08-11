dojo.provide("dojox.sketch.Slider");

dojo.require("dijit.form.HorizontalSlider");

dojo.declare("dojox.sketch.Slider",dojox.sketch._Plugin,{
	_initButton: function(){
		this.slider=new dijit.form.HorizontalSlider({minimum:10,maximum:200,style:"width:200px;float:right"});
		this.slider._movable.node.title='Double Click to "Zoom to Fit"'; //I18N
		this.connect(this.slider,'onChange','_setZoom');
		this.connect(this.slider.sliderHandle,'ondblclick','_zoomToFit');
	},
	_zoomToFit: function(){
		var r=this.figure.getFit();
		this.slider.attr('value',this.slider.maximum<r?this.slider.maximum:(this.slider.minimum>r?this.slider.minimum:r));
	},
	_setZoom: function(v){
		if(v && this.figure){
			this.figure.zoom(v);
		}
	},
	reset: function(){
		//reset slider to NaN so that onChange will be fired no matter what value is set in _zoomToFit
		this.slider.attr('value',NaN);
		this._zoomToFit();
	},
	setToolbar: function(t){
		t.addChild(this.slider);
		if(!t._reset2Zoom){
			t._reset2Zoom=true;
			this.connect(t,'reset','reset');
			if(t.figure && t.figure.surface){
				//already loaded, do a _zoomToFit
				this._zoomToFit();
			}
		}
	}
});

dojox.sketch.registerTool("Slider", dojox.sketch.Slider);
