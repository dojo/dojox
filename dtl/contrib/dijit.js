dojo.provide("dojox.dtl.contrib.dijit");

dojo.require("dojox.dtl.html");

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
				if(!this._rendered.length){
					this._rendered.push(buffer.addEvent(context, type, this.contents[i]));
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

	dojo.mixin(ddcd, {
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
		on: function(parser, text){
			// summary: Associates an event type to a function (on the current widget) by name
			var parts = text.split(" ");
			return new ddcd.EventNode([parts[0]], [parts[1]]);
		}
	});

	dd.register.tags("dojox.dtl.contrib", {
		"dijit": ["attr:dojoAttachPoint", ["attr:attach", "dojoAttachPoint"], "attr:dojoAttachEvent", [/(attr:)?on(click|key(up))/i, "on"]]
	});
})();