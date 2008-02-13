dojo.provide("dojox.dtl.tag.loop");

dojo.require("dojox.dtl._base");
dojo.require("dojox.string.tokenize");

(function(){
	var dd = dojox.dtl;
	var ddtl = dd.tag.loop;

	ddtl.CycleNode = dojo.extend(function(cyclevars, name, VarNode){
		this._cyclevars = cyclevars;
		this._counter = -1
		this._name = name;
		this._map = {};
		this._VarNode = VarNode;
	},
	{
		render: function(context, buffer){
			if(context.forloop && !context.forloop.counter0){
				this._counter = -1;
			}

			++this._counter;
			var value = this._cyclevars[this._counter % this._cyclevars.length];
			if(this._name){
				context[this._name] = value;
			}
			if(!this._map[value]){
				this._map[value] = {};
			}
			var node = this._map[value][this._counter] = new this._VarNode(value);

			return node.render(context, buffer, this);
		},
		unrender: function(context, buffer){
			return buffer;
		},
		clone: function(){
			return new this.constructor(this._cyclevars, this._name);
		},
		_onEnd: function(){
			this._counter = -1;
		}
	});

	ddtl.IfChangedNode = dojo.extend(function(nodes, vars, shared){
		this.nodes = nodes;
		this._vars = vars;
		this.shared = shared || {last: null};
		this.vars = dojo.map(vars, function(item){
			return new dojox.dtl._Filter(item);
		});
	}, {
		render: function(context, buffer){
			if(context.forloop && context.forloop.first){
				this.shared.last = null;
			}

			var change;
			if(this.vars.length){
				change = dojo.toJson(dojo.map(this.vars, function(item){
					return item.resolve(context);
				}));
			}else{
				change = this.nodes.dummyRender(context, buffer);
			}

			if(change != this.shared.last){
				var firstloop = (this.shared.last === null);
				this.shared.last = change;
				context.push();
				context.ifchanged = {firstloop: firstloop}
				buffer = this.nodes.render(context, buffer);
				context.pop();
			}
			return buffer;
		},
		unrender: function(context, buffer){
			this.nodes.unrender(context, buffer);
		},
		clone: function(buffer){
			return new this.constructor(this.nodes.clone(buffer), this._vars, this.shared);
		}
	});

	ddtl.RegroupNode = dojo.extend(function(expression, key, alias){
		this._expression = expression;
		this.expression = new dd._Filter(expression);
		this.key = key;
		this.alias = alias;
	},
	{
		_push: function(container, grouper, stack){
			if(stack.length){
				container.push({ grouper: grouper, list: stack })
			}
		},
		render: function(context, buffer){
			context[this.alias] = [];
			var list = this.expression.resolve(context);
			if(list){
				var last = null;
				var stack = [];
				for(var i = 0; i < list.length; i++){
					var id = list[i][this.key];
					if(last !== id){
						this._push(context[this.alias], last, stack);
						last = id;
						stack = [list[i]];
					}else{
						stack.push(list[i]);
					}
				}
				this._push(context[this.alias], last, stack);
			}
			return buffer;
		},
		unrender: function(context, buffer){
			return buffer;
		},
		clone: function(context, buffer){
			return this;
		}
	});

	dojo.mixin(ddtl, {
		cycle: function(parser, text){
			// summary: Cycle among the given strings each time this tag is encountered
			var args = text.split(" ");

			if(args.length < 2){
				throw new Error("'cycle' tag requires at least two arguments");
			}

			if(args[1].indexOf(",") != -1){
				var vars = args[1].split(",");
				args = [args[0]];
				for(var i = 0; i < vars.length; i++){
					args.push('"' + vars[i] + '"');
				}
			}

			if(args.length == 2){
				var name = args[args.length - 1];

				if(!parser._namedCycleNodes){
					throw new Error("No named cycles in template: '" + name + "' is not defined");
				}
				if(!parser._namedCycleNodes[name]){
					throw new Error("Named cycle '" + name + "' does not exist");
				}

		        return parser._namedCycleNodes[name];
			}

			if(args.length > 4 && args[args.length - 2] == "as"){
				var name = args[args.length - 1];

				var node = new ddtl.CycleNode(args.slice(1, args.length - 2), name, parser.getVarNodeConstructor());

				if(!parser._namedCycleNodes){
					parser._namedCycleNodes = {};
				}
				parser._namedCycleNodes[name] = node;
			}else{
				node = new ddtl.CycleNode(args.slice(1), null, parser.getVarNodeConstructor());
			}

			return node;
		},
		ifchanged: function(parser, text){
			var parts = dojox.dtl.text.pySplit(text);
			var nodes = parser.parse(["endifchanged"]);
			parser.next();
			return new ddtl.IfChangedNode(nodes, parts.slice(1));
		},
		regroup: function(parser, text){
			var tokens = dojox.string.tokenize(dojo.trim(text), /(\s+)/g, function(spaces){
				return spaces;
			});
			if(tokens.length < 11 || tokens[tokens.length - 3] != "as" || tokens[tokens.length - 7] != "by"){
				throw new Error("Expected the format: regroup list by key as newList");
			}
			var expression = tokens.slice(2, -8).join("");
			var key = tokens[tokens.length - 5];
			var alias = tokens[tokens.length - 1];
			return new ddtl.RegroupNode(expression, key, alias);
		}
	});
})();
