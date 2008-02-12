dojo.provide("dojox.dtl.tag.loader");

dojo.require("dojox.dtl._base");

(function(){
	var dd = dojox.dtl;
	var ddtl = dd.tag.loader;

	ddtl.BlockNode = dojo.extend(function(name, nodelist){
		this.name = name;
		this.nodelist = nodelist; // Can be overridden
	},
	{
		render: function(context, buffer){
			var name = this.name;
			var nodelist = this.nodelist;
			if(buffer.blocks){
				var block = buffer.blocks[name];
				if(block){
					nodelist = block.nodelist;
					block.used = true;
				}
			}
			this.rendered = nodelist;
			return nodelist.render(context, buffer, this);
		},
		unrender: function(context, buffer){
			return this.rendered.unrender(context, buffer);
		},
		clone: function(buffer){
			return new this.constructor(this.name, this.nodelist.clone(buffer));
		},
		setOverride: function(nodelist){
			// summary: In a shared parent, we override, not overwrite
			if(!this.override){
				this.override = nodelist;
			}
		},
		toString: function(){ return "dojox.dtl.tag.loader.BlockNode"; }
	});

	ddtl.ExtendsNode = dojo.extend(function(getTemplate, nodelist, shared, parent, key){
		this.getTemplate = getTemplate;
		this.nodelist = nodelist;
		this.shared = shared;
		this.parent = parent;
		this.key = key;
	},
	{
		parents: {},
		getParent: function(context){
			if(!this.parent){
				this.parent = context.get(this.key, false);
				if(!this.parent){
					throw new Error("extends tag used a variable that did not resolve");
				}
				if(typeof this.parent == "object"){
					if(this.parent.url){
						if(this.parent.shared){
							this.shared = true;
						}
						this.parent = this.parent.url.toString();
					}else{
						this.parent = this.parent.toString();
					}
				}
				if(this.parent && this.parent.indexOf("shared:") == 0){
					this.shared = true;
					this.parent = this.parent.substring(7, parent.length);
				}
			}
			var parent = this.parent;
			if(!parent){
				throw new Error("Invalid template name in 'extends' tag.");
			}
			if(parent.render){
				return parent;
			}
			if(this.parents[parent]){
				return this.parents[parent];
			}
			this.parent = this.getTemplate(dojox.dtl.text.getTemplateString(parent));
			if(this.shared){
				this.parents[parent] = this.parent;
			}
			return this.parent;
		},
		render: function(context, buffer){
			var parent = this.getParent(context);

			buffer.blocks = buffer.blocks || {};

			// The parent won't always be in the default parent's nodelist
			for(var i = 0, node; node = this.nodelist.contents[i]; i++){
				if(node instanceof dojox.dtl.tag.loader.BlockNode){
					buffer.blocks[node.name] = {
						shared: this.shared,
						nodelist: node.nodelist,
						used: false
					}
				}
			}

			this.rendered = parent;
			buffer = parent.nodelist.render(context, buffer, this);

			var rerender = false;
			for(var name in buffer.blocks){
				var block = buffer.blocks[name];
				if(!block.used){
					rerender = true;
					parent.nodelist[0].nodelist.append(block.nodelist);
				}
			}

			if(rerender){
				buffer = parent.nodelist.render(context, buffer, this);
			}

			return buffer;
		},
		unrender: function(context, buffer){
			return this.rendered.unrender(context, buffer, this);
		},
		toString: function(){ return "dojox.dtl.block.ExtendsNode"; }
	});

	dojo.mixin(ddtl, {
		block: function(parser, text){
			var parts = text.split(" ");
			var name = parts[1];

			parser._blocks = parser._blocks || {};
			parser._blocks[name] = parser._blocks[name] || [];
			parser._blocks[name].push(name);

			var nodelist = parser.parse(["endblock", "endblock " + name]);
			parser.next();
			return new dojox.dtl.tag.loader.BlockNode(name, nodelist);
		},
		extends_: function(parser, text){
			var parts = text.split(" ");
			var shared = false;
			var parent = null;
			var key = null;
			if(parts[1].charAt(0) == '"' || parts[1].charAt(0) == "'"){
				parent = parts[1].substring(1, parts[1].length - 1);
			}else{
				key = parts[1];
			}
			if(parent && parent.indexOf("shared:") == 0){
				shared = true;
				parent = parent.substring(7, parent.length);
			}
			var nodelist = parser.parse();
			return new dojox.dtl.tag.loader.ExtendsNode(parser.getTemplate, nodelist, shared, parent, key);
		}
	});
})();