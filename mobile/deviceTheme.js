define([
	"dojo/_base/array",
	"dojo/_base/config",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dojo/dom-construct",
	"require"
], function(array, config, lang, win, domConstruct, require){

	var dm = lang.getObject("dojox.mobile", true);

	// module:
	//		dojox/mobile/deviceTheme
	// summary:
	//		Automatic Theme Loader
	// description:
	//		Detects the User Agent of the browser and loads appropriate theme files.
	//		Simply dojo.require this module to enable the automatic theme loading.
	//
	//		By default, an all-in-one theme file (e.g. themes/iphone/iphone.css) is
	//		loaded. The all-in-one theme files contain style sheets for all the
	//		dojox.mobile widgets regardless of whether they are used in your
	//		application or not.
	//		If you want to choose what theme files to load, you can specify them
	//		via djConfig as shown in the following example:
	//
	//	|	djConfig="parseOnLoad:true, mblThemeFiles:['base','Button']"
	//
	//		Or you may want to use dojox.mobile.themeFiles as follows to get the
	//		same result. Note that the assignment has to be done before loading
	//		deviceTheme.js.
	//
	//	|	dojo.require("dojox.mobile");
	//	|	dojox.mobile.themeFiles = ['base','Button'];
	//	|	dojo.require("dojox.mobile.deviceTheme");
	//
	//		In the case of this example, if iphone is detected, for example, the
	//		following files will be loaded:
	//
	//	|	dojox/mobile/themes/iphone/base.css
	//	|	dojox/mobile/themes/iphone/Button.css
	//
	//		If you want to load style sheets for your own custom widgets, you can
	//		specify a package name along with a theme file name in an array.
	//
	//	|	['base',['com.acme','MyWidget']]
	//
	//		In this case, the following files will be loaded.
	//
	//	|	dojox/mobile/themes/iphone/base.css
	//	|	com/acme/themes/iphone/MyWidget.css
	//
	//		If you specify '@theme' as a theme file name, it will be replaced with
	//		the theme folder name. For example,
	//
	//	|	['@theme',['com.acme','MyWidget']]
	//
	//		will load the following files.
	//
	//	|	dojox/mobile/themes/iphone/iphone.css
	//	|	com/acme/themes/iphone/MyWidget.css

	dm.loadCssFile = function(/*String*/file){
		domConstruct.create("LINK", {
			href: file,
			type: "text/css",
			rel: "stylesheet"
		}, win.doc.getElementsByTagName('head')[0]);
	};

	dm.themeMap = dm.themeMap || [
		// summary:
		//		A map of user-agents to theme files.
		// description:
		//		The first array element is a regexp pattern that matches the
		//		userAgent string.
		//
		//		The second array element is a theme folder name.
		//
		//		The third array element is an array of css file paths to load.
		//
		//		The matching is performed in the array order, and stops after the
		//		first match.
		[
			"Android",
			"android",
			[]
		],
		[
			"BlackBerry",
			"blackberry",
			[]
		],
		[
			"iPad",
			"iphone",
			[require.toUrl("dojox/mobile/themes/iphone/ipad.css")]
		],
		[
			"Custom",
			"custom",
			[]
		],
		[
			".*",
			"iphone",
			[]
		]
	];

	dm.loadDeviceTheme = function(){
		var t = config["mblThemeFiles"] || dm.themeFiles || ["@theme"];
		if(!lang.isArray(t)){ console.log("loadDeviceTheme: array is expected but found: "+t); }
		var i, j;
		var m = dm.themeMap;
		var ua = (location.search.match(/theme=(\w+)/)) ? RegExp.$1 : navigator.userAgent;
		for(i = 0; i < m.length; i++){
			if(ua.match(new RegExp(m[i][0]))){
				var theme = m[i][1];
				var files = m[i][2];
				for(j = t.length - 1; j >= 0; j--){
					var pkg = lang.isArray(t[j]) ? (t[j][0]||"").replace(/\./g, '/') : "dojox/mobile";
					var name = lang.isArray(t[j]) ? t[j][1] : t[j];
					var f = "themes/" + theme + "/" +
						(name === "@theme" ? theme : name) + ".css";
					files.unshift(require.toUrl(pkg+"/"+f));
				}
				for(j = 0; j < files.length; j++){
					dm.loadCssFile(files[j].toString());
				}
				break;
			}
		}
	};
	
	if(dm.configDeviceTheme){
		dm.configDeviceTheme();
	}
	dm.loadDeviceTheme();

	return dm;
});
