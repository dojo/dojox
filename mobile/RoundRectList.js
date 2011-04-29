define(["dijit/_WidgetBase", "dijit/_Container", "dijit/_Contained"], function(WidgetBase,Container,Contained){
	// module:
	//		dojox/mobile/RoundRectList
	// summary:
	//		TODOC

	return dojo.declare("dojox.mobile.RoundRectList", [WidgetBase,Container,Contained], {
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
});
