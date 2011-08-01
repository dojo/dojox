define([
	"dojo/_base/kernel", // to test dojo.hash
	"dojo/_base/array",
	"dojo/_base/config",
	"dojo/_base/connect",
	"dojo/_base/lang",
	"dojo/_base/sniff",
	"dojo/_base/window",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dojo/ready",
	"dijit/_WidgetBase"
//	"dojo/hash", // optionally prereq'ed
], function(dojo, array, config, connect, lang, has, win, domClass, domConstruct, domStyle, ready, WidgetBase){

	lang.getObject("mobile", true, dojox);

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
//		Note that use of dijit._Templated and query was intentionally
//		avoided to reduce download code size.

	var ua = navigator.userAgent;

	// BlackBerry (OS 6 or later only)
	has.add('bb', ua.indexOf("BlackBerry") >= 0 && parseFloat(ua.split("Version/")[1]) || undefined);

	// Android
	has.add('android', parseFloat(ua.split("Android ")[1]) || undefined);

	// iPhone, iPod, or iPad
	// If iPod or iPad is detected, in addition to has('ipod') or has('ipad'),
	// has('iphone') will also have iOS version number.
	if(ua.match(/(iPhone|iPod|iPad)/)){
		var p = RegExp.$1.replace(/P/,/p/);
		var v = ua.match(/OS ([\d_]+)/) ? RegExp.$1 : "1";
		var os = parseFloat(v.replace(/_/, '.').replace(/_/g, ''));
		has.add(p, os);
		has.add('iphone', os);
	}

	var html = win.doc.documentElement;
	html.className += lang.trim([
		has('bb') ? "dj_bb" : "",
		has('android') ? "dj_android" : "",
		has('iphone') ? "dj_iphone" : "",
		has('ipod') ? "dj_ipod" : "",
		has('ipad') ? "dj_ipad" : ""
	].join(" ").replace(/ +/g," "));

	var dm = dojox.mobile;

	dm.getScreenSize = function(){
		return {
			h: win.global.innerHeight || win.doc.documentElement.clientHeight,
			w: win.global.innerWidth || win.doc.documentElement.clientWidth
		};
	};

	dm.updateOrient = function(){
		var dim = dm.getScreenSize();
		domClass.replace(win.doc.documentElement,
				  dim.h > dim.w ? "dj_portrait" : "dj_landscape",
				  dim.h > dim.w ? "dj_landscape" : "dj_portrait");
	};
	dm.updateOrient();

	dm.tabletSize = 500;
	dm.detectScreenSize = function(/*Boolean?*/force){
		var dim = dm.getScreenSize();
		var sz = Math.min(dim.w, dim.h);
		var from, to;
		if(sz >= dm.tabletSize && (force || (!this._sz || this._sz < dm.tabletSize))){
			from = "phone";
			to = "tablet";
		}else if(sz < dm.tabletSize && (force || (!this._sz || this._sz >= dm.tabletSize))){
			from = "tablet";
			to = "phone";
		}
		if(to){
			domClass.replace(win.doc.documentElement, "dj_"+to, "dj_"+from);
			connect.publish("/dojox/mobile/screenSize/"+to, [dim]);
		}
		this._sz = sz;
	};
	dm.detectScreenSize();

	dm.setupIcon = function(/*DomNode*/iconNode, /*String*/iconPos){
		if(iconNode && iconPos){
			var arr = array.map(iconPos.split(/[ ,]/),function(item){return item-0});
			var t = arr[0]; // top
			var r = arr[1] + arr[2]; // right
			var b = arr[0] + arr[3]; // bottom
			var l = arr[1]; // left
			var offset = iconNode.parentNode ? domStyle.get(iconNode.parentNode, "paddingLeft") : 8;
			domStyle.set(iconNode, {
				clip: "rect("+t+"px "+r+"px "+b+"px "+l+"px)",
				top: (iconNode.parentNode ? domStyle.get(iconNode, "top") : 0) - t + "px",
				left: offset - l + "px"
			});
		}
	};

	dm.hideAddressBarWait = typeof(config["mblHideAddressBarWait"]) === "number" ?
		config["mblHideAddressBarWait"] : 1500; // [ms] value must be larger than 800
	dm.hide_1 = function(force){
		scrollTo(0, 1);
		var h = dm.getScreenSize().h + "px";
		if(has('android')){
			if(force){
				win.body().style.minHeight = h;
			}
			dm.resizeAll();
		}else{
			if(force || dm._h === h && h !== win.body().style.minHeight){
				win.body().style.minHeight = h;
				dm.resizeAll();
			}
		}
		dm._h = h;
	};
	dm.hide_fs = function(){
		// for fail-safe, in case of failure to complete the address bar hiding in time
		var t = win.body().style.minHeight;
		win.body().style.minHeight = (dm.getScreenSize().h * 2) + "px"; // to ensure enough height for scrollTo to work
		scrollTo(0, 1);
		setTimeout(function(){
			dm.hide_1(1);
			dm._hiding = false;
		}, 1000);
	};
	dm.hideAddressBar = function(/*Event?*/evt){
		if(dm.disableHideAddressBar || dm._hiding){ return; }
		dm._hiding = true;
		dm._h = 0;
		win.body().style.minHeight = (dm.getScreenSize().h * 2) + "px"; // to ensure enough height for scrollTo to work
		setTimeout(dm.hide_1, 0);
		setTimeout(dm.hide_1, 200);
		setTimeout(dm.hide_1, 800);
		setTimeout(dm.hide_fs, dm.hideAddressBarWait);
	};

	dm.resizeAll = function(/*Event?*/evt, /*Widget?*/root){
		// summary:
		//		Call the resize() method of all the top level resizable widgets.
		// description:
		//		Find all widgets that do not have a parent or the parent does not
		//		have the resize() method, and call resize() for them.
		//		If a widget has a parent that has resize(), call of the widget's
		//		resize() is its parent's responsibility.
		// evt:
		//		Native event object
		// root:
		//		If specified, search the specified widget recursively for top level
		//		resizable widgets.
		//		root.resize() is always called regardless of whether root is a
		//		top level widget or not.
		//		If omitted, search the entire page.
		if(dm.disableResizeAll){ return; }
		connect.publish("/dojox/mobile/resizeAll", [evt, root]);
		dm.updateOrient();
		dm.detectScreenSize();
		var isTopLevel = function(w){
			var parent = w.getParent && w.getParent();
			return !!((!parent || !parent.resize) && w.resize);
		};
		var resizeRecursively = function(w){
			array.forEach(w.getChildren(), function(child){
				if(isTopLevel(child)){ child.resize(); }
				resizeRecursively(child);
			});
		};
		if(root){
			if(root.resize){ root.resize(); }
			resizeRecursively(root);
		}else{
			dijit.registry.filter(isTopLevel).forEach(function(w){
				w.resize();
			});
		}
	};

	dm.openWindow = function(url, target){
		win.global.open(url, target || "_blank");
	};

	dm.createDomButton = function(/*DomNode*/refNode, /*Object?*/style, /*DomNode?*/toNode){
		var s = refNode.className;
		var node = toNode || refNode;
		if(s.match(/(mblDomButton\w+)/) && s.indexOf("/") === -1){
			var btnClass = RegExp.$1;
			var nDiv = 4;
			if(s.match(/(mblDomButton\w+_(\d+))/)){
				nDiv = RegExp.$2 - 0;
			}
			for(var i = 0, p = node; i < nDiv; i++){
				p = p.firstChild || domConstruct.create("DIV", null, p);
			}
			if(toNode){
				setTimeout(function(){
					domClass.remove(refNode, btnClass);
				}, 0);
				domClass.add(toNode, btnClass);
			}
		}else if(s.indexOf(".") !== -1){ // file name
			domConstruct.create("IMG", {src:s}, node);
		}else{
			return null;
		}
		domClass.add(node, "mblDomButton");
		!!style && domStyle.set(node, style);
		return node;
	};
	
	dm.createIcon = function(/*String*/icon, /*String*/iconPos, /*DomNode*/node, /*String?*/title, /*DomNode?*/parent){
		// summary:
		//		Create or update a ListItem icon node
		// description:
		//		If node exists, update the existing node. Otherwise, create a new one.
		// icon:
		//		Path for an image, or DOM button class name.
		if(icon && icon.indexOf("mblDomButton") === 0){
			// DOM button
			if(node && node.className.match(/(mblDomButton\w+)/)){
				domClass.remove(node, RegExp.$1);
			}else{
				node = domConstruct.create("DIV");
			}
			node.title = title;
			domClass.add(node, icon);
			dm.createDomButton(node);
		}else if(icon && icon !== "none"){
			// Image
			if(!node || node.nodeName !== "IMG"){
				node = domConstruct.create("IMG", {
					alt: title
				});
			}
			node.src = icon;
			dm.setupIcon(node, iconPos);
			if(parent && iconPos){
				var arr = iconPos.split(/[ ,]/);
				domStyle.set(parent, {
					width: arr[2] + "px",
					height: arr[3] + "px"
				});
			}
		}
		if(parent){
			parent.appendChild(node);
		}
		return node;
	};

	if(config.parseOnLoad){
		ready(90, function(){
			// avoid use of query
			/*
			var list = query('[lazy=true] [dojoType]', null);
			list.forEach(function(node, index, nodeList){
				node.setAttribute("__dojoType", node.getAttribute("dojoType"));
				node.removeAttribute("dojoType");
			});
			*/
		
			var nodes = win.body().getElementsByTagName("*");
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
	}
	
	ready(function(){
		dm.detectScreenSize(true);
		if(config["mblApplyPageStyles"] !== false){
			domClass.add(win.doc.documentElement, "mobile");
		}

		if(config["mblAndroidWorkaround"] !== false && has('android') >= 2.2 && has('android') < 3.1){ // workaround for android screen flicker problem
			if(config["mblAndroidWorkaroundButtonStyle"] !== false){
				// workaround to avoid buttons disappear due to the side-effect of the webkitTransform workaroud below
				domConstruct.create("style", {innerHTML:"BUTTON,INPUT[type='button'],INPUT[type='submit'],INPUT[type='reset'],INPUT[type='file']::-webkit-file-upload-button{-webkit-appearance:none;}"}, win.doc.head, "first");
			}
			if(has('android') < 3){ // for Android 2.2.x and 2.3.x
				domStyle.set(win.doc.documentElement, "webkitTransform", "translate3d(0,0,0)");
				// workaround for auto-scroll issue when focusing input fields
				connect.connect(null, "onfocus", null, function(e){
					domStyle.set(win.doc.documentElement, "webkitTransform", "");
				});
				connect.connect(null, "onblur", null, function(e){
					domStyle.set(win.doc.documentElement, "webkitTransform", "translate3d(0,0,0)");
				});
			}else{ // for Android 3.0.x
				if(config["mblAndroid3Workaround"] !== false){
					domStyle.set(win.doc.documentElement, {
						webkitBackfaceVisibility: "hidden",
						webkitPerspective: 8000
					});
				}
			}
		}
	
		//	You can disable hiding the address bar with the following djConfig.
		//	var djConfig = { mblHideAddressBar: false };
		var f = dm.resizeAll;
		if(config["mblHideAddressBar"] !== false &&
			navigator.appVersion.indexOf("Mobile") != -1 ||
			config["mblForceHideAddressBar"] === true){
			dm.hideAddressBar();
			if(config["mblAlwaysHideAddressBar"] === true){
				f = dm.hideAddressBar;
			}
		}
		connect.connect(null, (win.global.onorientationchange !== undefined && !has('android'))
			? "onorientationchange" : "onresize", null, f);
	
		// avoid use of query
		/*
		var list = query('[__dojoType]', null);
		list.forEach(function(node, index, nodeList){
			node.setAttribute("dojoType", node.getAttribute("__dojoType"));
			node.removeAttribute("__dojoType");
		});
		*/
	
		var nodes = win.body().getElementsByTagName("*");
		var i, len = nodes.length, s;
		for(i = 0; i < len; i++){
			s = nodes[i].getAttribute("__dojoType");
			if(s){
				nodes[i].setAttribute("dojoType", s);
				nodes[i].removeAttribute("__dojoType");
			}
		}
	
		if(dojo.hash){
			// find widgets under root recursively
			var findWidgets = function(root){
				if(!root){ return []; }
				var arr = dijit.findWidgets(root);
				var widgets = arr;
				for(var i = 0; i < widgets.length; i++){
					arr = arr.concat(findWidgets(widgets[i].containerNode));
				}
				return arr;
			};
			connect.subscribe("/dojo/hashchange", null, function(value){
				var view = dm.currentView;
				if(!view){ return; }
				var params = dm._params;
				if(!params){ // browser back/forward button was pressed
					var moveTo = value ? value : dm._defaultView.id;
					var widgets = findWidgets(view.domNode);
					var dir = 1, transition = "slide";
					for(i = 0; i < widgets.length; i++){
						var w = widgets[i];
						if("#"+moveTo == w.moveTo){
							// found a widget that has the given moveTo
							transition = w.transition;
							dir = (w instanceof dm.Heading) ? -1 : 1;
							break;
						}
					}
					params = [ moveTo, dir, transition ];
				}
				view.performTransition.apply(view, params);
				dm._params = null;
			});
		}
	
		win.body().style.visibility = "visible";
	});
	
	dijit.getEnclosingWidget = function(node){
		while(node && node.tagName !== "BODY"){
			if(node.getAttribute && node.getAttribute("widgetId")){
				return dijit.registry.byId(node.getAttribute("widgetId"));
			}
			node = node._parentNode || node.parentNode;
		}
		return null;
	};

	(function(){
		// feature detection
		if(has("webKit")){
			dm.hasTouch = (typeof win.doc.documentElement.ontouchstart != "undefined" &&
				navigator.appVersion.indexOf("Mobile") != -1) || !!has('android');
		}
	})();

	return dm;
});
