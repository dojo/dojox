dojo.provide("dojox.image.Gallery");
dojo.experimental("dojox.image.Gallery");
//
// dojox.image.Gallery courtesy Shane O Sullivan, licensed under a Dojo CLA 
// @author  Copyright 2007 Shane O Sullivan (shaneosullivan1@gmail.com)
//
// For a sample usage, see http://www.skynet.ie/~sos/photos.php
//
//	TODO: Make public, document params and privitize non-API conformant methods.
//	document topics.

dojo.require("dojo.fx");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dojox.image.ThumbnailPicker");
dojo.require("dojox.image.SlideShow");

dojo.declare("dojox.image.Gallery",
	[dijit._Widget, dijit._Templated],
	{
	imageHeight: 375,
	imageWidth: 500,
	
	defaultTitle: "",
	
	thumbs: [],
	
	thumbCounter: 0,
	
	numberThumbs: 5,
	thumbIndex: 0,
	maxPhotos: 0,
	
	pageSize: dojox.image.SlideShow.prototype.pageSize,
	
	autoLoad: true,
	
	linkAttr: "link",
	imageThumbAttr: "imageUrlThumb",
	imageLargeAttr: "imageUrl",
	titleAttr: "title",
 
	// slideshowInterval: Integer
	//	time in seconds, between image changes in the slide show.
	slideshowInterval: 3,
	
	templatePath: dojo.moduleUrl("dojox.image", "resources/Gallery.html"), 
	tempImgPath: dojo.moduleUrl("dojox.image", "resources/images/1pixel.gif"),

	postCreate: function(){
		this.widgetid = this.id;
		this.inherited("postCreate",arguments)
		
		this.thumbPicker = new dojox.image.ThumbnailPicker({
			numberThumbs: this.numberThumbs,
			linkAttr: this.linkAttr,
			imageLargeAttr: this.imageLargeAttr,
			titleAttr: this.titleAttr,
			numberThumbs: this.numberThumbs
		}, this.thumbPickerNode);
		
		
		this.slideShow = new dojox.image.SlideShow({
			imageHeight: this.imageHeight, 
			imageWidth: this.imageWidth,
			autoLoad: this.autoLoad,
			linkAttr: this.linkAttr,
			imageLargeAttr: this.imageLargeAttr,
			titleAttr: this.titleAttr,
			slideshowInterval: this.slideshowInterval,
			pageSize: this.pageSize 
		}, this.slideShowNode);
		
		var _this = this;
		this.init();
	
		dojo.subscribe(this.thumbPicker.getTopicName(), function(evt){
			_this.slideShow.showImage(evt.index);
		});
		
		dojo.subscribe(this.slideShow.getLoadTopicName(), function(index){
			if(_this.thumbPicker.thumbs[index]) {
				_this.thumbPicker.setThumbClass(_this.thumbPicker.thumbs[index].lastChild, "imageGalleryLoaded");
			}
		});
		this._centerChildren();
	},
	
	init: function(){
		if(this.isInitialized || this.maxPhotos < 1) {//this.imageData.length < 1){
			return;
		}

		dojo.subscribe(this.slideShow.getShowTopicName(), function(packet){
			if(packet.index < _this.thumbIndex
			   || packet.index > _this.thumbPicker.thumbIndex + _this.thumbPicker.numberThumbs -1){
				var index = packet.index - (packet.index % _this.thumbPicker.numberThumbs);
				_this.thumbPicker.showThumbs(index);
			}
		});			      
		
		this.isInitialized = true;
	},
  
  	setDataStore: function(dataStore, request, /*optional*/paramNames){
		this.thumbPicker.setDataStore(dataStore, request, paramNames);
		this.slideShow.setDataStore(dataStore, request, paramNames);
  	},
  
  	reset: function(){
		this.slideShow.reset();
		this.thumbPicker.reset();
  	},
  
	loadNextImage: function(){
		this.slideShow.loadNextImage();
	},

	loadImage: function(pos, callbackFn){
		this.slideShow.loadImage(pos, callbackFn);
	},

	showNextImage: function(inTimer){
		this.slideShow.showNextImage();
	},

	toggleSlideshow: function(){
		this.slideShow.toggleSlideshow();
	},

	showImage: function(index, /*optional*/callback){
		this.slideShow.showImage(index, callback);
		var thumbNotifier = dojo.byId("loadingDiv_"+this.widgetid+"_"+index);
		if(thumbNotifier && !dojo.hasClass(thumbNotifier, "imageGalleryLoading")){
			this.setThumbClass(thumbNotifier, "imageGalleryLoading");
		}
	},
	
	_centerChildren: function() {
		var thumbSize = dojo.marginBox(this.thumbPicker.outerNode);
		var slideSize = dojo.marginBox(this.slideShow.outerNode);
		
		var diff = (thumbSize.w - slideSize.w) / 2;
		
		if(diff > 0) {
			dojo.style(this.slideShow.outerNode, "marginLeft", diff + "px");
		} else if(diff < 0) {
			dojo.style(this.thumbPicker.outerNode, "marginLeft", diff + "px");
		}
	}
});
