dojo.provide("dojox.data.JsonRestStore");
dojo.require("dojox.data.ServiceStore");
dojo.require("dojox.rpc.JsonRest");
dojo.require("dojox.json.ref"); // this provides json indexing


// A JsonRestStore takes a REST service or a URL and uses it the remote communication for a
// read/write dojo.data implementation. A JsonRestStore can be created with a simple URL like:
// new JsonRestStore({target:"/MyData/"});
// To use a JsonRestStore with a service, you should create a
// service with a REST transport. This can be configured with an SMD:
//{
//    services: {
//        jsonRestStore: {
//			transport: "REST",
//			envelope: "URL",
//                    target: "store.php",
//					contentType:"application/json",
//                    parameters: [
//                            {name: "location", type: "string", optional: true}
//                    ]
//            }
//    }
//}
// The SMD can then be used to create service, and the service can be passed to a JsonRestStore. For example:
// var myServices = new dojox.rpc.Service(dojo.moduleUrl("dojox.rpc.tests.resources", "test.smd"));
// var jsonStore = new dojox.data.JsonRestStore({service:myServices.jsonRestStore});
//
// The JsonRestStore will then cause all saved modifications to be server using Rest commands (PUT, POST, or DELETE).
// The JsonRestStore also supports lazy loading. References can be made to objects that have not been loaded.
//  For example if a service returned:
// {"name":"Example","lazyLoadedObject":{"$ref":"obj2"}}
//
// And this object has accessed using the dojo.data API:
// var obj = jsonStore.getValue(myObject,"lazyLoadedObject");
// The object would automatically be requested from the server (with an object id of "obj2").
//
// When using a Rest store on a public network, it is important to implement proper security measures to
// control access to resources

dojo.declare("dojox.data.JsonRestStore",
	dojox.data.ServiceStore,
	{
		constructor: function(options){
			//summary:
			//		JsonRestStore is a Dojo Data store interface to JSON HTTP/REST web
			//		storage services that support read and write through GET, PUT, POST, and DELETE. 
			// options: 
			// 		Keyword arguments
			//	
			// The *schema* parameter
			//		This is a schema object for this store. This should be JSON Schema format.
			//
			// The *service* parameter
			// 		This is the service object that is used to retrieve lazy data and save results
			// 		The function should be directly callable with a single parameter of an object id to be loaded
			// 		The function should also have the following methods:
			// 			put(id,value) - puts the value at the given id
			// 			post(id,value) - posts (appends) the value at the given id
			// 			delete(id) - deletes the value corresponding to the given id
			//
			// The *target* parameter
			// 		This is the target URL for this Service store. This may be used in place
			// 		of a service parameter to connect directly to RESTful URL without
			// 		using a dojox.rpc.Service object.
			//
			// The *idAttribute* parameter
			//		Defaults to 'id'. The name of the attribute that holds an objects id.
			//		This can be a preexisting id provided by the server.
			//		If an ID isn't already provided when an object
			//		is fetched or added to the store, the autoIdentity system
			//		will generate an id for it and add it to the index.

			//	The *mode* parameter: dojox.data.ASYNC_MODE || dojox.data.SYNC_MODE
			//		Defaults to ASYNC_MODE.  This option sets the default mode for this store.
			//		Sync calls return their data immediately from the calling function
			//		instead of calling the callback functions.  Functions such as
			//		fetchItemByIdentity() and fetch() both accept a string parameter in addtion
			//		to the normal keywordArgs parameter.  When passed this option, SYNC_MODE will
			//		automatically be used even when the default mode of the system is ASYNC_MODE.
			//		A normal request to fetch or fetchItemByIdentity (with kwArgs object) can also
			//		include a mode property to override this setting for that one request.

			dojo.connect(dojox.rpc.Rest._index,"onUpdate",this,function(obj,attrName,oldValue,newValue){
				var prefix = this.service.servicePath;
				if(!obj.__id){
					console.log("no id on updated object ", obj);
				}else if(obj.__id.substring(0,prefix.length) == prefix){
					this.onSet(obj,attrName,oldValue,newValue);
				}
			});
			this.idAttribute = this.idAttribute || 'id';// no options about it, we have to have identity
			//setup a byId alias to the api call
			if(this.target && !this.service){
				this.service = dojox.rpc.Rest(this.target,true); // create a default Rest service
				this.service._schema = this.schema || {};
				this.target = this.schema._idPrefix = this.service.servicePath;
			}
			/*else if(!(this.service.contentType + '').match(/application\/.*json/)){
				throw new Error("A service must use a contentType of 'application/json' in order to be used in a JsonRestStore");
			}*/
			this.service._store = this;
			this._constructor = dojox.rpc.JsonRest.getConstructor(this.service);
			//given a url, load json data from as the store
		},
		//Write API Support
		newItem: function(data/*, parentInfo*/){
			// summary:
			//		adds a new item to the store at the specified point.
			//		Takes two parameters, data, and options.
			//
			//	data: /* object */
			//		The data to be added in as an item.
			data = new this._constructor(data);
			this.onNew(data);
			return data;
		},
		deleteItem: function(item){
			// summary:
			//		deletes item any references to that item from the store.
			//
			//	item:
			//  	item to delete
			//

			//	If the desire is to delete only one reference, unsetAttribute or
			//	setValue is the way to go.
			dojox.rpc.JsonRest.deleteObject(item);
			var store = dojox.data._getStoreForItem(item);
			store._doDelete(item);
		},
		_doDelete : function(item/*,array / parentInfo*/){
			this.onDelete(item);
		},
		changing: function(item,_deleting){
			// summary:
			//		adds an item to the list of dirty items.  This item
			//		contains a reference to the item itself as well as a
			//		cloned and trimmed version of old item for use with
			//		revert.
			dojox.rpc.JsonRest.changing(item,_deleting);
		},

		setValue: function(item, attribute, value){
			// summary:
			//		sets 'attribute' on 'item' to 'value'

			var old = item[attribute];
			var store = dojox.data._getStoreForItem(item);
			if(old != value){
				store.changing(item);
				item[attribute]=value;
				store.onSet(item,attribute,old,value);
			}
		},
		setValues: function(item, attribute, values){
			// summary:
			//	sets 'attribute' on 'item' to 'value' value
			//	must be an array.


			if(!dojo.isArray(values)){
				throw new Error("setValues expects to be passed an Array object as its value");
			}
			this.changing(item);
			var old = item[attribute];
			item[attribute]=values;
			this.onSet(item,attribute,old,values);
		},

		unsetAttribute: function(item, attribute){
			// summary:
			//		unsets 'attribute' on 'item'

			this.changing(item);
			var old = item[attribute];
			delete item[attribute];
			this.onSet(item,attribute,old,undefined);
		},
		save: function(kwArgs){
			// summary:
			//		Saves the dirty data using REST Ajax methods
			var actions = dojox.rpc.JsonRest.commit(kwArgs);
			for(var i = 0; i < actions.length; i++){
				if(actions[i].method == 'post' && this.onPostCommit){
					var self = this;
					// some REST stores need to do some processing after a post has been committed
					(function(object){
						dfd.addCallback(function(value){
							self.onPostCommit(object);
							return value;
						});
					})(actions[i].content);
				}
			}
		},


		revert: function(){
			// summary
			//		returns any modified data to its original state prior to a save();
			var dirtyObjects = dojox.rpc.JsonRest.getDirtyObjects().concat([]);
			while (dirtyObjects.length>0){
				var d = dirtyObjects.pop();
				//TODO: Find the correct store for each one
				if(!d.object){
					// was a deletion, we will add it back
					this.onNew(d.old);
				}else if(!d.old){
					// was an addition, remove it
					this.onDelete(d.object);
				}else{
					//TODO: onSet
				}
			}
			dojox.rpc.JsonRest.revert();
		},

		isDirty: function(item){
			// summary
			//		returns true if the item is marked as dirty.
			return dojox.rpc.JsonRest.isDirty(item);
		},
		isItem: function(item){
			// summary:
			//	Checks to see if a passed 'item'
			//	is really belongs to this JsonRestStore.
			//
			//	item: /* object */
			//	attribute: /* string */
			return item && item.__id && this.service == dojox.rpc.Rest.getServiceAndId(item.__id).service;
		},

		fetch: function(args){
			// summary:
			//		See dojo.data.Read

			// add in the REST capabilities for paged fetching and cache control
			var queryInfo={};
			if(args.start || args.count){
				queryInfo.start=args.start;
				if(args.count){
					queryInfo.end=(args.start||0)+args.count;
				}
			}
			queryInfo.dontCache = args.dontCache; // TODO: Add TTL maybe?
			dojox.rpc.Rest.setQueryInfo(queryInfo);
			return dojox.data.ServiceStore.prototype.fetch.apply(this,arguments);
		},
		_processResults: function(results, deferred){
			// index the results
			return {totalCount:deferred.fullLength || results.length, items: results};
		},

		fetchItemByIdentity: function(args){
			// summary:
			//		fetch an item by its identity. fetch and fetchItemByIdentity work the same

			// convert the different spellings
			args.query = args.identity;
			args.onComplete = args.onItem;
			// we can rely on the Rest service to provide the index/cache
			return this.fetch(args);
		},
		getConstructor: function(){
			// summary:
			// 		Gets the constructor for objects from this store
			return this._constructor;
		},
		//Notifcation Support

		onSet: function(){
		},

		onNew: function(){
		},

		onDelete: function(){
		},

		getFeatures: function(){
			// summary:
			// 		return the store feature set
			var features = dojox.data.ServiceStore.prototype.getFeatures();
			features["dojo.data.api.Write"] = true;
			features["dojo.data.api.Notification"] = true;
			return features;
		}


	}
);
 
dojox.data._getStoreForItem = function(item){
	return dojox.rpc.services[item.__id.match(/.*\//)[0]]._store;
};
