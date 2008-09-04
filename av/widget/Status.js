dojo.provide("dojox.av.widget.Status");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.declare("dojox.av.widget.Status", [dijit._Widget, dijit._Templated], {
	
	// playerId: String
	//	The dijit id of the player component to control
	playerId:"",
	templatePath: dojo.moduleUrl("dojox.av.widget","resources/Status.html"),
	postCreate: function(){
	},
	
	setMedia: function(med){
		this.media = med;
		dojo.connect(this.media, "onMetaData", this, function(data){
			this.duration = data.duration;
			this.durNode.innerHTML = this.toSeconds(this.duration);
		});
		dojo.connect(this.media, "onPosition", this, function(time){
			this.timeNode.innerHTML = this.toSeconds(time);													  
		});
		
		var cons = ["onMetaData", "onPosition", "onStart", "onPlay", "onPause", "onStop", "onEnd", "onError", "onLoad"];
		dojo.forEach(cons, function(c){
			dojo.connect(this.media, c, this, c);							
		}, this);
		
	},
	onMetaData: function(data){
		this.duration = data.duration;
		this.durNode.innerHTML = this.toSeconds(this.duration);
		if(this.media.title){
			this.title = this.media.title;	
		}else{
			var a = this.media.mediaUrl.split("/");
			var b = a[a.length-1].split(".")[0];
			this.title = b;
		}
	},
	onPosition:function(time){
		this.timeNode.innerHTML = this.toSeconds(time);													  
	},
	onStart: function(){
		this.setStatus("Starting");
	},
	onPlay: function(){
		this.setStatus("Playing");
	},
	onPause: function(){
		this.setStatus("Paused");
	},
	onStop: function(){
		this.setStatus("Stopped");
	},
	onEnd: function(){
		this.setStatus("Stopped");
	},
	onError: function(evt){
		console.log("status error:", evt)
		var msg = evt.info.code;
		if(msg == "NetStream.Play.StreamNotFound"){
			msg = "Stream Not Found"
		}
		this.setStatus("ERROR: "+ msg, true);
	},
	onLoad: function(){
		this.setStatus("Loading...");
	},
	
	setStatus: function(str, isError){
		if(isError){
			dojo.addClass(this.titleNode, "statusError");		
		}else{
			dojo.removeClass(this.titleNode, "statusError");
		}
		this.titleNode.innerHTML = this.title+" "+str;
	},
	
	toSeconds: function(time){
		ts = time.toString()

		if(ts.indexOf(".")<0){
			ts += ".00"
		}else if(ts.length - ts.indexOf(".")==2){
			ts+="0"
		}else if(ts.length - ts.indexOf(".")>2){
			ts = ts.substring(0, ts.indexOf(".")+3)
		}
		return ts;
	}
	
});
