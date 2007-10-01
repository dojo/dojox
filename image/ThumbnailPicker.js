dojo.provide("dojox.image.ThumbnailPicker");
dojo.experimental("dojox.image.ThumbnailPicker");
//
// dojox.image.ThumbnailPicker courtesy Shane O Sullivan, licensed under a Dojo CLA 
// @author  Copyright 2007 Shane O Sullivan (shaneosullivan1@gmail.com)
//
// For a sample usage, see http://www.skynet.ie/~sos/photos.php
//
//	document topics.

dojo.require("dojo.fx");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.declare("dojox.image.ThumbnailPicker",
	[dijit._Widget, dijit._Templated],
	{
	// imageData: Array
	// Stores an internal cache of the image data retrieved from the data store.
	imageData: [],
	
	// imageStore: Object
	// A data store that implements the dojo.data Read API.
	imageStore: null,
	
	// request: Object
	// A dojo.data Read API Request object.
	request: null,
	
	// numberThumbs: Number
	// The number of thumbnail images to display at once.
	numberThumbs: 5,
	
	// useLoadNotifier: Boolean
	// Setting useLoadNotifier to true makes a colored DIV appear under each
	// thumbnail image, which is used to display the loading status of each
	// image in the data store.
	useLoadNotifier: false,
	
	// useHyperlink: boolean
	// Setting useHyperlink to true causes a click on a thumbnail to open a link.
	useHyperlink: false,
	
	// hyperlinkTarget: String
	// If hyperlinkTarget is set to "new", clicking on a thumb will open a new window
	// If it is set to anything else, clicking a thumbnail will open the url in the
	// current window.
	hyperlinkTarget: "new",
	
	// isClickable: Boolean
	// When set to true, the cursor over a thumbnail changes.
	isClickable: true,
	
	// isHorizontal: Boolean
	// If true, the thumbnails are displayed horizontally. Otherwise they are displayed
	// vertically
	isHorizontal: true,
	
	//autoLoad: Boolean
	autoLoad: true,

	// linkAttr: String
	// The attribute name for accessing the url from the data store
	linkAttr: "link",
	
	// imageThumbAttr: String
	// The attribute name for accessing the thumbnail image url from the data store
	imageThumbAttr: "imageUrlThumb",
	
	
	// imageLargeAttr: String
	// The attribute name for accessing the large image url from the data store
	imageLargeAttr: "imageUrl",
	
	// titleAttr: String
	// The attribute name for accessing the title from the data store
	titleAttr: "title",
 	
	templatePath: dojo.moduleUrl("dojox.image", "resources/ThumbnailPicker.html"), 
	tempImgPath: dojo.moduleUrl("dojox.image", "resources/images/1pixel.gif"),
	
	// _thumbCounter: Number
	// Records the number of images already loaded
	_thumbCounter: 0,
	
	// thumbs: Array
	// Stores the image nodes for the thumbnails.
	_thumbs: [],
	
	// _thumbIndex: Number
	// The index of the first thumbnail shown
	_thumbIndex: 0,
	
	// _maxPhotos: Number
	// The total number of photos in the image store
	_maxPhotos: 0,
	
	// _loadedImages: Object
	// Stores the indices of images that have been marked as loaded using the
	// markImageLoaded function.
	_loadedImages: {},

	postCreate: function(){
		// summary: Initializes styles and listeners		
		this.widgetid = this.id;
		this.inherited("postCreate",arguments);
		this.pageSize = this.numberThumbs * 4;
		
		var _this = this;		

		// FIXME: do this via css? calculate the correct width for the widget
		var width = (100 * this.numberThumbs) + 90;
		dojo.style(this.outerNode, "textAlign","center");
		dojo.style(this.outerNode, "width", width+"px");
		
		//If useHyperlink is true, then listen for a click on a thumbnail, and
		//open the link
		if(this.useHyperlink){
			dojo.subscribe(this.getTopicName(), function(packet){
				var index = packet.index;
				var url = _this.imageStore.getValue(_this.imageData[index],_this.linkAttr);
				
				//If the data item doesn't contain a URL, do nothing
				if(!url){return;}
				
				if(_this.hyperlinkTarget == "new"){
					window.open(url);
				} else{
					window.location = url;
				}				
			});
		}

		this.init();
	},
	
	init: function(){
		// summary: Creates DOM nodes for thumbnail images and initializes their listeners 
		if(this.isInitialized || this._maxPhotos < 1) {return;}

		if(!this.thumbCells){
			dojo.style(this.hiddenNode,"position","absolute");
			dojo.style(this.hiddenNode,"left","-10000px");
			this.thumbCells = [];
			this._thumbIndex = 0;
			this.numberThumbs = Number(this.numberThumbs);
			
			var row;
			
			var tb = this.thumbsTable.tBodies[0];
			if(this.isHorizontal){
				row = document.createElement('tr');
				tb.appendChild(row);
			}
			
			var classExt = this.isHorizontal ? "Horiz" : "Vert";
				
			for(var i = 0; i < this.numberThumbs + 2; i++){
				var cell = document.createElement("td");
				cell.setAttribute("id","img_cell_"+this.widgetid+"_"+i);
				this.thumbCells[this.thumbCells.length] = cell;
				if(i > 0 && i < this.numberThumbs + 1){
					dojo.addClass(cell, "thumbPlaceholder");
					if(this.useHyperlink || this.isClickable){
						dojo.addClass(cell, "thumbClickable");
					}
				}else{
					dojo.addClass(cell, "thumbNav");
					dojo.addClass(cell, "thumbClickable");
					dojo.addClass(cell, "nav");
					if(i == 0){
						dojo.addClass(cell, "prev" + classExt);
					}else{
						dojo.addClass(cell, "next" + classExt);      
					}
				}
				cell.innerHTML = "<img src='"+this.tempImgPath+"' class='imageGalleryThumb'/>";
				
				if(!this.isHorizontal) {
					row = document.createElement('tr');
					tb.appendChild(row);
				}
				
				row.appendChild(cell);
			}

			// FIXME: can we setup a listener around the whole element and determine based on e.target?
			var _this = this;
			dojo.connect(this.thumbCells[0], "onclick", function(evt){
				_this.showThumbs(_this._thumbIndex - _this.numberThumbs);
			});
			dojo.connect(this.thumbCells[this.numberThumbs + 1], "onclick", function(evt){
				_this.showThumbs(_this._thumbIndex + _this.numberThumbs);
			});

		}
		this.isInitialized = true;

		this._updateNavControls();
	  
		this._loadNextThumbnail();
	},

	getTopicName: function(){
		// summary: Returns the name of the dojo topic that can be
		//   subscribed to in order to receive notifications on
		//   which thumbnail was selected.
    		return (this.widgetId ? this.widgetId : this.id) + "/select"; // String
  	},
  
  	setDataStore: function(dataStore, request, /*optional*/paramNames){
		// summary: Sets the data store and request objects to read data from.
		// dataStore:
		//	An implementation of the dojo.data.api.Read API. This accesses the image
		//	data.
		// request:
		//	An implementation of the dojo.data.api.Request API. This specifies the
		//	query and paging information to be used by the data store
		// paramNames:
		//	An object defining the names of the item attributes to fetch from the
		//	data store.  The four attributes allowed are 'linkAttr', 'imageLargeAttr',
		//	'imageThumbAttr' and 'titleAttr'
  		this.reset();
		var _this = this;

		this.request = {
			query: {},
			start: request.start ? request.start : 0,
			count: request.count ? request.count : 10,
			onBegin: function(total) {
				_this._maxPhotos = total;
			}
   		};
   
		if(request.query){
   			dojo.mixin(this.request.query, request.query);
		}

   		if(paramNames && paramNames.imageThumbAttr){
			var attrNames = ["imageThumbAttr", "imageLargeAttr", "linkAttr", "titleAttr"];
			for(var i = 0; i< attrNames.length; i++){
				if(paramNames[attrNames[i]]){this[attrNames[i]] = paramNames[attrNames[i]];}	
			}
   		}
	
		var complete = function(items, request){
	  		_this._addData(items);
	  		_this.init();
	  		_this.request.onComplete = null;
		};
	
		this.imageStore = dataStore;
		this.maxItems = -1;
	
		this.request.onComplete = complete;
		this.request.count = this.pageSize;
		this.request.start = 0;
		this.imageStore.fetch(this.request);
  	},
  
  	reset: function(){
		// summary: Resets the widget back to its original state.
		this.imageData = null;
		this._loadedImages = {};

		while(this.hiddenNode.firstChild) {
			this.hiddenNode.removeChild(this.hiddenNode.firstChild);
		}
		var img;

		for(var pos = 0; pos < this._thumbs.length; pos++) {
			img = this._thumbs[pos];
			if(img) {
				//  dojo.event.browser.clean(img);
				if(img.parentNode){
					img.parentNode.removeChild(img);    
				}  
			}
		}

		this._thumbs = [];
		this.isInitialized = false;
		this._thumbCounter = 0;
		this.twoConnectionsUsedForMain = false;
	 	this._thumbIndex = 0;
  	},
  
  	showThumbs: function(idx){
		// summary: Displays thumbnail images, starting at position 'idx'
		// idx: Number
		//	The index of the first thumbnail
		var _this = this;
		var idx = arguments.length == 0 ? this._thumbIndex : arguments[0];

		idx = Math.max(idx, 0);
		idx = Math.min(idx, this._maxPhotos);

		if(idx >= this._maxPhotos) {
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
							_this._insertThumbnail(i + 1, node);
						}
					}else{
						//If the thumbnail has not already been loaded, then	
						//load it.
						var imgIndex = imagesToPlace[i].lastIndexOf("_");
						var loadPos = imagesToPlace[i].substring(imgIndex + 1, imagesToPlace[i].length);
	
						//Mark the position in the thumbCells where 
						//this image should be inserted when loaded.
						_this._loadingImages[imagesToPlace[i]] = i + 1;
						_this._loadNextThumbnail(loadPos);
					}
				}
			}
			_this._thumbIndex = idx;
  
			//If we have not already requested the data from the store, do so. 
			if(_this.maxItems < 0 && idx + _this.pageSize > _this.imageData.length){
				//Define the function to call when the items have been 
				//returned from the data store.
				var complete = function(items, request){
					if(items && items.length) {
						_this._addData(items);
						_this._updateNavControls();
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
			_this._updateNavControls();
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
  	},

	markImageLoaded: function(index){
		// summary: Changes a visual cue to show the image is loaded
		// description: If 'useLoadNotifier' is set to true, then a visual cue is
		//	given to state whether the image is loaded or not.  Calling this function
		//	marks an image as loaded.
		var thumbNotifier = dojo.byId("loadingDiv_"+this.widgetid+"_"+index);
		if(thumbNotifier){
			this._setThumbClass(thumbNotifier, "imageGalleryLoaded");
		}
		this._loadedImages[index] = true;
	},

  	_setThumbClass: function(thumb, className){
		// summary: Adds a CSS class to a thumbnail, only if 'autoLoad' is true
		// thumb: DomNode
		//	The thumbnail DOM node to set the class on
		// className: String
		//	The CSS class to add to the DOM node.
		if(!this.autoLoad){ return; }
		dojo.addClass(thumb, className);
  	},
  
	_addData: function(items){
		// summary: Adds image data to an internal cache.
		// items: Array
		//	The data items to add to the cache.
		if(!this.imageData) { this.imageData = []; }
		if(items.length < this.pageSize) {
			this.maxItems = this.imageData.length + items.length; 
		}
		this.imageData = this.imageData.concat(items);    
	},
  
  	_loadNextThumbnail: function(){
		// summary: Loads the next thumbnail image into the widgets internal cache.
		var initPos =  arguments.length == 0 ? -1 : arguments[0];
		var pos = arguments.length == 0 ? this._thumbCounter++ : arguments[0];
		while(pos < this._thumbs.length && this._thumbs[pos]){
			pos ++;
		}

		if(this._thumbCounter >= this._maxPhotos){
			if(this.imageData.length > 0){
				if(!this.twoConnectionsUsedForMain){
					//if all the thumbnails have been loaded, then use the second connection to 
					//the image server to load primary images
					this.twoConnectionsUsedForMain = true;
				} 
			}
		}
		if(pos >= this.imageData.length){ return; }

		var url = this.imageStore.getValue(this.imageData[pos],this.imageThumbAttr);
		var img = document.createElement("img");
		var imgContainer = document.createElement("div");
		imgContainer.setAttribute("id","img_"+this.widgetid+"_"+pos);
		imgContainer.appendChild(img);

		this._thumbs[pos] = imgContainer;

        if(this.useLoadNotifier){
		  var loadingDiv = document.createElement("div");
		  loadingDiv.innerHTML = "<!-- -->";

		  loadingDiv.setAttribute("id","loadingDiv_"+this.widgetid+"_"+pos);
		  
		  //If this widget was previously told that the main image for this
		  //thumb has been loaded, make the loading indicator transparent.
		  this._setThumbClass(loadingDiv,
				this._loadedImages[pos] ? "imageGalleryLoaded":"imageGalleryNotifier");

		  imgContainer.appendChild(loadingDiv);
		}
		this.hiddenNode.appendChild(imgContainer);
	
		var _this = this;
		dojo.connect(img, "onload", function(){    
			if(_this._loadingImages) {
				var insertPos = _this._loadingImages[imgContainer.getAttribute("id")];
				if(insertPos != null){
					_this._insertThumbnail(insertPos, this.parentNode);
				}
			}else if(pos >= _this._thumbIndex && pos <_this._thumbIndex + _this.numberThumbs){
				_this.showThumbs();
			}
			_this._loadNextThumbnail();
			return false;
		});
		dojo.connect(img, "onclick", function(evt){
			dojo.publish(_this.getTopicName(), 	[{
				index: pos, 
				url: img.getAttribute("src"), 
				largeUrl: _this.imageStore.getValue(_this.imageData[pos],_this.imageLargeAttr),
				title: _this.imageStore.getValue(_this.imageData[pos],_this.titleAttr),
				link: _this.imageStore.getValue(_this.imageData[pos],_this.linkAttr)
			}]);
			return false;
		});
		dojo.addClass(img, "imageGalleryThumb");
		img.setAttribute("src", url);
		var title = this.imageStore.getValue(this.imageData[pos], this.titleAttr);
		if(title){ img.setAttribute("title",title); }
	},

	_insertThumbnail: function(idx, node){
		// summary: Inserts a thumbnail DOM node at a given position in the
		//	set of visible nodes.
		// idx: Number
		//	The index to insert the node at.
		// node: DomNode
		//	The node to add the thumbnail image as a child of.
		this.thumbCells[idx].appendChild(node);
		if(dojo._getOpacity(node) < 0.99) {dojo._setOpacity(node, 0.99);}
	},
	
	_updateNavControls: function(){
		// summary: Updates the navigation controls to hide/show them when at
		//	the first or last images.
		var cells = [];
		if(this._thumbIndex < 1){cells.push({node: this.thumbCells[0]});}
		else {cells.push({node:this.thumbCells[0], add: true});}

		var lastCell = this.thumbCells[this.thumbCells.length -1];
		if(this._thumbIndex + this.numberThumbs >= this._maxPhotos){cells.push({node: lastCell});}
		else {cells.push({node:lastCell, add: true});}
		for(var i = 0; i<cells.length; i++){
			var fn = cells[i]["add"] ? "addClass" : "removeClass";
			dojo[fn](cells[i].node,"enabled");
			dojo[fn](cells[i].node,"thumbClickable");
		}
  	}
});
