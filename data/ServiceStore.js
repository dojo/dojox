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

dojox.data.ASYNC_MODE = 0;
dojox.data.SYNC_MODE = 1;
dojo.declare("dojox.data.ServiceStore",
	null,
	{
		mode: dojox.data.ASYNC_MODE,
		constructor: function(options){
			//summary:
			//		ServiceStore constructor, instantiate a new ServiceStore 
			// 		A ServiceStore can be configured from a JSON Schema. Queries are just 
			// 		passed through as URLs for XHR requests, 
			// 		so there is nothing to configure, just plug n play.
			// 		Of course there are some options to fiddle with if you want:
			//  
			// schema: /* object */
			//		This is a schema object for this store. This should be JSON Schema format.
			// 
			// service: /* function */
			// 		This is the service object that is used to retrieve lazy data and save results 
			// 		The function should be directly callable with a single parameter of an object id to be loaded
			//
			//	idAttribute: /* string */
			//		Defaults to 'id'. The name of the attribute that holds an objects id.
			//		This can be a preexisting id provided by the server.  
			//		If an ID isn't already provided when an object
			//		is fetched or added to the store, the autoIdentity system
			//		will generate an id for it and add it to the index. 
			//
			//	mode: dojox.data.ASYNC_MODE || dojox.data.SYNC_MODE
			//		Defaults to ASYNC_MODE.  This option sets the default mode for this store.
			//		Sync calls return their data immediately from the calling function
			//		instead of calling the callback functions.  Functions such as 
			//		fetch() both accept a string parameter in addtion
			//		to the normal keywordArgs parameter.  When passed this option, SYNC_MODE will
			//		automatically be used even when the default mode of the system is ASYNC_MODE.
			//		A normal request to fetch or fetchItemByIdentity (with kwArgs object) can also 
			//		include a mode property to override this setting for that one request.

			//setup a byId alias to the api call	
			this.byId=this.fetchItemByIdentity;
			// if the advanced json parser is enabled, we can pass through object updates as onSet events
			if(options){
				dojo.mixin(this,options);
			}
			this.idAttribute = this.idAttribute || (this.schema && this.schema._idAttr) || 'id';
		},

		getSchema: function(){
			return this.schema; 
		},
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
			value = value === undefined ? defaultValue : value; 
			if(value instanceof dojo.Deferred){
				dojox.rpc._sync = true; // tell the service to operate synchronously (I have some concerns about the "thread" safety with FF3, as I think it does event stacking on sync calls)
				value.addCallback(function(returned){
					value = returned;
					return value;
				});
				delete dojox.rpc._sync; // revert to normal async behavior
			}
			return value;
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
			return dojo.isArray(val) ? val : [val];
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
			return dojo.indexOf(getValues(item,attribute),value) > -1;
		},


		isItem: function(item){
			// summary:
			//		Checks to see if a passed 'item'
			//		really belongs to this ServiceStore.  
			//
			//	item: /* object */
			//	attribute: /* string */
		
			// we have no way of determining if it belongs, we just have object returned from
			// 	service queries
			return true; 
		},

		isItemLoaded: function(item){
			// summary:
			//		returns isItem() :)
			//
			//		item: /* object */

			return !(item instanceof Deferred && item.fired < 0);
		},

		loadItem: function(args){
			// summary:
			// 		Loads an item that has not been loaded yet. Lazy loading should happen through getValue. 
			// 		However, if you access a value directly through property access, you can use this to load
			// 		a lazy (Deferred) value.
			//
			if(args.item instanceof Deferred && args.item.fired < 0){
				args.item.addCallback(function(result){
					if(args.onItem){
						args.onItem.call(args.scope,result);				
					}
				});
				if(args.onError){
					args.item.addErrback(dojo.hitch(args.scope, args.onError));
				}
			}
		},
		_currentId : 0,
		_index : {},
		_processResults : function(results){
			// this should return an object with the items as an array and the total count of 
			// items (maybe more than currently in the result set).
			// for example:
			//	| {totalCount:10,[{id:1},{id:2}]}
			var self = this;
			// index the results, assigning ids as necessary
			function assignId(obj){
				if (!obj[self.idAttribute]){
					var id = self._currentId++;
					obj[self.idAttribute] = id;
					self._index[id] = obj;
					for (var i in obj){
						var value = obj[i]; 
						if (value && typeof value == 'object'){
							assignId(value);						}
					}
				}
			}
			assignId(results);
			return {totalCount:results.length, items: results};
		},
		close: function(request){
			return request && request.abort && request.abort();
		},
		_rootQueries:[],//objects that represent the result "root" queries			
		fetch: function(args){
			// summary
			//	
			//		fetch takes either a string argument or a keywordArgs
			//		object containing the parameters for the search.
			//		If passed a string, fetch will interpret this string
			//		as the query to be performed and will do so in 
			//		SYNC_MODE returning the results immediately.
			//		If an object is supplied as 'args', its options will be 
			// 		parsed and then contained query executed. 
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

			var query=args.query;
			if(!args.mode){args.mode = this.mode;}
			var self = this;
			dojox.rpc._sync = this.mode;
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
					args.onComplete.call(scope, results, args);
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
				"dojo.data.api.Identity": this.idAttribute, // this is dependent on 
				"dojo.data.api.Schema": this.schema
			};
		},

		getLabel: function(item){
			// summary
			//		returns the label for an item. Just gets the "label" attribute.
			//	
			return this.getValue(item,"label");
		},

		getLabelAttributes: function(item){
			// summary:
			//		returns an array of attributes that are used to create the label of an item
			return ["label"];
		},

		//Identity API Support

		getIdentity: function(item){
			return item[this.idAttribute];
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
			
			args.onItem.call(args.scope,this._index[args.identity]);
		}
	
	}
);
