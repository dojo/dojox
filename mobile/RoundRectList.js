define([
  "dojo",
  "dijit",
  "dojox",
  "dijit/_WidgetBase",
  "dijit/_Container",
  "dijit/_Contained"], function(dojo, dijit, dojox){
	// module:
	//		dojox/mobile/RoundRectList
	// summary:
	//		TODOC

dojo.declare(
	"dojox.mobile.RoundRectList",
	[dijit._WidgetBase, dijit._Container, dijit._Contained],
{
	transition: "slide",
	iconBase: "",
	iconPos: "",
	select: "", // "single", "multiple", or ""

	buildRendering: function(){
		this.domNode = this.containerNode = this.srcNodeRef || dojo.doc.createElement("UL");
		this.domNode.className = "mblRoundRectList";
	},

	onCheckStateChanged: function(/*Widget*/listItem, /*String*/newState){
		// Stub function to connect to from your application.
	}
});

return dojox.mobile.RoundRectList;
});
