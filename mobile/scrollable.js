/*=====
// summary:
//		Utility for enabling touch scrolling capability.
// description:
//		Mobile WebKit browsers do not allow scrolling inner DIVs. (You need
//		the two-finger operation to scroll them.)
//		That means you cannot have fixed-positioned header/footer bars.
//		To solve this issue, this module disables the browsers default scrolling
//		behavior, and re-builds its own scrolling machinery by handling touch
//		events. In this module, this.domNode has height "100%" and is fixed to
//		the window, and this.containerNode scrolls. If you place a bar outside
//		of this.containerNode, then it will be fixed-positioned while
//		this.containerNode is scrollable.
//
//		This module has the following features:
//		- Scrolls inner DIVs vertically, horizontally, or both.
//		- Vertical and horizontal scroll bars.
//		- Flashes the scroll bars when a view is shown.
//		- Simulates the flick operation using animation.
//		- Respects header/footer bars if any.
//
//		dojox.mobile.scrollable is a simple function object, which holds
//		several properties and functions in it. But if you transform it to a
//		dojo class, it can be used as a mix-in class for any custom dojo
//		widgets. dojox.mobile._ScrollableMixin is such a class.
//
//		Also, it can be used even for non-dojo applications. In such cases,
//		several dojo APIs used in this module, such as dojo.connect,
//		dojo.create, etc., are re-defined so that the code works without dojo.
//		When in dojo, of course those re-defined functions are not necessary.
//		So, they are surrounded by the excludeStart and excludeEnd directives
//		so that they will be excluded from the build.
//		
//		If you use this module for non-dojo application, you need to explicitly
//		assign your outer fixed node and inner scrollable node to this.domNode
//		and this.containerNode respectively.
//
// example:
//		Use this module from a non-dojo applicatoin:
//		| function onLoad(){
//		| 	var scrollable = new dojox.mobile.scrollable();
//		| 	scrollable.init({
//		| 		domNode: "outer", // id or node
//		| 		containerNode: "inner", // id or node
//		| 		fixedHeaderHeight: document.getElementById("hd1").offsetHeight
//		| 	});
//		| }
//		| <body onload="onLoad()">
//		| 	<h1 id="hd1" style="position:absolute;width:100%;z-index:1;">
//		| 		Fixed Header
//		| 	</h1>
//		| 	<div id="outer" style="height:100%;overflow:hidden;">
//		| 		<div id="inner" style="position:absolute;width:100%;">
//		| 			... content ...
//		| 		</div>
//		| 	</div>
//		| </body>
//		
=====*/

if(typeof dojo != "undefined" && dojo.provide){
	dojo.provide("dojox.mobile.scrollable");
}else{
	dojo = {doc:document, global:window, isWebKit:navigator.userAgent.indexOf("WebKit") != -1};
	dojox = {mobile:{}};
}

dojox.mobile.scrollable = function(){
	this.fixedHeaderHeight = 0; // height of a fixed header
	this.fixedFooterHeight = 0; // height of a fixed footer
	this.isLocalFooter = false; // footer is view-local (as opposed to application-wide)
	this.scrollBar = true; // show scroll bar or not
	this.scrollDir = "v"; // v: vertical, h: horizontal, vh: both, f: flip
	this.weight = 0.6; // frictional drag
	this.fadeScrollBar = true;
	this.disableFlashScrollBar = false;

//>>excludeStart("dojo", true);
	if(!dojo.version){ // seems running in a non-dojo environment
		dojo.connect = function(node, eventName, scope, method){
			var handler = function(e){
				e = e || window.event;
				if(!e.target){
					e.target = e.srcElement;
					e.pageX = e.offsetX;
					e.pageY = e.offsetY;
				}
				scope[method](e);
			};
			if(node.addEventListener){
				node.addEventListener(eventName.replace(/^on/,""), handler, false);
			}else{
				node.attachEvent(eventName, handler);
			}
			return {node:node, eventName:eventName, handler:handler};
		};
		dojo.disconnect = function(handle){
			if(handle.node.removeEventListener){
				handle.node.removeEventListener(handle.eventName.replace(/^on/,""), handle.handler, false);
			}else{
				handle.node.detachEvent(handle.eventName, handle.handler);
			}
		};
		dojo.create = function(tag, attrs, refNode){
			return refNode.appendChild(dojo.doc.createElement(tag));
		};
		dojo.stopEvent = function(evt){
			if(evt.preventDefault){
				evt.preventDefault();
				evt.stopPropagation();
			}else{
				evt.cancelBubble = true;
			}
			return false;
		};
		dojo.style = function(node, style){
			for(s in style){
				if(style.hasOwnProperty(s)){
					node.style[s] = style[s];
				}
			}
		};
	}
//>>excludeEnd("dojo");

	this.init = function(/*Object?*/params){
		if (params){
			for(var p in params){
				if (params.hasOwnProperty(p)) {
					this[p] = ((p == "domNode" || p == "containerNode") && typeof params[p] == "string") ?
						dojo.doc.getElementById(params[p]) : params[p]; // mix-in params
				}
			}
		}
		this._v = (this.scrollDir.indexOf("v") != -1); // vertical scrolling
		this._h = (this.scrollDir.indexOf("h") != -1); // horizontal scrolling
		this._f = (this.scrollDir == "f"); // flipping views

		this._ch = []; // connect handlers
		this._ch.push(dojo.connect(this.containerNode,
			dojox.mobile.hasTouch ? "touchstart" : "onmousedown", this, "onTouchStart"));
		if(dojo.isWebKit){
			this._ch.push(dojo.connect(this.containerNode, "webkitAnimationEnd", this, "onFlickAnimationEnd"));
			this._ch.push(dojo.connect(this.containerNode, "webkitAnimationStart", this, "onFlickAnimationStart"));
		}
		this.containerNode.style.paddingTop = this.fixedHeaderHeight + "px";
		if(this.isLocalFooter){
			this.containerNode.style.paddingBottom = this.fixedFooterHeight + "px";
		}

		if(window.onorientationchange !== undefined){
			this._ch.push(dojo.connect(dojo.global, "onorientationchange", this, "resizeView"));
		}else{
			this._ch.push(dojo.connect(dojo.global, "onresize", this, "resizeView"));
		}
		this.resizeView();
		var _this = this;
		setTimeout(function(){
			_this.flashScrollBar();
		}, 600);
	};

	this.cleanup = function(){
		for(var i = 0; i < this._ch.length; i++){
			dojo.disconnect(this._ch[i]);
		}
		this._ch = null;
	};

	this.resizeView = function(e){
		// has to wait a little for completion of hideAddressBar()
		var c = 0;
		var h = this.isLocalFooter ? 0 : this.fixedFooterHeight;
		var _this = this;
		var id = setInterval(function() {
			// adjust the height of this view a couple of times
			_this.domNode.style.height = (window.innerHeight||dojo.doc.documentElement.clientHeight) - h + "px";
			if(c++ >= 4) { clearInterval(id); }
		}, 300);
	};

	this.onFlickAnimationStart = function(e){
		dojo.stopEvent(e);
	};

	this.onFlickAnimationEnd = function(e){
		if(e && e.srcElement){
			dojo.stopEvent(e);
		}
		this.containerNode.className = this.containerNode.className.replace(/\s*mblScrollableScrollTo/, "");
		if(this._bounce){
			var _this = this;
			var bounce = _this._bounce;
			setTimeout(function(){
				_this.slideTo(bounce, 0.3, "ease-out");
			}, 0);
			_this._bounce = undefined;
		}else{
			this.stopScrollBar();
			this.removeCover();
		}
	};

	this.onTouchStart = function(e){
		if(this.containerNode.className.indexOf("mblScrollableScrollTo") != -1){
			// stop the currently running animation
			this.scrollTo(this.getPos());
			this.containerNode.className = this.containerNode.className.replace(/\s*mblScrollableScrollTo/, "");
			this._aborted = true;
		}else{
			this._aborted = false;
		}
		this.touchStartX = e.touches ? e.touches[0].pageX : e.pageX;
		this.touchStartY = e.touches ? e.touches[0].pageY : e.pageY;
		this.startTime = (new Date()).getTime();
		this.startPos = this.getPos();
		this._dim = this.getDim();
		this._time = [0];
		this._posX = [this.touchStartX];
		this._posY = [this.touchStartY];

		this._conn = [];
		this._conn.push(dojo.connect(dojo.doc, dojox.mobile.hasTouch ? "touchmove" : "onmousemove", this, "onTouchMove"));
		this._conn.push(dojo.connect(dojo.doc, dojox.mobile.hasTouch ? "touchend" : "onmouseup", this, "onTouchEnd"));

		if(e.target.nodeType != 1 || (e.target.tagName != "SELECT" && e.target.tagName != "INPUT")){
			dojo.stopEvent(e);
		}
	};

	this.onTouchMove = function(e){
		var x = e.touches ? e.touches[0].pageX : e.pageX;
		var y = e.touches ? e.touches[0].pageY : e.pageY;
		var dx = x - this.touchStartX;
		var dy = y - this.touchStartY;
		var to = {x:this.startPos.x + dx, y:this.startPos.y + dy};
		var dim = this._dim;

		this.addCover();
		this.showScrollBar();
		this.updateScrollBar(to);

		var weight = this.weight;
		if(this._v){
			if(to.y > 0){ // content is below the screen area
				to.y = Math.round(to.y * weight);
			}else if(to.y < -dim.o.h){ // content is above the screen area
				if(dim.c.h < dim.v.h){ // content is shorter than view
					to.y = Math.round(to.y * weight);
				}else{
					to.y = -dim.o.h - Math.round((-dim.o.h - to.y) * weight);
				}
			}
		}
		if(this._h || this._f){
			if(to.x > 0){
				to.x = Math.round(to.x * weight);
			}else if(to.x < -dim.o.w){
				if(dim.c.w < dim.v.w){
					to.x = Math.round(to.x * weight);
				}else{
					to.x = -dim.o.w - Math.round((-dim.o.w - to.x) * weight);
				}
			}
		}
		this.scrollTo(to);

		var max = 10;
		if(this._time.length == max){ this._time.shift(); }
		this._time.push((new Date()).getTime() - this.startTime);

		if(this._posX.length == max){ this._posX.shift(); }
		this._posX.push(x);

		if(this._posY.length == max){ this._posY.shift(); }
		this._posY.push(y);
	};

	this.onTouchEnd = function(e){
		for(var i = 0; i < this._conn.length; i++){
			dojo.disconnect(this._conn[i]);
		}

		var n = !this._time ? 0 : this._time.length; // # of samples
		var clicked = false;
		if(!this._aborted){
			if(n <= 1){
				clicked = true;
			}else if(n == 2 && Math.abs(this._posY[1] - this._posY[0]) < 4){
				clicked = true;
			}
		}
		if(clicked){ // clicked, not dragged or flicked
			this.stopScrollBar();
			this.removeCover();
			if(dojox.mobile.hasTouch){
				var elem = e.target;
				if(elem.nodeType != 1){
					elem = elem.parentNode;
				}
				var ev = dojo.doc.createEvent("MouseEvents");
				ev.initEvent("click", true, true);
				elem.dispatchEvent(ev);
			}
			return;
		}
		var speed = {x:0, y:0};
		if(n < 2 || (new Date()).getTime() - this.startTime - this._time[n - 1] > 500){
			// holding the mouse or finger more than 0.5 sec, do not move.
		}else{
			var dy = this._posY[n - (n > 2 ? 2 : 1)] - this._posY[(n - 6) >= 0 ? n - 6 : 0];
			var dx = this._posX[n - (n > 2 ? 2 : 1)] - this._posX[(n - 6) >= 0 ? n - 6 : 0];
			var dt = this._time[n - (n > 2 ? 2 : 1)] - this._time[(n - 6) >= 0 ? n - 6 : 0];
			speed.y = this.calcSpeed(dy, dt);
			speed.x = this.calcSpeed(dx, dt);
		}

		var pos = this.getPos();
		var to = {}; // destination
		var dim = this._dim;

		if(this._v){
			to.y = pos.y + speed.y;
		}
		if(this._h || this._f){
			to.x = pos.x + speed.x;
		}

		if(this.scrollDir == "v" && dim.c.h <= dim.v.h){ // content is shorter than view
			this.slideTo({y:0}, 0.3, "ease-out"); // go back to the top
			return;
		}else if(this.scrollDir == "h" && dim.c.w <= dim.v.w){ // content is narrower than view
			this.slideTo({x:0}, 0.3, "ease-out"); // go back to the left
			return;
		}else if(this._v && this._h && dim.c.h <= dim.v.h && dim.c.w <= dim.v.w){
			this.slideTo({x:0, y:0}, 0.3, "ease-out"); // go back to the top-left
			return;
		}

		var duration, easing = "ease-out";
		var bounce = {};
		if(this._v){
			if(to.y > 0){ // going down. bounce back to the top.
				if(pos.y > 0){ // started from below the screen area. return quickly.
					duration = 0.3;
					to.y = 0;
				}else{
					to.y = Math.min(to.y, 20);
					easing = "linear";
					bounce.y = 0;
				}
			}else if(-speed.y > dim.o.h - (-pos.y)){ // going up. bounce back to the bottom.
				if(pos.y < -dim.o.h){ // started from above the screen top. return quickly.
					duration = 0.3;
					to.y = dim.c.h <= dim.v.h ? 0 : -dim.o.h; // if shorter, move to 0
				}else{
					to.y = Math.max(to.y, -dim.o.h - 20);
					easing = "linear";
					bounce.y = -dim.o.h;
				}
			}
		}
		if(this._h || this._f){
			if(to.x > 0){ // going right. bounce back to the left.
				if(pos.x > 0){ // started from right of the screen area. return quickly.
					duration = 0.3;
					to.x = 0;
				}else{
					to.x = Math.min(to.x, 20);
					easing = "linear";
					bounce.x = 0;
				}
			}else if(-speed.x > dim.o.w - (-pos.x)){ // going left. bounce back to the right.
				if(pos.x < -dim.o.w){ // started from left of the screen top. return quickly.
					duration = 0.3;
					to.x = dim.c.w <= dim.v.w ? 0 : -dim.o.w; // if narrower, move to 0
				}else{
					to.x = Math.max(to.x, -dim.o.w - 20);
					easing = "linear";
					bounce.x = -dim.o.w;
				}
			}
		}
		this._bounce = (bounce.x !== undefined || bounce.y !== undefined) ? bounce : undefined;

		if(duration === undefined){
			var distance, velocity;
			if(this._v && this._h){
				velocity = Math.sqrt(speed.x+speed.x + speed.y*speed.y);
				distance = Math.sqrt(Math.pow(to.y - pos.y, 2) + Math.pow(to.x - pos.x, 2));
			}else if(this._v){
				velocity = speed.y;
				distance = to.y - pos.y;
			}else if(this._h){
				velocity = speed.x;
				distance = to.x - pos.x;
			}
			duration = velocity !== 0 ? Math.abs(distance / velocity) : 0.01; // time = distance / velocity
		}
		this.slideTo(to, duration, easing);
		this.startScrollBar();
	};

	this.calcSpeed = function(/*Number*/d, /*Number*/t){
		return Math.round(d / t * 100) * 4;
	};

	this.scrollTo = function(/*Object*/to){ // to: {x, y}
		if(dojo.isWebKit){
			this.containerNode.style.webkitTransform = this.makeTranslateStr(to);
		}else{
			if(this._v){
				this.containerNode.style.top = to.y + "px";
			}
			if(this._h || this._f){
				this.containerNode.style.left = to.x + "px";
			}
		}
	};

	this.slideTo = function(/*Object*/to, /*Number*/duration, /*String*/easing){
		if(dojo.isWebKit){
			this.setKeyframes(this.getPos(), to);
			this.containerNode.style.webkitAnimationDuration = duration + "s";
			this.containerNode.style.webkitAnimationTimingFunction = easing;
			this.containerNode.className += " mblScrollableScrollTo";
			this.scrollTo(to);
//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		}else if(dojo.fx && dojo.fx.easing){
			// If you want to support non-webkit browsers,
			// your application needs to load necessary modules as follows:
			//
			// | dojo.require("dojo.fx");
			// | dojo.require("dojo.fx.easing");
			//
			// This module itself does not make dependency on them.
			var s = dojo.fx.slideTo({
				node: this.containerNode,
				duration: duration*1000,
				left: to.x,
				top: to.y,
				easing: (easing == "ease-out") ? dojo.fx.easing.quadOut : dojo.fx.easing.linear
			}).play();
			dojo.connect(s, "onEnd", this, "onFlickAnimationEnd");
		}else{
			// directly jump to the destination without animation
			if(typeof to.x == "number"){
				this.containerNode.style.left = to.x + "px";
			}
			if(typeof to.y == "number"){
				this.containerNode.style.top = to.y + "px";
			}
			this.onFlickAnimationEnd();
//>>excludeEnd("webkitMobile");
		}
	};

	this.makeTranslateStr = function(to){
		var y = this._v && typeof to.y == "number" ? to.y+"px" : "0px";
		var x = (this._h||this._f) && typeof to.x == "number" ? to.x+"px" : "0px";
		return dojox.mobile.hasTranslate3d ?
				"translate3d("+x+","+y+",0px)" : "translate("+x+","+y+")";
	};

	this.getPos = function(){
		// summary:
		//		Get the top position in the midst of animation
		if(dojo.isWebKit){
			var m = dojo.doc.defaultView.getComputedStyle(this.containerNode, '')["-webkit-transform"];
			if(m && m.indexOf("matrix") === 0){
				var arr = m.split(/[,\s\)]+/);
				return {y:arr[5] - 0, x:arr[4] - 0};
			}
			return {x:0, y:0};
		}else{
			return {y:this.containerNode.offsetTop, x:this.containerNode.offsetLeft};
		}
	};

	this.getDim = function(){
		var d = {};
		// content width/height
		d.c = {h:this.containerNode.offsetHeight, w:this.containerNode.offsetWidth};

		// view width/height
		d.v = {h:this.domNode.offsetHeight, w:this.domNode.offsetWidth};

		// display width/height
		d.d = {h:d.v.h - this.fixedHeaderHeight - (this.isLocalFooter?this.fixedFooterHeight:0), w:d.v.w};

		// overflowed width/height
		d.o = {h:d.c.h - d.v.h, w:d.c.w - d.v.w};
		return d;
	};

	this.showScrollBar = function(){
		if(!this.scrollBar){ return; }

		var dim = this._dim;
		if(this.scrollDir == "v" && dim.c.h <= dim.v.h){ return; }
		if(this.scrollDir == "h" && dim.c.w <= dim.v.w){ return; }
		if(this._v && this._h && dim.c.h <= dim.v.h && dim.c.w <= dim.v.w){ return; }

		if(this._v){
			if(!this._scrollBarNodeV){
				this._scrollBarNodeV = dojo.create("div", null, this.domNode);
				dojo.style(this._scrollBarNodeV, {
					opacity: 0.6,
					position: "absolute",
					right: "2px",
					backgroundColor: "#606060",
					width: "5px",
					fontSize: "1px",
					webkitBorderRadius: "2px",
					mozBorderRadius: "2px"
				});
			}
			this._scrollBarV = this._scrollBarNodeV;
			this._scrollBarV.className = "";
			dojo.style(this._scrollBarV, {"opacity": 0.6});
		}
		if(this._h){
			if(!this._scrollBarNodeH){
				this._scrollBarNodeH = dojo.create("div", null, this.domNode);
				dojo.style(this._scrollBarNodeH, {
					opacity: 0.6,
					position: "absolute",
					bottom: (this.isLocalFooter ? this.fixedFooterHeight : 0) + 2 + "px",
					backgroundColor: "#606060",
					height: "5px",
					fontSize: "1px",
					webkitBorderRadius: "2px",
					mozBorderRadius: "2px"
				});
			}
			this._scrollBarH = this._scrollBarNodeH;
			this._scrollBarH.className = "";
			dojo.style(this._scrollBarH, {"opacity": 0.6});
		}
	};

	this.hideScrollBar = function(){
		var fadeRule;
		if(this.fadeScrollBar && dojo.isWebKit){
			if(!dojox.mobile._fadeRule){
				var node = dojo.create("style", null, dojo.doc.getElementsByTagName("head")[0]);
				node.textContent =
					".mblScrollableFadeOutScrollBar{"+
					"  -webkit-animation-duration: 1s;"+
					"  -webkit-animation-name: scrollableViewFadeOutScrollBar;}"+
					"@-webkit-keyframes scrollableViewFadeOutScrollBar{"+
					"  from { opacity: 0.6; }"+
					"  50% { opacity: 0.6; }"+
					"  to { opacity: 0; }}";
				dojox.mobile._fadeRule = node.sheet.cssRules[1];
			}
			fadeRule = dojox.mobile._fadeRule;
		}
		if(!this.scrollBar){ return; }
		if(this._scrollBarV){
			dojo.style(this._scrollBarV, {"opacity": 0});
			this._scrollBarV.className = "mblScrollableFadeOutScrollBar";
			this._scrollBarV = null;
		}
		if(this._scrollBarH){
			dojo.style(this._scrollBarH, {"opacity": 0});
			this._scrollBarH.className = "mblScrollableFadeOutScrollBar";
			this._scrollBarH = null;
		}
	};

	this.startScrollBar = function(){
		if(!this.scrollBar){ return; }
		if(!this._scrollBarV && !this._scrollBarH){ return; }
		if(!this._scrollTimer){
			var _this = this;
			this._scrollTimer = setInterval(function(){
				_this.updateScrollBar(_this.getPos());
			}, 20);
		}
	};

	this.stopScrollBar = function(){
		if(!this.scrollBar){ return; }
		if(!this._scrollBarV && !this._scrollBarH){ return; }
		this.hideScrollBar();
		clearInterval(this._scrollTimer);
		this._scrollTimer = null;
	};

	this.updateScrollBar = function(/*Object*/to){
		if(!this.scrollBar){ return; }
		if(!this._scrollBarV && !this._scrollBarH){ return; }
		var dim = this._dim;
		if(this._v){
			var ch = dim.c.h - this.fixedHeaderHeight;
			var height = Math.round(dim.d.h*dim.d.h/ch); // scroll bar height
			var top = Math.round((dim.d.h-height)/(dim.d.h-ch)*to.y); // scroll bar top
			if(top < 0){ // below the screen area
				height += top;
				top = 0;
			}else if(top + height > dim.d.h){ // above the screen area
				height -= top + height - dim.d.h;
			}
			this._scrollBarV.style.top = top + this.fixedHeaderHeight + 4 + "px"; // +4 is for top margin
			this._scrollBarV.style.height = height - 8 + "px"; // -8 is for top/bottom margin
		}
		if(this._h){
			var cw = dim.c.w;
			var width = Math.round(dim.d.w*dim.d.w/cw);
			var left = Math.round((dim.d.w-width)/(dim.d.w-cw)*to.x);
			if(left < 0){ // left of the screen area
				width += left;
				left = 0;
			}else if(left + width > dim.d.w){ // right of the screen area
				width -= left + width - dim.d.w;
			}
			this._scrollBarH.style.left = left + 4 + "px"; // +4 is for left margin
			this._scrollBarH.style.width = width - 8 + "px"; // -8 is for left/right margin
		}
	};

	this.flashScrollBar = function(){
		if(this.disableFlashScrollBar){ return; }
		this._dim = this.getDim();
		if(this._dim.d.h <= 0){ return; } // dom is not ready
		this.showScrollBar();
		this.updateScrollBar(this.getPos());
		var _this = this;
		setTimeout(function(){
			_this.hideScrollBar();
		}, 0);
	};

	this.addCover = function(){
//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		if(!dojox.mobile.hasTouch && !this.noCover){
			if(!this._cover){
				this._cover = dojo.create("div", null, dojo.doc.body);
				dojo.style(this._cover, {
					backgroundColor: "#ffff00",
					opacity: 0,
					position: "absolute",
					top: "0px",
					left: "0px",
					width: "100%",
					height: "100%"
				});
				this._ch.push(dojo.connect(this._cover,
					dojox.mobile.hasTouch ? "touchstart" : "onmousedown", this, "onTouchEnd"));
			}else{
				this._cover.style.display = "";
			}
		}
//>>excludeEnd("webkitMobile");
		this.setSelectable(this.domNode, false);
		var sel;
		if(window.getSelection){
			sel = window.getSelection();
			sel.collapse(dojo.doc.body, 0);
		}else{
			sel = dojo.doc.selection.createRange();
			sel.setEndPoint("EndToStart", sel);
			sel.select();
		}
	};

	this.removeCover = function(){
//>>excludeStart("webkitMobile", kwArgs.webkitMobile);
		if(!dojox.mobile.hasTouch && this._cover){
			this._cover.style.display = "none";
		}
//>>excludeEnd("webkitMobile");
		this.setSelectable(this.domNode, true);
	};

	this.setKeyframes = function(/*Object*/from, /*Object*/to){
		if(!dojox.mobile._rule){
            var node = dojo.create("style", null, dojo.doc.getElementsByTagName("head")[0]);
            node.textContent =
				".mblScrollableScrollTo{-webkit-animation-name: scrollableViewScroll;}"+
				"@-webkit-keyframes scrollableViewScroll{}";
			dojox.mobile._rule = node.sheet.cssRules[1];
		}
		var rule = dojox.mobile._rule;
		if(rule){
			if(from){
				rule.deleteRule("from"); 
				rule.insertRule("from { -webkit-transform: "+this.makeTranslateStr(from)+"; }");
			}
			if(to){
				if(to.x === undefined){ to.x = from.x; }
				if(to.y === undefined){ to.y = from.y; }
				rule.deleteRule("to"); 
				rule.insertRule("to { -webkit-transform: "+this.makeTranslateStr(to)+"; }");
			}
		} 
	};

	this.setSelectable = function(node, selectable){
		// dojo.setSelectable has dependency on dojo.query. Re-define our own.
		node.style.KhtmlUserSelect = selectable ? "auto" : "none";
		node.style.MozUserSelect = selectable ? "" : "none";
		node.onselectstart = selectable ? null : function(){return false;};
		node.unselectable = selectable ? "" : "on";
	};

};

(function(){
	// feature detection
	if(dojo.isWebKit){
		var elem = dojo.doc.createElement("div");
		elem.style.webkitTransform = "translate3d(0px,1px,0px)";
		dojo.doc.documentElement.appendChild(elem);
		var v = dojo.doc.defaultView.getComputedStyle(elem, '')["-webkit-transform"];
		dojox.mobile.hasTranslate3d = v && v.indexOf("matrix") === 0;
		dojo.doc.documentElement.removeChild(elem);
	
		dojox.mobile.hasTouch = (typeof dojo.doc.documentElement.ontouchstart != "undefined" &&
			navigator.appVersion.indexOf("Mobile") != -1);
	}
})();
