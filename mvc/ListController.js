define([
	"dojo/_base/declare",
	"./_Controller",
	"./ListControllerMixin"
], function(declare, _Controller, ListControllerMixin){
	return declare("dojox.mvc.ListController", [_Controller, ListControllerMixin], {
		// summary:
		//		A controller working with array model, managing its cursor.
		//		To use this declaratively on a dijit widget, use dojox.mvc.ListControllerMixin mixed into dijit._WidgetBase instead.
	});
});
