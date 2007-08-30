dojo.provide("dojox.image.LightBox");
dojo.experimental('dojox.image.LightBox');

dojo.require("dijit.Dialog"); 
dojo.require("dojox.fx");

dojo.declare("dojox.image.LightBox",
	dijit._Widget,{

	// group: String
	//	TODO:
	//	group sibling (global) images with this string to provide next/prev navigation
	//	within the group (default: null, single LightBox)
	group: "",
	store: "", // ?

	// caption: String 
	//	A string of text to be shown in the LightBox beneath the image
	caption: "",

	// duration: Integer
	//	generic time in MS to adjust the feel of widget. could possibly add various 
	//	durations for the various actions (dialog fadein, sizeing, img fadein ...) 
	duration: 500,

	_allowPassthru: false,
	_attachedDialog: null, // try to share a single underlay per page?

	startup: function(){
		dojox.image.LightBox.superclass.startup.call(this);
		this._clickConnect = dojo.connect(this.domNode,"onclick",this,"_handleClick");
		if (this.store){
			this._attachedDialog = new dojox.image._LightBoxDialog({
				store: this.store,
				duration: this.duration,
			});
			this._attachedDialog.startup();
		}
	},

	_handleClick: function(/* Event */e){
		// summary: handle the click on the link 

		// allow natural link to be followed (via this.disable())
		if(!this._allowPassthru){ e.preventDefault(); }
		else{ return; }

		// setup an attached dialog
		if(!this._attachedDialog){			
			this._attachedDialog = new dojox.image._LightBoxDialog({
				imgUrl: this.domNode.href, // the link better be an image ;) (or null?)
				caption: this.caption,
				group: this.group,
				duration: this.duration
			});
			this._attachedDialog.startup();
		}
		this._attachedDialog.show();
	},

	addGroupImage: function(/* Object */image){
		// summary
		this._attachedDialog.inGroup.push(image);
	},

	disable: function(){
		// summary, disables event clobbering and dialog, and follows natural link
		this._allowPassthru = true;
	},

	enable: function(){
		// summary: enables the dialog (prevents default link)
		this._allowPassthru = false; 
	}

});

dojo.declare("dojox.image._LightBoxDialog",
	dijit.Dialog,{
	//
	// Description:
	//	
	//	a widget that intercepts anchor links (typically around images) 	
	//	and displays a modal Dialog. this is the actual Popup, and should 
	//	not be created directly. 
	// 

	templatePath: dojo.moduleUrl("dojox.image","resources/LightBox.html"),

	// caption: String
	// 	the current caption 
	caption: "",

	// inGroup: Array
	//	of objects. this is populated by dojo.query when being parsed. there is currently not
	//	a way to programatically create a group ImageDialog :(
	inGroup: [],
	imgUrl: "",

	_imageReady: false,
	_connects: [],	

	startup: function(){
		// summary: handle grouping and setup in startup
		if (this.group || this.store){ 
			// FIXME:
			// else, if there isn't a master-dialog yet for this group, make it, and disable the groups
			// on other dialogs so that we only size around this one, and use _loadImg? maybe a better way?
			this._connects.push(dojo.connect(this.nextNode,"onclick",this,"_nextImage"));
			this._connects.push(dojo.connect(this.prevNode,"onclick",this,"_prevImage"));
			if(this.group){ // preserve basic markup grouping.
				var _this = this; var i=0;
				dojo.query('a[group="'+this.group+'"]').forEach(function(n){
					if(_this.imgUrl == n.href){ 
						_this._positionIndex = i;
					}
					var ne = { caption: n.getAttribute('caption'), group: _this.group, href: n.href };
					_this.inGroup.push(ne);
					i++;
				}); 
			}else if(this.store){
				this._positionIndex = 0;
				//this._loadImage(this.inGroup[this._positionIndex]);
			}
		}else{  // this is a sigle image dialog
			this.nextNode.style.display = "none";
			this.prevNode.style.display = "none";
		}
		dojox.image._LightBoxDialog.superclass.startup.call(this,arguments);
	},

	show: function(){
		// summary: starts the chain of events to show an image in the dialog

		// if (!this.imgUrl){ this._loadImage(this.inGroup[this._positionIndex]); }

		dojo.style(this.imgNode,"opacity","0"); 
		dojo.style(this.titleNode,"opacity","0");

		// we only need to call dijit.Dialog.show() if we're not already open
		if (!this.open) {
			dojox.image._LightBoxDialog.superclass.show.call(this,arguments);
		}

		// our image preloader
		var _this = this;
		if (!this._imageReady){ 
			this._imgConnect = dojo.connect(this.imgNode,"onload",dojo.hitch(function(){
				_this._imageReady = true;
				_this.resizeTo({ w: _this.imgNode.width, h:_this.imgNode.height, duration:_this.duration });
				dojo.disconnect(_this._imgConnect);
			}));
		}else{
			// do it quickly. kind of a hack, but image is ready now
			this.resizeTo({ w: this.imgNode.width, h:this.imgNode.height, duration:1 });
		}
	},

	_nextImage: function(){
		// summary: load next image in group
		if (this._positionIndex+1<this.inGroup.length){
			this._positionIndex++;
		}else{
			this._positionIndex = 0;
		}
		url = this.inGroup[this._positionIndex].href;
		this._loadImage(url);
	},

	_prevImage: function(){
		// summary: load previous image in group
		if (this._positionIndex==0){
			this._positionIndex = this.inGroup.length-1;
		}else{
			this._positionIndex--;
		}
		url = this.inGroup[this._positionIndex].href;
		this._loadImage(url);
		this.imgUrl = url;
	},

	_loadImage: function(/* String */img){
		// summary: do the prep work before we can show another image 
		var _loading = dojo.fx.combine([
			dojo.fadeOut({ node:this.imgNode, duration:(this.duration/2) }),
			dojo.fadeOut({ node:this.titleNode, duration:(this.duration/2) })
		]);
		dojo.connect(_loading,"onEnd",this,"_prepNodes");
		_loading.play(25);
	},

	_prepNodes: function(){
		// summary: a localized hook to accompany _loadImage
		this._imageReady = false; 
		this.imgNode.src = this.inGroup[this._positionIndex].href;
		this.textNode.innerHTML = this.inGroup[this._positionIndex].caption + " (" +(this._positionIndex+1) +" of "+this.inGroup.length+")";
		this.show();
	},

	resizeTo: function(/* Object */size){
		// summary: resize our dialog container
		var _sizeAnim = dojox.fx.sizeTo({ node: this.containerNode, duration:size.duration, 
			width: size.w, height:size.h+30
		});
		dojo.connect(_sizeAnim,"onEnd",this,"showImage");
		_sizeAnim.play(75);
	},

	showImage: function(){
		// summary: fade in the image
		dojo.fadeIn({ node: this.imgNode, duration:this.duration,
			onEnd: dojo.hitch(this,"showNav")
		}).play(75);
	},

	showNav: function(){
		// summary: fade in the footer
		dojo.fadeIn({ node: this.titleNode, duration:200 }).play(25);
		this._closeClick = dojo.connect(this.closeNode,"onclick",this,"hide");
	},

	hide: function(e){
		// summary: close the LightBox
		dojox.image._LightBoxDialog.superclass.hide.call(this);
		dojo.fadeOut({node:this.titleNode, duration:200 }).play(25); 
		dojo.disconnect(this._closeClick); 
		dojo.disconnect(this.imageReady);
	}
});
