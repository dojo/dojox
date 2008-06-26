dojo.provide("dojox.data.ServiceStore");

// note that dojox.rpc.Service is not required, you can create your own services

// A ServiceStore is a readonly data store that provides a data.data interface to an RPC service.
// var myServices = new dojox.rpc.Service(dojo.moduleUrl("dojox.rpc.tests.resources", "test.smd"));
// var serviceStore = new dojox.data.ServiceStore({service:myServices.ServiceStore});
// 
// The ServiceStore also supports lazy loading. References can be made to objects that have not been loaded.
//  For example if a service returned:
// {"name":"Example","lazyLoadedObject":{"$ref":"obj2"}}
//
// And this object has accessed using the dojo.data API:
// var obj = serviceStore.getValue(myObject,"lazyLoadedObject");
// The object would automatically be requested from the server (with an object id of "obj2").
//

dojo.declare("dojox.data.ServiceStore",
	null,
	{
		constructor: function(options){
			//summary:
			//		ServiceStore constructor, instantiate a new ServiceStore 
			// 		A ServiceStore can be configured from a JSON Schema. Queries are just 
			// 		passed through as URLs for XHR requests, 
			// 		so there is nothing to configure, just plug n play.
			// 		Of course there are some options to fiddle with if you want:
			// options: 
			// 		Keyword arguments
			// The *schema* parameter
			//		This is a schema object for this store. This should be JSON Schema format.
			// 
			// The *service* parameter
			// 		This is the service object that is used to retrieve lazy data and save results 
			// 		The function should be directly callable with a single parameter of an object id to be loaded
			//
			// The *idAttribute* parameter
			//		Defaults to 'id'. The name of the attribute that holds an objects id.
			//		This can be a preexisting id provided by the server.  
			//		If an ID isn't already provided when an object
			//		is fetched or added to the store, the autoIdentity system
			//		will generate an id for it and add it to the index. 
			//
			// The *syncMode* parameter
			//		Setting this to true will set the store to using synchronous calls by default.
			//		Sync calls return their data immediately from the calling function, so
			//		callbacks are unnecessary
			//
			// The *lazyLoadValues* parameter
			//		Setting this to true will cause any getValue call to automatically load the value
			// 		if the returned value is a lazy item. This defaults to true. 
			//
			// description:
			//		When extending this class, if you would like to create lazy objects, you can follow
			//		the example from dojox.data.tests.stores.ServiceStore:
			// |	var lazyItem = {
			// |		_loadObject: function(callback){
			// |			this.name="loaded";
			// |			delete this._loadObject;
			// |			callback(this);
			// |		}
			// |	};
			//setup a byId alias to the api call	
			this.byId=this.fetchItemByIdentity;
			this._index = {};			
			// if the advanced json parser is enabled, we can pass through object updates as onSet events
			if(options){
				dojo.mixin(this,options);
			}
			this.idAttribute = this.idAttribute || (this.schema && this.schema._idAttr);
			this.labelAttribute = this.labelAttribute || "label";
		},

		getSchema: function(){
			return this.schema; 
		},

		loadLazyValues:true,

		getValue: function(item, property, defaultValue){
			// summary:
			//	Gets the value of an item's 'property'
			//
			//	item: /* object */
			//	property: /* string */
			//		property to look up value for	
			//	defaultValue: /* string */
			//		the default value
			var value = item[property];
			return value ?
						(value._loadObject && this.loadLazyValues !== false) ? // check to see if it is not loaded 
							(dojox.rpc._sync = true) &&  // tell the service to operate synchronously (I have some concerns about the "thread" safety with FF3, as I think it does event stacking on sync calls)loadItem()
								dojox.data.ServiceStore.prototype.loadItem({item:value}) : 
							value : // return the plain value since it was found;
						// a truthy value was not found, see if we actually have it 
						property in item ? value : // we do, so we can return it
							(item._loadObject && this.syncMode) ? // the item is not loaded and we can load it synchronously, we should load it 
									arguments.callee.call(this,dojox.data.ServiceStore.prototype.loadItem({item:item}), property, defaultValue) : // load the item and run getValue again 
								defaultValue;// not in item -> return default value

		},
		getValues: function(item, property){
			// summary:
			//		Gets the value of an item's 'property' and returns
			//		it.  If this value is an array it is just returned,
			//		if not, the value is added to an array and that is returned.
			//
			//	item: /* object */
			//	property: /* string */
			//		property to look up value for	
	
			var val = this.getValue(item,property);
			return val instanceof Array ? val : [val];
		},

		getAttributes: function(item){
			// summary:
			//	Gets the available attributes of an item's 'property' and returns
			//	it as an array. 
			//
			//	item: /* object */

			var res = [];
			for(var i in item){
				res.push(i);
			}
			return res;
		},

		hasAttribute: function(item,attribute){
			// summary:
			//		Checks to see if item has attribute
			//
			//	item: /* object */
			//	attribute: /* string */
			return attribute in item;		
		},

		containsValue: function(item, attribute, value){
			// summary:
			//		Checks to see if 'item' has 'value' at 'attribute'
			//
			//	item: /* object */
			//	attribute: /* string */
			//	value: /* anything */
			return dojo.indexOf(this.getValues(item,attribute),value) > -1;
		},


		isItem: function(item){
			// summary:
			//		Checks to see if the argument is an item 
			//
			//	item: /* object */
			//	attribute: /* string */
		
			// we have no way of determining if it belongs, we just have object returned from
			// 	service queries
			return typeof item == 'object'; 
		},

		isItemLoaded: function(item){
			// summary:
			//		Checks to see if the item is loaded. 
			// 
			//		item: /* object */

			return item && !item._loadObject;
		},

		loadItem: function(args){
			// summary:
			// 		Loads an item that has not been loaded yet. 
			// 		If you access a value directly through property access, you can use this to load
			// 		a lazy (Deferred) value.
			//
			var item;
			if(args.item._loadObject){
				args.item._loadObject(function(result){
					item = result; // in synchronous mode this can allow loadItem to return the value
					delete item._loadObject;
					var func = result instanceof Error ? args.onError : args.onItem;
					if(func){
						func.call(args.scope,result);				
					}
				});
			}
			return item;
		},
		_currentId : 0,
		_processResults : function(results){
			// this should return an object with the items as an array and the total count of 
			// items (maybe more than currently in the result set).
			// for example:
			//	| {totalCount:10,[{id:1},{id:2}]}
			if(results instanceof Array){
				for (var i = 0; i < results.length; i++){
					results[i] = this._processResults(results[i]).items;
				}
			}
			else{
				// index the results, assigning ids as necessary

				if (results && typeof results == 'object'){
					var id = results.__id;
					if(!id){// if it hasn't been assigned yet
						if(this.idAttribute){
							// use the defined id if available
							id = results[this.idAttribute];
						}else{
							id = this._currentId++;
						}
						id = this.service.servicePath + id;
						var existingObj = this._index[id];
						if(existingObj){
							for(var j in existingObj){
								delete existingObj[j]; // clear it so we can mixin
							}
							results = dojo.mixin(existingObj,results);
						}
						results.__id = id;
						this._index[id] = results;
					}
				}
			}
			return {totalCount:results.length, items: results};
		},
		close: function(request){
			return request && request.abort && request.abort();
		},
		fetch: function(args){
			// summary:
			//		Standard fetch
			//
			//	query: /* string or object */
			//		Defaults to "". This is basically passed to the XHR request as the URL to get the data
			//
			//	start: /* int */
			//		Starting item in result set
			//
			//	count: /* int */
			//		Maximum number of items to return
			//
			// dontCache: /* boolean */
			//
			//	syncMode: /* boolean */
			//		Indicates that the call should be fetch synchronously if possible (this is not always possible)
			//
			//	onBegin: /* function */
			//		called before any results are returned. Parameters
			//		will be the count and the original fetch request
			//	
			//	onItem: /*function*/
			//		called for each returned item.  Parameters will be
			//		the item and the fetch request
			//
			//	onComplete: /* function */
			//		called on completion of the request.  Parameters will	
			//		be the complete result set and the request
			//
			//	onError: /* function */
			//		called in the event of an error

			args = args || {};

			var query= typeof args.queryStr == 'string' ? args.queryStr : args.query;
			if("syncMode" in args ? args.syncMode : this.syncMode){
				dojox.rpc._sync = true;	
			}
			var self = this;
			
			var scope = args.scope || self;
			var defResult = this.service(query);
			defResult.addCallback(function(results){
				
				var resultSet = self._processResults(results, defResult);
				results = args.results = resultSet.items;
				if(args.onBegin){
					args.onBegin.call(scope, resultSet.totalCount, args);
				}
				if(args.onItem){
					for(var i=0; i<results.length;i++){	
						args.onItem.call(scope, results[i], args);
					}
				}					
				if(args.onComplete){
					args.onComplete.call(scope, args.onItem ? null : results, args);
				}
				return results;
			});
			defResult.addErrback(args.onError && dojo.hitch(scope, args.onError));
			args.abort = function(){
				// abort the request
				defResult.ioArgs.xhr.abort();
			};
			args.store = this;
			return args;
		},
		
		getFeatures: function(){
			// summary:
			// 		return the store feature set

			return { 
				"dojo.data.api.Read": true,
				"dojo.data.api.Identity": true, 
				"dojo.data.api.Schema": this.schema
			};
		},

		getLabel: function(item){
			// summary
			//		returns the label for an item. Just gets the "label" attribute.
			//	
			return this.getValue(item,this.labelAttribute);
		},

		getLabelAttributes: function(item){
			// summary:
			//		returns an array of attributes that are used to create the label of an item
			return [this.labelAttribute];
		},

		//Identity API Support

		
		getIdentity: function(item){
			if(!item.__id){
				throw new Error("Identity attribute not found");
			}
			var prefix = this.service.servicePath;
			// support for relative referencing with ids
			return item.__id.substring(0,prefix.length) != prefix ?  item.__id : item.__id.substring(prefix.length); // String
		},

		getIdentityAttributes: function(item){
			// summary:
			//		returns the attributes which are used to make up the 
			//		identity of an item.  Basically returns this.idAttribute

			return [this.idAttribute];
		},

		fetchItemByIdentity: function(args){
			// summary: 
			//		fetch an item by its identity, by looking in our index of what we have loaded
			var item = this._index[this.service.servicePath + args.identity];
			args.onItem.call(args.scope, item);
			return item;
		}
	
	}
);
