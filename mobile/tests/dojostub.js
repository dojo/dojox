	//		A sample dojo API stub for scrollable.js to self-bootstrap.
	//
	//		If you use scrollable.js for non-dojo application, you need to explicitly
	//		assign your outer fixed node and inner scrollable node to this.domNode
	//		and this.containerNode respectively.
	//
	//		Non-dojo application should capture the onorientationchange or
	//		the onresize event and call resize() in the event handler.
	//
	// example:
	//		Use this module from a non-dojo applicatoin:
	//		| function onLoad(){
	//		| 	var scrollable = new dojox.mobile.scrollable(dojo, dojox);
	//		| 	scrollable.init({
	//		| 		domNode: "outer", // id or node
	//		| 		containerNode: "inner" // id or node
	//		| 	});
	//		| }
	//		| <body onload="onLoad()">
	//		| 	<h1 id="hd1" style="position:relative;width:100%;z-index:1;">
	//		| 		Fixed Header
	//		| 	</h1>
	//		| 	<div id="outer" style="position:relative;height:100%;overflow:hidden;">
	//		| 		<div id="inner" style="position:absolute;width:100%;">
	//		| 			... content ...
	//		| 		</div>
	//		| 	</div>
	//		| </body>

	dojo = {doc:document, global:window};
	dojox = {mobile:{}};

	dojo.has = function(name){
		var ua = navigator.userAgent;
		if(name === "webkit"){
			return ua.indexOf("WebKit") != -1;
		}
		if(name === "android"){
			return parseFloat(ua.split("Android ")[1]) || undefined;
		}
		if(name === "iphone"){
			return ua.match(/(iPhone|iPod|iPad)/);
		}
		if(name === "ie"){
			return parseFloat(ua.split("MSIE ")[1]) || undefined;
		}
		if(name === "touch"){
			return (typeof dojo.doc.documentElement.ontouchstart != "undefined" &&
				navigator.appVersion.indexOf("Mobile") != -1) || !!dojo.has("android");
		}
		return null;
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

	dojo.setStyle = function(node, style, value){
		if(typeof style === "string"){
			var obj = {};
			obj[style] = value;
			style = obj;
		}
		for(var s in style){
			if(style.hasOwnProperty(s)){
				node.style[s] = style[s];
				if(s === "opacity" && typeof(node.style.filter) !== "undefined"){
					node.style.filter = " progid:DXImageTransform.Microsoft.alpha(opacity="+ (style[s]*100) +")";
				}
			}
		}
	};

	dojo.create = function(tag, attrs, refNode){
		return refNode.appendChild(dojo.doc.createElement(tag));
	};

	dojo.hasClass = function(node, s){
		return (node.className.indexOf(s) != -1);
	};
	dojo.addClass = function(node, s){
		if(!dojo.hasClass(node, s)){
			node.className += " " + s;
		}
	};
	dojo.removeClass = function(node, s){
		node.className = node.className.replace(" " + s, "");
	};

	dojo.connect = function(node, eventName, scope, method){
		var handler = function(e){
			e = e || dojo.global.event;
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

	define = function(module, deps, def){
		var _def = (arguments.length === 2) ? arguments[1] : arguments[2];
		_def(
			dojo, // dojo
			{ // connect
				connect: dojo.connect,
				disconnect: dojo.disconnect
			},
			{ // event
				stop: dojo.stopEvent
			},
			{ // lang
				getObject: function(){ return dojox.mobile; }
			},
			dojo, // win
			{ // domClass
				contains: dojo.hasClass,
				add: dojo.addClass,
				remove: dojo.removeClass
			},
			{ // domConstruct
				create: dojo.create
			},
			{ // domStyle
				set: dojo.setStyle
			},
			dojo.has // has
		);
	};
