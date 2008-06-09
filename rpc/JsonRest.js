dojo.provide("dojox.rpc.JsonRest");
dojo.require("dojox.rpc.Rest");
// summary:
// 		Provides JSON/REST utility functions
(function(){
	var dirtyObjects = [];
	var Rest = dojox.rpc.Rest;
	dojox.rpc.JsonRest={
		commit: function(kwArgs){
			// summary:
			//		Saves the dirty data using REST Ajax methods
			var data = [];

			var left; // this is how many changes are remaining to be received from the server
			var self = this;
			kwArgs = kwArgs || {};
			function finishOne(value){
				if(!(--left)){
					dirtyObjects.splice(0,numDirty); // remove all the objects that were committed
					if(kwArgs.onComplete){
						kwArgs.onComplete.call(kwArgs.scope);
					}
				}
				return value;
			}
			var actions = [];
			var numDirty = dirtyObjects.length;
			var alreadyRecorded = {};
			for(var i = 0; i < numDirty; i++){
				var dirty = dirtyObjects[i];
				var object = dirty.object;
				var append = false;
				if(object && !dirty.old){
					// new object
					actions.push({method:"post",target:{__id:Rest.getServiceAndId(object.__id).service.servicePath},
											content:object});
				}else if(!object && dirty.old){
					// deleted object
					actions.push({method:"delete",target:dirty.old});
				}else{
					// changed object
					while(!(dojox.json && dojox.json.ref && dojox.json.ref.useRefs) && object.__id.match(/[\[\.]/)){ // it is a path reference
						// this means it is a sub object and the server doesn't support directly putting to
						// this object by path, we must go to the parent object and save it
						var parentId = object.__id.match(/^[^\[\.]*/)[0];
						if(parentId in alreadyRecorded){// if it has already been saved, we don't want to repeat it
							continue;
						}
						// record that we are saving
						object = alreadyRecorded[parentId] = Rest._index[parentId];
					}
					actions.push({method:"put",target:object,content:object});
				}

				data.push(object);
			}
			var xhrSendId;
			var plainXhr = dojo.xhr;
			left = actions.length;
			if(left){
				dojo.xhr = function(method,args){
					// keep the transaction open as we send requests
					args.headers = args.headers || {};
					args.headers['X-Transaction'] = "open";
					return plainXhr.apply(dojo,arguments);
				};
			}
			for(i =0; i < actions.length;i++){ // iterate through the actions to execute
				var action = actions[i];
				if(actions.length - 1 == i){
					// the last one should disconnect, so no transaction header is sent and thus commit the transaction
					dojo.xhr = plainXhr;
				}
				var dfd = Rest[action.method](action.target,action.content);
				dfd.addCallback(finishOne);
				dfd.addErrback(function(value){
					// on an error we want to revert, first we want to separate any changes that were made since the commit
					left = -1; // first make sure that success isn't called
					var postCommitDirtyObjects = dirtyObjects.splice(numDirty,dirtyObjects.length - numDirty);
					numDirty = 0; // make sure this does't do anything if it is called again
					self.revert(); // revert if there was an error
					dirtyObjects = postCommitDirtyObjects;
					if(kwArgs.onError){
						kwArgs.onError();
					}
				});
			}
			return actions;
		},
		getDirtyObjects: function(){
			return dirtyObjects;
		},
		revert: function(){
			// summary:
			//		Reverts all the changes made to JSON/REST data
			while (dirtyObjects.length>0){
				var d = dirtyObjects.pop();
				if(d.object && d.old){
					// changed
					for(var i in d.old){
						d.object[i] = d.old[i];
					}
					for(i in d.object){
						if(!d.old.hasOwnProperty(i)){
							delete d.object[i];
						}
					}
				}
			}
		},
		changing: function(object,_deleting){
			// summary:
			//		adds an object to the list of dirty objects.  This object
			//		contains a reference to the object itself as well as a
			//		cloned and trimmed version of old object for use with
			//		revert.
			if(!object.__id){
				return;
			}
			//if an object is already in the list of dirty objects, don't add it again
			//or it will overwrite the premodification data set.
			for(var i=0; i<dirtyObjects.length; i++){
				if(object==dirtyObjects[i].object){
					return;
				}
			}
			var old = object instanceof Array ? [] : {};
			for(i in object){
				if(object.hasOwnProperty(i)){
					old[i] = object[i];
				}
			}
			dirtyObjects.push({object: !_deleting && object, old: old});
		},
		deleteObject: function(object){
			// summary:
			//		deletes object any references to that object from the store.
			//
			//	object:
			//  	object to delete
			//

			//	If the desire is to delete only one reference, unsetAttribute or
			//	setValue is the way to go.
			var service= Rest.getServiceAndId(object.__id).service;
			for(var i = 0; i < service._rootQueries.length;i++){
				// delete the object from all the root queries
				var queryResult = service._rootQueries[i];
				for(var j = 0; j < queryResult.length;j++){
					if(queryResult[j]==object){
						queryResult.splice(j--,1); // remove the entry
					}
				}
			}

			this.changing(object,true);
		},
		getConstructor: function(/*Function|String*/service){
			// summary:
			// 		Creates or gets a constructor for objects from this service
			if(typeof service == 'string'){
				service = new dojox.rpc.Rest(service,true);
			}
			if(service._constructor){
				return service._constructor;
			}
			service._constructor = function(data){
				// summary:
				//		creates a new object for this table
				//
				//	data:
				//		object to mixed in
				dojo.mixin(this,data);
				Rest._index[this.__id = service.servicePath + (data[Rest.getIdAttribute(service)] = Math.random().toString(16).substring(2,14)+Math.random().toString(16).substring(2,14))] = this;
				dirtyObjects.push({object:this});
	//			this._getParent(parentInfo).push(data); // append to this list
				for(var i = 0; i < service._rootQueries.length;i++){
					// add the new item to all the root queries
					//TODO: If we create a mechanism to determine if the object belongs in this query, we could filter here
					service._rootQueries[i].push(this);
				}
			};
			return dojo.mixin(service._constructor, service._schema, {load:service});
		},
		fetch: function(absoluteId){
			// summary:
			//		Fetches a resource by an absolute path/id and returns a dojo.Deferred.
			var serviceAndId = Rest.getServiceAndId(absoluteId);
			return serviceAndId.service(serviceAndId.id);
		},
		isDirty: function(item){
			// summary
			//		returns true if the item is marked as dirty.
			for(var i = 0, l = dirtyObjects.length; i < l; i++){
				if(dirtyObjects[i]==item){return true;}
			}
			return false;
		}
	};
})();


