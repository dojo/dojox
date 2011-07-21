define([
	"./RoundRectCategory"
],function(RoundRectCategory){
	/*=====
		RoundRectCategory = dojox.mobile.RoundRectCategory;
	=====*/
	return dojo.declare("dojox.mobile.EdgeToEdgeCategory", RoundRectCategory, {
		buildRendering: function(){
			this.inherited(arguments);
			this.domNode.className = "mblEdgeToEdgeCategory";
		}
	});
});
