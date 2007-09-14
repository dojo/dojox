dojo.provide("dojox.image.SlideShow");
//
// This file contains an Image Gallery widget built upon the 
// Dojo Ajax toolkit.  For a sample usage, see http://www.skynet.ie/~sos/photos.php
//
// @author  Copyright 2007 Shane O Sullivan (shaneosullivan1@gmail.com)
// @license Licensed under the Academic Free License 3.0 http://www.opensource.org/licenses/afl-3.0.php
//
//	TODO: more cleanups, better inline docs.
//
dojo.require("dojo.fx");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.declare("dojox.image.SlideShow",
	[dijit._Widget, dijit._Templated],
	{

	imageHeight: 375,
	imageWidth: 500,

	// title: String
	//	the initial title of the SlideShow 
	title: "",

	// titleTemplate: String
	//	a way to customize the wording in the title. supported tags to be populated are:
	//		@title = the passed title of the image
	//		@current = the current index of the image
	//		@total = the total number of images in the SlideShow
	//
	//	should add more?
	titleTemplate: '@title <span class="slideShowCounterText">(@current of @total)</span>',

	// noLink: Boolean
	//	prevents the slideshow from putting an anchor link around the displayed image
	//	enables if true, though still will not link in absence of a url to link to
	noLink: false,

	// loop: Boolean
	//	true/false - make the slideshow loop
	loop: true,

	// hasNav: Boolean
	//	toggle to enable/disable the visual navigation controls
	hasNav: true,

	images: [],
	pageSize: 20,
	imageCounter: 0,
	autoLoad: true,

	imageStore: null,
	request: null,
	linkAttr: "link",
	imageLargeAttr: "imageUrl",
	titleAttr: "title",

	filters: [],

	slideshowInterval: 3,
	twoConnectionsUsedForMain: false,

	templatePath: dojo.moduleUrl("dojox.image", "resources/SlideShow.html"),
	tempImgPath: dojo.moduleUrl("dojox.image", "resources/images/1pixel.gif"),

	tmpImage: null,

	postCreate: function(){
		this.inherited("postCreate",arguments);
		var img = document.createElement("img");

		// FIXME: should API be to normalize an image to fit in the specified height/width?
		img.setAttribute("width", this.imageWidth);
		img.setAttribute("height", this.imageHeight);

		if(this.hasNav){ this.innerWrapper.style.height = (this.imageHeight + 30)+"px";
		}else{ this.innerWrapper.style.height = this.imageHeight + "px"; }
		this.outerNode.style.width = this.imageWidth + "px";

		img.setAttribute("src", this.tempImgPath);
		var _this = this;
		
		this.largeNode.appendChild(img);
		this.tmpImage = img;
		// FIXME: doesn't dojo normalize this? if this.autoLoad { } should be enough?
	//	if(!this.autoLoad == "true") {
	//		this.autoLoad = true;
	//	}else if(typeof(this.autoLoad) == "string" || this.autoLoad instanceof String && this.autoLoad.toLowerCase() === "false"){
	//		this.autoLoad = false;
	//	}
		this.loadImage(0, function(){
		        _this.showImage(0);
		});
	},

	_handleClick: function(/* Event */e){
		switch(e.target){
			case this.nextIcon: this._next(); break;
			case this.prevIcon: this._prev(); break; 
			case this.playIcon: this.toggleSlideShow(); break;
		}
	},

	setDataStore: function(dataStore, request, /*optional*/paramNames){
		this.reset();
		var _this = this;
		this.request = {
			query: {},
			start: ((request.start) ? request.start : 0),
			count: ((request.count) ? request.count : this.pageSize),
			onBegin: function(count, request){
				_this.maxPhotos = count;
			}
		};
		if(request.query){ dojo.mixin(this.request.query, request.query); }
		if(paramNames && paramNames.imageLargeAttr){
			this.imageLargeAttr = paramNames.imageLargeAttr;
		}
		
		var _this = this;
		var _complete = function(items){
			_this.showImage(0); 
			_this.request.onComplete = null;
		};
		
		this.imageStore = dataStore;
		this.request.onComplete = _complete;
		this.request.start = 0;
		this.imageStore.fetch(this.request);
	},

	reset: function(){
		while(this.largeNode.firstChild){
			this.largeNode.removeChild(this.largeNode.firstChild);
		}
		this.largeNode.appendChild(this.tmpImage);
		while(this.hiddenNode.firstChild){
			this.hiddenNode.removeChild(this.hiddenNode.firstChild);
		}
		var img;
		for(var pos = 0; pos < this.images.length; pos++){
			img = this.images[pos];
			if(img && img.parentNode){ img.parentNode.removeChild(img); }
		}
		this.images = [];
		this.isInitialized = false;
		this.twoConnectionsUsedForMain = false;
		this.imageCounter = 0;
	},

	isImageLoaded: function(index){
		return this.images && this.images.length > index && this.images[index];
	},

	loadNextImage: function(){
		if(!this.autoLoad){ return; }
		while(this.images.length >= this.imageCounter && this.images[this.imageCounter]){
			this.imageCounter++;
		}
		this.loadImage(this.imageCounter);
	},

	moveImageLoadingPointer: function(idx){
		this.imageCounter = idx;
	},

	loadImage: function(pos, callbackFn){
		if(this.images[pos] || !this.request) { return; }
		
		var pageStart = pos - (pos % this.pageSize);

		this.request.count = this.pageSize;
		this.request.start = pageStart;

		this.request.onComplete = function(items){
			var diff = pos - pageStart;
			if(items && items.length > diff){
				loadIt(items[diff]);
			}else{ /* Squelch - console.log("Got an empty set of items"); */ }
		}

		var _this = this;	
		var loadIt = function(item){
			
			var url = _this.imageStore.getValue(item, _this.imageLargeAttr);
			var img = document.createElement("img");
			var div = document.createElement("div");

			var link = _this.imageStore.getValue(item,_this.linkAttr);
			if(!link || _this.noLink){ div.appendChild(img); 
			}else{
				var a = document.createElement("a");
				a.setAttribute("href", link);
				a.setAttribute("target","_blank");
				div.appendChild(a);
				a.appendChild(img);
			}

			div.setAttribute("id",_this.id + "_imageDiv"+pos);
			dojo.connect(img, "onload", function(){
				var h = img.height;
				var w = img.width;  
				// console.log('what?',w,h);
				
					div.setAttribute("width",_this.imageWidth);
					div.setAttribute("height",_this.imageHeight);
				
				dojo.publish(_this.getLoadTopicName(), [pos]);
				_this.loadNextImage();
				if(callbackFn){ callbackFn(); }
			});
			_this.hiddenNode.appendChild(div);

			var titleDiv = document.createElement("div");
			dojo.addClass(titleDiv, "slideShowTitle");
			div.appendChild(titleDiv);
		
			_this.images[pos] = div;
			img.setAttribute("src", url);
			
			var title = _this.imageStore.getValue(item,_this.titleAttr);
			if(title){ img.setAttribute("title",title); } 
		}
		this.imageStore.fetch(this.request);
	},

	_setTitle: function(title){
		this.titleNode.innerHTML = this.titleTemplate.replace('@title',title).replace('@current',this.imageIndex).replace('@total',this.imageCounter);
	},

	destroy: function(){
		if(this._slideId) { this._stop(); }
		this.inherited("destroy",arguments);
	},

	showNextImage: function(inTimer){
		if(this.imageIndex + 1 >= this.maxPhotos){
			if(this.loop){ this.imageIndex = 0; 
			}else{
				if(this._slideId){ this._stop; }
				return false;
			}
		}
		var _this = this;
		this.showImage(this.imageIndex + 1, function(){
			if(inTimer){ _this.startTimer(); }
		});
		return true;
	},

	toggleSlideShow: function(){
		if(this._slideId){ this._stop(); 
		}else{
			/* this.slideshowNode.firstChild.innerHTML= "Stop Slideshow"; */
			dojo.toggleClass(this.domNode,"slideShowPaused");
			var success = this.showNextImage(true);
			if(!success){
				this._stop();
			}
		}
	},

	_stop: function(){
		if(this._slideId) { clearTimeout(this._slideId); }
		this._slideId = null;
		dojo.removeClass(this.domNode,"slideShowPaused");
	},

	_prev: function(){
		// FIXME: either pull code from showNext/prev, or call it here
	},

	_next: function(){

	},

	startTimer: function(){
		this._slideId = setTimeout("dijit.byId('"+this.id +"').showNextImage(true);", this.slideshowInterval * 1000);
	},

	getShowTopicName: function(){
		return (this.widgetId ? this.widgetId : this.id) + "/imageShow";
	},

	getLoadTopicName: function(){
		return (this.widgetId ? this.widgetId : this.id) + "/imageLoad";
	},

	showImage: function(index, /* Function? */callback){  
		if(!callback && this._slideId){ this.toggleSlideShow(); }
		var _this = this;
		var current = this.largeNode.getElementsByTagName("div");
		this.imageIndex = index;

		var showOrLoadIt = function() {
			//If the image is already loaded, then show it. 
			if(_this.images[index]){
				while(_this.largeNode.firstChild){
					_this.largeNode.removeChild(_this.largeNode.firstChild);
				}
				_this.images[index].style.opacity = 0;
					_this.largeNode.appendChild(_this.images[index]);
			        var onEnd = function(a,b,c) {
					title = _this.images[index].firstChild.firstChild.getAttribute("title");
					dojo.publish(_this.getShowTopicName(), [{
						index: index,	
						title: title,
						url: _this.images[index].firstChild.firstChild.getAttribute("src")
					}]);
        				if(callback) { callback(a,b,c); }
					_this._setTitle(title);
        			};

				dojo.fadeIn({
					node: _this.images[index],
					duration: 300,
					onEnd: onEnd
				}).play();
			}else{
				//If the image is not loaded yet, load it first, then show it.
				_this.loadImage(index, function(){
					dojo.publish(_this.getLoadTopicName(), [index]);
					_this.showImage(index, callback);	
				});
			}
		};

		//If an image is currently showing, fade it out, then show
		//the new image. Otherwise, just show the new image. 	
		if(current && current.length > 0){
			dojo.fadeOut({
				node: current[0],
				duration: 300,
				onEnd: function(){
					_this.hiddenNode.appendChild(current[0]);
					showOrLoadIt();
			}
			}).play();
		}else{
			showOrLoadIt();
		}
	}

});
