define([
  "dojo",
  "dijit",
  "dojox",
  "dijit/_WidgetBase",
  "dijit/_Contained"], function(dojo, dijit, dojox){
	// module:
	//		dojox/mobile/RoundRectCategory
	// summary:
	//		TODOC

dojo.declare(
	"dojox.mobile.RoundRectCategory",
	[dijit._WidgetBase, dijit._Contained],
{
	label: "",

	buildRendering: function(){
		this.domNode = this.containerNode = this.srcNodeRef || dojo.doc.createElement("H2");
		this.domNode.className = "mblRoundRectCategory";
		if(!this.label){
			this.label = this.domNode.innerHTML;
		}
		this.domNode.innerHTML = this._cv(this.label);
	}
});

return dojox.mobile.RoundRectCategory;
});
