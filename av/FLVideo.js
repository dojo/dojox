dojo.provide("dojox.av.FLVideo");
dojo.experimental("dojox.av.FLVideo");
dojo.require("dijit._Widget");
dojo.require("dojox.embed.Flash");

dojo.declare("dojox.av.FLVideo", [dijit._Widget], {
			 
	// summary
	//		Inserts one or more Flash FLV videos into the HTML page and provides methods
	//		and events for controlling the video. Also plays the H264/M4V codec with a 
	//		little trickery: change the ".M4V" extension to ".flv".
	//
	// USAGE:
	//
	//		markup:
	//			<div id="vid" initialVolume=".7", videoUrl="../resources/Grog.flv" dojoType="dojox.av.FLVideo"></div>
	//		programmatic:
	//			new dojox.av.FLVideo({initialVolume:.7, videoUrl:"../resources/Grog.flv"}, "vid");
	//
	// arguments:
	//
	//  videoUrl /* String */
	// 		REQUIRED: The Url of the video file that will be played. 
	//		NOTE: Must be either an absolute URL or relative to the HTML file. Relative
	//		paths will be converted to abslute paths
	videoUrl:"",
	//
	// initialVolume /* Float */
	//		The initial volume setting of the player. Acccepts between 0 and 1.
	initialVolume:1,
	//
	//  autoPlay: /* Boolean */
	//		Whether the video plays on load or not.
	autoPlay: false,
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
		this.videoUrl = this._normalizeUrl(this.videoUrl);
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
				videoUrl:this.videoUrl, 
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
		this._sub("mediaStatus", "onStatus");
		this._sub("mediaMeta",   "onMetaData");
		this._sub("mediaError",  "onVideoError");
		this._sub("mediaStart",  "onVideoStart");
		this._sub("mediaEnd",    "onVideoEnd");
	
		this._flashObject = new dojox.embed.Flash(args, this.domNode);
		this._flashObject.onLoad = dojo.hitch(this, "onLoad");
	},
	
	//  =============================  //
	//  Methods to control the player  //
	//  =============================  //
	
	togglePause: function(){
		// Toggles between play and pause
		console.log("TOGGLE")
		this._flashMovie.togglePause();
	},
	play: function(newUrl /* Optional */){
		// Plays the video. If an url is passed in, plays the new link.
		this._flashMovie.play(this._normalizeUrl(newUrl));
	},
	pause: function(){
		// Pauses the video
		this._flashMovie.pause();
	},
	seek: function(time /* Float */){
		// Goes to the time passed in the argument
		console.log("seek:", time)
		this._flashMovie.seek(time);
	},
	setVolume: function(vol){
		//	Sets the volume of teh video to the time in the
		//	argument - between 0 - 1.
		this._flashMovie.setVolume(this._normalizeVolume(vol));
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
	getVolume: function(){
		// Returns current volume of video
		return this._flashMovie.getVolume();
	},
	
	//  =============  //
	//  Player Events  //
	//  =============  //
	
	onLoad: function(mov){
		// Fired when the SWF player has loaded
		// NOT when the video has loaded
		this._flashMovie = mov;
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
	onStatus: function(data, evt){
		// Returns the status of the video
		// playing, stopped, bufering, etc.
		//console.warn("STATUS:", data, evt);
	},
	onMetaData: function(data, evt){
		// Returns the video properties. Width, height, duration, etc.
		// NOTE: if data is empty, this is an older FLV with no meta data.
		// Duration cannot be determined. In original FLVs, duration could
		// only be obtained with Flash Media Server.
		// TODO: Older FLVs can still return width and height
		console.warn("META:", data, evt);
	},
	onVideoStart: function(data){
		// Fires when video starts
		// Good for setting the play button to pause
		// during an autoPlay for example
		console.warn("onVideoStart:", data);
	},
	onVideoEnd: function(data){
		// Fires when vdieo ends
		// Could be used to change pause button to play
		// or show a post video graphic, like YouTube
		console.warn("onVideoEnd:", data);
	},
	onVideoError: function(data, url){
		// Fired when the player encounters an error
		console.warn("ERROR-"+data.type.toUpperCase()+":", data.info.code, " - URL:", url);
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
