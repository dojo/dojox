define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/window",
	"dijit/_Contained",
	"dijit/_Container",
	"dijit/_WidgetBase"
], function(array, declare, win, Contained, Container, WidgetBase){
	// module:
	//		dojox/mobile/RoundRectList
	// summary:
	//		TODOC

	/*=====
		WidgetBase = dijit._WidgetBase;
		Container = dijit._Container;
		Contained = dijit._Contained;
	=====*/
	return declare("dojox.mobile.RoundRectList", [WidgetBase, Container, Contained], {
		transition: "slide",
		iconBase: "",
		iconPos: "",
		select: "", // "single", "multiple", or ""
		stateful: false, // keep the selection state or not

		buildRendering: function(){
			this.domNode = this.containerNode = this.srcNodeRef || win.doc.createElement("UL");
			this.domNode.className = "mblRoundRectList";
		},
	
		onCheckStateChanged: function(/*Widget*/listItem, /*String*/newState){
			// Stub function to connect to from your application.
		},

		_setStatefulAttr: function(stateful){
			this.stateful = stateful;
			array.forEach(this.getChildren(), function(child){
				child.setArrow && child.setArrow();
			});
		},

		deselectItem: function(/*ListItem*/item){
			item.deselectItem();
		},

		deselectAll: function(){
			array.forEach(this.getChildren(), function(child){
				child.deselect && child.deselect();
			});
		},

		selectItem: function(/*ListItem*/item){
			item.select();
		}
	});
});
