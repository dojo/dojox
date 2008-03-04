dojo.provide("dojox.dtl.contrib.dijit");

dojo.require("dojox.dtl.html");
dojo.require("dojo.parser");

(function(){
	var dd = dojox.dtl;
	var ddcd = dd.contrib.dijit;

	ddcd.AttachNode = dojo.extend(function(key){
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

	ddcd.EventNode = dojo.extend(function(types, fns){
		this._types = types;
		this.contents = fns;
		this._rendered = [];
	},
	{
		// _clear: Boolean
		//		Make sure we kill the actual tags (onclick problems, etc)
		_clear: false,
		render: function(context, buffer){
			for(var i = 0, type; type = this._types[i]; i++){
				if(!this._clear){
					buffer.getParent()[type] = null;
				}
				var fn = this.contents[i];
				var args;
				if(dojo.isArray(fn)){
					if(this._rendered[i]){
						dojo.disconnect(this._rendered[i]);
						this._rendered[i] = false;
					}
					args = dojo.map(fn.slice(1), function(item){
						return new dd._Filter(item).resolve(context);
					});
					fn = fn[0];
				}
				if(!this._rendered[i]){
					this._rendered[i] = buffer.addEvent(context, type, fn, args);
				}
			}
			this._clear = true;

			return buffer;
		},
		unrender: function(context, buffer){
			while(this._rendered.length){
				dojo.disconnect(this._rendered.pop());
			}
			return buffer;
		},
		clone: function(){
			return new this.constructor(this._types, this.contents);
		}
	});

	ddcd.DojoTypeNode = dojo.extend(function(node){
		this._node = node;
		this.dijit = dojo.parser.instantiate([node.cloneNode(true)])[0];
	},
	{
		render: function(context, buffer){
			if(this.dijit.dojoAttachPoint){
				(context.getThis())[this.dijit.dojoAttachPoint] = this.dijit;
			}
			return buffer.concat(this.dijit.domNode);
		},
		unrender: function(context, buffer){
			return buffer.remove(this.dijit.domNode);
		},
		clone: function(){
			return new this.constructor(this._node);
		}
	});

	dojo.mixin(ddcd, {
		widgetsInTemplate: true,
		dojoAttachPoint: function(parser, text){
			var parts = dd.text.pySplit(text);
			return new ddcd.AttachNode(parts[1]);
		},
		dojoAttachEvent: function(parser, text){
			text = text.slice(16);
			var type, events = text.split(/\s*,\s*/);
			var trim = dojo.trim;
			var types = [];
			var fns = [];
			while(type = events.pop()){
				if(type){
					var fn = null;
					if(type.indexOf(":") != -1){
						// oh, if only JS had tuple assignment
						var funcNameArr = type.split(":");
						type = trim(funcNameArr[0]);
						fn = trim(funcNameArr[1]);
					}else{
						type = trim(type);
					}
					if(!fn){
						fn = type;
					}
					types.push(type);
					fns.push(fn);
				}
			}
			return new ddcd.EventNode(types, fns);
		},
		dojoType: function(parser, text){
			if(ddcd.widgetsInTemplate){
				var node = parser.swallowNode();
				return new ddcd.DojoTypeNode(node);
			}
			return dd._noOpNode;
		},
		on: function(parser, text){
			// summary: Associates an event type to a function (on the current widget) by name
			var parts = text.split(" ");
			return new ddcd.EventNode([parts[0]], [parts.slice(1)]);
		}
	});

	dd.register.tags("dojox.dtl.contrib", {
		"dijit": ["attr:dojoType", "attr:dojoAttachPoint", ["attr:attach", "dojoAttachPoint"], "attr:dojoAttachEvent", [/(attr:)?on(click|key(up))/i, "on"]]
	});
})();