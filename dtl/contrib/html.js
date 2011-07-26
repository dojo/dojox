define([
	"dojo/_base/kernel",
	"dojo/_base/lang",
	"../contrib/dom"
], function(dojo,lang,ddcd){
	lang.getObject("dtl.contrib.html", true, dojox);

	dojo.deprecated("dojox.dtl.html", "All packages and classes in dojox.dtl that start with Html or html have been renamed to Dom or dom");
	return dojox.dtl.contrib.html;
});