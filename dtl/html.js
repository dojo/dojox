dojo.provide("dojox.dtl.html");

dojo.require("dojox.dtl._base");

dojox.dtl.html = {
	types: dojo.mixin({change: -11, attr: -12, elem: 1, text: 3}, dojox.dtl.text.types),
	_attributes: {},
	_re: /(^\s+|\s+$)/g,
	_re2: /\b([a-zA-Z]+)="/g,
	_re3: /<!--({({|%).*?(%|})})-->/g,
	_re4: /^function anonymous\(\)\s*{\s*(.*)\s*}$/,
	_trim: function(/*String*/ str){
		return str.replace(this._re, "");
	},
	getTemplate: function(text){
		if(typeof this._commentable == "undefined"){
			// Check to see if the browser can handle comments
			this._commentable = false;
			var div = document.createElement("div");
			div.innerHTML = "<!--Test comment handling, and long comments, using comments whenever possible.-->";
			if(div.childNodes.length && div.childNodes[0].nodeType == 8 && div.childNodes[0].data == "comment"){
				this._commentable = true;
			}
		}

		if(!this._commentable){
			// Strip comments
			text = text.replace(this._re3, "$1");
		}

		var match;
		while(match = this._re2.exec(text)){
			this._attributes[match[1]] = true;
		}
		var div = document.createElement("div");
		div.innerHTML = text;
		var output = { pres: [], posts: []}
		while(div.childNodes.length){
			if(!output.node && div.childNodes[0].nodeType == 1){
				output.node = div.removeChild(div.childNodes[0]);
			}else if(!output.node){
				output.pres.push(div.removeChild(div.childNodes[0]));
			}else{
				output.posts.push(div.removeChild(div.childNodes[0]));
			}
		}

		if(!output.node){
			throw new Error("Template did not provide any content");
		}

		return output;
	},
	tokenize: function(/*Node*/ node, /*Array?*/ tokens, /*Array?*/ preNodes, /*Array?*/ postNodes){
		tokens = tokens || [];
		var first = !tokens.length;
		var types = this.types;

		var children = [];
		for(var i = 0, child; child = node.childNodes[i]; i++){
			children.push(child);
		}

		if(preNodes){
			for(var i = 0, child; child = preNodes[i]; i++){
				if(child.nodeType == 1){
					tokens.push([types.elem, node]);
				}
				this._tokenize(node, child, tokens);
			}
		}

		tokens.push([types.elem, node]);
		tokens.push([types.change, node]);

		for(var key in this._attributes){
			var value = "";
			if(key == "class"){
				value = node.className || value;
			}else if(key == "for"){
				value = node.htmlFor || value;
			}else if(node.getAttribute){;
				value = node.getAttribute(key, 2) || value;
			}
			if(typeof value == "function"){
				value = value.toString().replace(this._re4, "$1");
			}
			if(typeof value == "string" && (value.indexOf("{%") != -1 || value.indexOf("{{") != -1 || (value && dojox.dtl.text.getTag("attr:" + key, true)))){
				tokens.push([types.attr, node, key, value]);
			}
		}

		if(!children.length){
			tokens.push([types.change, node.parentNode, true]);
			if(postNodes){
				for(var i = 0, child; child = postNodes[i]; i++){
					if(child.nodeType == 1){
						tokens.push([types.elem, node]);
					}
					this._tokenize(node, child, tokens);
				}
			}
			return tokens;
		}

		for(var i = 0, child; child = children[i]; i++){
			this._tokenize(node, child, tokens);
		}

		if(node.parentNode && node.parentNode.tagName){
			tokens.push([types.change, node.parentNode, true]);
			node.parentNode.removeChild(node);
		}
		
		if(postNodes){
			for(var i = 0, child; child = postNodes[i]; i++){
				if(child.nodeType == 1){
					tokens.push([types.elem, node]);
				}
				this._tokenize(node, child, tokens);
			}
		}

		if(first){
			tokens.push([types.change, node, true]);
		}

		return tokens;
	},
	_tokenize: function(parent, child, tokens){
		var types = this.types;
		var data = child.data;
		switch(child.nodeType){
			case 1:
				tokens.push([types.elem, child]);
				this.tokenize(child, tokens);
				break;
			case 3:
				if(data.match(/[^\s\n]/)){
					if(data.indexOf("{{") != -1 || data.indexOf("{%") != -1){
						var texts = dojox.dtl.text.tokenize(data);
						for(var j = 0, text; text = texts[j]; j++){
							tokens.push(text);
						}
					}else{
						tokens.push([child.nodeType, child]);
					}
				}
				if(child.parentNode) child.parentNode.removeChild(child);
				break;
			case 8:
				if(data.indexOf("{%") == 0){
					tokens.push([types.tag, this._trim(data.substring(2, data.length - 3))]);
				}
				if(data.indexOf("{{") == 0){
					tokens.push([types.varr, this._trim(data.substring(2, data.length - 3))]);
				}
				if(child.parentNode) child.parentNode.removeChild(child);
				break;
		}
	}
}

dojox.dtl.HtmlTemplate = function(/*String|dojo._Url*/ obj){
	// summary: Use this object for HTML templating
	var dd = dojox.dtl;
	var ddh = dd.html;

	if(!obj.node){
		if(typeof obj == "object"){
			obj = dojox.dtl.text.getTemplateString(obj);
		}
		obj = ddh.getTemplate(obj);
	}
	this.contents = obj.node;

	var tokens = ddh.tokenize(obj.node, [], obj.pres, obj.posts);
	var parser = new dd.HtmlParser(tokens);
	this.nodelist = parser.parse();
}
dojo.extend(dojox.dtl.HtmlTemplate, {
	_count: 0,
	_re: /\bdojo:([a-zA-Z0-9_]+)\b/g,
	setClass: function(str){
		this.getRootNode().className = str;
	},
	getRootNode: function(){
		return this.contents;
	},
	getBuffer: function(){
		return new dojox.dtl.HtmlBuffer();
	},
	render: function(context, buffer){
		buffer = buffer || this.getBuffer();
		return this.nodelist.render(context || new dojox.dtl.Context({}), buffer);
	},
	unrender: function(context, buffer){
		return this.nodelist.unrender(context, buffer);
	},
	toString: function(){ return "dojox.dtl.HtmlTemplate"; }
});

dojox.dtl.HtmlBuffer = function(/*Node*/ parent){
	// summary: Allows the manipulation of DOM
	// description:
	//		Use this to append a child, change the parent, or
	//		change the attribute of the current node.
	this._parent = parent;
	this._cache = [];
}
dojo.extend(dojox.dtl.HtmlBuffer, {
	concat: function(/*DOMNode*/ node){
		if(!this._parent) return this;
		if(node.nodeType){
			var caches = this._getCache(this._parent);
			if(node.parentNode === this._parent){
				// If we reach a node that already existed, fill in the cache for this same parent
				var i = 0;
				for(var i = 0, cache; cache = caches[i]; i++){
					if(this.onAddNode) this.onAddNode();
					this._parent.insertBefore(cache, node);
				}
				caches.length = 0;
			}
			if(!node.parentNode || !node.parentNode.tagName){
				if(!this._parent.childNodes.length){
					if(this.onAddNode) this.onAddNode();
					this._parent.appendChild(node);
				}else{
					caches.push(node);
				}
			}
		}
		return this;
	},
	remove: function(obj){
		if(typeof obj == "string"){
			this._parent.removeAttribute(obj);
		}else{
			if(obj.parentNode === this._parent){
				if(this.onRemoveNode) this.onRemoveNode();
				this._parent.removeChild(obj);
			}
		}
		return this;
	},
	setAttribute: function(key, value){
		if(key == "class"){
			this._parent.className = value;
		}else if(key == "for"){
			this._parent.htmlFor = value;
		}else if(node.getAttribute){;
			this._parent.setAttribute(key, value);
		}
		return this;
	},
	setParent: function(node, /*Boolean?*/ up){
		if(!this._parent) this._parent = node;
		var caches = this._getCache(this._parent);
		if(caches && caches.length && up){
			for(var i = 0, cache; cache = caches[i]; i++){
				if(cache !== this._parent && (!cache.parentNode || !cache.parentNode.tagName)){
					this._parent.appendChild(cache);
				}
			}
			caches.length = 0;
		}

		this._parent = node;
		return this;
	},
	getParent: function(){
		return this._parent;
	},
	_getCache: function(node){
		for(var i = 0, cache; cache = this._cache[i]; i++){
			if(cache[0] === node){
				return cache[1];
			}
		}
		var arr = [];
		this._cache.push([node, arr]);
		return arr;
	},
	toString: function(){ return "dojox.dtl.HtmlBuffer"; }
});

dojox.dtl.HtmlNode = function(node){
	// summary: Places a node into DOM
	this.contents = node;
}
dojo.extend(dojox.dtl.HtmlNode, {
	render: function(context, buffer){
		return buffer.concat(this.contents);
	},
	unrender: function(context, buffer){
		return buffer.remove(this.contents);
	},
	clone: function(buffer){
		return new dojox.dtl.HtmlNode(this.contents);
	},
	toString: function(){ return "dojox.dtl.HtmlNode"; }
});

dojox.dtl.HtmlNodeList = function(/*Node[]*/ nodes){
	// summary: A list of any HTML-specific node object
	// description:
	//		Any object that's used in the constructor or added
	//		through the push function much implement the
	//		render, unrender, and clone functions.
	this.contents = nodes || [];
}
dojo.extend(dojox.dtl.HtmlNodeList, {
	push: function(node){
		this.contents.push(node);
	},
	unshift: function(node){
		this.contents.unshift(node);
	},
	render: function(context, buffer){
		for(var i = 0; i < this.contents.length; i++){
			buffer = this.contents[i].render(context, buffer);
			if(!buffer) throw new Error("Template node render functions must return their buffer");
		}
		return buffer;
	},
	unrender: function(context, buffer){
		for(var i = 0; i < this.contents.length; i++){
			buffer = this.contents[i].unrender(context, buffer);
			if(!buffer) throw new Error("Template node render functions must return their buffer");
		}
		return buffer;
	},
	clone: function(buffer){
		var dd = dojox.dtl;
		var ddh = dd.html;
		var parent = buffer.getParent();
		var contents = this.contents;
		var map = new dojox.dtl.ObjectMap();
		var nodelist = new dd.HtmlNodeList();
		for(var i = 0; i < contents.length; i++){
			var clone = contents[i].clone(buffer);
			if(clone.contents !== parent && (clone instanceof dd.ChangeNode || clone instanceof dd.HtmlNode)){
				var node = clone.contents;
				var item = map.get(node);
				if(item){
					clone.contents = item;
				}else{
					clone.contents = clone.contents.cloneNode(false); // Avoid attached nodes!
					map.put(node, clone.contents);
				}
			}
			nodelist.push(clone);
		}
		return nodelist;
	},
	toString: function(){ return "dojox.dtl.HtmlNodeList"; }
});

dojox.dtl.HtmlVarNode = function(str){
	// summary: A node to be processed as a variable
	// description:
	//		Will render an object that supports the render function
	// 		and the getRootNode function
	this.contents = new dojox.dtl.Filter(str);
	this._lists = {};
}
dojo.extend(dojox.dtl.HtmlVarNode, {
	render: function(context, buffer){
		this._rendered = true;
		var dd = dojox.dtl;
		var ddh = dd.html;
		var str = this.contents.resolve(context);
		if(str.render && str.getRootNode){
			var root = this._curr = str.getRootNode();
			var lists = this._lists;
			var list = lists[root];
			if(!list){
				list = lists[root] = new dd.HtmlNodeList();
				list.push(new dd.ChangeNode(buffer.getParent()));
				list.push(new dd.HtmlNode(root));
				list.push(str);
				list.push(new dd.ChangeNode(buffer.getParent(), true));
			}
			return list.render(context, buffer);
		}else{
			if(!this._txt) this._txt = document.createTextNode(str);
			if(this._txt.data != str) this._txt.data = str;
			return buffer.concat(this._txt);
		}
		return buffer;
	},
	unrender: function(context, buffer){
		if(this._rendered){
			this._rendered = false;
			if(this._curr){
				return this._lists[this._curr].unrender(context, buffer);
			}else if(this._txt){
				return buffer.remove(this._txt);
			}
		}
		return buffer;
	},
	clone: function(){
		return new dojox.dtl.HtmlVarNode(this.contents.key);
	},
	toString: function(){ return "dojox.dtl.HtmlVarNode"; }
});

dojox.dtl.ChangeNode = function(node, /*Boolean?*/ up){
	// summary: Changes the parent during render/unrender
	this.contents = node;
	this._up = up;
}
dojo.extend(dojox.dtl.ChangeNode, {
	render: function(context, buffer){
		return buffer.setParent(this.contents, this._up);
	},
	unrender: function(context, buffer){
		return buffer.setParent(this.contents);
	},
	clone: function(buffer){
		return new dojox.dtl.ChangeNode(this.contents, this._up);
	},
	toString: function(){ return "dojox.dtl.ChangeNode"; }
});

dojox.dtl.AttributeNode = function(key, value){
	// summary: Works on attributes
	this._key = key;
	this._value = value;
	this._tpl = new dojox.dtl.Template(value);
	this.contents = "";
}
dojo.extend(dojox.dtl.AttributeNode, {
	render: function(context, buffer){
		var key = this._key;
		var value = this._tpl.render(context);
		if(this._rendered){
			if(value != this.contents){
				this.contents = value;
				return buffer.setAttribute(key, value);
			}
		}else{
			this._rendered = true;
			this.contents = value;
			return buffer.setAttribute(key, value);
		}
		return buffer;
	},
	unrender: function(context, buffer){
		if(this._rendered){
			this._rendered = false;
			this.contents = "";
			return buffer.remove(this.contents);
		}
		return buffer;
	},
	clone: function(){
		return new dojox.dtl.AttributeNode(this._key, this._value);
	},
	toString: function(){ return "dojox.dtl.AttributeNode"; }
});

dojox.dtl.HtmlTextNode = function(str){
	// summary: Adds a straight text node without any processing
	this.contents = document.createTextNode(str);
}
dojo.extend(dojox.dtl.HtmlTextNode, {
	render: function(context, buffer){
		return buffer.concat(this.contents);
	},
	unrender: function(context, buffer){
		return buffer.remove(this.contents);
	},
	clone: function(){
		return new dojox.dtl.HtmlTextNode(this.contents.data);
	},
	toString: function(){ return "dojox.dtl.HtmlTextNode"; }
});

dojox.dtl.HtmlParser = function(tokens){
	// summary: Turn a simple array into a set of objects
	// description:
	//	This is also used by all tags to move through
	//	the list of nodes.
	this.contents = tokens;
}
dojo.extend(dojox.dtl.HtmlParser, {
	parse: function(/*Array?*/ stop_at){
		var dd = dojox.dtl;
		var ddh = dd.html;
		var types = ddh.types;
		var terminators = {};
		var tokens = this.contents;
		if(!stop_at){
			stop_at = [];
		}
		for(var i = 0; i < stop_at.length; i++){
			terminators[stop_at[i]] = true;
		}
		var nodelist = new dd.HtmlNodeList();
		while(tokens.length){
			var token = tokens.shift();
			var type = token[0];
			var value = token[1];
			if(type == types.change){
				nodelist.push(new dd.ChangeNode(value, token[2]));
			}else if(type == types.attr){
				var fn = dojox.dtl.text.getTag("attr:" + token[2], true);
				if(fn){
					nodelist.push(fn(null, token[2] + " " + token[3]));
				}else{
					nodelist.push(new dd.AttributeNode(token[2], token[3]));
				}
			}else if(type == types.elem){
				var fn = dojox.dtl.text.getTag("node:" + value.tagName.toLowerCase(), true);
				if(fn){
					// TODO: We need to move this to tokenization so that it's before the
					// 				node and the parser can be passed here instead of null
					nodelist.push(fn(null, value, value.tagName.toLowerCase()));
				}
				nodelist.push(new dd.HtmlNode(value));
			}else if(type == types.varr){
				nodelist.push(new dd.HtmlVarNode(value));
			}else if(type == types.text){
				nodelist.push(new dd.HtmlTextNode(value.data || value));
			}else if(type == types.tag){
				if(terminators[value]){
					tokens.unshift(token);
					return nodelist;
				}
				var cmd = value.split(/\s+/g);
				if(cmd.length){
					cmd = cmd[0];
					var fn = dojox.dtl.text.getTag(cmd);
					if(typeof fn != "function"){
						throw new Error("Function not found for ", cmd);
					}
					var tpl = fn(this, value);
					if(tpl){
						nodelist.push(tpl);
					}
				}
			}
		}

		if(stop_at.length){
			throw new Error("Could not find closing tag(s): " + stop_at.toString());
		}

		return nodelist;
	},
	next: function(){
		// summary: Used by tags to discover what token was found
		var token = this.contents.shift();
		return {type: token[0], text: token[1]};
	},
	skipPast: function(endtag){
		return dojox.dtl.Parser.prototype.skipPast.call(this, endtag);
	},
	getVarNode: function(){
		return dojox.dtl.HtmlVarNode;
	},
	getTextNode: function(){
		return dojox.dtl.HtmlTextNode;
	},
	getTemplate: function(/*String*/ loc){
		return new dojox.dtl.HtmlTemplate(dojox.dtl.html.getTemplate(loc));
	},
	toString: function(){ return "dojox.dtl.HtmlParser"; }
});

dojox.dtl.ObjectMap = function(){
	this.contents = [];
}
dojo.extend(dojox.dtl.ObjectMap, {
	get: function(key){
		var contents = this.contents;
		for(var i = 0, content; content = contents[i]; i++){
			if(content[0] === key){
				return content[1];
			}
		}
	},
	put: function(key, value){
		var contents = this.contents;
		for(var i = 0, content; content = contents[i]; i++){
			if(content[0] === key){
				content[1] = value;
				return;
			}
		}
		contents.push([key, value]);
	},
	toString: function(){ return "dojox.dtl.ObjectMap"; }
});

dojox.dtl.register.tag("dojox.dtl.tag.event", "dojox.dtl.tag.event", [[/(attr:)?on(click|key(up))/i, "on"]]);
dojox.dtl.register.tag("dojox.dtl.tag.html", "dojox.dtl.tag.html", ["html", "attr:attach", "attr:tstyle"]);