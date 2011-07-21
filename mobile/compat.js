define([
	"dojo/_base/kernel",
	"dojo/_base/sniff"
], function(dojo, has){
	dojo.getObject("mobile.compat", true, dojox);
	if(!dojo.isWebKit){
		require(["dojox/mobile/_compat"]);
	}
	return dojox.mobile.compat;
});
