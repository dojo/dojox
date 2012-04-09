define([
	"dojo/_base/declare",
	"dijit/_WidgetBase"
], function(declare, _WidgetBase){
	return declare("dojox.mvc.FormElement", _WidgetBase, {
		// summary:
		//		A widget implicitly created by dojox.mvc.ParserExtension for <input> elements.
		// description:
		//		Updates value (or checked for check box) as user edits the <input>.

		buildRendering: function(){
			this.inherited(arguments);
			var _self = this, node = this.focusNode = this.domNode;
			this.on("change", function(e){
				var attr = /^checkbox$/i.test(node.getAttribute("type")) ? "checked" : "value";
				_self._set(attr, _self.get(attr));
			});
		},

		_getCheckedAttr: function(){ return this.domNode.checked; },
		_getValueAttr: function(){ return this.domNode.value; }
	});
});
