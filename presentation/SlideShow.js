dojo.provide("dojox.presentation.SlideShow");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.declare(
	"dojox.presentation.SlideShow",
	[dijit._Widget, dijit._Templated],
	null,
	{
	/*
		summary: 
			Takes a bunch of pictures and displays them one by one, like a slide show.
	*/
	templatePath: dojo.moduleUrl("dojox.presentation", "resources/SlideShow.html"),
				
	// iconImages:
	//  need to theme more like 'tundra' maybe
	navIconPlay: dojo.moduleUrl("dojox.presentation","resources/icons/navIconPlay.png"),		
	navIconPause: dojo.moduleUrl("dojox.presentation","resources/icons/navIconPause.png"),
	navIconDirDown: dojo.moduleUrl("dojox.presentation","resources/icons/navIconDirDown.png"),
	navIconDirUp: dojo.moduleUrl("dojox.presentation","resources/icons/navIconDirUp.png"),

	// imgUrls: String[]
	//	List of images to use
	//	Ex: "1.jpg;2.jpg;3.jpg"
	imgUrls: [],
		
	// imgUrlBase: String
	//	Path prefix to prepend to each file specified in imgUrls
	//	Ex: "/foo/bar/images/"
	imgUrlBase: "",

	// delay: Integer
	//	Number of milliseconds to display each image
	delay: 4000,

	// transitionInterval: Integer
	//	Number of milliseconds to transition between pictures
	transitionInterval: 2000,

	// toggleAnimation: String
	// 	one of "fade|scale" for different image transitions
	toggleAnimation: "fade", 

	randomizeAnimation: false, 
	
	// showDialog: Boolean
	//	toggle visibility of dialog [x of n] 
	showDialog: true, 

	// hideNavAfterEvent: Boolean
	// 	wether to force hideNav() after a button is clicked
	hideNavAfterEvent: true,

	// useNav: Boolean
	// 	toggle initial state of Nav, prevent from displaying
	useNav: false, 

	// navDur: Interger
	// 	Number of ms to transition navigation in/out
	navDur:	420,
		
	// imgWidth: Integer
	//	Width of image in pixels
	imgWidth: 800,
		
	// imgHeight: Integer
	//	Height of image in pixels
	imgHeight: 600,

	// preventCache: Boolean
	//	If true, download the image every time, rather than using cached version in browser
	preventCache: false,
		
	// stopped: Boolean
	//	is Animation paused?
	stopped: false,

	// direction: String
	// 	(forewards|backwards) uhmmm ... moving forward? or backwards?
	direction: 'forwards',

	// isPausable: Boolean
	// 	is Animation pausable?
	isPausable: true,

	// navOpacity: Float
	//	ending opacity
	navOpacity: 0.75,
	navOpacityMin: 0.0,

	////// Properties
	_urlsIdx: 0, 		// where in the images we are
	_background: "img2", // what's in the bg
	_foreground: "img1", // what's in the fg
	fadeAnim: null, // references our animation
	bkgFadeAnim: null, // the background nav [lack of connectOnce existance]
	fadeNavAnim: null, // references our nav fade status
	allowNavChange: true,	
	navShowing: true, // for us
	forwards: null,	// holder var for directions
	dialogStart: null, dialogEnd: null, 	// x of x placeholders

	///////// our DOM nodes 
	startStopButton: null,
	slideShowHolder: null,
	slideShowDialog: null, 
	img1: null,
	img2: null,
	slideShowNav: null,
	navInfo: null,

	postCreate: function(){
		// summary: do all the styling and get it started
		
		// FIXME: seems like a lot to do right here ... but using CSS inline in the template
		// really screws things up.
		dojo.style(this.slideShowHolder, "width", this.imgWidth);
		dojo.style(this.slideShowHolder, "height", this.imgHeight);
		dojo.style(this.slideShowNav, "opacity", 0.75);
		dojo.style(this.img1, "width", this.imgWidth);
		dojo.style(this.img1, "height", this.imgHeight);
		dojo.style(this.img2, "width", this.imgWidth);
		dojo.style(this.img2, "height", this.imgHeight);
			if (!this.useNav) { dojo.style(this.slideShowNav, "display", "none"); } 
			else {
			this.startStopButton.type = "image"; 
			this.startStopButton.src = this.navIconPlay; 
			this.directionButton.type = "image";
			this.directionButton.src = this.navIconDirUp;
		}
			if (this.showDialog) { this._updateDialog(); }
			if (this.direction == "forwards") { this.forwards = true; } else { this.forwards = false; } 
		// safari will cache the images and not fire an image onload event if	
		// there are only two images in the slideshow
		if(dojo.isSafari && this.imgUrls.length == 2) {
			this.preventCache = true;
		}
		if(this.imgUrls.length>1){
			this.img2.src = this.imgUrlBase+this.imgUrls[this._urlsIdx++] + this._getUrlSuffix();
			this._endTransition();
		}else{
			this.img1.src = this.imgUrlBase+this.imgUrls[this._urlsIdx++] + this._getUrlSuffix();
		}
	},
		setGallery: function(/* String */ jsonData) { 
		// summary: loads the images listed in jsonData array into imgUrls; 
		this.imgUrls = jsonData;
		this._urlsIdx = 0;
	},
		addImgUrl: function(str) {
		// summary: puts an image in the imgUrls stack
		this.imgUrls.push(str); 
	},
	
	removeImgUrl: function() {
		// summary: remove last imgUrls	
		return this.imgUrls.shift(); 
	},
	shuffleImgUrls: function() {
		// summary: mixup the urls, and start over.
		// FIXME: shuffle is an added array prototype, don't know how to do this in widget-land	
		// could just put the mix math code here?
		this.imgUrls.shuffle();
		this._urlsIdx = 0; 
	},
	
	toggleNav: function() {
		// summary: toggle navigation visibility
		if (!this.useNav) { return; } 
		if (this.navShowing) { this.hideNav(); } else { this.showNav(); } 
	},

	showNav: function() {
		// summary: show the navigation tab
		if (!this.useNav) { return; } 
		if (!this.navShowing) {
			dojo.animateProperty({
			node: this.slideShowNav, duration:this.navDur,
			properties: { opacity: { start:this.navOpacityMin, end:this.navOpacity }}}).play(); 
			this.navShowing = true; 
		}
	},
		
	hideNav: function() {
		// summary: hide the navigation tab
		if (!this.useNav) { return; } 
		if (this.navShowing) { 
			dojo.animateProperty({
				node:this.slideShowNav, duration:this.navDur,
				properties: { 
					opacity: { start:this.navOpacity, end: this.navOpacityMin } 
				}
			}).play();
			this.navShowing = false; 
		}
	},
	toggleDirection: function() {
	// summary: toggle the direction of the array-walk 
		if (this.direction == 'forwards') { 
			this.direction = 'backwards'; 
			this.directionButton.src= this.navIconDirDown;
		} else { 
			this.direction = 'forwards'; 
			this.directionButton.src = this.navIconDirUp;
		} 
		if (this.hideNavAfterEvent) { this.hideNav(); }
		},
	
	togglePaused: function(){
		// summary: pauses or restarts the slideshow
		if(this.stopped){
			this.stopped = false;
			this._backgroundImageLoaded();
			if (this.isPausable) { 
				this.startStopButton.value= "pause";
				this.startStopButton.src = this.navIconPlay;
			}
		}else{
			if (this.isPausable) {
				this.stopped = true;
				this.startStopButton.value= "play";
				this.startStopButton.src = this.navIconPause; 
			}
		}
		if (this.hideNavAfterEvent) { this.hideNav(); } 
	},
		_updateDialog: function() {
		// FIXME: is there a neat JS way to use string substitution in this scope
		// to allow a user-defined dialog string, like: dialogString="[ $start of $end Image ... ]"
		// and update the innerHTML with the variables in their string?
		this.dialogStart = this._urlsIdx+1; 
		this.dialogEnd = this.imgUrls.length; 
		this.slideShowDialog.innerHTML = '[ '+this.dialogStart+' of '+this.dialogEnd+' ]';
	},
		_getUrlSuffix: function() {
		if(this.preventCache) {
			return "?ts=" + (new Date()).getTime();
		} else {
			return "";
		}
	},
		_backgroundImageLoaded: function(){
		// start fading out the _foreground image
		if(this.stopped){ return; }
			this.allowNavChange = false; 
			// actually start the fadeOut effect
		// NOTE: if we wanted to use other transition types, we'd set them up
		// 		 here as well
		if(this.fadeAnim) {
			this.fadeAnim.stop();
		}
			switch (this.toggleAnimation) {
			case "fade" : 
				this.fadeAnim = dojo.fadeOut({
					node:this[this._foreground], 
					duration: this.transitionInterval
				}); 
				break;
			case "slide" : break;
			case "wipe" : 
				this.fadeAnim = dojo.animateProperty({
					node:this[this._foreground],
					duration: this.transitionInterval,
					properties: {
						width:{
							start:this.imgWidth,
							end:0, unit:"px"
						},
						height:{
							start:this.imgHeight,
							end:0, unit:"px"
						}

					}
				});
				break;
		}
			this._handle = dojo.connect(this.fadeAnim,"onEnd",this,"_endTransition");
		this.fadeAnim.play();
		
	},
	_endTransition: function(){
		// move the _foreground image to the _background 
		// if (this.showDialog) {this._updateDialog(); }
			with(this[this._background].style){ zIndex = parseInt(zIndex)+1; }
		with(this[this._foreground].style){ zIndex = parseInt(zIndex)-1; }
			// fg/bg book-keeping
		var tmp = this._foreground;
		this._foreground = this._background;
		this._background = tmp;
		this.allowNavChange = true;
		// keep on truckin, 
		// FIXME: is there a better method than setTimeout?
		setTimeout(dojo.hitch(this,"_loadNextImage"),this.delay); 
	},

	_loadNextImage: function(){
		// summary: after specified delay, load a new image in that container, 
		// and call _backgroundImageLoaded() when it finishes loading


		dojo.disconnect(this._handle); 
		this._handle = dojo.connect(this[this._background],"onload", this, "_backgroundImageLoaded"); 
		dojo.style(this[this._background], "opacity", 1.0);
		dojo.style(this[this._background], "width", this.imgWidth);
		dojo.style(this[this._background], "height", this.imgHeight);
		if (this.showDialog) { this._updateDialog(); }
		var nextIdx = (this.direction=='forwards') ? this._urlsIdx+1 : this._urlsIdx-1;
		this[this._background].src = this.imgUrlBase+this.imgUrls[this._urlsIdx];
		if (this.direction=='forwards') { 
		if(nextIdx>(this.imgUrls.length-1)){ this._urlsIdx = 0;	} 
			else { this._urlsIdx = nextIdx; } 
		} else {
			if (nextIdx<0) { this._urlsIdx = this.imgUrls.length-1; } 
			else { this._urlsIdx = nextIdx; } 
		}
	}
	
});
