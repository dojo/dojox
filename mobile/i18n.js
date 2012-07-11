define([
	"dojo/_base/lang",
	"dojo/i18n",
	"dijit/_WidgetBase"
], function(lang, di18n, WidgetBase){

	// module:
	//		dojox/mobile/i18n

	var i18n = {
		// summary:
		//		An internationalization utility for applications based on dojox/mobile.
	};
	lang.setObject("dojox.mobile.i18n", i18n);

	i18n.load = function(/*String*/packageName, /*String*/bundleName, /*String?*/locale){
		// summary:
		//		Loads an nls resource bundle and returns an array of localized
		//		resources.
		return i18n.registerBundle(di18n.getLocalization(packageName, bundleName, locale));
	};

	i18n.registerBundle = function(/*Array*/bundle){
		// summary:
		//		Accumulates the given localized resources in an array and returns
		//		it.
		if(!i18n.bundle){ i18n.bundle = []; }
		return lang.mixin(i18n.bundle, bundle);
	};

	// Add these functions to _WidgetBase, but hide from API doc parser because they don't seem very useful to
	// document.
	lang.extend(WidgetBase, /*===== {} || =====*/ {
		mblNoConv: false,
		_cv: function(s){
			if(this.mblNoConv || !i18n.bundle){ return s; }
			return i18n.bundle[lang.trim(s)] || s;
		}
	});

	return i18n;
});
