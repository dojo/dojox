define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-construct"
], function(array, declare, lang, domConstruct){

	return declare("dojox.mobile.dh.JsonContentHandler", null, {

		parse: function(/*String*/ text, /*DomNode*/ target, /*DomNode*/ refNode){
			var view, container = domConstruct.create("DIV");
			target.insertBefore(container, refNode);
			this._ws = [];
			view = this._instantiate(eval('('+text+')'), container);
			view.style.visibility = "hidden";
			array.forEach(this._ws, function(w){
				if(!w._started && w.startup){
					w.startup();
				}
			});
			this._ws = null;
			return view.id;
		},

		_instantiate: function(/*Object*/obj, /*DomNode*/node, /*Widget*/parent){
			// summary:
			//		Given the evaluated json data, does the same thing as what
			//		the parser does.
			var widget;
			for(var key in obj){
				if(key.charAt(0) == "@"){ continue; }
				var cls = lang.getObject(key);
				if(!cls){ continue; }
				var params = {},
					proto = cls.prototype,
					objs = lang.isArray(obj[key]) ? obj[key] : [obj[key]];
				for(var i = 0; i < objs.length; i++){
					for(var prop in objs[i]){
						if(prop.charAt(0) == "@"){
							var v = objs[i][prop];
							prop = prop.substring(1);
							var t = typeof proto[prop];
							if(t === "string"){
								params[prop] = v;
							}else if(t === "number"){
								params[prop] = v - 0;
							}else if(t === "boolean"){
								params[prop] = (v !== "false");
							}else if(t === "object"){
								params[prop] = ev("(" + v + ")");
							}else if(t === "function"){
								params[prop] = lang.getObject(v, false) || new Function(v);
							}
						}
					}
					widget = new cls(params, node);
					if(node){ // to call View's startup()
						this._ws.push(widget);
					}
					if(parent){
						widget.placeAt(parent.domNode);
						if(parent._started){
							widget.startup();
						}
					}
					this._instantiate(objs[i], null, widget);
				}
			}
			return widget && widget.domNode;
		}
	});
});
