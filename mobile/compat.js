define([
	"dojo/_base/lang",
	"dojo/_base/sniff"
], function(lang, has){
	var dm = lang.getObject("dojox.mobile", true);
	if(!has("webkit")){
		require(["dojox/mobile/_compat"]);
	}
	return dm;
});
