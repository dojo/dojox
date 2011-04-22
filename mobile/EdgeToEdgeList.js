define([
  "dojo",
  "dijit",
  "dojox",
  "dojox/mobile/RoundRectList"], function(dojo, dijit, dojox){
	// module:
	//		dojox/mobile/EdgeToEdgeList
	// summary:
	//		TODOC

dojo.declare(
	"dojox.mobile.EdgeToEdgeList",
	dojox.mobile.RoundRectList,
{
	stateful: false, // keep the selection state or not
	buildRendering: function(){
		this.inherited(arguments);
		this.domNode.className = "mblEdgeToEdgeList";
	}
});

return dojox.mobile.EdgeToEdgeList;
});
