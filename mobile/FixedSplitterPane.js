define([
	"dojo/dom-class",
	"dojo/_base/declare",
	"dojo/_base/array",
	"dijit/_WidgetBase",
	"dijit/_Container",
	"dijit/_Contained"
],
	function(domClass, declare, array, WidgetBase, Container, Contained){
	/*=====
		WidgetBase = dijit._WidgetBase;
		Container = dijit._Container;
		Contained = dijit._Contained;
	=====*/
	return declare("dojox.mobile.FixedSplitterPane",[WidgetBase, Container, Contained],{
		buildRendering: function(){
			this.inherited(arguments);
			domClass.add(this.domNode, "mblFixedSplitterPane");
		},

		resize: function(){
			array.forEach(this.getChildren(), function(child){
				if(child.resize){ child.resize(); }
			});
		}
	});
});
