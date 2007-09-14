dojo.provide("dojox.image.Gallery");
dojo.experimental("dojox.image.Gallery");
//
// dojox.image.Gallery courtesy Shane O Sullivan, licensed under a Dojo CLA 
// @author  Copyright 2007 Shane O Sullivan (shaneosullivan1@gmail.com)
//
// For a sample usage, see http://www.skynet.ie/~sos/photos.php
//
//	TODO: extract ThumbNailList from this widget, and make public.
//	document params and privitize non-API conformant methods.
//	document topics.

dojo.require("dojo.fx");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dojox.image.SlideShow");

dojo.declare("dojox.image.Gallery",
	[dijit._Widget, dijit._Templated],
	{

	imageData: [],
	imageStore: null,
	request: null,
	
	imageHeight: 375,
	imageWidth: 500,
	
	defaultTitle: "",
	
	thumbs: [],
	
	thumbCounter: 0,
	
	numberThumbs: 5,
	thumbIndex: 0,
	maxPhotos: 0,
	
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

	tmpImage: null,

	postCreate: function(){
		this.widgetid = this.id;
		this.inherited("postCreate",arguments);
		this.pageSize = this.numberThumbs * 4;
		
		this.slideShow = new dojox.image.SlideShow({
			  imageHeight: this.imageHeight, 
			  imageWidth: this.imageWidth,
			  autoLoad: this.autoLoad,
			  linkAttr: this.linkAttr,
			  imageLargeAttr: this.imageLargeAttr,
			  titleAttr: this.titleAttr,
			  slideshowInterval: this.slideshowInterval,
			  pageSize: this.pageSize 
		}, this.largeNode);
		
		this.slideShow.imageLargeAttr = this.imageLargeAttr;
		
		var _this = this;
		this.init();
	
		dojo.subscribe(this.getTopicName(), function(evt){
			_this.slideShow.showImage(evt.index);
		});
		
		dojo.subscribe(this.slideShow.getLoadTopicName(), function(index){
			if(_this.thumbs[index]) {
				_this.setThumbClass(_this.thumbs[index].lastChild, "imageGalleryLoaded");
			}
		});
	},
	
	init: function(){
		if(this.isInitialized || this.maxPhotos < 1) {//this.imageData.length < 1){
			return;
		}

		if(!this.thumbCells){
			dojo.style(this.hiddenNode,"position","absolute");
			dojo.style(this.hiddenNode,"left","-10000px");
			this.thumbCells = [];
			this.thumbIndex = 0;
			this.numberThumbs = Number(this.numberThumbs); 
	
			for(var i = 0; i < this.numberThumbs + 2; i++){
				var cell = document.createElement("td");
				cell.setAttribute("id","img_cell_"+this.widgetid+"_"+i);
				this.thumbCells[this.thumbCells.length] = cell;
				if(i > 0 && i < this.numberThumbs + 1){
					dojo.addClass(cell, "imageThumbPlaceholder");
				}else{
					dojo.addClass(cell, "imageThumbNav");
					if(i == 0){
						dojo.addClass(cell, "imageThumbPrev");
					}else{
						dojo.addClass(cell, "imageThumbNext");      
					}
				}
				cell.innerHTML = "<img src='"+this.tempImgPath+"' class='imageGalleryThumb'/>";
				this.thumbsTableRow.appendChild(cell);
			}

			// FIXME: can we setup a listener around the whole element and determine based on e.target?
			var _this = this;
			dojo.connect(this.thumbCells[0], "onclick", function(evt){
				_this.showThumbs(_this.thumbIndex - _this.numberThumbs);
			});
			dojo.connect(this.thumbCells[this.numberThumbs + 1], "onclick", function(evt){
				_this.showThumbs(_this.thumbIndex + _this.numberThumbs);
			});

			dojo.subscribe(this.slideShow.getShowTopicName(), function(packet){
				if(packet.index < _this.thumbIndex || packet.index > _this.thumbIndex + _this.numberThumbs -1){
					var index = packet.index - (packet.index % _this.numberThumbs);
					_this.showThumbs(index);
				}
			});
			// FIXME: do this via css? calculate the correct width for the widget
			var width = (100 * this.numberThumbs) + 90;
			dojo.style(this.outerNode, "textAlign","center");
			dojo.style(this.outerNode, "width", width+"px");        
		}
		this.isInitialized = true;

		this.updateNavControls();
	  
		this.loadNextThumbnail();
	},

	getTopicName: function(){
		// summary: 
    		return (this.widgetId ? this.widgetId : this.id) + "/select"; // String
  	},
  
  	setDataStore: function(dataStore, request, /*optional*/paramNames){
  		this.reset();
		var _this = this;

		this.request = {
     			query: {},
     			start: request.start ? request.start : 0,
     			count: request.count ? request.count : 10,
     			onBegin: function(total) {
       				_this.maxPhotos = total;
     			}
   		};
   
		if(request.query){
   			dojo.mixin(this.request.query, request.query);
		}

   		if(paramNames && paramNames.imageThumbAttr){
     			this.imageThumbAttr = paramNames.imageThumbAttr;
   		}
	
		var complete = function(items, request){
	  		_this._addData(items);
	  		_this.init();
	  		_this.request.onComplete = null;
	  
	  		//Tell the slide show widget to show some pics. 
	  		_this.slideShow.setDataStore(dataStore, _this.request, paramNames);
		};
	
		this.imageStore = dataStore;
		this.maxItems = -1;
	
		this.request.onComplete = complete;
		this.request.count = this.pageSize;
		this.request.start = 0;
		this.imageStore.fetch(this.request);
  	},
  
	_addData: function(items){
    		if(!this.imageData) { this.imageData = []; }
    		if(items.length < this.pageSize) {
      			this.maxItems = this.imageData.length + items.length; 
    		}
    		this.imageData = this.imageData.concat(items);    
	},
  
  	reset: function(){
    		this.imageData = null;
    
    		this.slideShow.reset();
  
    		while(this.hiddenNode.firstChild) {
      			this.hiddenNode.removeChild(this.hiddenNode.firstChild);
    		}
    		var img;
    
    		for(var pos = 0; pos < this.thumbs.length; pos++) {
      			img = this.thumbs[pos];
      			if(img) {
      				//  dojo.event.browser.clean(img);
        			if(img.parentNode){
          				img.parentNode.removeChild(img);    
        			}  
      			}
    		}

    		this.thumbs = [];
    		this.isInitialized = false;
    		this.thumbCounter = 0;
    		this.twoConnectionsUsedForMain = false;
	 	this.thumbIndex = 0;
  	},
  
  	showThumbs: function(idx){
    		var _this = this;
    		var idx = arguments.length == 0 ? this.thumbIndex : arguments[0];
    
    		idx = Math.max(idx, 0);
    		idx = Math.min(idx, this.maxPhotos);
  
    		if(idx >= this.maxPhotos) {// this.imageData.length) {
      			return;
    		}
    
    		var imgId;
    		var existingNodes = [];
    		var imagesToPlace = [];
    		var child;
    
    		//Build up an array of the images to add and remove to
    		// and from the list of thumbnails 
    		for(var i = 0; i < this.numberThumbs; i++){
			imgId = "img_"+this.widgetid+"_"+(i + idx);
			child = this.thumbCells[i + 1].firstChild;
	      
	      		//If there is a thumbnail image in the table
	      		//cell, mark it for removal.
			if(child){
				if(child.getAttribute("id") == imgId){ continue; }
				existingNodes[existingNodes.length] = {
					node: child,
					duration: 300
				};
			}
			imagesToPlace[i] = imgId;
    		}
    
    		//showNodes is used to display the new thumbnail images 
    		var showNodes = function(){
      			_this._loadingImages = {};
    
      			for(var i = 0; i < _this.numberThumbs; i++){
        			if(imagesToPlace[i]) {
          				//If there is still an image in the thumbnail cell,
          				//add it to the invisible node. 
          				while(_this.thumbCells[i + 1].firstChild) {
            					_this.hiddenNode.appendChild(
                  				_this.thumbCells[i + 1].firstChild);
          				}
      
          				var node = dojo.byId(imagesToPlace[i]);
          				//If the thumbnail has already been loaded, then show it. 
          				if(node){
            					//If the image is not already in the thumbnail cell, 
            					//put it there 
            					if(node.parentNode != _this.thumbCells[i + 1]) {
              						_this.insertThumbnail(i + 1, node);
            					}
          				}else{
            					//If the thumbnail has not already been loaded, then	
            					//load it. 
            					var loadPos = imagesToPlace[i].split("_")[2];
            
            					//Mark the position in the thumbCells where 
            					//this image should be inserted when loaded.
            					_this._loadingImages[imagesToPlace[i]] = i + 1;
            					_this.loadNextThumbnail(imagesToPlace[i].split("_")[2]);
          				}
        			}
      			}
      			_this.thumbIndex = idx;
      
      			//If we have not already requested the data from the store, do so. 
      			if(_this.maxItems < 0 && idx + _this.pageSize > _this.imageData.length){
        			//Define the function to call when the items have been 
        			//returned from the data store.
        			var complete = function(items, request){
          				if(items && items.length) {
            					_this._addData(items);
            					_this.updateNavControls();
          				}
        			};
        
        			//Define the function to call if the store reports an error. 
			        var error = function(){ console.log("Error getting items"); };

			        _this.request.onComplete = complete;
        			_this.request.onError = error;
        
        			//Increment the start parameter. This is the dojo.data API's
        			//version of paging. 
        			_this.request.start += _this.pageSize;
        
        			//Execute the request for data. 
        			_this.imageStore.fetch(_this.request);
      			}      
      
      			//Show or hide the navigation arrows on the thumbnails, 
      			//depending on whether or not the widget is at the start,
      			//end, or middle of the list of images. 
      			_this.updateNavControls();
    		};
  
    		//If images are already showing in the thumbnail cells, fade them 
    		//out first, before showing the new nodes. 
    		if(existingNodes.length > 0){
      			existingNodes[existingNodes.length - 1].onEnd = showNodes;
      			for(var count = 0; count < existingNodes.length; count++){
        			existingNodes[count] = dojo.fadeOut(existingNodes[count]);
      			}
      			dojo.fx.combine(existingNodes).play();
    		}else{ showNodes(); }
    		this.slideShow.moveImageLoadingPointer(idx);
  	},

  	updateNavControls: function(){
    		var firstCell = this.thumbsTableRow.cells[0];
    		if(this.thumbIndex < 1){
      			dojo.removeClass(firstCell,"imageThumbPrev");
    		}else if(!dojo.hasClass(firstCell,"imageThumbPrev")){
      			dojo.addClass(firstCell,"imageThumbPrev");
    		}
  
    		var lastCell = this.thumbsTableRow.cells[this.thumbsTableRow.cells.length -1];
  
    		if(this.thumbIndex + this.numberThumbs >= this.maxPhotos){
      			dojo.removeClass(lastCell,"imageThumbNext");
    		} else if(!dojo.hasClass(lastCell,"imageThumbNext")){
      			dojo.addClass(lastCell,"imageThumbNext");
    		}
  	},
  
  	setThumbClass: function(thumb, className){
    		if(!this.autoLoad){ return; }
    		dojo.addClass(thumb, className);
  	},
  
  	loadNextThumbnail: function(){ 
    		var initPos =  arguments.length == 0 ? -1 : arguments[0];
    		var pos = arguments.length == 0 ? this.thumbCounter++ : arguments[0];
    		while(pos < this.thumbs.length && this.thumbs[pos]){
      			pos ++;
    		}
    
	    	if(this.thumbCounter >= this.maxPhotos){
      			if(this.imageData.length > 0){
        			if(!this.twoConnectionsUsedForMain){
          				//if all the thumbnails have been loaded, then use the second connection to 
          				//the image server to load primary images
          				this.twoConnectionsUsedForMain = true;
          				this.slideShow.loadNextImage();
        			} 
      			}
    		}
    		if(pos >= this.imageData.length){ return; }
  
    		var url = this.imageStore.getValue(this.imageData[pos],this.imageThumbAttr);
    		var img = document.createElement("img");
    		var imgContainer = document.createElement("div");
    		imgContainer.setAttribute("id","img_"+this.widgetid+"_"+pos);
    		imgContainer.appendChild(img);
  
    		this.thumbs[pos] = imgContainer;
    
    		var loadingDiv = document.createElement("div");
    		loadingDiv.innerHTML = "<!-- -->";
    
    		loadingDiv.setAttribute("id","loadingDiv_"+this.widgetid+"_"+pos);
    		this.setThumbClass(loadingDiv,"imageGalleryNotifier");
    
    		if(this.slideShow.isImageLoaded(pos)){
      			this.setThumbClass(loadingDiv, "imageGalleryLoaded");
    		}
    
    		imgContainer.appendChild(loadingDiv);
    		this.hiddenNode.appendChild(imgContainer);
        
    		var _this = this;
    		dojo.connect(img, "onload", function(){    
			if(_this._loadingImages) {
				var insertPos = _this._loadingImages[imgContainer.getAttribute("id")];
				if(insertPos != null){
					_this.insertThumbnail(insertPos, this.parentNode);
				}
			}else if(pos >= _this.thumbIndex && pos <_this.thumbIndex + _this.numberThumbs){
				_this.showThumbs();
			}
			_this.loadNextThumbnail();
			return false;
    		});
    		dojo.connect(img, "onclick", function(evt){
      			dojo.publish(_this.getTopicName(), 
                    		[{
					index: pos, 
					url: img.getAttribute("src"), 
					largeUrl: _this.imageData[pos][_this.imageLargeAttr]
				}]);
			return false;
		});
		dojo.addClass(img, "imageGalleryThumb");
		img.setAttribute("src", url);
		var title = this.imageStore.getValue(this.imageData[pos], this.titleAttr);
		if(title){ img.setAttribute("title",title); }
	},

	insertThumbnail: function(pos, node){
		this.thumbCells[pos].appendChild(node);
		if(dojo._getOpacity(node) < 0.99) {
			dojo._setOpacity(node, 0.99);
		}
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
	}
});
