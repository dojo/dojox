define([
	"dojo/_base/declare",
	"./_Controller",
	"./EditStoreRefControllerMixin"
], function(declare, _Controller, EditStoreRefControllerMixin){
	return declare("dojox.mvc.EditStoreRefController", [_Controller, EditStoreRefControllerMixin], {
		// summary:
		//		A controller working with Dojo Object Store.
		//		It does not store/model in sync unless queryStore()/getStore()/commit() is called.
		//		To use this declaratively on a dijit widget, use dojox.mvc.EditStoreRefControllerMixin mixed into dijit._WidgetBase instead.
	});
});
