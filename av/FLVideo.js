dojo.provide("dojox.av.FLVideo");
dojo.experimental("dojox.av.FLVideo");
dojo.require("dijit._Widget");
dojo.require("dojox.embed.Flash");
dojo.require("dojox.av.mediaStatus");

dojo.declare("dojox.av.FLVideo", [dijit._Widget, dojox.av.mediaStatus], {
			 
	// summary
	//		Inserts one or more Flash FLV videos into the HTML page and provides methods
	//		and events for controlling the video. Also plays the H264/M4V codec with a 
	//		little trickery: change the ".M4V" extension to ".flv".
	//
	// USAGE:
	//
	//		markup:
	//			<div id="vid" initialVolume=".7", mediaUrl="../resources/Grog.flv" dojoType="dojox.av.FLVideo"></div>
	//		programmatic:
	//			new dojox.av.FLVideo({initialVolume:.7, mediaUrl:"../resources/Grog.flv"}, "vid");
	//
	// arguments:
	//
	//  mediaUrl /* String */
	// 		REQUIRED: The Url of the video file that will be played. 
	//		NOTE: Must be either an absolute URL or relative to the HTML file. Relative
	//		paths will be converted to abslute paths
	mediaUrl:"",
	//
	// initialVolume /* Float */
	//		The initial volume setting of the player. Acccepts between 0 and 1.
	initialVolume:1,
	//
	//  autoPlay: /* Boolean */
	//		Whether the video plays on load or not.
	autoPlay: false,
	//
	// updateTime: /* Number */,
	//		How often, in milliseconds to get an update of the vide position
	updateTime: 100,
	//
	//  id /* String */
	//		The id of this widget and the id of the SWF movie.
	id:"",
	//
	// isDebug /* Boolean */
	//		Setting to true tells the SWF to output log messages to Firebug
	isDebug: false,
	//
	// private vars
	//
	// statusReturnTime: how often status is figured
	statusReturnTime: 200, // NOTE: Too small of a time will toggle between play and pause
	//
	// domNode: The node that holds the SWF's embed/object tag
	domNode:null,
	//
	// _flashObject: the dojox.embed object
	_flashObject:null,
	//
	// _flashMovie: the SWF object. Methods are passed to this.
	_flashMovie:null,
	//
	// _swfPath: The path to the video player SWF resource
	_swfPath: dojo.moduleUrl("dojox.av", "resources/video.swf"),
	//
	//
	postMixInProperties: function(){
		console.log("Flash version detected:", dojox.embed.Flash.available);
		
		this._subs = [];
		this._cons = [];
		this.mediaUrl = this._normalizeUrl(this.mediaUrl);
		this.initialVolume = this._normalizeVolume(this.initialVolume);	
	},
	
	postCreate: function(){
		var args = {
			path:this._swfPath.uri,
			width:"100%",
			height:"100%",
			params:{
				allowFullScreen:true
			},
			// only pass in simple variables - no deep objects
			vars:{
				videoUrl:this.mediaUrl, 
				id:this.id,
				autoPlay:this.autoPlay,
				volume:this.initialVolume,
				isDebug:this.isDebug
			}
		};
		
		// Setting up dojo.subscribes that listens to events
		//	from the player
		this._sub("stageClick",  "onClick");
		this._sub("stageSized",  "onSwfSized");
		//this._sub("mediaStatus", "onStatus");
		this._sub("mediaMeta",   "onMetaData");
		this._sub("mediaError",  "onError");
		this._sub("mediaStart",  "onStart");
		this._sub("mediaEnd",    "onEnd");
	
		this._flashObject = new dojox.embed.Flash(args, this.domNode);
		this._flashObject.onLoad = dojo.hitch(this, "onLoad");
	},
	
	//  =============================  //
	//  Methods to control the player  //
	//  =============================  //
	
	togglePause: function(){
		// DEPRECATED
		// Toggles between play and pause
		console.log("TOGGLE")
		this._flashMovie.togglePause();
	},
	
	play: function(newUrl /* Optional */){
		// Plays the video. If an url is passed in, plays the new link.
		this.isPlaying = true;
		this.isStopped = false;
		this._flashMovie.doPlay(this._normalizeUrl(newUrl));
	},
	
	pause: function(){
		// Pauses the video
		this.isPlaying = false;
		this.isStopped = false;
		this.onPause();
		this._flashMovie.pause();
	},
	
	seek: function(time /* Float */){
		// Goes to the time passed in the argument
		console.log("seek:", time)
		this._flashMovie.seek(time);
	},
	
	
	//  =====================  //
	//  Player Getter/Setters  //
	//  =====================  //
	
	volume: function(vol){
		//	Sets the volume of the video to the time in the
		//	argument - between 0 - 1.
		if(vol){
			if(!this._flashMovie) {
				this.initialVolume = vol;	
			}
			this._flashMovie.setVolume(this._normalizeVolume(vol));
		}
		if(!this._flashMovie) {
			return this.initialVolume;
		}
		return this._flashMovie.getVolume();	
	},
	
	/*
	
	Due to security restriction, fullscreen can't be trigger without
	a Flash button click. Will probably add a FS button to the player somehow.
	
	fullscreen: function(){
		// Sets the video to fullscreen.
		// Usually fullscreen players include UI controls that will go
		// fullscreen along with the video. Since the HTML UI will not 
		// show during fullscreen, the escape button will have to be
		// relied upon to leave fullscreen mode. 
		this._flashMovie.fullscreen();
	},*/
	
	//  ==============  //
	//  Player Getters  //
	//  ==============  //
	
	getTime: function(){
		// Returns the current time of the video
		return this._flashMovie.getTime();
	},
	
	getLoaded: function(){
		// Returns status of load
		return this._flashMovie.getLoaded();
	},
	
	//  =============  //
	//  Player Events  //
	//  =============  //
	
	
	onLoad: function(mov){
		// Fired when the SWF player has loaded
		// NOT when the video has loaded
		this._flashMovie = mov;
		this.isPlaying = false;
		this.isStopped = true;
		this._initStatus();
		this._updatePosition();
	},
	onClick: function(evt){ //FIXME: Return x/y of click
		// Fires when the player is clicked
		// Could be used to toggle play/pause, or 
		// do an external activity, like opening a new
		//window.
		console.log("CLICK")
	},
	onSwfSized: function(data){
		// Fired on SWF resize, or when its
		// toggled between fullscreen.
		//console.warn("onSwfSized:", data);
	},
	onMetaData: function(data, evt){
		// Returns the video properties. Width, height, duration, etc.
		// NOTE: if data is empty, this is an older FLV with no meta data.
		// Duration cannot be determined. In original FLVs, duration could
		// only be obtained with Flash Media Server.
		// TODO: Older FLVs can still return width and height
		console.warn("META:", data, evt);
	},
	
	
	onPosition: function(time){
		//console.log("POS:", time)
	},
	
	onStart: function(data){
		// Fires when video starts
		// Good for setting the play button to pause
		// during an autoPlay for example
		console.warn("onStart:", data);
	},
	
	onPlay: function(data){
		// Fires when video starts and resumes
	},
	
	onPause: function(data){
		// Fires when teh pause button is clicked
	},
	
	onEnd: function(data){
		// Fires when vdieo ends
		// Could be used to change pause button to play
		// or show a post video graphic, like YouTube
		console.warn("onEnd:", data);
	},
	
	onError: function(data, url){
		// Fired when the player encounters an error
		console.warn("ERROR-"+data.type.toUpperCase()+":", data.info.code, " - URL:", url);
	},
	
	
	
	onStatus: function(data){
		return;
		
		// Returns the status of the video
		// playing, stopped, bufering, etc.
		// UGH - Such fishy, swimmy stuff. Very inconsistant.
		// Need to do this manually, like in dAIR.Sound
		var msg = data.status || data.info.code;
		console.warn("STATUS:", msg);
		
		// NOTE Fall-throughs?
		switch(msg){
			case "NetConnection.Connect.Success":
				this.onLoad(msg);
			break;
			
			case "NetStream.Play.Start":
				this.isPlaying = true;
				this.isStopped = false;
				this.onPlay(msg);
			break;
			
			case "NetStream.Buffer.Full":
				this.isPlaying = true;
				this.isStopped = false;
				this.onPlay(msg);
			break;
			
			case "NetStream.Play.Stop":
				this.isPlaying = false;
				this.isStopped = true;
				this.onStop();
				this.onEnd();
			break;
			
			case "NetStream.Buffer.Empty":
			case "NetStream.Buffer.Flush":
			default:
			break;
			
		}
	},
	
	_updatePosition: function(){
		
		var time = this.getTime() || 0;
		this.onPosition(time);
		setTimeout(dojo.hitch(this, "_updatePosition"), this.updateTime);
	},
	
	
	
	_normalizeUrl: function(_url){
		if(_url && _url.toLowerCase().indexOf("http")<0){
			//
			// Appears to be a relative path. Attempt to  convert it to absolute, 
			// so it will better target the SWF.
			var loc = window.location.href.split("/");
			loc.pop();
			loc = loc.join("/")+"/";
			
			_url = loc+_url;
		}
		return _url;
	},
	_normalizeVolume: function(vol){
		if(vol>1){
			while(vol>1){
				vol*=.1	
			}
		}
		return vol;
	},
	_sub: function(topic, method){
		dojo.subscribe(this.id+"/"+topic, this, method);
	},
	destroy: function(){
		//destroys flash
		if(!this._flashMovie){
			this._cons.push(dojo.connect(this, "onLoad", this, "destroy"));	
			return;
		}
		dojo.forEach(this._subs, function(s){
			dojo.unsubscribe(s);								  
		});
		dojo.forEach(this._cons, function(c){
			dojo.disconnect(c);								  
		});
		this._flashObject.destroy();
		//dojo._destroyElement(this.flashDiv);
		
	}
	
});
