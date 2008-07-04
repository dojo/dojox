dojo.provide("dojox.rpc.LocalStorageRest");
dojo.require("dojox.rpc.Rest");
dojo.require("dojox.storage");
dojo.require("dojo.data.util.filter"); // <-- this code is not very compact, it could be done in a 
			// fraction of the code size with regular expressions, so I would like to get rid of this dependency
// module for adding live result set functionality to an existing data store class





// in the future this will live on it's own
(function(){
	var defaultMatchesQuery = function(store,item,args){
		var query = args.query; 
		var ignoreCase = args.queryOptions && args.queryOptions.ignoreCase; 
		if(query){
			for(var i in query){
				// if anything doesn't match, than this should be in the query
				var match = query[i];
				var value = store.getValue(item,i);
				if((typeof match == 'string' && (match.match(/[\*\.]/) || ignoreCase)) ?
					!dojo.data.util.filter.patternToRegExp(match, ignoreCase).test(value) :
					value != match){	  
					return false;
				}
			}
		}
		return true;
	};
	var compare = function(store,a,b,args){
		// compare items by sort order
		var sort = args.sort;
		if(sort){
			for(var i = 0; i < sort.length;i++){
				var av = store.getValue(a,sort[i].attribute);
				var bv = store.getValue(b,sort[i].attribute);
				if(av != bv){
					return av > bv == sort[i].descending;
				}
			}
		}
		// ties and no sort orders, we will put it at the end...
		// is that right or should it go to the front?
		return true; 
	};
	var lrs;
	var processLiveResults = function(create,remove){
		// create a handler that updates any live result sets
		return function(item){
			var requests = this._liveRequests;
			var processed = [];
			for(var i = 0; i < requests.length; i++){
				var request = requests[i];
				var results = request.results;
				if(results && !results._processed){
					// we need to make sure we only process each result set only once (there can be duplicates in the case of caching)
					processed.push(results);
					results._processed = true;
					var updated;
					if(remove){
						for(var j = 0; j < results.length;j++){
							if(results[j]==item){
								results.splice(j--,1);
								updated = true;
							}
						}
					}
					if(create && (this.matchesQuery ? this.matchesQuery(item,request) : defaultMatchesQuery(this,item,request))){
						for(j=0;j < results.length && compare(this,results[j],item,request); j++){} // find the right place in the sort order
						results.splice(j,0,item);
						updated = true;
					}
					lrs.onUpdate(results);
				}
			}
			for(i = 0; i < processed.length; i++){
				delete processed[i]._processed;
			}
		}
	};
	lrs = dojo.declare("dojox.rpc.LocalStorageRest.LiveResultSets",
		null,
		{
			constructor: function(){
				// summary:
				//		This is a mixin class that adds live result set functionality, this enables
				//		widgets to be aware of how active results change in response to the modifications/notifications.
				//
				//	description:
				//		To use live result sets, you do a fetch, and if the returned dojo.data.api.Request object
				//		has a "makeLive" function, that function can be called to register the result set as "live".
				//		Once a result set is registered as live, any onNew, onSet, and onDelete operation will
				//		cause the result set to be properly updated to reflect the change, with awareness
				//		of whether or not a new item should be added to a result set based on the query
				//		and properly placing the item in a result set to preserve sorting and even if 
				//		items should be removed or added based on property changes. Widgets can use these
				//		result sets to determine how to react to notifications, and how to update their displayed results
				//		based on changes.
				//		When a widget is finished using a result set, it is good practice to call the abort function 
				// 		on the Request object, this will signal that the result set is no longer "live", and it will no
				// 		longer be maintained (and could be GC'ed). If fetch returns a Request object that does
				// 		not have a "makeLive" function, this indicates that the result set can not be made to be
				// 		live, and the widget will have to resort to other means to a proper view of the data.
				// 		This module will use the best available information to maintain result sets, using query attribute
				// 		objects to determine if items are in a result set, and using the sort arrays to maintain sort
				// 		information. However, queries can be opaque strings, and this module can not maintain
				// 		live results by itself in this case. In this situations, data stores can provide a canBeLive(args) function
				// 		and matchesQuery(item,args) function. If a data store can handle a query, it can return true from
				// 		canBeLive and if an item matches a query, it can return true from matchesQuery. Here is 
				//		definition of canBeLive and matchesQuery
				// 		canBeLive(args)  - args is the keywords arguments as is passed to the fetch function.
				// 		matchesQuery(item,args) - item is the item to test, and args is the value arguments object
				//				for the fetch function.
				//
				// example:
				//		to make a live-result-set data store from an existing data store:
				//	|	dojo.declare("dojox.data.MyLiveDataStore",
				//	|		[dojox.data.MyDataStore,dojox.data.LiveResultSets], // subclass LiveResultSets if available
				//	|		{}
				//	|	);
				this.onSet = processLiveResults(true,true);
				this.onNew = processLiveResults(true,false);
				this.onDelete = processLiveResults(false,true);
			},
			alwaysLive: true,
			fetch: function(args){
				if(this.canBeLive ? this.canBeLive(args) : typeof args.query == "object"){
					// we can keep object style queries "live"
					var store = this;
					args.makeLive = function(){
						store._liveRequests.push(args);
					}
					if(lrs.alwaysLive){
						store._liveRequests.push(args);
					}
					var defaultAbort = args.abort; 
					args.abort = function(){
						if(!lrs.alwaysLive){
							store._liveRequests.splice(dojo.indexOf(store._liveRequests,args),1);
						}
						defaultAbort();
					} 
				}
				this.inherited(arguments);
				return args;
			}
		}
	);
	lrs.onUpdate= function(){};
})();

// summary:
// 		Makes the REST service be able to store changes in local
// 		storage so it can be used offline automatically.
(function(){
	var Rest = dojox.rpc.Rest;
	var namespace = "dojox_rpc_LocalStorageRest";
	var loaded;
	var index = Rest._index;	
	dojox.storage.manager.addOnLoad(function(){
		//console.log("storage loaded");
		// now that we are loaded we need to save everything in the index
		loaded = dojox.storage.manager.available;
		for(var i in index){
			saveObject(index[i], i);
		}
	});
	var dontSave;
	function getStorageKey(key){
		// returns a key that is safe to use in storage
		return key.replace(/[^0-9A-Za-z_]/g,'_');
	}
	function saveObject(object,id){
		// save the object into local storage
		if(loaded && !dontSave && (id || (object && object.__id))){
			dojox.storage.put(
					getStorageKey(id||object.__id),
					typeof object=='object'?dojox.json.ref.toJson(object):object, // makeshift technique to determine if the object is json object or not
					function(){},
					namespace);
		}
	}
	function isNetworkError(error){
		//	determine if the error was a network error and should be saved offline
		// 	or if it was a server error and not a result of offline-ness
		return error instanceof Error && (error.status == 503 || error.status > 12000 ||  !error.status); // TODO: Make the right error determination
	}
	function sendChanges(){
		// periodical try to save our dirty data
		if(loaded){
			var dirty = dojox.storage.get("dirty",namespace);
			if(dirty){
				for (var dirtyId in dirty){
					commitDirty(dirtyId,dirty);
				}
			}
		}
	}
	var lsr;
	function sync(){
		lsr.sendChanges();
		lsr.downloadChanges();
	} 
	var syncId = setInterval(sync,15000);
	lsr = dojo.mixin(dojox.rpc.LocalStorageRest,{
		turnOffAutoSync: function(){
			clearInterval(syncId);
		},
		sync: sync,
		sendChanges: sendChanges,
		downloadChanges: function(){
			
		}
	});

	var defaultGet = Rest._get;
	Rest._get = function(service, id){
		// We specifically do NOT want the paging information to be used by the default handler,
		// this is because online apps want to minimize the data transfer,
		// but an offlien app wants the opposite, as much data as possible transferred to
		// the client side
		Rest.setQueryInfo({dontCache:Rest._dontCache});
		var dfd = defaultGet(service, id); 
		var sync = dojox.rpc._sync;
		if (!(service.isJson && dojox.json && dojox.json.ref)){ // json.ref will call onLoad for each object
			dfd.addCallback(function(result){
				saveObject(result, service.servicePath+id);
				return result;			
			});
		}
		dfd.addErrback(function(error){
			if(loaded){
				// if the storage is loaded, we can go ahead and get the object out of storage
				if(isNetworkError(error)){
					console.log("network error, getting ");
					var loadedObjects = {};
					// network error, load from local storage
					var byId = function(id,backup){
						if(loadedObjects[id]){
							return backup;
						}
						var result = dojo.fromJson(dojox.storage.get(getStorageKey(id),namespace)) || backup;
						loadedObjects[id] = result;
						for(var i in result){
							var val = result[i]; // resolve references if we can
							if (val && val.$ref){
								result[i] = byId(val.$ref,val);
							}
						}
						if (result instanceof Array){
							//remove any deleted items
							for (i = 0;i<result.length;i++){
								if (result[i]===undefined){
									result.splice(i--,1);
								}
							}
						}
						return result;
					};
					dontSave = true; // we don't want to be resaving objects when loading from local storage
					//TODO: Should this reuse something from dojox.rpc.Rest
					var result = byId(service.servicePath+id);
					
					if(!result){// if it is not found we have to just return the error
						return error;
					}
					dontSave = false;
					return result;
				}
				else{
					return error; // server error, let the error propagate
				}
			}
			else{
				if(sync){
					return new Error("Storage manager not loaded, can not continue");
				}
				// we are not loaded, so we need to defer until we are loaded
				dfd = new dojo.Deferred();
				dfd.addCallback(arguments.callee);
				dojo.connect(dojox.storage.manager,"loaded", function(){
					dfd.callback();
				});
				return dfd;
			}
		});
		return dfd;
	};
	var updatedResults = {};

	dojo.connect(dojox.rpc.LocalStorageRest.LiveResultSets,"onUpdate",function(results){
		// we want to be notified when queries are updated, so can store the changes
		updatedResults[results.__id] = results;
	});
	//FIXME: Should we make changes after a commit to see if the server rejected the change
	// or should we come up with a revert mechanism? 
	var defaultChange = Rest._change;
	Rest._change = function(method,service,id,serializedContent){
		if(!loaded){
			return defaultChange.apply(this,arguments);
		}
		var absoluteId = service.servicePath + id;
		if(method=='delete'){
			dojox.storage.remove(getStorageKey(absoluteId),namespace);
		}		
		else{
			// both put and post should store the actual object
			dojox.storage.put(getStorageKey(dojox.rpc.JsonRest._contentId),serializedContent,function(){
			},namespace);
		}
		// record all the updated queries
		for(i in updatedResults){
			dojox.storage.put(getStorageKey(i),dojox.json.ref.toJson(updatedResults[i]),function(){
				},namespace);
		}
		updatedResults = {}; // clear the updates
		var dirty = dojox.storage.get("dirty",namespace) || {};
		if (method=='put' || method=='delete'){
			// these supersede so we can overwrite anything using this id
			var dirtyId = absoluteId;
		}
		else{
			dirtyId = 0;
			for (var i in dirty){
				if(!isNaN(parseInt(i))){
					dirtyId = i;
				}
			} // get the last dirtyId to make a unique id for non-idempotent methods
			dirtyId++;
		}
		dirty[dirtyId] = {method:method,id:absoluteId,content:serializedContent};
		return commitDirty(dirtyId,dirty);
	};
	function commitDirty(dirtyId, dirty){
		var dirtyItem = dirty[dirtyId];
		var serviceAndId = dojox.rpc.JsonRest.getServiceAndId(dirtyItem.id);
		var deferred = defaultChange(dirtyItem.method,serviceAndId.service,serviceAndId.id,dirtyItem.content);
		// add it to our list of dirty objects		
		dirty[dirtyId] = dirtyItem;
		dojox.storage.put("dirty",dirty,function(){},namespace);
		deferred.addBoth(function(result){
			if (isNetworkError(result)){
				// if a network error (offlineness) was the problem, we leave it 
				// dirty, and return to indicate successfulness
				return null;
			}
			// it was successful or the server rejected it, we remove it from the dirty list 
			var dirty = dojox.storage.get("dirty",namespace) || {};
			delete dirty[dirtyId];
			dojox.storage.put("dirty",dirty,function(){},namespace);
			return result;
		});
		return deferred;
	}
		
	dojo.connect(index,"onLoad",saveObject);
	dojo.connect(index,"onUpdate",saveObject);
	
})();
