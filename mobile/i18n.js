define([
	"dojo/_base/lang",
	"dojo/i18n",
	"dijit/_WidgetBase"
], function(lang, di18n, WidgetBase){

	// module:
	//		dojox/mobile/i18n
	// summary:
	//		An internationalization utility for dojox.mobile-based user
	//		applications.

	var i18n = lang.getObject("dojox.mobile.i18n", true);

	i18n.load = function(/*String*/packageName, /*String*/bundleName, /*String?*/locale){
		return i18n.registerBundle(di18n.getLocalization(packageName, bundleName, locale));
	};

	i18n.registerBundle = function(/*Array*/bundle){
		if(!i18n.bundle){ i18n.bundle = []; }
		return lang.mixin(i18n.bundle, bundle);
	};

	lang.extend(WidgetBase, {
		mblNoConv: false,
		_cv: function(s){
			if(this.mblNoConv || !i18n.bundle){ return s; }
			return i18n.bundle[lang.trim(s)] || s;
		}
	});

	return i18n;
});
