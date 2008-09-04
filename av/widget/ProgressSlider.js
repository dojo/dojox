dojo.provide("dojox.av.widget.ProgressSlider");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.declare("dojox.av.widget.ProgressSlider", [dijit._Widget, dijit._Templated], {
	
	// playerId: String
	//	The dijit id of the player component to control
	playerId:"",
	type:"volume",
	widgetsInTemplate:false,
	templatePath: dojo.moduleUrl("dojox.av.widget","resources/ProgressSlider.html"),
	postCreate: function(){

		this.seeking = false;
		this.handleWidth = dojo.marginBox(this.handle).w;
		var dim = dojo.coords(this.domNode);
		this.width = dim.w-this.handleWidth;
		this.x = dim.x;
		
		dojo.setSelectable(this.domNode, false);
			console.log("ProgressSlider BUTTON CREATED W:", this.width, "X:", this.x, "handleWidth:", this.handleWidth);
	},
	setMedia: function(med){
		this.media = med;
		dojo.connect(this.media, "onMetaData", this, function(data){
			if(data && data.duration){
				this.duration = data.duration;
			}
		});
		dojo.connect(this.media, "onEnd", this,  function(){
			dojo.disconnect(this.posCon);
			console.warn("onEnd SetSlider");
			this.setHandle(this.duration);
		});
		dojo.connect(this.media, "onStart", this, function(){
			this.posCon = dojo.connect(this.media, "onPosition", this, "setHandle");												
		});
	},
	onDrag: function(evt){
		var x = evt.clientX - this.x;
		if(x<0) x = 0;
		if(x>this.width) x=this.width;
		
		console.log(evt.clientX);
		
		var p = x/this.width;
		//this.media.seek( durNode.value * p );
		dojo.style(this.handle, "marginLeft", x+"px");
		dojo.style(this.progressPosition, "width", x+"px");
	},
	startDrag: function(){
		console.log("startDrag")
		this.seeking = true;
		this.cmove = dojo.connect(dojo.doc, "mousemove", this, "onDrag");
		this.cup = dojo.connect(dojo.doc, "mouseup", this, "endDrag");
	},
	endDrag: function(){
		this.seeking = false;
		if(this.cmove) dojo.disconnect(this.cmove);
		if(this.cup) dojo.disconnect(this.cup);
		this.handleOut();
	},
	
	setHandle: function(time){
		if(!this.seeking){
			var w = this.width;
			var p = time/this.duration;
			var x = p*w;
			//console.log("w:", this.width, "x:", x, "hw:",this.handleWidth, p); 
			dojo.style(this.handle, "marginLeft", x+"px");
			dojo.style(this.progressPosition, "width", x+"px");
		}
	},
	handleOver: function(){
		dojo.addClass(this.handle, "over");
	},
	handleOut: function(){
		if(!this.seeking){
			dojo.removeClass(this.handle, "over");	
		}
	},
	onResize: function(playerDimensions){
		console.log("ProgSlid RESIZE", this.media.isStopped)
		var dim = dojo.coords(this.domNode);
		this.width = dim.w-this.handleWidth;
		if(this.media.isStopped){
			this.setHandle(this.duration);
		}
	},
	onClick: function(){
		console.log("ProgressSlider BUTTON CLICKED");
		
	}
	
});
