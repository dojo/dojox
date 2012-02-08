define([
	"dojo/_base/kernel",
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/Deferred",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dijit/registry",
	"../lazyLoadUtils"
], function(dojo, array, declare, Deferred, domClass, domConstruct, registry, lazyLoadUtils){

	// module:
	//		dojox/mobile/dh/HtmlContentHandler
	// summary:
	//		An HTML content handler.

	return declare("dojox.mobile.dh.HtmlContentHandler", null, {
		// summary:
		//		A HTML content handler.
		// description:
		//		This module is a content handler that creates a view from HTML
		//		data. If widgets used in the HTML data are not available, they
		//		are loaded automatically before instantiation.

		parse: function(/*String*/ text, /*DomNode*/ target, /*DomNode*/ refNode){
			if(this.execScript){
				text = this.execScript(text);
			}
			var container = domConstruct.create("div", {
				innerHTML: text,
				style: {visibility: "hidden"}
			});
			target.insertBefore(container, refNode);

			return Deferred.when(lazyLoadUtils.instantiateLazyWidgets(container), function(){
				// allows multiple root nodes in the fragment,
				// but transition will be performed to the 1st view.
				var view;
				for(i = 0, len = container.childNodes.length; i < len; i++){
					var n = container.firstChild;
					if(!view && n.nodeType === 1){
						view = registry.byNode(n);
					}
					target.insertBefore(container.firstChild, refNode); // reparent
				}
				target.removeChild(container);
				if(!view || !domClass.contains(view.domNode, "mblView")){
					console.log("HtmlContentHandler.parse: invalid view content");
					return null;
				}
				return view.id;
			});
		}
	});
});
