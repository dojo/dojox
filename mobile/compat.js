define([
	"dojo/_base/lang",
	"dojo/_base/sniff"
], function(lang, has){
	lang.getObject("mobile.compat", true, dojox);
	if(!has("webKit")){
		require(["dojox/mobile/_compat"]);
	}
	return dojox.mobile.compat;
});
