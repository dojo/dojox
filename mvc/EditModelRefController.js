define([
	"dojo/_base/declare",
	"./_Controller",
	"./EditModelRefControllerMixin"
], function(declare, _Controller, EditModelRefControllerMixin){
	return declare("dojox.mvc.EditModelRefController", [_Controller, EditModelRefControllerMixin], {
		// summary:
		//		A controller that takes a data model as a data source.
		//		When this controller gets such data model, it creates a copy of that and works with it as the data model.
		//		This controller can reset the data model to the data source it originally got (reset()), or send the change back to the data source (commit()).
		//		To use this declaratively on a dijit widget, use dojox.mvc.EditModelRefControllerMixin mixed into dijit._WidgetBase instead.
	});
});
