define([
	"dojo/_base/window",
	"dojo/_base/declare",
	"dijit/_WidgetBase",
	"dijit/_Contained"
], function(win, declare, WidgetBase, Contained){
	// module:
	//		dojox/mobile/RoundRectCategory
	// summary:
	//		TODOC

	/*=====
		WidgetBase = dijit._WidgetBase;
		Contained = dijit._Contained;
	=====*/
	return declare("dojox.mobile.RoundRectCategory", [WidgetBase, Contained],{
		label: "",

		buildRendering: function(){
			this.domNode = this.containerNode = this.srcNodeRef || win.doc.createElement("H2");
			this.domNode.className = "mblRoundRectCategory";
			if(!this.label){
				this.label = this.domNode.innerHTML;
			}
		},

		_setLabelAttr: function(/*String*/label){
			this.label = label;
			this.domNode.innerHTML = this._cv(label);
		}
	});

});
