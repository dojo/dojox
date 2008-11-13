dojo.provide("dojox.data.PersevereStore");
dojo.require("dojox.data.JsonQueryRestStore");
dojo.require("dojox.rpc.Client"); // Persevere supports this and it improves reliability

// PersevereStore is an extension of JsonRestStore to handle Persevere's special features

dojox.json.ref.serializeFunctions = true; // Persevere supports persisted functions

dojo.declare("dojox.data.PersevereStore",dojox.data.JsonQueryRestStore,{	
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
	var rootService= dojox.rpc.Rest(path,true);
	dojox.rpc._sync = sync;
	var dfd = rootService("Class/");//dojo.xhrGet({url: target, sync:!callback, handleAs:'json'});
	var results;
	var stores = {};
	dfd.addBoth(function(schemas){
		for(var i in schemas){
			if(typeof schemas[i] == 'object'){
				stores[schemas[i].id] = new dojox.data.PersevereStore({target:new dojo._Url(path,schemas[i].id) + '',schema:schemas[i]});
			}
		}
		return (results = stores);
	});
	return sync ? results : dfd;
};
dojox.data.PersevereStore.addProxy = function(){
	// summary:
	//		Invokes the XHR proxy plugin. Call this if you will be using x-site data.
	dojo.require("dojox.io.xhrPlugins"); // also not necessary, but we can register that Persevere supports proxying
	dojox.io.xhrPlugins.addProxy("/proxy/");
};
