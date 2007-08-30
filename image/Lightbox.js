dojo.provide("dojox.image.Lightbox");
dojo.experimental("dojox.image.Lightbox");

dojo.require("dijit.Dialog"); 
dojo.require("dojox.fx");

dojo.declare("dojox.image.Lightbox",
	dijit._Widget,{
	// summary:
	//	a dojo-based Lightbox implementation. 
	//
	// description:
	//	
	//	
	//
	// examples:
	//
	//
	//

	// group: String
	//	grouping images in a page with similar tags will provide a 'slideshow' like grouping of images
	group: "",

	// title: String 
	//	A string of text to be shown in the Lightbox beneath the image
	title: "",

	// href; String
	//	link to image to use for this Lightbox node (empty if using a store).
	href: "",

	// duration: Integer
	//	generic time in MS to adjust the feel of widget. could possibly add various 
	//	durations for the various actions (dialog fadein, sizeing, img fadein ...) 
	duration: 500,

	// _allowPassthru: Boolean
	//	privately set this to disable/enable natural link of anchor tags
	_allowPassthru: false,
	_attachedDialog: null, // try to share a single underlay per page?

	startup: function(){
		dojox.image.Lightbox.superclass.startup.call(this);
		if (!this.store){
			this._clickConnect = dojo.connect(this.domNode,"onclick",this,"_handleClick");
		}

		// setup an attachment to the masterDialog (or create the masterDialog)
		var tmp = dijit.byId('dojoxLightboxDialog');
		if (tmp){
			this._attachedDialog = tmp;
		}else{
			// this is the first instance to start, so we make the masterDialog
			this._attachedDialog = new dojox.image._LightboxDialog({ id: "dojoxLightboxDialog" });
			this._attachedDialog.startup();
		}
		this._addSelf();
	},

	_addSelf: function(){
		this._attachedDialog.addImage({
			href: this.href,
			title: this.title
		},this.group||null);
	},

	_handleClick: function(/* Event */e){
		// summary: handle the click on the link 

		// allow natural link to be followed (via this.disable())
		if(!this._allowPassthru){ e.preventDefault(); }
		else{ return; }
		this.show();
	},

	show: function(){
		this._attachedDialog.imgUrl = this.href; 
		this._attachedDialog.show(this);
	},

	addGroupImage: function(/* Object */image){
		// summary
		this._attachedDialog._groups.push(image);
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

dojo.declare("dojox.image._LightboxDialog",
	dijit.Dialog,{
	//
	// Description:
	//	
	//	a widget that intercepts anchor links (typically around images) 	
	//	and displays a modal Dialog. this is the actual Popup, and should 
	//	not be created directly. 
	//
	//	there will only be one of these on a page, so all dojox.image.Lightbox's will us it
	//	(the first instance of a Lightbox to be show()'n will create me If i do not exist)
	// 
	//	note: the could be the ImagePane i was talking about?

	templatePath: dojo.moduleUrl("dojox.image","resources/Lightbox.html"),

	// caption: String
	// 	the current caption 
	title: "",

	// inGroup: Array
	//	of objects. this is populated by from the JSON object _groups
	inGroup: null,

	// imgUrl: String
	//	the src="" attrib of our imageNode (can be null at statup)
	imgUrl: "",

	// an array of objects, each object being a unique 'group'
	_groups: { XnoGroupX: [] },
	_imageReady: false,
	_connects: [],	

	startup: function(){

		dojox.image._LightboxDialog.superclass.startup.call(this);

		// FIXME: these are supposed to be available in dijit.Dialog already,
		// but aren't making it over.
		dojo.connect(document.documentElement,"onkeypress",this,"_handleKey");
		dojo.connect(window,"onresize",this,"_position"); 

		dojo.connect(this.nextNode,"onclick",this,"_nextImage");
		dojo.connect(this.prevNode,"onclick",this,"_prevImage");
		dojo.connect(this.closeNode,"onclick",this,"hide");
		
	},

	show: function(/* Object */groupData){
		// summary: starts the chain of events to show an image in the dialog

		this._connects = [];

		dojo.style(this.imgNode,"opacity","0"); 
		dojo.style(this.titleNode,"opacity","0");

		// we only need to call dijit.Dialog.show() if we're not already open?
		if (!this.open){ dojox.image._LightboxDialog.superclass.show.call(this); }
	
		this._imageReady = false; 

		this.imgNode.src = groupData.href;
		if ((groupData.group && !(groupData == "XnoGroupX")) || this.inGroup){ 
			if (!this.inGroup){ 
				this.inGroup = this._groups[(groupData.group)]; 
				var i = 0;
				dojo.forEach(this.inGroup,function(g){
					if (g.href == groupData.href){
						this._positionIndex = i;
					}
					i++; 
				},this);
			}
			this.groupCount.innerHTML = " (" +(this._positionIndex+1) +" of "+this.inGroup.length+")";
			this.prevNode.style.visibility = "visible";
			this.nextNode.style.visibility = "visible";
		}else{
			this.groupCount.innerHTML = "";
			this.prevNode.style.visibility = "hidden";
			this.nextNode.style.visibility = "hidden";
		}
		this.textNode.innerHTML = groupData.title;
	
		// our image preloader
		if (!this._imageReady){ 
			this._imgConnect = dojo.connect(this.imgNode,"onload",dojo.hitch(this,function(){
				this._imageReady = true;
				this.resizeTo({ w: this.imgNode.width, h:this.imgNode.height, duration:this.duration });
				dojo.disconnect(this._imgConnect);
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
		this._loadImage();
	},

	_prevImage: function(){
		// summary: load previous image in group
		if (this._positionIndex==0){
			this._positionIndex = this.inGroup.length-1;
		}else{
			this._positionIndex--;
		}
		this._loadImage();
	},

	_loadImage: function(){
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
		this.show({
			href: this.inGroup[this._positionIndex].href,
			title: this.inGroup[this._positionIndex].title
		});
	},

	resizeTo: function(/* Object */size){
		// summary: resize our dialog container, and fire showImage
		var _sizeAnim = dojox.fx.sizeTo({ node: this.containerNode, duration:size.duration, 
			width: size.w, height:size.h+30
		});
		dojo.connect(_sizeAnim,"onEnd",this,"showImage");
		_sizeAnim.play(this.duration);
	},

	showImage: function(){
		// summary: fade in the image, and fire showNav
		dojo.fadeIn({ node: this.imgNode, duration:this.duration,
			onEnd: dojo.hitch(this,"showNav")
		}).play(75);
	},

	showNav: function(){
		// summary: fade in the footer, and setup our connections.
		dojo.fadeIn({ node: this.titleNode, duration:200 }).play(25);
	},

	hide: function(e){
		// summary: close the Lightbox
		
		dojo.fadeOut({node:this.titleNode, duration:200 }).play(25); 
		dojox.image._LightboxDialog.superclass.hide.call(this);
		//dojo.disconnect(this.imageReady);
		dojo.forEach(this._connects,function(c){ dojo.disconnect(c); });
		this.inGroup = null;
		this._positionIndex = null;
		

	},

	addImage: function(/* object */child,/* String? */group){
		if (group){ 	
			if(this._groups[(group)]){ this._groups[group].push(child); 
			}else{ this._groups[(group)] = [child]; }
		}else{ this._groups["XnoGroupX"].push(child); }
	},

	_handleKey: function(/* Event */evt){
		if(!this.open){ return; }
		var key = (evt.charCode == dojo.keys.SPACE ? dojo.keys.SPACE : evt.keyCode);
		switch(key){
			case dojo.keys.ESCAPE: this.hide(); break;

			case dojo.keys.DOWN_ARROW:
			case dojo.keys.RIGHT_ARROW:
			case 78: // key "n"
				this._nextImage(); break;

			case dojo.keys.UP_ARROW:
			case dojo.keys.LEFT_ARROW:
			case 80: // key "p" 
				this._prevImage(); break;
		}

	}
});
