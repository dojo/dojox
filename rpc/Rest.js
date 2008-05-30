dojo.provide("dojox.rpc.Rest");
// summary:
// 		This provides a HTTP REST service with full range REST verbs include PUT,POST, and DELETE.
// description:
// 		A normal GET query is done by using the service directly:
// 		| var restService = dojox.rpc.Rest("Project");
// 		| restService("4");
//		This will do a GET for the URL "/Project/4".
//		| restService.put("4","new content");
//		This will do a PUT to the URL "/Project/4" with the content of "new content".
//		You can also use the SMD service to generate a REST service:
// 		| var services = dojox.rpc.Service({services: {myRestService: {transport: "REST",...
// 		| services.myRestService("parameters");
//
// 		The modifying methods can be called as sub-methods of the rest service method like:
//  	| services.myRestService.put("parameters","data to put in resource");
//  	| services.myRestService.post("parameters","data to post to the resource");
//  	| services.myRestService['delete']("parameters");
(function(){
	if(dojox.rpc && dojox.rpc.transportRegistry){
		// register it as an RPC service if the registry is available
		dojox.rpc.transportRegistry.register(
			"REST",
			function(str){return str == "REST";},
			{
				getExecutor : function(func,method,svc){
					return new dojox.rpc.Rest(
						method.name,
						(method.contentType||svc._smd.contentType||"").match(/json|javascript/), // isJson
						function(id){
							var request = svc._getRequest(method,[id]);
							request.url= request.target + (request.data ? '?'+  request.data : '');
							return request;
						}
					);
				}
			}
		);
	}
	var drr, start, end, dontCache;

	function index(deferred, service, range, id){
		deferred.addCallback(function(result){
			if(id==""){
				service._rootQueries.push(result);
			}
			if(range){
				// try to record the total number of items from the range header
				var range = deferred.ioArgs.xhr.getResponseHeader("Content-Range");
				deferred.fullLength = range && (range=range.match(/\/(.*)/)) && parseInt(range[1]);
			}
			return service.cache.intake(result,service._schema,id);
		});
		return deferred;
	}
	drr = dojox.rpc.Rest = function(/*String*/name, /*Boolean*/isJson, /*Function?*/getRequest){
		var service;
		// it should be in the form /Table/
		name = (name.charAt(0)!='/'?'/':'') + name + (name.charAt(name.length-1)!='/'?'/':'');
		// the default XHR args creator:
		service = function(id){
			// if caching is allowed, we look in the cache for the result
			var result = !dontCache && drr._index[(service.servicePath || '') + id];
			dontCache=0; // reset it
			if(result){// cache hit
				var dfd = new dojo.Deferred();
				dfd.callback(result);
				return dfd;
			}
			return drr._get(service,id);
		};
		service.isJson = isJson;
		// cache:
		//		This is an object that provides indexing service
		// 		This can be overriden to take advantage of more complex referencing/indexing
		// 		schemes
		service.cache = {
			intake:function(result,schema,id){
				// use json referencing if possible to do indexing when it is a JSON Rest service
				if(isJson && dojox.json && dojox.json.ref && result){
					return dojox.json.ref.resolveJson(result,result instanceof Array ? {items:service._schema} : schema,id);
				}
				drr._index.onLoad && drr._index.onLoad(result,id);
				drr._index[(schema._idPrefix || '') + id] = result;
				return result;
			},
			serialize:function(result){
				return isJson ? ((dojox.json && dojox.json.ref) || dojo).toJson(result) : result;
			}
		};
		service._rootQueries = [];// this is used by JsonRest and the stores
		// This is the default REST handler, you can of course define your own as a parameter
		service._getRequest = getRequest || function(id){
			return {url: name+id, handleAs: isJson?'json':'text', sync: dojox.rpc._sync};
		};
		// each calls the event handler
		function makeRest(name){
			service[name] = function(id,content){
				return drr._change(name,service,id,content && service.cache.serialize(content,false,service._schema),content); // the last parameter is to let the OfflineRest know where to store the item
			};
		}
		makeRest('put');
		makeRest('post');
		makeRest('delete');
		// record the REST services for later lookup
		dojox.rpc.services = dojox.rpc.services || {};
		dojox.rpc.services[name] = service;
		service.servicePath=name;
		return service;
	};
	function restMethod(name){
		// summary:
		// 		create a REST method for the given name
		drr[name] = function(target,content){
			// parse the id to find the service and the id to use
			var parts = target.__id.match(/(\/.+\/)(.*)/);
			// find the service and call it
			var service = dojox.rpc.services[parts[1]] || new dojox.rpc.Rest(parts[1]); // use an existing or create one
			// // TODO: could go directly to the event handlers
			return name == 'get' ? service(parts[2],content) : service[name](parts[2],content);
		};
	}
	restMethod("get");
	restMethod("put");
	restMethod("post");
	restMethod("delete");
	drr._index={};// the map of all indexed objects that have gone through REST processing
	// these do the actual requests
	drr._change = function(method,service,id,content){
		// this is called to actually do the put, post, and delete
		var request = service._getRequest(id);
		request[method+"Data"] = content;
		return index(dojo.xhr(method.toUpperCase(),request,true),service);
	};
	drr.getServiceAndId = function(/*String*/absoluteId){
		// summary:
		//		This gets the REST service for the given absolute id
		var parts = absoluteId.match(/(\/.+\/)(.*)/);
		var svc = dojox.rpc.services[parts[1]] || new dojox.rpc.Rest(parts[1]); // use an existing or create one
		return { service: svc, id:parts[2] };
	};
	drr.setQueryInfo = function(/*Object*/args){
		// summary:
		//		Sets extra meta-information prior to a query, to assist in querying
		//	args:
		//		The extra query information
		//	The *start* parameter.
		//		The starting index of the query
		//	The *end* parameter
		//		The ending index of the query
		//	The *dontCache* parameter
		//		This prevents the REST service from looking in it's own cache
		start = args.start;
		end = args.end;
		dontCache = args.dontCache;
	};
	drr._get= function(service,id){
		var req = dojo.mixin(service._getRequest(id), {
			headers: {
				Range: (start >= 0 || end >= 0) ?  "items=" + (start || '') + '-' + (end || '') : undefined
			}
		});
		// this is called to actually do the get
		var dfd = index(dojo.xhrGet(req), service, (start >= 0 || end >= 0), id);
		start = -1; // reset them
		end = -1;
		return dfd;
	};
})();
