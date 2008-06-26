dojo.provide("dojox.data.PersevereStore");
dojo.require("dojox.data.JsonRestStore");
dojo.require("dojox.rpc.Client"); // Persevere supports this and it improves reliability
if(dojox.rpc.LocalStorageRest){
	dojo.require("dojox.json.query"); // this is so we can do perform queries locally 
}

// PersevereStore is an extension of JsonRestStore to handle Persevere's special features

dojox.json.ref.useRefs = true; // Persevere supports referencing
dojox.json.ref.serializeFunctions = true; // Persevere supports persisted functions

dojo.declare("dojox.data.PersevereStore",dojox.data.JsonRestStore,{
	fetch: function(args){

		// performs conversion of Dojo Data query objects and sort arrays to JSONQuery strings
		if(typeof args.query == "object"){
			// convert Dojo Data query objects to JSONQuery
			var jsonQuery = "[?(", first = true;
			for(var i in args.query){
				if(args.query[i]!="*"){ // full wildcards can be ommitted
					jsonQuery += (first ? "" : "&") + "@[" + dojo._escapeString(i) + "]=" + dojox.json.ref.toJson(args.query[i]);
					first = false;
				}
			}
			if(!first){
				// use ' instead of " for quoting in JSONQuery, and end with ]
				jsonQuery += ")]"; 
			}else{
				jsonQuery = "";
			}
			args.queryStr = jsonQuery.replace(/\\"|"/g,function(t){return t == '"' ? "'" : t;});
		}else if(!args.query){
			args.query = "";
		}
		
		var sort = args.sort;
		if(sort){
			// if we have a sort order, add that to the JSONQuery expression
			args.queryStr = args.queryStr || args.query || ""; 
			first = true;
			for(i = 0; i < sort.length; i++){
				args.queryStr += (first ? '[' : ',') + (sort[i].descending ? '\\' : '/') + "@[" + dojo._escapeString(sort[i].attribute) + "]";
				first = false; 
			}
			if(!first){
				args.queryStr += ']';
			}
		}
		if(args.queryStr){
			args.queryStr = args.queryStr.replace(/\\"|"/g,function(t){return t == '"' ? "'" : t;});
		}
		var index = dojox.rpc.Rest._index;
		if(dojox.json.query && !args.dontCache && index[this.target] && !index[this.target]._loadObject){
			// we can do the query locally
			jsonQuery = args.queryStr || args.query;
			// do the query locally with dojox.json.query and then sneak the results in the cache, so the 
			//	inherited fetch can handle it
			index[this.target + jsonQuery] = dojox.json.query(jsonQuery,index[this.target]);
			// there is no point in using range if everything is local, and it disables caching, so we eliminate it.
			args.start = 0;
			delete args.count;
		}
		return this.inherited(arguments);
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
