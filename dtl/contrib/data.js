dojo.provide("dojox.dtl.contrib.data");
dojo.require("dojox.dtl._base");

(function(){
	var dd = dojox.dtl;
	var ddcd = dd.contrib.data;

	ddcd._BoundItem = dojo.extend(function(item, store){
		this.item = item;
		this.store = store;
	},
	{
		get: function(key){
			if(key == "getLabel"){
				return this.store.getLabel(this.item);
			}else if(key == "getAttributes"){
				return this.store.getAttributes(this.item);
			}else if(key == "getIdentity"){
				if(this.store.getIdentity){
					return this.store.getIdentity(this.item);
				}
				return "Store has no identity API";
			}else{
				if(this.store.hasAttribute(this.item, key)){
					return this.store.getValue(this.item, key);
				}else{
					return "Item has no attribute: " + key;
				}
			}
		}
	});

	ddcd.BindDataNode = dojo.extend(function(items, store, alias){
		this.items = new dd._Filter(items);
		this.store = new dd._Filter(store);
		this.alias = alias;
	},
	{
		render: function(context, buffer){
			var items = this.items.resolve(context);
			var store = this.store.resolve(context);
			if(!store){
				throw new Error("data_bind didn't receive a store");
			}

			var list = [];
			if(items){
				for(var i = 0, item; item = items[i]; i++){
					list.push(new ddcd._BoundItem(item, store));
				}
			}

			context[this.alias] = list;
			return buffer;
		},
		unrender: function(context, buffer){
			return buffer;
		},
		clone: function(){
			return this;
		}
	});

	dojo.mixin(ddcd, {
		bind_data: function(parser, text){
			var parts = dd.text.pySplit(text);

			if(parts[2] != 'to' || parts[4] != 'as' || !parts[5]){
				throw new Error("data_bind expects the format: 'data_bind items to store as varName'");
			}

			return new ddcd.BindDataNode(parts[1], parts[3], parts[5]);
		}
	});

	dd.register.tags("dojox.dtl.contrib", {
		"data": ["bind_data"]
	});
})();