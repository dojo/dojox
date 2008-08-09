dojo.provide("dojox.dtl.contrib.html");

dojo.require("dojox.dtl.html");

(function(){
	var dd = dojox.dtl;
	var ddch = dd.contrib.html;

	ddch.StyleNode = dojo.extend(function(styles){
		this.contents = {};
		this._styles = styles;
		for(var key in styles){
			this.contents[key] = new dd.Template(styles[key]);
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

	ddch.BufferNode = dojo.extend(function(nodelist){
		this.nodelist = nodelist;
	},
	{
		_swap: function(){
			if(!this.swapped && this.parent.parentNode){
				dojo.disconnect(this.onAddNode);
				dojo.disconnect(this.onRemoveNode);
				this.swapped = this.parent.cloneNode(true);
				this.parent.parentNode.replaceChild(this.swapped, this.parent);
			}
		},
		render: function(context, buffer){
			this.parent = buffer.getParent();
			this.onAddNode = dojo.connect(buffer, "onAddNode", this, "_swap");
			this.onRemoveNode = dojo.connect(buffer, "onRemoveNode", this, "_swap");
			buffer = this.nodelist.render(context, buffer);
			if(this.swapped){
				this.swapped.parentNode.replaceChild(this.parent, this.swapped);
				dojo._destroyElement(this.swapped);
			}else{
				dojo.disconnect(this.onAddNode);
				dojo.disconnect(this.onRemoveNode);
			}
			delete this.parent;
			delete this.swapped;
			return buffer;
		},
		unrender: function(context, buffer){
			return this.nodelist.unrender(context, buffer);
		},
		clone: function(buffer){
			return new this.constructor(this.nodelist.clone(buffer));
		}
	});

	dojo.mixin(ddch, {
		buffer: function(parser, token){
			var nodelist = parser.parse(["endbuffer"]);
			parser.next_token();
			return new ddch.BufferNode(nodelist);
		},
		html: function(parser, token){
			dojo.deprecated("{% html someVariable %}", "Use {{ someVariable|safe }} instead")
			return parser.create_variable_node(token.contents.slice(5) + "|safe");
		},
		tstyle: function(parser, token){
			var styles = {};
			token = token.contents.replace(/^tstyle\s+/, "");
			var rules = token.split(/\s*;\s*/g);
			for(var i = 0, rule; rule = rules[i]; i++){
				var parts = rule.split(/\s*:\s*/g);
				var key = parts[0];
				var value = parts[1];
				if(value.indexOf("{{") == 0){
					styles[key] = value;
				}
			}
			return new ddch.StyleNode(styles);
		}
	});

	dd.register.tags("dojox.dtl.contrib", {
		"html": ["html", "attr:tstyle", "buffer"]
	});
})();