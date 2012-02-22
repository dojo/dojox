define([
	"dojo/_base/declare",
	"./_Controller",
	"./ModelRefControllerMixin"
], function(declare, _Controller, ModelRefControllerMixin){
	return declare("dojox.mvc.ModelRefController", [_Controller, ModelRefControllerMixin], {
		// summary:
		//		A controller working with a data model as a reference.
		//		Manages change in model as well as change in model properties.
		//		To use this declaratively on a dijit widget, use dojox.mvc.ModelRefControllerMixin mixed into dijit._WidgetBase instead.
	});
});
