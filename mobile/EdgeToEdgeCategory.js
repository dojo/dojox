define([
	"dojo/_base/declare",
	"./RoundRectCategory"
],function(declare, RoundRectCategory){
	/*=====
		RoundRectCategory = dojox.mobile.RoundRectCategory;
	=====*/
	return declare("dojox.mobile.EdgeToEdgeCategory", RoundRectCategory, {
		buildRendering: function(){
			this.inherited(arguments);
			this.domNode.className = "mblEdgeToEdgeCategory";
		}
	});
});
