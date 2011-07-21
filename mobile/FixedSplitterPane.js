define([
	"dojo/_base/kernel",
	"dojo/_base/declare",
	"dojo/_base/html",
	"dojo/_base/array",
	"dijit/_WidgetBase",
	"dijit/_Container",
	"dijit/_Contained"
],
	function(dojo, declare, dhtml, darray, WidgetBase, Container, Contained){
	/*=====
		WidgetBase = dijit._WidgetBase;
		Container = dijit._Container;
		Contained = dijit._Contained;
	=====*/
	return dojo.declare("dojox.mobile.FixedSplitterPane",[WidgetBase, Container, Contained],{
		buildRendering: function(){
			this.inherited(arguments);
			dojo.addClass(this.domNode, "mblFixedSplitterPane");
		},

		resize: function(){
			dojo.forEach(this.getChildren(), function(child){
				if(child.resize){ child.resize(); }
			});
		}
	});
});
