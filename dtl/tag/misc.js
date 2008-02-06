dojo.provide("dojox.dtl.tag.misc");

dojo.require("dojox.dtl._base");

dojox.dtl.tag.misc.commentNode = new function(){
	this.render = this.unrender = function(context, buffer){ return buffer; };
	this.clone = function(){ return this; };
	this.toString = function(){ return "dojox.dtl.tag.misc.CommentNode"; };
}

dojox.dtl.tag.misc.DebugNode = function(TextNode){
	this._TextNode = TextNode;
}
dojo.extend(dojox.dtl.tag.misc.DebugNode, {
	render: function(context, buffer){
		var keys = context.getKeys();
		var debug = "";
		for(var i = 0, key; key = keys[i]; i++){
			console.debug("DEBUG", key, ":", context[key]);
			debug += key + ": " + dojo.toJson(context[key]) + "\n\n";
		}
		return new this._TextNode(debug).render(context, buffer, this);
	},
	unrender: function(context, buffer){
		return buffer;
	},
	clone: function(buffer){
		return new this.constructor(this._TextNode);
	},
	toString: function(){ return "dojox.dtl.tag.misc.DebugNode"; }
});

dojox.dtl.tag.misc.FilterNode = function(varnode, nodelist){
	this._varnode = varnode;
	this._nodelist = nodelist;
}
dojo.extend(dojox.dtl.tag.misc.FilterNode, {
	render: function(context, buffer){
		// Doing this in HTML requires a different buffer with a fake root node
		var output = this._nodelist.render(context, new dojox.string.Builder());
		context.update({ "var": output.toString() });
		var filtered = this._varnode.render(context, buffer);
		context.pop();
		return buffer;
	},
	unrender: function(context, buffer){
		return buffer;
	},
	clone: function(buffer){
		return new this.constructor(this._expression, this._nodelist.clone(buffer));
	}
});

dojox.dtl.tag.misc.FirstOfNode = function(vars, TextNode){
	this._vars = vars;
	this.vars = dojo.map(vars, function(item){
		return new dojox.dtl._Filter(item);
	});
	this.contents = new TextNode("");
}
dojo.extend(dojox.dtl.tag.misc.FirstOfNode, {
	render: function(context, buffer){
		for(var i = 0, item; item = this.vars[i]; i++){
			var resolved = item.resolve(context);
			if(typeof resolved != "undefined"){
				if(resolved === null){
					resolved = "null";
				}
				this.contents.set(resolved);
				return this.contents.render(context, buffer);
			}
		}
		return this.contents.unrender(context, buffer);
	},
	unrender: function(context, buffer){
		return this.contents.unrender(context, buffer);
	},
	clone: function(buffer){
		return new this.constructor(this._vars, this.contents.constructor);
	}
});

dojox.dtl.tag.misc.comment = function(parser, text){
	// summary: Ignore everything between {% comment %} and {% endcomment %}
	parser.skipPast("endcomment");
	return dojox.dtl.tag.misc.commentNode;
}

dojox.dtl.tag.misc.debug = function(parser, text){
	// summary: Output the current context, maybe add more stuff later.
	return new dojox.dtl.tag.misc.DebugNode(parser.getTextNode());
}

dojox.dtl.tag.misc.filter = function(parser, text){
	// summary: Filter the contents of the blog through variable filters.
	var parts = text.split(" ", 2);
	var varnode = new (parser.getVarNode())("var|" + parts[1]);
	var nodelist = parser.parse(["endfilter"]);
	parser.next();
	return new dojox.dtl.tag.misc.FilterNode(varnode, nodelist);
}

dojox.dtl.tag.misc.firstof = function(parser, text){
	var parts = dojox.dtl.text.pySplit(text).slice(1);
	if(!parts.length){
		throw new Error("'firstof' statement requires at least one argument");
	}
	return new dojox.dtl.tag.misc.FirstOfNode(parts, parser.getTextNode());
}