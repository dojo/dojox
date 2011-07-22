define([
	".",
	"dojo/_base/kernel",
	"dojo/_base/lang",
	"dojox/mobile/_base"
], function(dojox, kernel, lang, base){
	lang.getObject("mobile", true, dojox);
	kernel.experimental("dojox.mobile");
	return dojox.mobile;
});
