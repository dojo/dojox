define([
	"dojo/_base/kernel",
	"dojo/_base/config",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dojo/ready",
	".."
], function(dojo, config, lang, win, ready, dojox){

	lang.getObject("mobile", true, dojox);

	// assigning to dojox.mobile.parser is for back compat, dojo.parser is in case user app calls it
	var parser = dojox.mobile.parser = dojo.parser = new function(){
		this.instantiate = function(/* Array */nodes, /* Object? */mixin, /* Object? */args){
			// summary:
			//		Function for instantiating a list of widget nodes.
			// nodes:
			//		The list of DOMNodes to walk and instantiate widgets on.
			mixin = mixin || {};
			args = args || {};
			var i, ws = [];
			if(nodes){
				for(i = 0; i < nodes.length; i++){
					var n = nodes[i];
					var cls = lang.getObject(n.getAttribute("dojoType") || n.getAttribute("data-dojo-type"));
					var proto = cls.prototype;
					var params = {}, prop, v, t;
					lang.mixin(params, eval('({'+(n.getAttribute("data-dojo-props")||"")+'})'));
					lang.mixin(params, args.defaults);
					lang.mixin(params, mixin);
					for(prop in proto){
						v = n.getAttributeNode(prop);
						v = v && v.nodeValue;
						t = typeof proto[prop];
						if(!v && (t !== "boolean" || v !== "")){ continue; }
						if(t === "string"){
							params[prop] = v;
						}else if(t === "number"){
							params[prop] = v - 0;
						}else if(t === "boolean"){
							params[prop] = (v !== "false");
						}else if(t === "object"){
							params[prop] = eval("(" + v + ")");
						}
					}
					params["class"] = n.className;
					params.style = n.style && n.style.cssText;
					v = n.getAttribute("data-dojo-attach-point");
					if(v){ params.dojoAttachPoint = v; }
					v = n.getAttribute("data-dojo-attach-event");
					if(v){ params.dojoAttachEvent = v; }
					var instance = new cls(params, n);
					ws.push(instance);
					var jsId = n.getAttribute("jsId") || n.getAttribute("data-dojo-id");
					if(jsId){
						lang.setObject(jsId, instance);
					}
				}
				for(i = 0; i < ws.length; i++){
					var w = ws[i];
					!args.noStart && w.startup && !w._started && (!w.getParent || !w.getParent()) && w.startup();
				}
			}
			return ws;
		};

		this.parse = function(rootNode, args){
			// summary:
			//		Function to handle parsing for widgets in the current document.
			//		It is not as powerful as the full parser, but it will handle basic
			//		use cases fine.
			// rootNode:
			//		The root node in the document to parse from
			if(!rootNode){
				rootNode = win.body();
			}else if(!args && rootNode.rootNode){
				// Case where 'rootNode' is really a params object.
				args = rootNode;
				rootNode = rootNode.rootNode;
			}

			var nodes = rootNode.getElementsByTagName("*");
			var i, list = [];
			for(i = 0; i < nodes.length; i++){
				var n = nodes[i];
				if(n.getAttribute("dojoType") || n.getAttribute("data-dojo-type")){
					list.push(n);
				}
			}
			var mixin = args && args.template ? {template: true} : null;
			return this.instantiate(list, mixin, args);
		};
	}();
	if(config.parseOnLoad){
		ready(100, parser, "parse");
	}
	return parser;
});
