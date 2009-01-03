dojo.provide("dojox.data.PersevereStore");
dojo.require("dojox.data.JsonQueryRestStore");
dojo.require("dojox.rpc.Client"); // Persevere supports this and it improves reliability

// PersevereStore is an extension of JsonRestStore to handle Persevere's special features

dojox.json.ref.serializeFunctions = true; // Persevere supports persisted functions

dojo.declare("dojox.data.PersevereStore",dojox.data.JsonQueryRestStore,{
	jsonQueryPagination: false // use the Range headers instead	
});
dojox.data.PersevereStore.getStores = function(/*String?*/path,/*Boolean?*/sync){
	// summary:
	//		Creates Dojo data stores for all the table/classes on a Persevere server
	// path:
	// 		URL of the Persevere server's root, this normally just "/"
	// 		which is the default value if the target is not provided
	// sync:
	// 		Indicates that the operation should happen synchronously.
	// return:
	// 		A map/object of datastores will be returned if it is performed asynchronously,
	// 		otherwise it will return a Deferred object that will provide the map/object.
	// 		The name of each property is a the name of a store,
	// 		and the value is the actual data store object.
	path = (path && (path.match(/\/$/) ? path : (path + '/'))) || '/';
	if(path.match(/^\w*:\/\//)){
		// if it is cross-domain, we will use window.name for communication
		dojo.require("dojox.io.xhrScriptPlugin");
		dojox.io.xhrScriptPlugin(path, "callback", dojox.io.xhrPlugins.fullHttpAdapter);
	}
	var plainXhr = dojo.xhr;
	dojo.xhr = function(method,args){
		(args.headers = args.headers || {})['X-Server-Methods'] = false;
		return plainXhr.apply(dojo,arguments);
	}
	var rootService= dojox.rpc.Rest(path,true);
	dojox.rpc._sync = sync;
	var dfd = rootService("Class/");//dojo.xhrGet({url: target, sync:!callback, handleAs:'json'});
	var results;
	var stores = {};
	var callId = 0;
	dfd.addCallback(function(schemas){
		for(var i in schemas){
			if(typeof schemas[i] == 'object'){
				var schema = schemas[i];
				if(schema.methods){
					for(var j in schema.methods){
						var methodDef = schema.methods[j];
						// if any method definitions indicate that the method should run on the server, than add 
						// it to the prototype as a JSON-RPC method
						if(methodDef.runAt == "server" && !schema.prototype[j]){
							schema.prototype = schema.prototype || {};
							schema.prototype[j] = (function(methodName){
								return function(){
									// execute a JSON-RPC call
									var deferred = dojo.rawXhrPost({
										url: this.__id,
										// the JSON-RPC call
										postData: dojo.toJson({
											method: methodName,
											id: callId++,
											params: arguments
										}),
										handleAs: "json"
									});
									deferred.addCallback(function(response){
										// handle the response
										return response.error ?
											new Error(response.error) :
											response.result;
									});
									return deferred;
								}
							})(j);	
						}
					}
				}
				stores[schemas[i].id] = new dojox.data.PersevereStore({target:new dojo._Url(path,schemas[i].id) + '',schema:schema});
			}
		}
		return (results = stores);
	});
	dojo.xhr = plainXhr;
	return sync ? results : dfd;
};
dojox.data.PersevereStore.addProxy = function(){
	// summary:
	//		Invokes the XHR proxy plugin. Call this if you will be using x-site data.
	dojo.require("dojox.io.xhrPlugins"); // also not necessary, but we can register that Persevere supports proxying
	dojox.io.xhrPlugins.addProxy("/proxy/");
};
