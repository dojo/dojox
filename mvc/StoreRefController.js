define([
	"dojo/_base/declare",
	"./_Controller",
	"./StoreRefControllerMixin"
], function(declare, _Controller, StoreRefControllerMixin){
	return declare("dojox.mvc.StoreRefController", [_Controller, StoreRefControllerMixin], {
		// summary:
		//		A controller working with Dojo Object Store.
		//		It does not store/model in sync unless queryStore()/getStore() is called.
		//		To use this declaratively on a dijit widget, use dojox.mvc.StoreRefControllerMixin mixed into dijit._WidgetBase instead.
	});
});
