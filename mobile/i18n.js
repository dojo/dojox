dojo.provide("dojox.mobile.i18n");
dojo.require("dojo.i18n");
dojo.require("dojox.mobile");

dojox.mobile.i18n.load = function(/*String*/packageName, /*String*/bundleName, /*String?*/locale, /*String?*/availableFlatLocales){
	dojo.requireLocalization(packageName, bundleName, locale, availableFlatLocales);
	if(!dojox.mobile.i18n.bundle){ dojox.mobile.i18n.bundle = []; }
	return dojo.mixin(dojox.mobile.i18n.bundle, dojo.i18n.getLocalization(packageName, bundleName, locale));
};

dojo.extend(dijit._WidgetBase, {
	mblNoConv: false,
	_cv: function(s){
		if(this.mblNoConv || !dojox.mobile.i18n.bundle){ return s; }
		return dojox.mobile.i18n.bundle[dojo.trim(s)] || s;
	}
});
