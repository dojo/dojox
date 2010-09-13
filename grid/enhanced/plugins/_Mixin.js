dojo.provide("dojox.grid.enhanced.plugins._Mixin");

dojo.declare("dojox.grid.enhanced.plugins._Mixin", null, {
	//	summary:
	//		Common mixin for all plugins - mainly for managing/destroying event/topic
	//  	Note: - Just a temporary solution that will be replaced with a real base Plugin class for 1.6

	//_connects: Array
	//		List of all connections.
	_connects: [],
	
	//_subscribes: Array
	//		List of all subscribes.
	_subscribes: [],

	//privates: Object
	//		Private properties/methods shouldn't be mixin-ed at anytime.
	privates: {},
	
	constructor: function(){
		this._connects = [], this._subscribes = [];
		this.privates = dojo.mixin({},dojox.grid.enhanced.plugins._Mixin.prototype);
	},
	
	connect: function(obj, event, method){
		// summary:
		//		Connects specified obj/event to specified method of this object.
		// example:
		//	|	var plugin = new dojox.grid.enhanced._Plugin(grid,"myPlugin",{...});
		//	|	// when foo.bar() is called, call the listener in the scope of plugin		
		//	|	plugin.connect(foo, "bar", function(){
		//	|		console.debug(this.xxx());//"this" - plugin scope
		//	|	});
		var conn = dojo.connect(obj, event, this, method);
		this._connects.push(conn);
		return conn;
	},
	
	disconnect: function(handle){
		// summary:
		//		Disconnects handle and removes it from connection list.
		dojo.some(this._connects, function(conn, i, conns){
			if(conn == handle){
				dojo.disconnect(handle);
				conns.splice(i, 1);
				return true;
			}
		});
	},
	
	subscribe: function(topic, method){
		// summary:
		//		Subscribes to the specified topic and calls the specified method
		//		of this object.
		// example:
		//	|	var plugin = new dojox.grid.enhanced._Plugin(grid,"myPlugin",{...});
		//	|	// when /my/topic is published, call the subscriber in the scope of plugin
		//	|	// with passed parameter - "v"		
		//	|	plugin.subscribe("/my/topic", function(v){
		//	|		console.debug(this.xxx(v));//"this" - plugin scope
		//	|	});
		var subscribe = dojo.subscribe(topic, this, method);
		this._subscribes.push(subscribe);
		return subscribe;
	},
	
	unsubscribe: function(handle){
		// summary:
		//		Un-subscribes handle and removes it from subscriptions list.
		dojo.some(this._subscribes, function(subscribe, i, subscribes){
			if(subscribe == handle){
				dojo.unsubscribe(handle);
				subscribes.splice(i, 1);
				return true;
			}
		});
	},
	
	destroy: function(){
		//summary:
		//		Destroy all resources.
		dojo.forEach(this._connects, dojo.disconnect);
		dojo.forEach(this._subscribes, dojo.unsubscribe);
		delete this._connects;
		delete this._subscribes;
		delete this.privates;
	}
});
