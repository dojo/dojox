define([
  "dojo",
  "dijit",
  "dojox",
  "dijit/_WidgetBase",
  "dijit/_Container",
  "dijit/_Contained"], function(dojo, dijit, dojox){
	// module:
	//		dojox/mobile/RoundRect
	// summary:
	//		TODOC

dojo.declare(
	"dojox.mobile.RoundRect",
	[dijit._WidgetBase, dijit._Container, dijit._Contained],
{
	shadow: false,

	buildRendering: function(){
		this.domNode = this.containerNode = this.srcNodeRef || dojo.doc.createElement("DIV");
		this.domNode.className = this.shadow ? "mblRoundRect mblShadow" : "mblRoundRect";
	},

	resize: function(){
		dojo.forEach(this.getChildren(), function(child){
			if(child.resize){ child.resize(); }
		});
	}
});

return dojox.mobile.RoundRect;
});
