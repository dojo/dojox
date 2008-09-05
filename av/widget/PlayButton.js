dojo.provide("dojox.av.widget.PlayButton");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit.form.Button");

dojo.declare("dojox.av.widget.PlayButton", [dijit._Widget, dijit._Templated], {
	
	// playerId: String
	//	The dijit id of the player component to control
	type:"play",
	widgetsInTemplate:false,
	templatePath: dojo.moduleUrl("dojox.av.widget","resources/PlayButton.html"),
	postCreate: function(){
			
		console.log("PLAY BUTTON CREATED");
		this.showPlay();
	},
	
	setMedia: function(med){
		this.media = med;
		dojo.connect(this.media, "onEnd", this, "showPlay");
		dojo.connect(this.media, "onStart", this, "showPause");
	},
	
	onClick: function(){
		if(this.mode=="play"){
			this.onPlay();	
		}else{
			this.onPause();
		}
	},
	
	onPlay: function(){
		if(this.media){
			this.media.play();
		}
		this.showPause();
	},
	onPause: function(){
		if(this.media){
			this.media.pause();
		}
		this.showPlay();
	},
	showPlay: function(){
		this.mode = "play";
		dojo.removeClass(this.domNode, "Pause");
		dojo.addClass(this.domNode, "Play");
	},
	showPause: function(){
		this.mode = "pause";
		dojo.addClass(this.domNode, "Pause");
		dojo.removeClass(this.domNode, "Play");
	}
});
