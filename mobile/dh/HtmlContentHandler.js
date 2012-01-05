define([
	"dojo/_base/kernel",
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/dom-construct"
], function(dojo, array, declare, domConstruct){

	return declare("dojox.mobile.dh.HtmlContentHandler", null, {

		parse: function(/*String*/ text, /*DomNode*/ target, /*DomNode*/ refNode){
			var view, container = domConstruct.create("div", {innerHTML: text});
			for(i = 0; i < container.childNodes.length; i++){
				var n = container.childNodes[i];
				if(n.nodeType === 1){
					view = n; // expecting <div dojoType="dojox.mobile.View">
					break;
				}
			}
			if(!view){
				console.log(this.declaredClass + ".parse: invalid view content");
				return;
			}
			view.style.visibility = "hidden";
			target.insertBefore(container, refNode);
			var ws = dojo.parser.parse(container); // [global reference]
			array.forEach(ws, function(w){
				if(!w._started && w.startup){
					w.startup();
				}
			});

			// allows multiple root nodes in the fragment,
			// but transition will be performed to the 1st view.
			for(i = 0, len = container.childNodes.length; i < len; i++){
				target.insertBefore(container.firstChild, refNode); // reparent
			}
			target.removeChild(container);
			return view.id;
		}
	});
});
