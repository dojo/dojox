define([
	"dojo/_base/declare",
	"dijit/_WidgetBase"
], function(declare, _WidgetBase){
	return declare("dojox.mvc.Element", _WidgetBase, {
		// summary:
		//		A simple widget that maps "value" attribute to DOM text (working as a lightweight version of dojox.mvc.Output in this case), and other attributes to DOM attributes.

		_setValueAttr: {node: "domNode", type: "innerText"}
	});
});
