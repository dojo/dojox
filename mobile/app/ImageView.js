dojo.provide("dojox.mobile.app.ImageView");
dojo.require("dojox.mobile.app._Widget");

dojo.require("dojo.fx.easing");

dojo.declare("dojox.mobile.app.ImageView", dojox.mobile.app._Widget, {
	
	zoom: 1,
	
	zoomCenterX: 0, 
	
	zoomCenterY: 0, 
	
	// maxZoom: Number
	//		The highest degree to which an image can be zoomed.  For example,
	//		a maxZoom of 5 means that the image will be 5 times larger than normal
	maxZoom: 5,
	
	// autoZoomLevel: Number
	//		The degree to which the image is zoomed when auto zoom is invoked.
	//		The higher the number, the more the image is zoomed in.
	autoZoomLevel: 3,
	
	// disableAutoZoom: Boolean
	//		Disables auto zoom
	disableAutoZoom: false,
	
	// autoZoomEvent: String
	//		Overrides the default event listened to which invokes auto zoom
	autoZoomEvent: null,
	
	_leftImg: null,
	
	_centerImg: null,
	
	_rightImg: null,
	
	_leftSmallImg: null,
	
	_centerSmallImg: null,
	
	_rightSmallImg: null,
	
	constructor: function(){
		this._loadedImgs = [];
		
		this.panX = 0;
		this.panY = 0;
		
		this.handleLoad = dojo.hitch(this, this.handleLoad);
		this._updateAnimatedZoom = dojo.hitch(this, this._updateAnimatedZoom);
		this._updateAnimatedPan = dojo.hitch(this, this._updateAnimatedPan);
		this._onAnimPanEnd = dojo.hitch(this, this._onAnimPanEnd);
	},
	
	buildRendering: function(){
		this.inherited(arguments);
		
		this.canvas = dojo.create("canvas", {}, this.domNode);
		
		dojo.addClass(this.domNode, "mblImageView");
	},
	
	postCreate: function(){
		this.inherited(arguments);
		
		this.size = dojo.marginBox(this.domNode);
		
		dojo.style(this.canvas, {
			width: this.size.w + "px",
			height: this.size.h + "px"
		});
		this.canvas.height = this.size.h;
		this.canvas.width = this.size.w;
		
		var _this = this;
		
		var downX;
		var downY;
		this.connect(this.domNode, "onmousedown", function(event){
			if(_this.isAnimating()){
				return;
			}
			if (_this.panX) {
				_this.handleDragEnd();
			}else {
				console.log("rightImg = ", _this._rightImg, 
					"loaded=" + (_this._rightImg ? _this._rightImg._loaded : null));
				downX = event.targetTouches ? event.targetTouches[0].clientX : event.pageX;
				downY = event.targetTouches ? event.targetTouches[0].clientY : event.pageY;
			}
		});

		this.connect(this.domNode, "onmousemove", function(event){
			if(_this.isAnimating()){
				return;
			}
			if((!downX && downX !== 0) || (!downY && downY !== 0)){
				// If the touch didn'g begin on this widget, ignore the movement
				return;
			}
			
			var x = event.targetTouches ? 
						event.targetTouches[0].clientX : event.pageX;
			var y = event.targetTouches ? 
						event.targetTouches[0].clientY : event.pageY;
			
			if(_this.zoom == 1){
				// If not zoomed in, then try to move to the next or prev image
				
				_this.panX = x - downX;
				if (Math.abs(_this.panX) > 10) {
					_this.render();
				}
			}
		});
		
		this.connect(this.domNode, "onmouseout", function(event){
			if(_this.isAnimating()){
				return;
			}
			if(_this.zoom == 1 && _this.panX){
				// If not zoomed in, then try to move to the next or prev image
				
				_this.handleDragEnd();
			}
			if((!downX && downX !== 0) || (!downY && downY !== 0)){
				// If the touch didn'g begin on this widget, ignore the movement
				return;
			}
			
		});
		this.connect(this.domNode, "onmouseover", function(event){
			downX = downY = null;
		});

		// Set up AutoZoom, which zooms in a fixed amount when the user taps
		// a part of the canvas
			
			
		// Zoom in on the tapped point when the user taps the widget
		this.connect(this.domNode, "onmouseup", function(event){
			if(_this.isAnimating()){
				return;
			}
			if(downX == null || downY == null){
				return;
			}
			
			if(Math.abs(downX - event.pageX) > 14
				|| Math.abs(downY - event.pageY) > 14){
				downX = downY = null;
				_this.handleDragEnd();
				return;
			}
			downX = downY = null;
			
			if (!_this.disableAutoZoom) {
			
				if (!_this._centerImg || !_this._centerImg._loaded) {
					// Do nothing until the image is loaded
					return;
				}
				if (_this.zoom != 1) {
					_this.set("animatedZoom", 1);
					return;
				}
				
				var pos = dojo._abs(_this.domNode);
				
				// Translate the clicked point to a point on the source image
				var xRatio = _this.size.w / _this._centerImg.width;
				var yRatio = _this.size.h / _this._centerImg.height;
				
				_this.zoomTo(((event.pageX - pos.x) / xRatio) - _this.panX, ((event.pageY - pos.y) / yRatio) - _this.panY, _this.autoZoomLevel);
			}
		});
		
		// Listen for Flick events
		dojo.connect(this.domNode, "flick", this, "handleFlick");
	},
	
	isAnimating: function(){
		return this._anim && this._anim.status() == "playing";
	},
	
	handleDragEnd: function(){
		downX = downY = null;
		if(!this.panX){
			return;
		}
		
		var doMove = 
			!(Math.abs(this.panX) < this._centerImg._baseWidth / 2) &&
			(
				(this.panX > 0 && this._leftImg && this._leftImg._loaded ? 1:0) ||
				(this.panX < 0 && this._rightImg && this._rightImg._loaded ? 1:0)
			);
			
		console.log("doMove = " + doMove, "rightImg = ", this._rightImg);
		
		if(!doMove){
			this._animPanTo(0, dojo.fx.easing.expoOut, 700);
		}else{
			this.moveTo(this.panX);
		}
		
	},
	
	handleFlick: function(event){
		if(this.zoom == 1 && event.duration < 0.5){
			// Only handle quick flicks here, less than 0.5 seconds
			
			// If not zoomed in, then check if we should move to the next photo
			// or not
			if(event.direction == "ltr"){
				this.moveTo(-1);
			}else if(event.direction == "rtl"){
				this.moveTo(1);
			}
			// If an up or down flick occurs, it means nothing so ignore it
		}
	},
	
	moveTo: function(direction){
		direction = direction > 0 ? 1 : -1;
		var toImg = direction < 1 ? this._rightImg : this._leftImg;
		console.log("moveTo " + direction, toImg);
		
		this._moveDir = direction;
		var _this = this;
		
		if(toImg && toImg._loaded){
			// If the image is loaded, make a linear animation to show it
			this._animPanTo(this.size.w * direction, null, 500, function(){
				_this.panX = 0;
				
				console.log("anim end and direction = ", direction);
				if(direction < 0){
					// Moving to show the right image
					_this._switchImage("left", "right");
				}else{
					// Moving to show the left image
					_this._switchImage("right", "left");
				}
				_this._loadedImgs = [];
				var imgs = [_this._leftImg, _this._centerImg, _this._rightImg];
				for(var i = 0; i < imgs.length; i++){
					if(imgs[i] && imgs[i]._loaded){
						_this._loadedImgs.push(imgs[i]);
					}
				}
				
				_this.render();
				_this.onChange(direction * -1);
			});
			
		}else{
			// If the next image is not loaded, make an animation to
			// move the center image to half the width of the widget and back
			// again
			
			console.log("moveTo image not loaded!", toImg);
			
			this._animPanTo(0, dojo.fx.easing.expoOut, 700);
		}
	},
	
	_switchImage: function(toImg, fromImg){
		console.log("copying center to " + toImg + " and " + fromImg + " to center");
		var toSmallImgName = "_" + toImg + "SmallImg";
		var toImgName = "_" + toImg + "Img";

		var fromSmallImgName = "_" + fromImg + "SmallImg";
		var fromImgName = "_" + fromImg + "Img";
		
		this[toImgName] = this._centerImg;
		this[toSmallImgName] = this._centerSmallImg;
		
		this[toImgName]._type = toImg;
		
		if(this[toSmallImgName]){
			this[toSmallImgName]._type = toImg;
		}

		this._centerImg = this[fromImgName];
		this._centerSmallImg = this[fromSmallImgName];
		this._centerImg._type = "center";
		
		if(this._centerSmallImg){
			this._centerSmallImg._type = "center";
		}
		this[fromImgName] = this[fromSmallImgName] = null;
		
		console.log("left = ", this._leftImg, 
					"center = ",this._centerImg,
					"right=",this._rightImg);
	},
	
	_animPanTo: function(to, easing, duration, callback){
		this._anim = new dojo.Animation({
			curve: [this.panX, to],
			onAnimate: this._updateAnimatedPan,
			duration: duration || 500,
			easing: easing,
			onEnd: callback
		});
		
		this._anim.play();
		return this._anim;
	},
	
	onChange: function(direction){
		// summary:
		//		Stub function that can be listened to in order to provide
		//		new images when the displayed image changes
	},
	
	_updateAnimatedPan: function(amount){
		this.panX = amount;
		this.render();
	},
	
	_onAnimPanEnd: function(){
		this.onChange(this._moveDir);
	},
	
	zoomTo: function(centerX, centerY, zoom){
		this.set("zoomCenterX", centerX);
		this.set("zoomCenterY", centerY);
			
		this.set("animatedZoom", zoom);
	},
	
	render: function(){
		var cxt = this.canvas.getContext('2d');
		
		cxt.clearRect(0, 0, this.canvas.width, this.canvas.height);
		if(this._loadedImgs.length < 1){
			return;
		}
		
		// Check if the center image is loaded, if not show nothing at all,
		// and ignore any panning.
		
		if(!this._centerImg && !this._centerImg._loaded){
			return;
		}
		
		this._renderImg(
			this._centerSmallImg, 
			this._centerImg, 
			this.zoom == 1 ? (this.panX < 0 ? 1 : this.panX > 0 ? -1 : 0) : 0);
		
		if(this.zoom == 1 && this.panX != 0){
			if(this.panX > 0){
				// Render the left image, showing the right side of it
				this._renderImg(this._leftSmallImg, this._leftImg, 1);
			}else{
				// Render the right image, showing the left side of it
				this._renderImg(this._rightSmallImg, this._rightImg, -1);
			}
		}
	},
	
	_renderImg: function(smallImg, largeImg, panDir){
		// summary:
		//		Renders a single image
		
		
		// If zoomed, we just display the center img
		var img = (largeImg && largeImg._loaded) ? largeImg : smallImg;
		
		if(!img || !img._loaded){
			// If neither the large or small image is loaded, display nothing
			return;
		}
		var cxt = this.canvas.getContext('2d');
		
		var baseWidth = img._baseWidth;
		var baseHeight = img._baseHeight;
		
		// Calculate the size the image would be if there were no bounds
		var desiredWidth = baseWidth * this.zoom;
		var desiredHeight = baseHeight * this.zoom;

		// Calculate the actual size of the viewable image
		var destWidth = Math.min(this.size.w, desiredWidth);
		var destHeight = Math.min(this.size.h, desiredHeight);
		
		
		// Calculate the size of the window on the original image to use
		var sourceWidth = this.dispWidth = img.width * (destWidth / desiredWidth);
		var sourceHeight = this.dispHeight = img.height * (destHeight / desiredHeight);
		
		// Calculate where the center of the view should be
		var centerX = Math.floor(Math.max(sourceWidth / 2, 
				Math.min(img.width - sourceWidth / 2, this.zoomCenterX)));
		var centerY = Math.floor(Math.max(sourceHeight / 2, 
				Math.min(img.height - sourceHeight / 2, this.zoomCenterY)));
				
	
		var sourceX =  Math.max(0, 
			Math.round((img.width - sourceWidth)/2 + (centerX - img._centerX)) );
		var sourceY =  Math.max(0, 
			Math.round((img.height - sourceHeight) / 2 + (centerY - img._centerY)) 
						);
		
		var destX = Math.round(Math.max(0, this.canvas.width - destWidth)/2);
		var destY = Math.round(Math.max(0, this.canvas.height - destHeight)/2);

		var oldDestWidth = destWidth;
		var oldSourceWidth = sourceWidth;
		if(this.zoom == 1 && panDir && this.panX){
			
			if(this.panX < 0){
				if(panDir > 0){
					// If the touch is moving left, and the right side of the
					// image should be shown, then reduce the destination width
					// by the absolute value of panX
					destWidth -= Math.abs(this.panX);
					destX = 0;
				}else if(panDir < 0){
					// If the touch is moving left, and the left side of the
					// image should be shown, then set the displayed width
					// to the absolute value of panX, less some pixels for
					// a padding between images
					destWidth = Math.max(1, Math.abs(this.panX) - 5);
					destX = this.size.w - destWidth;
				}
			}else{
				if(panDir > 0){
					// If the touch is moving right, and the right side of the
					// image should be shown, then set the destination width
					// to the absolute value of the pan, less some pixels for
					// padding
					destWidth = Math.max(1, Math.abs(this.panX) - 5);
					destX = 0;
				}else if(panDir < 0){
					// If the touch is moving right, and the left side of the
					// image should be shown, then reduce the destination width
					// by the widget width minus the absolute value of panX
					destWidth -= Math.abs(this.panX);
					destX = this.size.w - destWidth;
				}
			}

			sourceWidth = Math.max(1, 
						Math.floor(sourceWidth * (destWidth / oldDestWidth)));
			
			if(panDir > 0){
				// If the right side of the image should be displayed, move
				// the sourceX to be the width of the image minus the difference
				// between the original sourceWidth and the new sourceWidth
				sourceX = (sourceX + oldSourceWidth) - (sourceWidth);
			}
			sourceX = Math.floor(sourceX);
//		}else{
//			console.log("no pan, panX = ", this.panX, "panDir=", panDir,"zoom=", this.zoom);
		}
//		console.log("panX=", this.panX,
//					"oldDestWidth = ", oldDestWidth, 
//					"destWidth", destWidth,
//					"destX", destX
//					, "oldSourceWidth=",oldSourceWidth,
//					"sourceWidth=", sourceWidth,
//					"sourceX = " + sourceX
//		);

		try {
			
			// See https://developer.mozilla.org/en/Canvas_tutorial/Using_images
			cxt.drawImage(
				img,
				Math.max(0, sourceX),
				sourceY,
				Math.min(oldSourceWidth, sourceWidth),
				sourceHeight,
				destX, 	// Xpos
				destY, // Ypos
				Math.min(oldDestWidth, destWidth), 
				destHeight
			);
		}catch(e){
			console.log("Caught Error",e,
			
					"type=", img._type,
					"oldDestWidth = ", oldDestWidth, 
					"destWidth", destWidth,
					"destX", destX
					, "oldSourceWidth=",oldSourceWidth,
					"sourceWidth=", sourceWidth,
					"sourceX = " + sourceX
			);
		}
	},

	_setZoomAttr: function(amount){
		this.zoom = Math.min(this.maxZoom, Math.max(1, amount));
		
		if(this.zoom == 1 
				&& this._centerImg 
				&& this._centerImg._loaded){
			
			if(!this.isAnimating()){
				this.zoomCenterX = this._centerImg.width / 2;
				this.zoomCenterY = this._centerImg.height / 2;
			}
			this.panX = this.panY = 0;
		}
		
		this.render();
	},
	
	_setZoomCenterXAttr: function(value){
		if(value != this.zoomCenterX){
			if(this._centerImg && this._centerImg._loaded){
				value = Math.min(this._centerImg.width, value);
			}
			this.zoomCenterX = Math.max(0, Math.round(value));
			
			console.log("set zoomCenterX based on " + this.size.w +  " and " + value);
		}
	},

	_setZoomCenterYAttr: function(value){
		if(value != this.zoomCenterY){
			if(this._centerImg && this._centerImg._loaded){
				value = Math.min(this._centerImg.height, value);
			}
			this.zoomCenterY = Math.max(0, Math.round(value));
		}
	},
	
	_setZoomCenterAttr: function(value){
		if(value.x != this.zoomCenterX || value.y != this.zoomCenterY){
			this.set("zoomCenterX", value.x);
			this.set("zoomCenterY", value.y);
			this.render();
		}
	},
	
	_setAnimatedZoomAttr: function(amount){
		if(this._anim && this._anim.status() == "playing"){
			return;
		}

		this._anim = new dojo.Animation({
			curve: [this.zoom, amount],
			onAnimate: this._updateAnimatedZoom,
			onEnd: this._onAnimEnd
		});
		
		this._anim.play();
	},
	
	_updateAnimatedZoom: function(amount){
		this._setZoomAttr(amount);
	},
	
	_setCenterUrlAttr: function(urlOrObj){
		this._setImage("center", urlOrObj);
	},
	_setLeftUrlAttr: function(urlOrObj){
		this._setImage("left", urlOrObj);
	},
	_setRightUrlAttr: function(urlOrObj){
		this._setImage("right", urlOrObj);
	},
	
	_setImage: function(name, urlOrObj){
		var smallUrl = null;
		
		var largeUrl = null;
		
		if(dojo.isString(urlOrObj)){
			// If the argument is a string, then just load the large url
			largeUrl = urlOrObj;
		} else {
			largeUrl = urlOrObj.large;
			smallUrl = urlOrObj.small;
		}
		console.log("got largeUrl " , largeUrl);
		
		if(this["_" + name + "Img"] && this["_" + name + "Img"]._src == largeUrl){
			console.log("identical image for " + name);
			return;
		} else {
			console.log("creating new image for " + name, largeUrl);
			if(this["_" + name + "Img"]){
				console.log("existing url for " + name, this["_" + name + "Img"].src);
			}
		}
		
		// Remove any previously loaded images
		for(var i = 0; i < this._loadedImgs.length; i++){
			if(this._loadedImgs[i]._type == name){
				this._loadedImgs.splice(i, 1);
				break;
			}
		}
		
		// Just do the large image for now
		var largeImg = this["_" + name + "Img"] = new Image();
		largeImg._type = name;
		largeImg._loaded = false;
		largeImg._src = largeUrl;
		largeImg._conn = dojo.connect(largeImg, "onload", this.handleLoad);
		
		largeImg.src = largeUrl;
	},
	
	handleLoad: function(evt){
		var img = evt.target;
		img._loaded = true;
		
		dojo.disconnect(img._conn);
		
		var type = img._type;
		var arr = this._loadedImgs;
		
		console.log("loaded type " + type);
		switch(type){
			case "center":
				if(arr.length < 1){
					arr.push(img);
				} else {
					arr.splice(1, 0, img);
				}
				this.zoomCenterX = img.width / 2;
				this.zoomCenterY = img.height / 2;
				break;
			case "left":
				if(arr.length > 0){
					if(arr[0]._type == type){
						arr[0] = img;
					}else{
						arr.splice(0, 0, img);
					}
				}else{
					arr.push(img);
				}
				break;
			case "right":
				if(arr.length > 0){
					if(arr[arr.length - 1]._type == type){
						arr[arr.length - 1] = img;
					}else{
						arr.push(img);
					}
				}else{
					arr.push(img);
				}
				break;
		}
		
		var height = img.height;
		var width = img.width;
		
		if(width / this.size.w < height / this.size.h){
			// Fit the height to the height of the canvas
			img._baseHeight = this.canvas.height;
			img._baseWidth = width / (height / this.size.h);
		} else {
			// Fix the width to the width of the canvas
			img._baseWidth = this.canvas.width;
			img._baseHeight = height / (width / this.size.w);
		}
		img._centerX = width / 2;
		img._centerY = height / 2;
		
		this.render();
	}
});
