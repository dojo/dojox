dojo.provide("dojox.widget.Standby");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dojo.fx");

dojo.experimental("dojox.widget.Standby");

dojo.declare("dojox.widget.Standby",[dijit._Widget, dijit._Templated],{
	//	summary:
	//		A widget designed to act as a Standby/Busy/Disable/Blocking widget to indicate a 
	//		particular DOM node is processing and cannot be clicked on at this time.
	//		This widget uses absolute positioning to apply the overlay and image.
	// 
	//	image:	
	//		A URL to an image to center within the blocking overlay.  The default is a basic spinner.
	//
	//	imageText:
	//		Text to set on the ALT tag of the image.  The default is 'Please wait...'
	//
	//	color:
	//		The color to use for the translucent overlay.  Text string such as: darkblue, #FE02FD, etc.
	templatePath: dojo.moduleUrl("dojox", "widget/Standby/Standby.html"),

	_underlayNode: null,	//The node that is the translucent underlay for the image that blocks access to the target.

	_imageNode: null,		// The image node where we attach and define the image to display.

	image: dojo.moduleUrl("dojox", "widget/Standby/images/loading.gif").toString(), //The image

	imageText: "Please Wait...", //Text for the ALT tag.

	_displayed: false, //display status

	_resizeCheck: null, //Handle to interval function that chects the target for changes.
	
	target: "", //The target to overlay when active.  Can be a widget id or a dom id.  The widget will try to get the dom node from it.

	color: "#C0C0C0",  //Default color for the translucent overlay.  (light gray.)

	startup: function(args){
		//	summary:
		//		Over-ride of the basic widget startup function.  Configures the target node and sets the image to use.
		if(typeof this.target === "string"){
			var w = dijit.byId(this.target);
			if(w){
				this.target = w.domNode;
			}else{
				this.target = dojo.byId(this.target);
			}
		}
		dojo.style(this._underlayNode, "display", "none");
		dojo.style(this._imageNode, "display", "none");
		dojo.style(this._underlayNode, "backgroundColor", this.color);
		dojo.attr(this._imageNode, "src", this.image);
		dojo.attr(this._imageNode, "alt", this.imageText);
		this.connect(this._underlayNode, "onclick", "_ignore");
	},

	show: function() {
		//	summary:
		//		Function to display the blocking overlay and busy/status icon
		if(!this._displayed){
			this._displayed = true;
			this._size();
			this._fadeIn();
		}
	},

	hide: function(){
		//	summary:
		//		Function to hide the blocking overlay and status icon.
		if(this._displayed){
			this._size();
			this._fadeOut();
			this._displayed = false;
			if (this._resizeCheck !== null) {
				clearInterval(this._resizeCheck);
				this._resizeCheck = null;
			}
		}
	},

	_size: function(){
		//	summary:
		//		Internal function that handles resizing the overlay and centering of the image on window resizing.
		if(this._displayed){
			//Gotta show, then hide the image, but with a huge negative zindex, shouldn't actually show up on anything (I hope).
			var curStyle = dojo.style(this._imageNode, "display"); 
			dojo.style(this._imageNode, "display", "block");
			var box = dojo.coords(this.target);
			var img = dojo.marginBox(this._imageNode);
			dojo.style(this._imageNode, "display", curStyle);
 			dojo.style(this._imageNode, "zIndex", "1000");

			//Need scroll positions as it needs to alter ABS positioning.
			var sVal = dojo._docScroll();
			if(!sVal){
				sVal = {x:0,y:0};
			}

			//Address margins as they shift the position..
			var marginLeft = dojo.style(this.target, "marginLeft");
			if(dojo.isWebkit||dojo.isSafari||dojo.isChrome){
				//Safari and others work differently here.  Needs to be doubled.
				//Don't ask me why. :)
				marginLeft = marginLeft*2;
			}
			if(marginLeft){
				box.w = box.w - marginLeft;
			}
			if (!(dojo.isSafari||dojo.isWebKit||dojo.isChrome)) {
				//Safari and others work differently here.  
				var marginRight = dojo.style(this.target, "marginRight");
				if(marginRight){
					box.w = box.w - marginRight;
				}
			}
			var marginTop = dojo.style(this.target, "marginTop");
			if(marginTop){
				box.h = box.h - marginTop;
			}
			var marginBottom = dojo.style(this.target, "marginBottom");
			if(marginBottom){
				box.h = box.h - marginBottom;
			}

			if(box.h > 0 && box.w > 0){
				//Set position and size of the blocking div overlay.
				dojo.style(this._underlayNode, "width", box.w + "px");
				dojo.style(this._underlayNode, "height", box.h + "px");
				dojo.style(this._underlayNode, "top", (box.y + sVal.y) + "px");
				dojo.style(this._underlayNode, "left", (box.x + sVal.x) + "px");

				///Clone any curving if possible.
				dojo.style(this._underlayNode, "borderRadius", dojo.style(this.target, "borderRadius"));
				dojo.style(this._underlayNode, "borderTopLeftRadius", dojo.style(this.target, "borderTopLeftRadius"));
				dojo.style(this._underlayNode, "borderTopRightRadius", dojo.style(this.target, "borderTopRightRadius"));
				dojo.style(this._underlayNode, "borderBottomLeftRadius", dojo.style(this.target, "borderBottomLeftRadius"));
				dojo.style(this._underlayNode, "borderBottomRightRadius", dojo.style(this.target, "borderBottomRightRadius"));
				if(!dojo.isIE){
					dojo.style(this._underlayNode, "MozBorderRadius", dojo.style(this.target, "MozBorderRadius"));
					dojo.style(this._underlayNode, "MozBorderRadiusTopleft", dojo.style(this.target, "MozBorderRadiusTopleft"));
					dojo.style(this._underlayNode, "MozBorderRadiusTopright", dojo.style(this.target, "MozBorderRadiusTopright"));
					dojo.style(this._underlayNode, "MozBorderRadiusBottomleft", dojo.style(this.target, "MozBorderRadiusBottomleft"));
					dojo.style(this._underlayNode, "MozBorderRadiusBottomright", dojo.style(this.target, "MozBorderRadiusBottomright"));
					dojo.style(this._underlayNode, "WebkitBorderRadius", dojo.style(this.target, "WebkitBorderRadius"));
					dojo.style(this._underlayNode, "WebkitBorderTopLeftRadius", dojo.style(this.target, "WebkitBorderTopLeftRadius"));
					dojo.style(this._underlayNode, "WebkitBorderTopRightRadius", dojo.style(this.target, "WebkitBorderTopRightRadius"));
					dojo.style(this._underlayNode, "WebkitBorderBottomLeftRadius", dojo.style(this.target, "WebkitBorderBottomLeftRadius"));
					dojo.style(this._underlayNode, "WebkitBorderBottomRightRadius", dojo.style(this.target, "WebkitBorderBottomRightRadius"));
				}
				var imgTop = (box.h/2) - (img.h/2);
				var imgLeft = (box.w/2) - (img.w/2);
				dojo.style(this._imageNode, "top", (imgTop + box.y + sVal.y) + "px");
				dojo.style(this._imageNode, "left", (imgLeft + box.x + sVal.x) + "px");
				dojo.style(this._underlayNode, "display", "block");
				dojo.style(this._imageNode, "display", "block");
			}else{
				//Target has no size, display nothing on it!
				dojo.style(this._underlayNode, "display", "none");
				dojo.style(this._imageNode, "display", "none");
			}
			if (this._resizeCheck === null) {
				//Set an interval timer that checks the target size and scales as needed.
				//Checking every 10th of a second seems to generate a fairly smooth update.
				var self = this;
				this._resizeCheck = setInterval(function(){self._size();}, 100);
			}
		}
	},

	_fadeIn: function(){
		//	summary:
		//		Internal function that does the opacity style fade in animation.
		var underlayNodeAnim = dojo.animateProperty({node: this._underlayNode, properties: {opacity: {start: 0, end: 0.75}}});
		var imageAnim = dojo.animateProperty({node: this._imageNode, properties: {opacity: {start: 0, end: 1}}});
		var anim = dojo.fx.combine([underlayNodeAnim,imageAnim]);
		anim.play();
	},

	_fadeOut: function(){
		//	summary:
		//		Internal function that does the opacity style fade out animation.
		var self = this;
		var underlayNodeAnim = dojo.animateProperty({
			node: this._underlayNode, 
			properties: {opacity: {start: 0.75, end: 0}},
			onEnd: function() {
				dojo.style(self._underlayNode, "display", "none");
			}
		});
		var imageAnim = dojo.animateProperty({
			node: this._imageNode, 
			properties: {opacity: {start: 1, end: 0}},
			onEnd: function() {
				dojo.style(self._imageNode, "display", "none");
			}
		});
		var anim = dojo.fx.combine([underlayNodeAnim,imageAnim]);
		anim.play();
	},

	_ignore: function(event){
		 if(event){
			 event.preventDefault();
			 event.stopPropagation();
		 }
	}
});	
