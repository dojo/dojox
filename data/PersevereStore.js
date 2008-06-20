dojo.provide("dojox.data.PersevereStore");
dojo.require("dojox.data.JsonRestStore");
dojo.require("dojox.rpc.Client"); // this isn't necessary, but it improves reliability

// PersevereStore is an extension of JsonRestStore to handle Persevere's special features

dojox.json.ref.useRefs = true; // Persevere supports referencing
dojox.json.ref.serializeFunctions = true; // Persevere supports persisted functions

dojo.declare("dojox.data.PersevereStore",dojox.data.JsonRestStore,{
	fetch: function(args){
		if(typeof args.query == "object"){
			// convert Dojo Data query objects to JSONPath
			args.queryObj = args.query; // queryObj can be used by LiveResultSets to do comparisons		
			var jsonPathQuery = "[?(", first = true;
			for(var i in args.query){
				jsonPathQuery += (first ? "" : "&") + "@[" + dojo._escapeString(i) + "]=" + dojox.json.ref.toJson(args.query[i]);
				first = false;
			}
			//FIXME: Add sorting
			if(!first){
				args.query = jsonPathQuery.replace(/\\"|"/g,function(t){return t == '"' ? "'" : t}) + ")]"; // use ' instead of " for quoting in JSONPath
			}else{
				args.query = args.query || ""; 
			}
		}
		return dojox.data.JsonRestStore.prototype.fetch.apply(this,arguments);
	}
});
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
	path = (path && (path.match(/\/$/) ? path : (path + '/'))) || '/';
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
