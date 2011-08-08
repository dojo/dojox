define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/dom-class",
	"dijit/_Contained",
	"dijit/_Container",
	"dijit/_WidgetBase"
], function(array, declare, domClass, Contained, Container, WidgetBase){
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
