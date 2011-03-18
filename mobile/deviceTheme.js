dojo.provide("dojox.mobile.deviceTheme");

// summary:
//		Detects the User Agent of the browser and loads appropriate theme files.
//		Simply dojo.require this module to enable the automatic theme loading.
//
//	example:
//			dojo.require("dojox.mobile");
//			dojo.require("dojox.mobile.deviceTheme");

dojox.mobile.loadCssFile = function(/*String*/file){
	dojo.create("LINK", {
		href: file,
		type: "text/css",
		rel: "stylesheet"
	}, dojo.doc.getElementsByTagName('head')[0]);
};

// A map of user-agents to theme files.
// The first array element is a regexp pattern that matches the userAgent string.
// The second array element is an array of css file paths.
// The matching is performed in the array order, and stops after the first match.
dojox.mobile.themeMap = [
	[
		"Android",
		[dojo.moduleUrl("dojox.mobile", "themes/android/android.css")]
	],
	[
		"BlackBerry",
		[dojo.moduleUrl("dojox.mobile", "themes/blackberry/blackberry.css")]
	],
	[
		"iPad",
		[dojo.moduleUrl("dojox.mobile", "themes/iphone/iphone.css"),
		 dojo.moduleUrl("dojox.mobile", "themes/iphone/ipad.css")]
	],
	[
		".*",
		[dojo.moduleUrl("dojox.mobile", "themes/iphone/iphone.css")]
	]
];

dojox.mobile.loadDeviceTheme = function(){
	var m = dojox.mobile.themeMap;
	for(var i = 0; i < m.length; i++){
		var re = new RegExp(m[i][0]);
		if(navigator.userAgent.match(re)){
			var files = m[i][1];
			for(var j = 0; j < files.length; j++){
				dojox.mobile.loadCssFile(files[j]);
			}
			break;
		}
	}
};

dojo.addOnLoad(function(){
	dojox.mobile.loadDeviceTheme();
});
