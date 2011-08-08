define([
	"dojo/_base/lang",
	"dojo/_base/sniff",
	".."
], function(lang, has, dojox){
	lang.getObject("mobile.compat", true, dojox);
	if(!has("webkit")){
		require(["dojox/mobile/_compat"]);
	}
	return dojox.mobile.compat;
});
