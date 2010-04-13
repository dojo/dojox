dojo.provide("dojox.mobile.compat");
dojo.require("dojo.fx");
dojo.require("dojox.fx.flip");

// summary:
//		CSS3 compatibility module
// description:
//		This module provides support for some of the CSS3 features to djMobile
//		for non-CSS3 browsers, such as IE or Firefox.
//		If you load this module, it directly replaces some of the methods of
//		djMobile instead of subclassing. This way, html pages remains the same
//		regardless of whether this compatibility module is used or not.
//		Recommended usage is as follows. the code below loads dojox.mobile.compat
//		only when isWebKit is true.
//
//		dojo.require("dojox.mobile");
//		dojo.requireIf(!dojo.isWebKit, "dojox.mobile.compat");
//
//		This module also loads compatibility CSS files, which has -compat.css
//		suffix. You should use the <link> tag instead of @import to load theme
//		CSS files. Then, this module searches for the <link> tags and loads
//		compatibility CSS files. For example, if you load iphone.css with a
//		link tag, this module automatically loads iphone-compat.css.
//		Of course, you can explicitly load iphone.css and iphone-compat.css
//		with the @import rule if you would like.

dojo.extend(dojox.mobile.View, {
	_doTransition: function(fromNode, toNode, transition, dir){
		var anim;
		this.wakeUp(toNode);
		if(!transition || transition == "none"){
			toNode.style.display = "";
			fromNode.style.display = "none";
			toNode.style.position = "absolute";
			toNode.style.left = "0px";
			this.invokeCallback();
		}else if(transition == "slide"){
			toNode.style.display = "";
			var w = fromNode.offsetWidth;
			var s1 = dojo.fx.slideTo({
				node: fromNode,
				duration: 300,
				left: -w*dir,
				top: fromNode.offsetTop
			});
			var s2 = dojo.fx.slideTo({
				node: toNode,
				duration: 300,
				left: 0
			});
			toNode.style.position = "absolute";
			toNode.style.left = w*dir + "px";
			anim = dojo.fx.combine([s1,s2]);
			dojo.connect(anim, "onEnd", this, function(){
				fromNode.style.display = "none";
				this.invokeCallback();
			});
			anim.play();
		}else if(transition == "flip"){
			anim = dojox.fx.flip({ 
				node: fromNode,
				dir: "right",
				depth: 0.5,
				duration: 400
			});
			toNode.style.position = "absolute";
			toNode.style.left = "0px";
			dojo.connect(anim, "onEnd", this, function(){ 
				fromNode.style.display = "none";
				toNode.style.display = "";
				this.invokeCallback();
			});
			anim.play(); 
		}else if(transition == "fade"){
			toNode.style.display = "";
			anim = dojo.fx.chain([
				dojo.fadeOut({
					node: fromNode,
					duration: 600
				}),
				dojo.fadeIn({
					node: toNode,
					duration: 600
				})
			]);
			toNode.style.position = "absolute";
			toNode.style.left = "0px";
			dojo.style(toNode, "opacity", 0);
			dojo.connect(anim, "onEnd", this, function(){
				fromNode.style.display = "none";
				dojo.style(fromNode, "opacity", 1);
				this.invokeCallback();
			});
			anim.play();
		}
	},

	wakeUp: function(node){
		// summary:
		//		Function to force IE to redraw a node since its layout code tends to misrender
		//		in partial draws.
		//	node:
		//		The node to forcibly redraw.
		// tags:
		//		public
		if(dojo.isIE && !node._wokeup){
			node._wokeup = true;
			var disp = node.style.display;
			node.style.display = "";
			var nodes = node.getElementsByTagName("*");
			for(var i = 0, len = nodes.length; i < len; i++){
				var val = nodes[i].style.display;
				nodes[i].style.display = "none";
				nodes[i].style.display = "";
				nodes[i].style.display = val;
			}
			node.style.display = disp;
		}
	},

	_loadCss: function (/*String|Array*/files){
		// summary:
		//		Function to load and register CSS files with the page
		//	files: String|Array
		//		The CSS files to load and register with the page.
		// tags:
		//		private
		if(!dojo.global._loadedCss){dojo.global._loadedCss = {};}
		if(!dojo.isArray(files)){ files = [files]; }
		for(var i = 0; i < files.length; i++){
			var file = files[i];
			if(!dojo.global._loadedCss[file]){
				dojo.global._loadedCss[file] = true;
				if(dojo.doc.createStyleSheet){
					// for some reason, IE hangs when you try to load
					// multiple css files almost at once.
					setTimeout(function(file){
						return function(){
							dojo.doc.createStyleSheet(file);
						};
					}(file), 0);
				}else{
					var link = dojo.doc.createElement("link");
					link.href = file;
					link.type = "text/css";
					link.rel = "stylesheet";
					var head = dojo.doc.getElementsByTagName('head')[0];
					head.appendChild(link);
				}
			}
		}
	}
});

dojo.extend(dojox.mobile.Switch, {
	buildRendering: function(){
		// summary:
		//		Function to simulate the mobile device style switches on
		//		browsers such as IE and FireFox.
		// tags:
		//		protected
		this.domNode = this.srcNodeRef || dojo.doc.createElement("DIV");
		this.domNode.className = "mblSwitch";
		this.domNode.innerHTML =
			  '<div class="mblSwitchInner">'
			+   '<div class="mblSwitchBg mblSwitchBgLeft">'
			+     '<div class="mblSwitchCorner mblSwitchCorner1T"></div>'
			+     '<div class="mblSwitchCorner mblSwitchCorner2T"></div>'
			+     '<div class="mblSwitchCorner mblSwitchCorner3T"></div>'
			+     '<div class="mblSwitchText mblSwitchTextLeft">'+this.leftLabel+'</div>'
			+     '<div class="mblSwitchCorner mblSwitchCorner1B"></div>'
			+     '<div class="mblSwitchCorner mblSwitchCorner2B"></div>'
			+     '<div class="mblSwitchCorner mblSwitchCorner3B"></div>'
			+   '</div>'
			+   '<div class="mblSwitchBg mblSwitchBgRight">'
			+     '<div class="mblSwitchCorner mblSwitchCorner1T"></div>'
			+     '<div class="mblSwitchCorner mblSwitchCorner2T"></div>'
			+     '<div class="mblSwitchCorner mblSwitchCorner3T"></div>'
			+     '<div class="mblSwitchText mblSwitchTextRight">'+this.rightLabel+'</div>'
			+     '<div class="mblSwitchCorner mblSwitchCorner1B"></div>'
			+     '<div class="mblSwitchCorner mblSwitchCorner2B"></div>'
			+     '<div class="mblSwitchCorner mblSwitchCorner3B"></div>'
			+   '</div>'
			+   '<div class="mblSwitchKnobContainer">'
			+     '<div class="mblSwitchCorner mblSwitchCorner1T"></div>'
			+     '<div class="mblSwitchCorner mblSwitchCorner2T"></div>'
			+     '<div class="mblSwitchCorner mblSwitchCorner3T"></div>'
			+     '<div class="mblSwitchKnob"></div>'
			+     '<div class="mblSwitchCorner mblSwitchCorner1B"></div>'
			+     '<div class="mblSwitchCorner mblSwitchCorner2B"></div>'
			+     '<div class="mblSwitchCorner mblSwitchCorner3B"></div>'
			+   '</div>'
			+ '</div>';
		var n = this.inner = this.domNode.firstChild;
		this.left = n.childNodes[0];
		this.right = n.childNodes[1];
		this.knob = n.childNodes[2];

		dojo.addClass(this.domNode, (this.value == "on") ? "mblSwitchOn" : "mblSwitchOff");
		this[this.value == "off" ? "left" : "right"].style.display = "none";
	},

	_changeState: function(/*String*/state){
		// summary:
		//		Function to toggle the switch state on the switch
		// state:
		//		Thhe state to toggle, switch 'on' or 'off'
		// tags:
		//		private
		if(!this.inner.parentNode || !this.inner.parentNode.tagName){
			dojo.addClass(this.domNode, (state == "on") ? "mblSwitchOn" : "mblSwitchOff");
			return;
		}
		var pos;
		if(this.inner.offsetLeft == 0){ // currently ON
			if(state == "on"){ return; }
			pos = -53;
		}else{ // currently OFF
			if(state == "off"){ return; }
			pos = 0;
		}

		var a = dojo.fx.slideTo({
			node: this.inner,
			duration: 500,
			left: pos
		});
		var _this = this;
		dojo.connect(a, "onEnd", function(){
			_this[state == "off" ? "left" : "right"].style.display = "none";
		});
		a.play();
	}
});

if(dojo.isIE){

dojo.extend(dojox.mobile.RoundRect, {
	buildRendering: function(){
		// summary:
		//		Function to simulate the borderRadius appearance on IE, since
		//		IE does not support this CSS style.
		// tags:
		//		protected
		dojox.mobile.createRoundRect(this);
		this.domNode.className = "mblRoundRect";
	}
});

dojo.extend(dojox.mobile.RoundRectList, {
	buildRendering: function(){
		// summary:
		//		Function to simulate the borderRadius appearance on IE, since
		//		IE does not support this CSS style.
		// tags:
		//		protected
		dojox.mobile.createRoundRect(this, true);
		this.domNode.className = "mblRoundRectList";
	},

	postCreate: function(){
		this.redrawBorders();
	},

	redrawBorders: function(){
		// summary:
		//		Function to adjust the creation of RoundRectLists on IE.
		//		Removed undesired styles.
		// tags:
		//		public

		// Remove a border of the last ListItem.
		// This is for browsers that do not support the last-child CSS pseudo-class.

		var lastChildFound = false;
		for(var i = this.containerNode.childNodes.length - 1; i >= 0; i--){
			var c = this.containerNode.childNodes[i];
			if(c.tagName == "LI"){
				c.style.borderBottomStyle = lastChildFound ? "solid" : "none";
				lastChildFound = true;
			}
		}
	}
});

dojo.mixin(dojox.mobile, {
	createRoundRect: function(_this, isList){
		// summary:
		//		Function to adjust the creation of rounded rectangles on IE.
		//		Deals with IE's lack of borderRadius support
		// tags:
		//		public
		_this.domNode = dojo.doc.createElement("DIV");
		_this.domNode.style.padding = "0px";
		_this.domNode.style.backgroundColor = "transparent";
		_this.domNode.style.borderStyle = "none";
		_this.containerNode = dojo.doc.createElement(isList?"UL":"DIV");
		_this.containerNode.className = "mblRoundRectContainer";
		_this.srcNodeRef.parentNode.replaceChild(_this.domNode, _this.srcNodeRef);
		_this.domNode.appendChild(_this.containerNode);

		var i;
		for(i = 0, len = _this.srcNodeRef.childNodes.length; i < len; i++){
			_this.containerNode.appendChild(_this.srcNodeRef.removeChild(_this.srcNodeRef.firstChild));
		}
		_this.srcNodeRef = null;

		for(i = 0; i <= 5; i++){
			var top = dojo.create("DIV");
			top.className = "mblRoundCorner mblRoundCorner"+i+"T";
			_this.domNode.insertBefore(top, _this.containerNode);

			var bottom = dojo.create("DIV");
			bottom.className = "mblRoundCorner mblRoundCorner"+i+"B";
			_this.domNode.appendChild(bottom);
		}
	}
});

} // if(dojo.isIE)

dojo.addOnLoad(function(){
	// summary:
	//		Function to perform page-level adjustments on browsers such as
	//		IE and firefox.  It loads compat specific css files into the 
	//		page header.
	var elems = dojo.doc.getElementsByTagName("link");
	for(var i = 0, len = elems.length; i < len; i++){
		var href = elems[i].href;
		if((href.indexOf("/mobile/themes/") != -1 || location.href.indexOf("/mobile/tests/") != -1)
		   && href.substring(href.length - 4) == ".css"){
			var compatCss = href.substring(0, href.length-4)+"-compat.css";
			dojox.mobile.View.prototype._loadCss(compatCss);
		}
	}
});
