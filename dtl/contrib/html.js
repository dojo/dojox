dojo.provide("dojox.dtl.contrib.html");

dojo.require("dojox.dtl.html");

dojox.dtl.contrib.html.HtmlNode = dojo.extend(function(name){
	this.contents = new dojox.dtl._Filter(name);
	this._div = document.createElement("div");
	this._lasts = [];
},
{
	render: function(context, buffer){
		var text = this.contents.resolve(context);
		text = text.replace(/<(\/?script)/ig, '&lt;$1').replace(/\bon[a-z]+\s*=/ig, '');
		if(this._rendered && this._last != text){
			buffer = this.unrender(context, buffer);
		}
		this._last = text;

		// This can get reset in the above tag
		if(!this._rendered){
			this._rendered = true;
			var div = this._div;
			div.innerHTML = text;
			var children = div.childNodes;
			while(children.length){
				var removed = div.removeChild(children[0]);
				this._lasts.push(removed);
				buffer = buffer.concat(removed);
			}
		}

		return buffer;
	},
	unrender: function(context, buffer){
		if(this._rendered){
			this._rendered = false;
			this._last = "";
			for(var i = 0, node; node = this._lasts[i++];){
				buffer = buffer.remove(node);
				dojo._destroyElement(node);
			}
			this._lasts = [];
		}
		return buffer;
	},
	clone: function(buffer){
		return new this.constructor(this.contents.contents);
	}
});

dojox.dtl.contrib.html.StyleNode = dojo.extend(function(styles){
	this.contents = {};
	this._styles = styles;
	for(var key in styles){
		this.contents[key] = new dojox.dtl.Template(styles[key]);
	}
},
{
	render: function(context, buffer){
		for(var key in this.contents){
			dojo.style(buffer.getParent(), key, this.contents[key].render(context));
		}
		return buffer;
	},
	unrender: function(context, buffer){
		return buffer;
	},
	clone: function(buffer){
		return new this.constructor(this._styles);
	}
});

dojox.dtl.contrib.html.AttachNode = dojo.extend(function(key){
	this.contents = key;
},
{
	render: function(context, buffer){
		if(!this._rendered){
			this._rendered = true;
			context.getThis()[this.contents] = buffer.getParent();
		}
		return buffer;
	},
	unrender: function(context, buffer){
		if(this._rendered){
			this._rendered = false;
			if(context.getThis()[this.contents] === buffer.getParent()){
				delete context.getThis()[this.contents];
			}
		}
		return buffer;
	},
	clone: function(buffer){
		return new this.constructor(this._styles);
	}
});

dojo.mixin(dojox.dtl.contrib.html, {
	html: function(parser, text){
		var parts = text.split(" ", 2);
		return new dojox.dtl.contrib.html.HtmlNode(parts[1]);
	},
	tstyle: function(parser, text){
		var styles = {};
		text = text.replace(/^tstyle\s+/, "");
		var rules = text.split(/\s*;\s*/g);
		for(var i = 0, rule; rule = rules[i]; i++){
			var parts = rule.split(/\s*:\s*/g);
			var key = parts[0];
			var value = parts[1];
			if(value.indexOf("{{") == 0){
				styles[key] = value;
			}
		}
		return new dojox.dtl.contrib.html.StyleNode(styles);
	},
	attach: function(parser, text){
		var parts = dojox.dtl.text.pySplit(text);
		return new dojox.dtl.contrib.html.AttachNode(parts[1]);
	}
});

dd.register.tags("dojox.dtl.contrib", {
	"html": ["html", "attr:attach", "attr:tstyle"]
});