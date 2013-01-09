define([
	"dojo/_base/window",
	"dojo/_base/sniff",
	"dojo/_base/array"
], function(win, has, arr){

	var ua = navigator.userAgent;

	// BlackBerry (OS 6 or later only)
	has.add('bb', (ua.indexOf("BlackBerry") >= 0 || ua.indexOf("BB10")) && parseFloat(ua.split("Version/")[1]) || undefined, undefined, true);

	// Android
	has.add('android', parseFloat(ua.split("Android ")[1]) || undefined, undefined, true);

	// iPhone, iPod, or iPad
	// If iPod or iPad is detected, in addition to has('ipod') or has('ipad'),
	// has('iphone') will also have iOS version number.
	if(ua.match(/(iPhone|iPod|iPad)/)){
		var p = RegExp.$1.replace(/P/, 'p');
		var v = ua.match(/OS ([\d_]+)/) ? RegExp.$1 : "1";
		var os = parseFloat(v.replace(/_/, '.').replace(/_/g, ''));
		has.add(p, os, undefined, true);
		has.add('iphone', os, undefined, true);
	}

	if(has("webkit")){
		has.add('touch', (typeof win.doc.documentElement.ontouchstart != "undefined" &&
			navigator.appVersion.indexOf("Mobile") != -1) || !!has('android'), undefined, true);
	}

	// Does the browser support CSS3 animations?
		
	// We just test webkit prefix for now since our themes only have standard and webkit
	// (see dojox/mobile/themes/common/css3.less)
	// More prefixes can be added if/when we add them to css3.less.
	var prefixes = ["webkit"];
		
	has.add("css3-animations", function(global, document, element){
		var style = element.style;
		return (style["animation"] !== undefined && style["transition"] !== undefined) ||
			arr.some(prefixes, function(p){
				return style[p+"Animation"] !== undefined && style[p+"Transition"] !== undefined;
			});
	});
	
	// Does the browser support SVG?
	has.add("svg", "SVGAngle" in win.global);
	
	/*=====
	return {
		// summary:
		//		This module sets has() flags based on the userAgent of the current browser.
	};
	=====*/
	return has;
});
