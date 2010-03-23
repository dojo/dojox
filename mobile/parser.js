dojo.provide("dojox.mobile.parser");

dojox.mobile.parser = new function(){
	this.instantiate = function(list){
		// summary:
		//		Function for instantiating a list of widget nodes.
		// list:
		//		The list of DOMNodes to walk and instantiate widgets on.
		var ws = [];
		if(list){
			var i, len;
			len = list.length
			for(i = 0; i < len; i++){
				var node = list[i];
				var cls = dojo.getObject(dojo.attr(node, "dojoType"));
				var proto = cls.prototype;
				var params = {};
				for(var prop in proto){
					var val = dojo.attr(node, prop);
					if(!val){ continue; }
					if(typeof proto[prop] == "string"){
						params[prop] = val;
					}else if(typeof proto[prop] == "number"){
						params[prop] = val - 0;
					}else if(typeof proto[prop] == "boolean"){
						params[prop] = (val != "false");
					}
				}
				params["class"] = node.className;
				params["style"] = node.style && node.style.cssText;
				ws.push(new cls(params, node));
			}
			len = ws.length
			for(i = 0; i < len; i++){
				var w = ws[i]
				w.startup && !w._started && (!w.getParent || !w.getParent()) && w.startup();
			}
		}
		return ws;
	};

	this.parse = function(rootNode){
		// summary:
		//		Function to handle parsing for widgets in the current document.
		//		It is not as powerful as the full dojo parser, but it will handle basic
		//		use cases fine.
		// rootNode:
		//		The root node in the document to parse from
		if(!rootNode){ 
			rootNode = dojo.body(); 
		}
		return this.instantiate(dojo.query("[dojoType]", rootNode));
	};
};
dojo._loaders.unshift(function(){
	dojox.mobile.parser.parse();
});
