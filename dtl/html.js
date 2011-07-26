define([
	"dojo/_base/kernel",
	"dojo/_base/lang",
	"./_base",
	"./dom"
], function(dojo,lang,dd,ddd){
	/*=====
		dd = dojox.dtl;
	=====*/ 
	lang.getObject("dtl.html", true, dojox);

	dojo.deprecated("dojox.dtl.html", "All packages and classes in dojox.dtl that start with Html or html have been renamed to Dom or dom");
	dd.HtmlTemplate = ddd.DomTemplate;
	return dojox.dtl.html;
});