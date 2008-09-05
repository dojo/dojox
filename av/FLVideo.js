dojo.provide("dojox.av.FLVideo");
dojo.experimental("dojox.av.FLVideo");
dojo.require("dijit._Widget");
dojo.require("dojox.embed.Flash");
dojo.require("dojox.av.mediaStatus");

dojo.declare("dojox.av.FLVideo", [dijit._Widget, dojox.av.mediaStatus], {
			 
	// summary:
	//		Inserts a Flash FLV video into the HTML page and provides methods
	//		and events for controlling the video. Also plays the H264/M4V codec 
	//		with a little trickery: change the '.M4V' extension to '.flv'.
	//
	// example:
	//
	//		markup:
	//		|	<div id="vid" initialVolume=".7", 
	//		|		mediaUrl="../resources/Grog.flv" 
	//		|		dojoType="dojox.av.FLVideo"></div>
	//		programmatic:
	//		|	new dojox.av.FLVideo({
	//		|		initialVolume:.7, 
	//		|		mediaUrl:"../resources/Grog.flv"
	//		|	}, "vid");
	//
	//  mediaUrl: String
	// 		REQUIRED: The Url of the video file that will be played. 
	//		NOTE: Must be either an absolute URL or relative to the HTML file. 
	//		Relative paths will be converted to abslute paths
	mediaUrl:"",
	//
	// initialVolume: Float?
	//		The initial volume setting of the player. Acccepts between 0 and 1.
	initialVolume:1,
	//
	//  autoPlay:Boolean?
	//		Whether the video automatically plays on load or not.
	autoPlay: false,
	//
	//	bufferTime: Number?
	//		Time in milliseconds that the video should be loaded before it will 
	//		play. May pause and resume to build up buffer. Prevents stuttering.
	//	Note:
	//		Older FLVs, without a duration, cannot be buffered.
	bufferTime: 2000,
	//
	//	minBufferTime: Number
	//		Time in milliseconds bwteen the playhead time and loaded time that
	//		will trigger the buffer. When buffer is triggered, video will pause
	//		until the bufferTime amount is buffered.
	//		Note: Should be a small number, greater than zero.
	minBufferTime:300,
	//
	// updateTime: Number
	//		How often, in milliseconds to get an update of the video position.
	updateTime: 100,
	//
	//  id: String?
	//		The id of this widget and the id of the SWF movie.
	id:"",
	//
	// isDebug: Boolean?
	//		Setting to true tells the SWF to output log messages to Firebug.
	isDebug: false, 
	//
	//
	// percentDownloaded: read-only-Number
	//		The percentage the media has downloaded; from 0-100
	percentDownloaded:0,
	//
	// _flashObject: read-only-Object
	//	The dojox.embed object
	_flashObject:null,
	//
	// _flashMovie: read-only-SWF 
	//		The SWF object. Methods are passed to this.
	_flashMovie:null,
	//
	// _swfPath: Uri
	//		The path to the video player SWF resource
	_swfPath: dojo.moduleUrl("dojox.av", "resources/video.swf"),
	//
	//
	postCreate: function(){
		// summary:
		// Initialize the media.
		//
		this._subs = [];
		this._cons = [];
		this.mediaUrl = this._normalizeUrl(this.mediaUrl);
		this.initialVolume = this._normalizeVolume(this.initialVolume);	
		
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
		this._sub("mediaStatus", "onPlayerStatus");
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
	
	play: function(/* String? */newUrl){
		// summary:
		//		Plays the video. If an url is passed in, plays the new link.
		this.isPlaying = true;
		this.isStopped = false;
		this._flashMovie.doPlay(this._normalizeUrl(newUrl));
	},
	
	pause: function(){
		// summary:
		// 		Pauses the video
		this.isPlaying = false;
		this.isStopped = false;
		//this.onPause();
		this._flashMovie.pause();
	},
	
	seek: function(/* Float */ time ){
		// summary:
		// 		Goes to the time passed in the argument
		this._flashMovie.seek(time);
	},
	
	
	//  =====================  //
	//  Player Getter/Setters  //
	//  =====================  //
	
	volume: function(/* Float */ vol){
		// summary:
		//		Sets the volume of the video to the time in the
		// argument - between 0 - 1.
		//
		if(vol){
			if(!this._flashMovie) {
				this.initialVolume = vol;	
			}
			this._flashMovie.setVolume(this._normalizeVolume(vol));
		}
		if(!this._flashMovie) {
			return this.initialVolume;
		}
		return this._flashMovie.getVolume(); // Float	
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
		// summary:
		// 		Returns the current time of the video
		//	Note:
		//		Consider the onPosition event, which returns
		//		the time at a set interval. Too many trips to 
		//		the SWF could impact performance.
		return this._flashMovie.getTime(); // Float
	},
	
	//  =============  //
	//  Player Events  //
	//  =============  //
	
	
	onLoad: function(/* SWF */ mov){
		// summary:
		// 		Fired when the SWF player has loaded
		// 		NOT when the video has loaded
		//
		this._flashMovie = mov;
		this.isPlaying = this.autoPlay;
		this.isStopped = !this.autoPlay;
		this._initStatus();
		this._update();
	},
	onDownloaded: function(/* Number */percent){
		// summary:
		//		Fires the amount of that the media has been 
		//		downloaded. Number, 0-100
		this.percentDownloaded = percent;
	},
	onClick: function(/* Object */ evt){ 
		// summary:
		// 		TODO: Return x/y of click
		// 		Fires when the player is clicked
		// 		Could be used to toggle play/pause, or 
		// 		do an external activity, like opening a new
		//		window.
	},
	onSwfSized: function(/* Object */ data){
		// summary:
		// 		Fired on SWF resize, or when its
		// 		toggled between fullscreen.
	},
	onMetaData: function(/* Object */ data, /* Object */ evt){
		// summary:
		// 		The video properties. Width, height, duration, etc.
		// 		NOTE: 	if data is empty, this is an older FLV with no meta data.
		// 				Duration cannot be determined. In original FLVs, duration 
		//				could only be obtained with Flash Media Server.
		// 		NOTE: 	Older FLVs can still return width and height
		//				and will do so on a second event call
		this.duration = data.duration;
	},
	
	
	onPosition: function(/* Float */ time){
		// summary:
		//		The position of the playhead in seconds 
	},
	
	onStart: function(/* Object */ data){
		// summary:
		// 		Fires when video starts
		// 		Good for setting the play button to pause
		// 		during an autoPlay for example
	},
	
	onPlay: function(/* Object */ data){
		// summary:
		// 		Fires when video starts and resumes
	},
	
	onPause: function(/* Object */ data){
		// summary:
		// 		Fires when teh pause button is clicked
	},
	
	onEnd: function(/* Object */ data){
		// summary:
		// 		Fires when vdieo ends
		// 		Could be used to change pause button to play
		// 		or show a post video graphic, like YouTube
		this.percentDownloaded = 0;
	},
	
	
	onBuffer: function(/* Boolean */ isBuffering){
		// summary:
		//		Fires a boolean to tell if media
		//		is paused for buffering or if buffering
		//		has finished
		this.isBuffering = isBuffering;
	},
	
	onError: function(/* Object */ data, /* String */ url){
		// summary:
		// 		Fired when the player encounters an error
		// example:
		//		| console.warn("ERROR-"+data.type.toUpperCase()+":", 
		//		|		data.info.code, " - URL:", url);
		console.warn("ERROR-"+data.type.toUpperCase()+":", data.info.code, " - URL:", url);
	},
	
	onStatus: function(/* Object */data){
		// summary:
		// 		Simple status, compiled in dojox.av.mediaStatus
	},
	
	onPlayerStatus: function(/* Object */data){
		// summary:
		// 		The status of the video from the SWF
		// 		playing, stopped, bufering, etc.
	},
	
	
	//  ===============  //
	//  Private Methods  //
	//  ===============  //
	
	_checkBuffer: function(/* Float */time, /* Float */bufferLength){
		// summary:
		//		Checks that there is a proper buffer time between
		//		current playhead time and the amount of data loaded.
		//		Works only on FLVs with a duration (not older). Pauses
		//		the video while continuing download.
		//
		if(this.percentDownloaded == 100){
			if(this.isBuffering){
				this.onBuffer(false);
				this._flashMovie.doPlay();
			}
			return;
		}
		
		if(!this.isBuffering && bufferLength<.1){
			this.onBuffer(true);
			this._flashMovie.pause();
			return;
		}
		
		var timePercentLoad = this.percentDownloaded*.01*this.duration;
		
		// check if start buffer needed
		if(!this.isBuffering && time+this.minBufferTime*.001>timePercentLoad){
			this.onBuffer(true);
			this._flashMovie.pause();
		
		// check if end buffer needed
		}else if(this.isBuffering && time+this.bufferTime*.001<=timePercentLoad){
			this.onBuffer(false);
			this._flashMovie.doPlay();
		}
		
	},
	_update: function(){
		// summary:
		//		Helper function to fire onPosition, check download progress,
		//		and check buffer.
		var time = Math.min(this.getTime() || 0, this.duration);
		var dObj = this._flashMovie.getLoaded();
		this.onDownloaded(Math.ceil(dObj.bytesLoaded/dObj.bytesTotal*100));
		this.onPosition(time);
		if(this.duration){
			this._checkBuffer(time, dObj.buffer);	
		}
		setTimeout(dojo.hitch(this, "_update"), this.updateTime);
	},
	
	_normalizeUrl: function(_url){
		// summary:
		//		Checks that path is relative to HTML file or
		//		convertes it to an absolute path. 
		//
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
		// summary:
		//		Ensures volume is less than one
		//
		if(vol>1){
			while(vol>1){
				vol*=.1	
			}
		}
		return vol;
	},
	_sub: function(topic, method){
		// summary:
		// helper for subscribing to topics
		dojo.subscribe(this.id+"/"+topic, this, method);
	},
	destroy: function(){
		// summary:
		// 		destroys flash
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
