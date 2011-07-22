define([
	"dojo/_base/window",
	"dojo/_base/declare",
	"dojo/_base/array",
	"dijit/_WidgetBase",
	"dijit/_Contained",
	"dijit/_Container"
], function(win, declare, array, WidgetBase, Contained, Container){
	// module:
	//		dojox/mobile/RoundRect
	// summary:
	//		TODOC

	/*=====
		WidgetBase = dijit._WidgetBase;
		Contained = dijit._Contained;
		Container = dijit._Container;
	=====*/
	return declare("dojox.mobile.RoundRect", [WidgetBase, Container, Contained], {

		shadow: false,

		buildRendering: function(){
			this.domNode = this.containerNode = this.srcNodeRef || win.doc.createElement("DIV");
			this.domNode.className = this.shadow ? "mblRoundRect mblShadow" : "mblRoundRect";
		},

		resize: function(){
			array.forEach(this.getChildren(), function(child){
				if(child.resize){ child.resize(); }
			});
		}
	});
});
