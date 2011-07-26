define([
	"dojo/_base/kernel",
	"dojo/_base/lang",
	"./_base",
	"./DomInline"
], function(dojo,lang,dd,dddnl){
	/*=====
		dd = dojox.dtl;
	=====*/ 
	lang.getObject("dtl.HtmlInline", true, dojox);

	dojo.deprecated("dojox.dtl.html", "All packages and classes in dojox.dtl that start with Html or html have been renamed to Dom or dom");
	dd.HtmlInline = dddnl;
	dd.HtmlInline.prototype.declaredClass = "dojox.dtl.HtmlInline";
	return dojox.dtl.HtmlInline;
});