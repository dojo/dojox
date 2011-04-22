define([
  "dojo",
  "dijit",
  "dojox",
  "dojox/mobile/RoundRectCategory"], function(dojo, dijit, dojox){
	// module:
	//		dojox/mobile/EdgeToEdgeCategory
	// summary:
	//		TODOC

dojo.declare(
	"dojox.mobile.EdgeToEdgeCategory",
	dojox.mobile.RoundRectCategory,
{
	buildRendering: function(){
		this.inherited(arguments);
		this.domNode.className = "mblEdgeToEdgeCategory";
	}
});

return dojox.mobile.EdgeToEdgeCategory;
});
