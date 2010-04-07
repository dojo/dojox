dojo.provide("dojox.mobile._base");

dojo.require("dijit._Widget");

// summary:
//		Mobile Widgets
// description:
//		This module provides a number of widgets that can be used to build
//		web-based applications for mobile devices such as iPhone or Android.
//		These widgets work best with webkit-based browsers, such as Safari or
//		Chrome, since webkit-specific CSS3 features are used.
//		However, the widgets should work in a "graceful degradation" manner
//		even on non-CSS3 browsers, such as IE or Firefox. In that case,
//		fancy effects, such as animation, gradient color, or round corner
//		rectangle, may not work, but you can still operate your application.
//
//		Furthermore, as a separate file, a compatibility module,
//		dojox.mobile.compat, is available that simulates some of CSS3 features
//		used in this module. If you use the compatibility module, fancy visual
//		effects work better even on non-CSS3 browsers.
//
//		Note that use of dijit._Container, dijit._Contained, dijit._Templated,
//		and dojo.query is intentionally avoided to reduce download code size.

dojo.declare("dojox.mobile.Page",dijit._Widget,{
	selected: false,

	constructor: function(){
		arguments[1].style.visibility = "hidden";
	},

	buildRendering: function(){
		this.domNode = this.containerNode = this.srcNodeRef || dojo.doc.createElement("DIV");
		this.domNode.className = "mblPage";
		dojox.mobile.Page._pillar = dojo.doc.createElement("DIV");
		this.connect(this.domNode, "webkitAnimationEnd", "onAnimationEnd");
		this.connect(this.domNode, "webkitAnimationStart", "onAnimationStart");
		var id = location.href.match(/#(\w+)([^\w=]|$)/) ? RegExp.$1 : null;
		this._visible = this.selected && !id || this.id == id;
	},

	startup: function(){
		var _this = this;
		setTimeout(function(){
			if(!_this._visible){
				_this.domNode.style.display = "none";
			}else{
				_this.onStartPage();
			}
			_this.domNode.style.visibility = "visible";
		}, 0);
	},

	onStartPage: function(){
		// Stub function to connect to from your application.
		// Called only when this page is shown at startup time.
	},

	onBeforeTransitionIn: function(moveTo, dir, transition, context, method){
		// Stub function to connect to from your application.
	},

	onAfterTransitionIn: function(moveTo, dir, transition, context, method){
		// Stub function to connect to from your application.
	},

	onBeforeTransitionOut: function(moveTo, dir, transition, context, method){
		// Stub function to connect to from your application.
	},

	onAfterTransitionOut: function(moveTo, dir, transition, context, method){
		// Stub function to connect to from your application.
	},

	_saveState: function(moveTo, dir, transition, context, method){
		var i;
		this._context = context;
		this._method = method;
		if(transition == "none" || !dojo.isWebKit){
			transition = null;
		}
		this._transition = transition;
		this._arguments = [];
		for(i = 0; i < arguments.length; i++){
			this._arguments.push(arguments[i]);
		}
		this._args = [];
		if(context || method){
			for(i = 5; i < arguments.length; i++){
				this._args.push(arguments[i]);
			}
		}
	},

	performTransition: function(/*String|DomNode*/moveTo, dir, transition, /*Object|null*/context, /*String|Function*/method /*optional args*/){
		this._saveState.apply(this, arguments);
		if(moveTo){
			if(typeof(moveTo) == "string"){
				moveTo.match(/(\w+)/);
				toNode = RegExp.$1;
			}else{
				toNode = moveTo;
			}
		}else{
			if(!this._dummyNode){
				this._dummyNode = dojo.doc.createElement("DIV");
			}
			toNode = this._dummyNode;
		}
		var fromNode = this.domNode;
		toNode = this.toNode = dojo.byId(toNode);
		if(!toNode){ alert("dojox.mobile.Page#performTransition: destination page not found: "+toNode); }
		this.onBeforeTransitionOut.apply(this, arguments);
		var toWidget = dijit.byNode(toNode);
		if(toWidget && toWidget.onBeforeTransitionIn){
			toWidget.onBeforeTransitionIn.apply(this, arguments);
		}
		var rev = (dir == -1) ? " reverse" : "";

		toNode.style.display = "";
		if(transition){
			var pillar = dojox.mobile.Page._pillar;
			pillar.style.height = fromNode.offsetHeight+"px";
			fromNode.parentNode.appendChild(pillar);
			dojo.addClass(fromNode, transition + " out" + rev);
			dojo.addClass(toNode, transition + " in" + rev);
		}else{
			this.domNode.style.display = "none";
			this.invokeCallback();
		}
	},

	onAnimationStart: function(e){
	},

	onAnimationEnd: function(e){
		var isOut = false;
		if(dojo.hasClass(this.domNode, "out")){
			isOut = true;
			this.domNode.style.display = "none";
			dojo.forEach([this._transition,"in","out","reverse"], function(s){
				dojo.removeClass(this.domNode, s);
			}, this);
		}
		if(e.animationName.indexOf("shrink") == 0){
			var li = e.target;
			li.style.display = "none";
			dojo.removeClass(li, "mblCloseContent");
		}
		if(isOut){
			dojox.mobile.Page._pillar.parentNode.removeChild(dojox.mobile.Page._pillar);
			this.invokeCallback();
		}
		this.domNode.className = "mblPage";
	},

	invokeCallback: function(){
		this.onAfterTransitionOut.apply(this, this._arguments);
		var toWidget = dijit.byNode(this.toNode);
		if(toWidget && toWidget.onAfterTransitionIn){
			toWidget.onAfterTransitionIn.apply(this, this._arguments);
		}

		var c = this._context, m = this._method;
		if(!c && !m){ return; }
		if(!m){
			m = c;
			c = null;
		}
		c = c || dojo.global;
		if(typeof(m) == "string"){
			c[m].apply(c, this._args);
		}else{
			m.apply(c, this._args);
		}
	}
});

dojo.declare(
	"dojox.mobile.Heading",
	dijit._Widget,
{
	back: "",
	href: "",
	moveTo: "",
	transition: "slide",

	buildRendering: function(){
		this.domNode = this.containerNode = this.srcNodeRef || dojo.doc.createElement("H1");
		this.domNode.className = "mblHeading";
		if(this.back){
			var text = this._text = this.domNode.innerHTML;
			var head = dojo.doc.createElement("DIV");
			head.className = "mblArrowButtonHead";
			var body = this._body = dojo.doc.createElement("DIV");
			body.className = "mblArrowButtonBody mblArrowButtonText";
			body.innerHTML = this.back;
			this.connect(body, "onclick", "onClick");
			var neck = dojo.doc.createElement("DIV");
			neck.className = "mblArrowButtonNeck";

			dojo.body().appendChild(body);
			if(this._text.length > 12){
				this.domNode.style.paddingLeft = body.offsetWidth + 30 + "px";
				this.domNode.style.textAlign = "left";
			}
			dojo.body().removeChild(body);

			this.domNode.appendChild(head);
			this.domNode.appendChild(body);
			this.domNode.appendChild(neck);
		}
	},

	onClick: function(e){
		var h1 = this.domNode;
		dojo.addClass(h1, "mblArrowButtonSelected");
		setTimeout(function(){
			dojo.removeClass(h1, "mblArrowButtonSelected");
		}, 1000);
		if(this.href){
			this.goTo(this.href);
			return;
		}
		dijit.byNode(this.domNode.parentNode).performTransition(this.moveTo, -1, this.transition);
	},

	goTo: function(/*String*/href){
		dijit.byNode(this.domNode.parentNode).performTransition(null, -1, this.transition, this, function(){location.href = href;});
	}
});

dojo.declare(
	"dojox.mobile.RoundRect",
	dijit._Widget,
{
	shadow: false,

	buildRendering: function(){
		this.domNode = this.containerNode = this.srcNodeRef || dojo.doc.createElement("DIV");
		this.domNode.className = this.shadow ? "mblRoundRect mblShadow" : "mblRoundRect";
	}
});

dojo.declare(
	"dojox.mobile.EdgeToEdgeCategory",
	dijit._Widget,
{
	buildRendering: function(){
		this.domNode = this.containerNode = this.srcNodeRef || dojo.doc.createElement("H2");
		this.domNode.className = "mblEdgeToEdgeCategory";
	}
});

dojo.declare(
	"dojox.mobile.RoundRectCategory",
	dijit._Widget,
{
	buildRendering: function(){
		this.domNode = this.containerNode = this.srcNodeRef || dojo.doc.createElement("H2");
		this.domNode.className = "mblRoundRectCategory";
	}
});

dojo.declare(
	"dojox.mobile.RoundRectList",
	dijit._Widget,
{
	transition: "slide",
	iconBase: "",
	iconPos: "",

	buildRendering: function(){
		this.domNode = this.containerNode = this.srcNodeRef || dojo.doc.createElement("UL");
		this.domNode.className = "mblRoundRectList";
	}
});

dojo.declare(
	"dojox.mobile.EdgeToEdgeList",
	dijit._Widget,
{
	transition: "slide",
	iconBase: "",
	iconPos: "",

	buildRendering: function(){
		this.domNode = this.containerNode = this.srcNodeRef || dojo.doc.createElement("UL");
		this.domNode.className = "mblEdgeToEdgeList";
	}
});

dojo.declare(
	"dojox.mobile.AbstractItem",
	dijit._Widget,
{
	icon: "",
	iconPos: "", // top,left,width,height (ex. "0,0,29,29")
	href: "",
	moveTo: "",
	transition: "",
	callback: null,

	startup: function(){
		if(!this.transition){
			this.transition = this.getParentWidget().transition;
		}
	},

	transitionTo: function(moveTo, href){
		var n = this.domNode.parentNode;
		var w;
		while(true){
			w = dijit.getEnclosingWidget(n);
			if(!w){ return; }
			if(w.performTransition){ break; }
			n = w.domNode.parentNode;
		}
		if(href){
			w.performTransition(moveTo, 1, this.transition, this, function(){location.href = href;});
		}else{
			w.performTransition(moveTo, 1, this.transition, this.callback && this, this.callback);
		}
	},

	getParentWidget: function(){
		return dijit.getEnclosingWidget(this.domNode.parentNode);
	}
});

dojo.declare(
	"dojox.mobile.ListItem",
	dojox.mobile.AbstractItem,
{
	rightText: "",
	btnClass: "",

	buildRendering: function(){
		var a = dojo.create("A");
		a.className = "mblListItemAnchor";
		var span = dojo.create("SPAN");
		span.className = "mblListItemSpan";
		if(this.href && this.moveTo){
			span.style.cursor = "pointer";
		}
		var r = this.srcNodeRef;
		if(r){
			for(var i = 0, len = r.childNodes.length; i < len; i++){
				span.appendChild(r.removeChild(r.firstChild));
			}
		}
		a.appendChild(span);
		if(this.rightText){
			var txt = dojo.create("DIV");
			txt.className = "mblRightText";
			txt.innerHTML = this.rightText;
			a.appendChild(txt);
		}
		if(this.moveTo || this.href){
			span = dojo.create("SPAN");
			span.className = "mblArrow";
			a.appendChild(span);
			this.connect(a, "onclick", "onClick");
		}else if(this.btnClass){
			var div = this.btnNode = dojo.create("DIV");
			div.className = this.btnClass+" mblRightButton";
			div.appendChild(dojo.create("DIV"));
			div.appendChild(dojo.create("P"));

			var dummyDiv = dojo.create("DIV");
			dummyDiv.className = "mblRightButtonContainer";
			dummyDiv.appendChild(div);
			a.appendChild(dummyDiv);
			dojo.addClass(a, "mblListItemAnchorHasRightButton");
			setTimeout(function(){
				dummyDiv.style.width = div.offsetWidth + "px";
				dummyDiv.style.height = div.offsetHeight + "px";
				if(dojo.isIE){
					// IE seems to ignore the height of LI without this..
					a.parentNode.style.height = a.parentNode.offsetHeight + "px";
				}
			});
		}
		var li = this.domNode = this.containerNode = this.srcNodeRef || dojo.doc.createElement("LI");
		li.className = "mblListItem";
		if(!this.icon){ this.icon = this.getParentWidget().iconBase; }
		if(!this.iconPos){ this.iconPos = this.getParentWidget().iconPos; }
		if(this.icon && this.icon != "none"){
			var img = dojo.create("IMG");
			img.className = "mblListItemIcon";
			img.src = this.icon;
			li.appendChild(img);
			if(this.iconPos){
				var arr = dojo.map(this.iconPos.split(/[ ,]/),
									  function(item){ return item - 0; });
				var ht = arr[0];
				var wr = arr[1] + arr[2];
				var hb = arr[0] + arr[3];
				var wl = arr[1];
				img.style.clip = "rect("+ht+"px "+wr+"px "+hb+"px "+wl+"px)";
				img.style.top = -arr[0] + "px";
				img.style.left = -arr[1] + "px";
			}
		}else{
			dojo.addClass(a, "mblListItemAnchorNoIcon");
		}
		li.appendChild(a);
	},

	onClick: function(e){
		if(this.href && this.moveTo){
			for(var p = e.target; p.tagName != "LI"; p = p.parentNode){
				if(p.className == "mblListItemSpan"){
					dojo.addClass(p, "mblListItemSpanSelected");
					this.transitionTo(null, this.href);
					return;
				}
			}
		}
		var a = e.currentTarget;
		var li = a.parentNode;
		dojo.addClass(li, "mblItemSelected");
		setTimeout(function(){
			dojo.removeClass(li, "mblItemSelected");
		}, 1000);
		if(this.moveTo){
			this.transitionTo(this.moveTo);
		}else if(this.href){
			this.transitionTo(null, this.href);
		}
	}
});

dojo.declare(
	"dojox.mobile.Switch",
	dijit._Widget,
{
	value: "on",
	leftLabel: "ON",
	rightLabel: "OFF",
	_width: 53,

	buildRendering: function(){
		this.domNode = this.srcNodeRef || dojo.doc.createElement("DIV");
		this.domNode.className = "mblSwitch";
		this.domNode.innerHTML =
			  '<div class="mblSwitchInner">'
			+   '<div class="mblSwitchBg mblSwitchBgLeft">'
			+     '<div class="mblSwitchText mblSwitchTextLeft">'+this.leftLabel+'</div>'
			+   '</div>'
			+   '<div class="mblSwitchBg mblSwitchBgRight">'
			+     '<div class="mblSwitchText mblSwitchTextRight">'+this.rightLabel+'</div>'
			+   '</div>'
			+   '<div class="mblSwitchKnob"></div>'
			+ '</div>';
		var n = this.inner = this.domNode.firstChild;
		this.left = n.childNodes[0];
		this.right = n.childNodes[1];
		this.knob = n.childNodes[2];

		dojo.addClass(this.domNode, (this.value == "on") ? "mblSwitchOn" : "mblSwitchOff");
		this[this.value == "off" ? "left" : "right"].style.display = "none";
	},

	postCreate: function(){
		this.connect(this.knob, "onclick", "onClick");
		this.connect(this.knob, "touchstart", "onTouchStart");
		this.connect(this.knob, "mousedown", "onTouchStart");
	},

	_changeState: function(/*String*/state){
		this.inner.style.left = "";
		dojo.addClass(this.domNode, "mblSwitchAnimation");
		dojo.removeClass(this.domNode, (state == "on") ? "mblSwitchOff" : "mblSwitchOn");
		dojo.addClass(this.domNode, (state == "on") ? "mblSwitchOn" : "mblSwitchOff");

		var _this = this;
		setTimeout(function(){
			_this[state == "off" ? "left" : "right"].style.display = "none";
			dojo.removeClass(_this.domNode, "mblSwitchAnimation");
		}, 300);
	},

	onClick: function(e){
		if(this._moved){ return; }
		this.value = (this.value == "on") ? "off" : "on";
		this._changeState(this.value);
		this.onStateChanged(this.value);
	},

	onTouchStart: function(e){
		this._moved = false;
		this.innerStartX = this.inner.offsetLeft;
		if(e.targetTouches){
			this.touchStartX = e.targetTouches[0].clientX;
			this._conn1 = dojo.connect(this.inner, "touchmove", this, "onTouchMove");
			this._conn2 = dojo.connect(this.inner, "touchend", this, "onTouchEnd");
		}
		this.left.style.display = "block";
		this.right.style.display = "block";
		return false;
	},

	onTouchMove: function(e){
		e.preventDefault();
		var dx;
		if(e.targetTouches){
			if(e.targetTouches.length != 1){ return false; }
			dx = e.targetTouches[0].clientX - this.touchStartX;
		}else{
			dx = e.clientX - this.touchStartX;
		}
		var pos = this.innerStartX + dx;
		var d = 10;
		if(pos <= -(this._width-d)){ pos = -this._width; }
		if(pos >= -d){ pos = 0; }
		this.inner.style.left = pos + "px";
		this._moved = true;
		return true;
	},

	onTouchEnd: function(e){
		dojo.disconnect(this._conn1);
		dojo.disconnect(this._conn2);
		if(this.innerStartX == this.inner.offsetLeft){ return; }
		var newState = (this.inner.offsetLeft < -(this._width/2)) ? "off" : "on";
		this._changeState(newState);
		if(newState != this.value){
			this.value = newState;
			this.onStateChanged(this.value);
		}
	},

	onStateChanged: function(/*String*/newState){
	}
});

dojo.declare(
	"dojox.mobile.IconContainer",
	dijit._Widget,
{
	defaultIcon: "",
	transition: "below", // slide, flip, or below
	pressedIconOpacity: 0.4,

	buildRendering: function(){
		this.domNode = this.containerNode = this.srcNodeRef || dojo.doc.createElement("UL");
		this.domNode.className = "mblIconContainer";
	},

	startup: function(){
		var ul, i, len, child, w;
		if(this.transition == "below"){
			ul = this.domNode;
			len = this.domNode.childNodes.length;
			for(i = 0; i < len; i++){
				child = this.domNode.childNodes[i];
				if(child.nodeType != 1){ continue; }
				w = dijit.byNode(child);
				ul.appendChild(w.subNode);
			}
		}else{
			var page = new dojox.mobile.Page({id:"mblApplPage"});
			page.domNode.style.display = "none";
			var heading = new dojox.mobile.Heading({back:"Home", moveTo:this.domNode.parentNode.id, transition:this.transition});
			heading.domNode.appendChild(dojo.doc.createTextNode("My Application"));
			page.domNode.appendChild(heading.domNode);
			ul = dojo.doc.createElement("UL");
			len = this.domNode.childNodes.length;
			for(i = 0; i < len; i++){
				child = this.domNode.childNodes[i];
				if(child.nodeType != 1){ continue; }
				w = dijit.byNode(child);
				ul.appendChild(w.subNode);
			}
			page.domNode.appendChild(ul);
			dojo.doc.body.appendChild(page.domNode);
		}
	}
});

dojo.declare(
	"dojox.mobile.IconItem",
	dojox.mobile.AbstractItem,
{
	// description:
	//		Dynamic creation is not supported.
	title: "",
	lazy: false,
	requires: "",
	timeout: 10,

	templateString: '<li class="mblIconItem">'+
						'<div class="mblIconArea" dojoAttachPoint="iconDivNode">'+
							'<img src="${icon}" dojoAttachPoint="iconNode"><br>${title}'+
						'</div>'+
					'</li>',
	templateStringSub: '<li class="mblIconItemSub" lazy="${lazy}" style="display:none;" dojoAttachPoint="contentNode">'+
						'<h2 class="mblIconContentHeading" dojoAttachPoint="closeNode">'+
							'<div class="mblBlueMinusButton" style="position:absolute;left:4px;top:2px;" dojoAttachPoint="closeIconNode"><div></div></div>${title}'+
						'</h2>'+
						'<div class="mblContent" dojoAttachPoint="containerNode"></div>'+
					'</li>',

	createTemplate: function(s){
		dojo.forEach(["lazy","icon","title"], function(v){
			while(s.indexOf("${"+v+"}") != -1){
				s = s.replace("${"+v+"}", this[v]);
			}
		}, this);
		var div = dojo.doc.createElement("DIV");
		div.innerHTML = s;

		/*
		dojo.forEach(dojo.query("[dojoAttachPoint]", domNode), function(node){
			this[node.getAttribute("dojoAttachPoint")] = node;
		}, this);
		*/

		var nodes = div.getElementsByTagName("*");
		var i, len, s1;
		len = nodes.length
		for(i = 0; i < len; i++){
			s1 = nodes[i].getAttribute("dojoAttachPoint");
			if(s){
				this[s1] = nodes[i];
			}
		}
		var domNode = div.removeChild(div.firstChild);
		div = null;

		return domNode;
	},

	buildRendering: function(){
		this.domNode = this.createTemplate(this.templateString);
		this.subNode = this.createTemplate(this.templateStringSub);
		this.subNode._parentNode = this.domNode; // [custom property]
		this.srcNodeRef.parentNode.replaceChild(this.domNode, this.srcNodeRef);

		// reparent
		for(var i = 0, len = this.srcNodeRef.childNodes.length; i < len; i++){
			this.containerNode.appendChild(this.srcNodeRef.removeChild(this.srcNodeRef.firstChild));
		}
		this.srcNodeRef = null;
	},

	postCreate: function(){
		this.connect(this.iconNode, "onmousedown", "onMouseDownIcon");
		this.connect(this.iconNode, "onclick", "iconClicked");
		this.connect(this.closeIconNode, "onmousedown", "onMouseDownClose");
		this.connect(this.closeIconNode, "onclick", "closeIconClicked");
		this.connect(this.iconNode, "onerror", "onError");
	},

	highlight: function(){
		dojo.addClass(this.iconDivNode, "mblVibrate");
		if(this.timeout > 0){
			var _this = this;
			setTimeout(function(){
				_this.unhighlight();
			}, this.timeout*1000);
		}
	},

	unhighlight: function(){
		dojo.removeClass(this.iconDivNode, "mblVibrate");
	},

	setOpacity: function(node, val){
		node.style.opacity = val;
		node.style.mozOpacity = val;
		node.style.khtmlOpacity = val;
		node.style.webkitOpacity = val;
	},

	instantiateWidget: function(e){
		// avoid use of dojo.query
		/*
		var list = dojo.query('[dojoType]', this.containerNode);
		for(var i = 0, len = list.length; i < len; i++){
			dojo["require"](list[i].getAttribute("dojoType"));
		}
		*/

		var nodes = this.containerNode.getElementsByTagName("*");
		var len = nodes.length;
		var s;
		for(var i = 0; i < len; i++){
			s = nodes[i].getAttribute("dojoType");
			if(s){
				dojo["require"](s);
			}
		}

		if(len > 0){
			(dojo.global.lw&&dojox.mobile.parser||dojo.parser).parse(this.containerNode);
		}
		this.lazy = false;
	},

	isOpen: function(e){
		return this.containerNode.style.display != "none";
	},

	onMouseDownIcon: function (e){
		var node = e.target;
		this.setOpacity(node, this.getParentWidget().pressedIconOpacity);
		if(this.transition != "below"){
			setTimeout(dojo.hitch(this, function(d){
				this.setOpacity(node, 1);
			}), 1500);
		}
	},

	onMouseDownClose: function (e){
		var node = e.target;
		dojo.addClass(node.parentNode, "mblCloseButtonSelected");
		setTimeout(dojo.hitch(this, function(d){
			dojo.removeClass(node.parentNode, "mblCloseButtonSelected");
		}), 1500);
	},

	iconClicked: function(e){
		if(e){
			setTimeout(dojo.hitch(this, function(d){ this.iconClicked(); }), 0);
			return;
		}
		if(this.href){
			this.goTo(this.href);
			return;
		}
		if(this.moveTo){
			this.transitionTo(this.moveTo);
		}else{
			this.open();
		}
	},

	closeIconClicked: function(e){
		if(e){
			setTimeout(dojo.hitch(this, function(d){ this.closeIconClicked(); }), 0);
			return;
		}
		this.close();
	},

	open: function(){
		if(this.transition != "below"){
			this.transitionTo("mblApplPage");
		}
		this.contentNode.style.display = "";
		this.unhighlight();
		if(this.lazy){
			if(this.requires){
				dojo.forEach(this.requires.split(/,/), function(c){
					dojo["require"](c);
				});
			}
			this.instantiateWidget();
		}
		this.contentNode.scrollIntoView();

		this.onOpen();
	},

	close: function(){
		if(dojo.isWebKit){
			var t = this.domNode.parentNode.offsetWidth/8;
			var y = this.iconNode.offsetLeft;
			var pos = 0;
			for(var i = 1; i <= 3; i++){
				if(t*(2*i-1) < y && y <= t*(2*(i+1)-1)){
					pos = i;
					break;
				}
			}
			dojo.addClass(this.containerNode.parentNode, "mblCloseContent mblShrink"+pos);
		}else{
			this.containerNode.parentNode.style.display = "none";
		}
		this.setOpacity(this.iconNode, 1);
		this.onClose();
	},

	goTo: function(/*String*/href){
		location.href = href;
	},

	onOpen: function(){
		// stub method to allow the application to connect to.
	},

	onClose: function(){
		// stub method to allow the application to connect to.
	},

	onError: function(){
		this.iconNode.src = this.getParentWidget().defaultIcon;
	}
});

dojo.declare(
	"dojox.mobile.Button",
	dijit._Widget,
{
	buildRendering: function(){
		this.domNode = this.containerNode = this.srcNodeRef || dojo.doc.createElement("BUTTON");
		this.domNode.className = "mblButton";
		this.connect(this.domNode, "onclick", "onClick");
	},

	onClick: function(e){
		var button = this.domNode;
		dojo.addClass(button, "mblButtonSelected");
		setTimeout(function(){
			dojo.removeClass(button, "mblButtonSelected");
		}, 1000);
	}
});

dojo.declare(
	"dojox.mobile.TabContainer",
	dijit._Widget,
{
	selectedPane: null, /* TabPane widget */

	buildRendering: function(){
		var node = this.domNode = this.srcNodeRef;
		node.className = "mblTabContainer";
		var headerNode = this.tabHeaderNode = dojo.doc.createElement("DIV");
		var paneNode = this.containerNode = dojo.doc.createElement("DIV");

		// reparent
		for(var i = 0, len = node.childNodes.length; i < len; i++){
			paneNode.appendChild(node.removeChild(node.firstChild));
		}

		headerNode.className = "mblTabPanelHeader";
		headerNode.align = "center";
		node.appendChild(headerNode);
		paneNode.className = "mblTabPanelPane";
		node.appendChild(paneNode);
	},

	startup: function(){
		this.createTabButtons();
		this.inherited(arguments);
	},

	createTabButtons: function(){
		var div = dojo.doc.createElement("DIV");
		div.align = "center";
		var tbl = dojo.doc.createElement("TABLE");
		var cell = tbl.insertRow(-1).insertCell(-1);
		var children = this.containerNode.childNodes;
		for(var i = 0; i < children.length; i++){
			var pane = children[i];
			if(pane.nodeType != 1){ continue; }
			var widget = dijit.byNode(pane);
			if(widget.selected || !this.selectedPane){
				this.selectedPane = widget;
			}
			pane.style.display = "none";
			var tab = dojo.doc.createElement("DIV");
			tab.className = "mblTabButton";
			if(widget.icon){
				var d = dojo.create("IMG");
				d.src = dojo.moduleUrl("dojo", "resources/blank.gif");
				d.style.backgroundImage = "url("+widget.icon+")";
				d.style.backgroundRepeat = "no-repeat";
				d.style.width = "30px";
				d.style.height = "30px";
				d.style.textAlign = "center";
				if(widget.iconPos){
					d.style.backgroundPosition = widget.iconPos;
				}
				tab.appendChild(d);
				tab.appendChild(dojo.create("BR"));
			}
			tab.appendChild(dojo.doc.createTextNode(widget.label));
			tab.pane = widget;
			widget.tab = tab;
			this.connect(tab, "onclick", "onTabClick");
			cell.appendChild(tab);
		}
		div.appendChild(tbl);
		this.tabHeaderNode.appendChild(div);
		this.selectTab(this.selectedPane.tab);
	},

	selectTab: function(/*DomNode*/tab){
		this.selectedPane.domNode.style.display = "none";
		dojo.removeClass(this.selectedPane.tab, "mblTabButtonSelected");
		this.selectedPane = tab.pane;
		this.selectedPane.domNode.style.display = "";
		dojo.addClass(tab, "mblTabButtonSelected");
	},

	onTabClick: function(e){
		var tab = e.currentTarget;
		dojo.addClass(tab, "mblTabButtonHighlighted");
		setTimeout(function(){
			dojo.removeClass(tab, "mblTabButtonHighlighted");
		}, 200);
		this.selectTab(tab);
	}
});

dojo.declare(
	"dojox.mobile.TabPane",
	dijit._Widget,
{
	label: "",
	icon: "",
	iconPos: "",
	selected: false,
	buildRendering: function(){
		this.domNode = this.containerNode = this.srcNodeRef || dojo.doc.createElement("DIV");
		this.domNode.className = "mblTabPane";
	}
});

dojo._loaders.unshift(function(){
	// avoid use of dojo.query
	/*
	var list = dojo.query('[lazy=true] [dojoType]', null);
	list.forEach(function(node, index, nodeList){
		node.setAttribute("__dojoType", node.getAttribute("dojoType"));
		node.removeAttribute("dojoType");
	});
	*/

	var nodes = dojo.body().getElementsByTagName("*");
	var i, len, s;
	len = nodes.length;
	for(i = 0; i < len; i++){
		s = nodes[i].getAttribute("dojoType");
		if(s){
			if(nodes[i].parentNode.getAttribute("lazy") == "true"){
				nodes[i].setAttribute("__dojoType", s);
				nodes[i].removeAttribute("dojoType");
			}
		}
	}
});

dojo.addOnLoad(function(){
	// avoid use of dojo.query
	/*
	var list = dojo.query('[__dojoType]', null);
	list.forEach(function(node, index, nodeList){
		node.setAttribute("dojoType", node.getAttribute("__dojoType"));
		node.removeAttribute("__dojoType");
	});
	*/

	var nodes = dojo.body().getElementsByTagName("*");
	var i, len, s;
	for(i = 0; i < len; i++){
		s = nodes[i].getAttribute("__dojoType");
		if(s){
			nodes[i].setAttribute("dojoType", s);
			nodes[i].removeAttribute("__dojoType");
		}
	}
});

dijit.getEnclosingWidget = function(node){
	for(var n = node; node && node.tagName != "BODY"; node = (node._parentNode||node.parentNode)){
		if(node.getAttribute && node.getAttribute("widgetId")){
			return dijit.registry.byId(node.getAttribute("widgetId"));
		}
	}
	return null;
};
