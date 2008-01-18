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
	//	an Elegant, keyboard accessible, markup and store capable Lightbox widget to show images
	//	in a modal dialog-esque format. Can show individual images as Modal dialog, or can group
	//	images with multiple entry points, all using a single "master" Dialog for visualization
	//
	// example:
	// |	<a href="image1.jpg" dojoType="dojox.image.Lightbox">show lightbox</a>
	//
	// example: 
	// |	<a href="image2.jpg" dojoType="dojox.image.Lightbox" group="one">show group lightbox</a>
	// |	<a href="image3.jpg" dojoType="dojox.image.Lightbox" group="one">show group lightbox</a>
	//
	// example:	 
	// |	not implemented fully yet, though works with basic datastore access. need to manually call
	// |	widget._attachedDialog.addImage(item,"fromStore") for each item in a store result set.
	// |	<div dojoType="dojox.image.Lightbox" group="fromStore" store="storeName"></div>
	//
	// group: String
	//		Grouping images in a page with similar tags will provide a 'slideshow' like grouping of images
	group: "",

	// title: String 
	//		A string of text to be shown in the Lightbox beneath the image (empty if using a store)
	title: "",

	// href; String
	//		Link to image to use for this Lightbox node (empty if using a store).
	href: "",

	// duration: Integer
	//		Generic time in MS to adjust the feel of widget. could possibly add various 
	//		durations for the various actions (dialog fadein, sizeing, img fadein ...) 
	duration: 500,

	// _allowPassthru: Boolean
	//		Privately set this to disable/enable natural link of anchor tags
	_allowPassthru: false,
	_attachedDialog: null, // try to share a single underlay per page?

	startup: function(){
		this.inherited(arguments);
		// setup an attachment to the masterDialog (or create the masterDialog)
		var tmp = dijit.byId('dojoxLightboxDialog');
		if(tmp){
			this._attachedDialog = tmp;
		}else{
			// this is the first instance to start, so we make the masterDialog
			this._attachedDialog = new dojox.image._LightboxDialog({ id: "dojoxLightboxDialog" });
			this._attachedDialog.startup();
		}
		if(!this.store){
			// FIXME: full store support lacking, have to manually call this._attachedDialog.addImage(imgage,group) as it stands
			this._addSelf();
			this.connect(this.domNode, "onclick", "_handleClick");
		}
	},

	_addSelf: function(){
		// summary: Add this instance to the master LightBoxDialog
		this._attachedDialog.addImage({
			href: this.href,
			title: this.title
		},this.group||null);
	},

	_handleClick: function(/* Event */e){
		// summary: Handle the click on the link 
		if(!this._allowPassthru){ e.preventDefault(); }
		else{ return; }
		this.show();
	},

	show: function(){
		// summary: Show the Lightbox with this instance as the starting point
		this._attachedDialog.show(this);
	},

	disable: function(){
		// summary: Disables event clobbering and dialog, and follows natural link
		this._allowPassthru = true;
	},

	enable: function(){
		// summary: Enables the dialog (prevents default link)
		this._allowPassthru = false; 
	}

});

dojo.declare("dojox.image._LightboxDialog",
	dijit.Dialog,{
	// summary: The "dialog" shared  between any Lightbox instances on the page
	//
	// description:
	//	
	//		A widget that intercepts anchor links (typically around images) 	
	//		and displays a modal Dialog. this is the actual Popup, and should 
	//		not be created directly. 
	//
	//		There will only be one of these on a page, so all dojox.image.Lightbox's will us it
	//		(the first instance of a Lightbox to be show()'n will create me If i do not exist)
	// 
	// title: String
	// 		The current title 
	title: "",

	// FIXME: implement titleTemplate

	// inGroup: Array
	//		Array of objects. this is populated by from the JSON object _groups, and
	//		should not be populate manually. it is a placeholder for the currently 
	//		showing group of images in this master dialog
	inGroup: null,

	// imgUrl: String
	//		The src="" attrib of our imageNode (can be null at statup)
	imgUrl: "",
		
	// errorMessage: String
	// 		The text to display when an unreachable image is linked
	errorMessage: "Image not found.",

	// an array of objects, each object being a unique 'group'
	_groups: { XnoGroupX: [] },
	_imageReady: false,
	_errorImg: dojo.moduleUrl("dojox.image","resources/images/warning.png"),
	_blankImg: dojo.moduleUrl("dojo","resources/blank.gif"),

	templatePath: dojo.moduleUrl("dojox.image","resources/Lightbox.html"),

	startup: function(){
		// summary: Add some extra event handlers, and startup our superclass.
		this.inherited(arguments);

		// FIXME: these are supposed to be available in dijit.Dialog already,
		// but aren't making it over.
		this.connect(document.documentElement,"onkeypress","_handleKey");
		this.connect(window,"onresize","_position"); 

		this.connect(this.nextNode, "onclick", "_nextImage");
		this.connect(this.prevNode, "onclick", "_prevImage");
		this.connect(this.closeNode, "onclick", "hide");
		
	},

	show: function(/* Object */groupData){
		// summary: Show the Master Dialog. Starts the chain of events to show
		//		an image in the dialog, including showing the dialog if it is
		//		not already visible

		dojo.style(this.imgNode,"opacity","0"); 
		dojo.style(this.titleNode,"opacity","0");

		// we only need to call dijit.Dialog.show() if we're not already open.
		if(!this.open){ this.inherited(arguments); }
	
		this._imageReady = false; 
		
		this.imgNode.src = groupData.href;
		if((groupData.group && !(groupData == "XnoGroupX")) || this.inGroup){ 
			if(!this.inGroup){ 
				this.inGroup = this._groups[(groupData.group)];
				var i = 0;
				// determine where we were or are in the show 
				dojo.forEach(this.inGroup,function(g){
					if (g.href == groupData.href){
						this._positionIndex = i;
					}
					i++; 
				},this);
			}
			if(!this._positionIndex){ this._positionIndex=0; this.imgNode.src = this.inGroup[this._positionIndex].href; }
			this.groupCount.innerHTML = " (" +(this._positionIndex+1) +" of "+this.inGroup.length+")";
			this.prevNode.style.visibility = "visible";
			this.nextNode.style.visibility = "visible";
		}else{
			this.groupCount.innerHTML = "";
			this.prevNode.style.visibility = "hidden";
			this.nextNode.style.visibility = "hidden";
		}
		this.textNode.innerHTML = groupData.title;
		
		if(!this._imageReady || this.imgNode.complete === true){ 
			this._imgConnect = dojo.connect(this.imgNode,"onload", this, function(){
				this._imageReady = true;
				this.resizeTo({ w: this.imgNode.width, h:this.imgNode.height, duration:this.duration });
				dojo.disconnect(this._imgConnect);
				if(this._imgError){ dojo.disconnect(this._imgError); }
			});
			this._imgError = dojo.connect(this.imgNode, "onerror", this, function(){
				dojo.disconnect(this._imgError);
				dojo.disconnect(this._imgConnect);
				this.imgNode.src = this._errorImg;
				this._imgError = dojo.connect(this.imgNode,"onload",this,function(){
					dojo.disconnect(this._imgError);
					this._imageReady = true;
					this.textNode.innerHTML = this.errorMessage;
					this.resizeTo({
						w: this.imgNode.width,
						h:this.imgNode.height,
						duration:this.duration
					});
				});
			});
			// onload doesn't fire in IE if you connect before you set the src. 
			// hack to re-set the src after onload connection made:
			if(dojo.isIE){ this.imgNode.src = this.imgNode.src; }
		}else{
			// do it quickly. kind of a hack, but image is ready now
			this.resizeTo({ w: this.imgNode.width, h:this.imgNode.height, duration:1 });
		}
	},

	_nextImage: function(){
		// summary: Load next image in group
		if(!this.inGroup){ return; }
		if(this._positionIndex+1<this.inGroup.length){
			this._positionIndex++;
		}else{
			this._positionIndex = 0;
		}
		this._loadImage();
	},

	_prevImage: function(){
		// summary: Load previous image in group

		if(!this.inGroup){ return; }
		if(this._positionIndex==0){
			this._positionIndex = this.inGroup.length-1;
		}else{
			this._positionIndex--;
		}
		this._loadImage();
	},

	_loadImage: function(){
		// summary: Do the prep work before we can show another image 
		var _loading = dojo.fx.combine([
			dojo.fadeOut({ node:this.imgNode, duration:(this.duration/2) }),
			dojo.fadeOut({ node:this.titleNode, duration:(this.duration/2) })
		]);
		this.connect(_loading,"onEnd","_prepNodes");
		_loading.play(10);
	},

	_prepNodes: function(){
		// summary: A localized hook to accompany _loadImage
		this._imageReady = false; 
		this.show({
			href: this.inGroup[this._positionIndex].href,
			title: this.inGroup[this._positionIndex].title
		});
	},

	resizeTo: function(/* Object */size){
		// summary: Resize our dialog container, and fire _showImage
		var _sizeAnim = dojox.fx.sizeTo({ 
			node: this.containerNode,
			duration:size.duration||this.duration,
			width: size.w, 
			height:size.h+30 // FIXME: ugh, static num
		});
		this.connect(_sizeAnim,"onEnd","_showImage");
		_sizeAnim.play(this.duration);
	},

	_showImage: function(){
		// summary: Fade in the image, and fire showNav
		dojo.fadeIn({ node: this.imgNode, duration:this.duration,
			onEnd: dojo.hitch(this,"_showNav")
		}).play(75);
	},

	_showNav: function(){
		// summary: Fade in the footer, and setup our connections.
		dojo.fadeIn({ node: this.titleNode, duration:200 }).play(25);
	},

	hide: function(){
		// summary: Hide the Master Lightbox
		dojo.fadeOut({node:this.titleNode, duration:200,
			onEnd: dojo.hitch(this,function(){
				// refs #5112 - if you _don't_ change the .src, safari will _never_ fire onload for this image
				this.imgNode.src = this._blankImg; 
			}) 
		}).play(25); 
		this.inherited(arguments);
		this.inGroup = null;
		this._positionIndex = null;
	},

	addImage: function(/* object */child, group){
		// summary: Add an image to this Master Lightbox
		// 
		// child.href: String - link to image (required)
		// child.title: String - title to display
		//
		// group: String? - attach to group of similar tag
		//	or null for individual image instance

		var g = group;
		if(!child.href){ return; }
		if(g){ 	
			if(this._groups[(g)]){
				this._groups[(g)].push(child); 
			}else{
				this._groups[(g)] = [(child)];
			}
		}else{ this._groups["XnoGroupX"].push(child); }
	},

	_handleKey: function(/* Event */e){
		// summary: Handle keyboard navigation
		if(!this.open){ return; }

		var dk = dojo.keys;
		var key = (e.charCode == dk.SPACE ? dk.SPACE : e.keyCode);
		switch(key){
			case dk.ESCAPE: this.hide(); break;

			case dk.DOWN_ARROW:
			case dk.RIGHT_ARROW:
			case 78: // key "n"
				this._nextImage(); break;

			case dk.UP_ARROW:
			case dk.LEFT_ARROW:
			case 80: // key "p" 
				this._prevImage(); break;
		}
	}
});
