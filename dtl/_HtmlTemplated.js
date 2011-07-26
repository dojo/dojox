define([
	"dojo/_base/kernel",
	"dojo/_base/lang",
	"./_base",
	"./_DomTemplated"
], function(dojo,lang,dtl,dddt){
	/*=====
		dtl = dojox.dtl;
	=====*/
	lang.getObject("dtl._HtmlTemplated", true, dojox);

	dojo.deprecated("dojox.dtl.html", "All packages and classes in dojox.dtl that start with Html or html have been renamed to Dom or dom");
	dtl._HtmlTemplated = dddt;
	dtl._HtmlTemplated.prototype.declaredClass = "dojox.dtl._HtmlTemplated";
	return dojox.dtl._HtmlTemplated;
});