define([
	"dojo/_base/kernel",
	"dojo/_base/lang",
	"../render/dom",
	"./_base"
], function(dojo,lang,ddrd,dd){
	/*=====
		dd = dojox.dtl;
	=====*/ 
	lang.getObject("dtl.render.html", true, dojox);

	dd.render.html.Render = ddrd.Render;
	return dojox.dtl.render.html;
});