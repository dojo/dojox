define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/window",
	"dijit/_Contained",
	"dijit/_Container",
	"dijit/_WidgetBase"
], function(array, declare, win, Contained, Container, WidgetBase){
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
