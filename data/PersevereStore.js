dojo.provide("dojox.data.PersevereStore");
dojo.require("dojox.data.JsonRestStore");
dojo.require("dojox.rpc.Client"); // this isn't necessary, but it improves reliability

// PersevereStore is an extension of JsonRestStore to handle Persevere's special features

dojox.json.ref.useRefs = true; // Persevere supports referencing

dojo.declare("dojox.data.PersevereStore",dojox.data.JsonRestStore,{});
dojox.data.PersevereStore.getStores = function(/*String?*/path,/*Function?*/callback){
	// summary:
	//		Creates Dojo data stores for all the table/classes on a Persevere server
	// target:
	// 		URL of the Persevere server's root, this normally just "/"
	// 		which is the default value if the target is not provided
	// callback:
	// 		Allows the operation to happen asynchronously
	// return:
	// 		A map/object of datastores. The name of each property is a the name of a store,
	// 		and the value is the actual data store object.
	path = path || '/';
	var rootService= dojox.rpc.Rest(path,true);
	var lastSync = dojox.rpc._sync;
	dojox.rpc._sync = !callback;
	var dfd = rootService("root");//dojo.xhrGet({url: target, sync:!callback, handleAs:'json'});
	var results;
	dfd.addCallback(function(schemas){
		for(var i in schemas){
			if(typeof schemas[i] == 'object'){
				schemas[i] = new dojox.data.PersevereStore({target:new dojo._Url(path,i+'/') + '',schema:schemas[i]});
			}
		}
		if(callback){
			callback(schemas);
		}
		return (results = schemas);
	});
	dfd.addErrback(function(error){
		console.log(error);
	});
	dojox.rpc._sync = lastSync;
	return results;
};
dojox.data.PersevereStore.addProxy = function(){
	// summary:
	//		Invokes the XHR proxy plugin. Call this if you will be using x-site data.
	dojo.require("dojox.io.xhrPlugins"); // also not necessary, but we can register that Persevere supports proxying
	dojox.io.xhrPlugins.addProxy("/proxy/");
};
