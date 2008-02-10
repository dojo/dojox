dojo.provide("dojox.rpc.Service");

dojo.declare("dojox.rpc.Service", null, {
	constructor: function(smd, options){
		//summary:
		//Take a string as a url to retrieve an smd or an object that is an smd or partial smd to use
		//as a definition for the service
		//
		//	smd: object
		//		Takes a number of properties as kwArgs for defining the service.  It also
		//		accepts a string.  When passed a string, it is treated as a url from
		//		which it should synchronously retrieve an smd file.  Otherwise it is a kwArgs
		//		object.  It accepts serviceUrl, to manually define a url for the rpc service
		//		allowing the rpc system to be used without an smd definition. strictArgChecks
		//		forces the system to verify that the # of arguments provided in a call
		//		matches those defined in the smd.  smdString allows a developer to pass
		//		a jsonString directly, which will be converted into an object or alternatively
		//		smdObject is accepts an smdObject directly.
		//				

		if(smd){
			//if the arg is a string, we assume it is a url to retrieve an smd definition from
			if( (dojo.isString(smd)) || (smd instanceof dojo._Url)){
				if (smd instanceof dojo._Url){
					var url = smd + "";
				}else{
					url = smd;
				}
				var def = dojo.xhrGet({
					url: url,
					handleAs: "json-comment-optional",
					sync: true
				});
				
				def.addCallback(this, "_processSmd");
				def.addErrback(function() {
					throw new Error("Unable to load SMD from " + smd);
				});
			}else{
				this._processSmd(smd);
			}
		}

		if (options) {this._options = options}
		this._requestId=0;
	},

	_processSmd: function(smd){
		this._smd = smd;

		//generate the methods
		for(var serviceName in this._smd.services){
			this[serviceName]=this._generateService(serviceName, this._smd.services[serviceName]);
		}
	},

	_generateService: function(serviceName, method){
		if(this[method]){
			throw new Error("WARNING: "+ serviceName+ " already exists for service. Unable to generate function");
		}
		method.name = serviceName;
		return dojo.hitch(this, "_executeMethod",method);
	},

	_executeMethod: function(){
		var method = arguments[0];

		var args = [];
		for (var i=1; i< arguments.length; i++){
			args.push(arguments[i]);
		}
		
		if ((args.length==1) && dojo.isObject(args[0])){
			args = args[0];
		}

		var envelope = method.envelope || this._smd.envelope || "NONE";
		var request = dojox.rpc.envelopes[envelope].serialize.apply(this, [this._smd, method, args, this._options]);
		var deferred = dojox.rpc.transports[request.transport].apply(this,[request]); 
		deferred.addBoth(this, dojox.rpc.envelopes[request.envelope].deserialize);
		return deferred;
	}
});

dojox.rpc.getTarget = function(smd, method){
	var dest="";
	if (smd.target){
		dest = smd.target;
	}
		
	if (method.target){
		if (method.target[0]=='/'){
			dest = method.target;
		}else{
			if (dest.length>0){
				dest += "/" + method.target;
			}else{
				dest = method.target;
			}
		}
	}
	return dest;
}

dojox.rpc.toNamed=function(method, args, strictParams){
	var i;
	if (!dojo.isArray(args)){
		if (strictParams) {
			//verify that all required parameters were supplied
			for (i=0; i<method.parameters.length;i++){
				if ((!method.parameters[i].optional) && (!args[method.parameters[i].name])){
					throw new Error("Optional Parameter '" + method.parameters[i].name + "' not supplied to " + method.name);
				}
			}

			//remove any properties that were not defined
			for (var x in args){
				var found=false;
				for(i=0; i<method.parameters.length;i++){
					if (method.parameters[i].name==x){found=true;}	
				}
				if(!found){
					delete args[x];
				}
			}			
		}
		return args;
	}

	var data={};
	for(i=0;i<method.parameters.length;i++){
		data[method.parameters[i].name]=args[i]
	}	
	return data;
}

dojox.rpc.toOrdered=function(method, args){
	if (dojo.isArray(args)){return args;}
	var data=[];
	for(var i=0;i<method.parameters.length;i++){
		data.push(args[method.parameters[i].name]);
	}	
	return data;
}

dojox.rpc.transports = {};
dojox.rpc.envelopes = {};

dojox.rpc.registerTransport = function (name, sendMethod){
	//summary
	//add a new transport type to the available transports for rpc services
	dojox.rpc.transports[name]=sendMethod;
}

dojox.rpc.registerEnvelope= function (name, serialize, deserialize){
	//summary
	//add a new envelope type to the available transports for rpc services
	dojox.rpc.envelopes[name]={
		serialize: serialize,
		deserialize: deserialize
	};
}
//Built In Envelopes

dojox.rpc.registerEnvelope(
	"URL",
	function(smd, method, data, options){ 
		var d = dojo.objectToQuery(dojox.rpc.toNamed(method, data, method.strictParameters||smd.strictParameters));
		var trans = method.transport || smd.transport || "POST";

		return {
			data: d,
			target: dojox.rpc.getTarget(smd, method),
			transport: trans,
			envelope: method.envelope || smd.envelope,
			timeout: method.timeout || smd.timeout,
			preventCache: method.preventCache || smd.preventCache,
			callbackParamName: method.callbackParamName || smd.callbackParamName,
		}
	},
	function(results){
		return results;
	}
);

dojox.rpc.registerEnvelope(
	"JSON",
	function(smd, method, data, options){ 
		var d = dojo.toJson(dojox.rpc.toNamed(method, data, method.strictParameters||smd.strictParameters));
		var trans = method.transport || smd.transport || "POST";

		return {
			data: d,
			target: dojox.rpc.getTarget(smd, method),
			transport: trans,
			envelope: method.envelope || smd.envelope,
			timeout: method.timeout || smd.timeout,
			preventCache: method.preventCache || smd.preventCache,
			callbackParamName: method.callbackParamName || smd.callbackParamName,
		}
	},
	function(results){
		return results;
	}
);



//post is registered first because it is the default;
dojox.rpc.registerTransport(
	"POST",
	function(r){
		console.log("TARGET: ", r.target);
		return dojo.rawXhrPost({
			url: r.target,
			postData: r.data,
			timeout: r.timeout,
			handleAs: "text"
		});
	}
);
/*
dojox.rpc.registerTransport(
	"RAW-POST",
	function(r){
		return dojo.rawXhrPost({
			url: r.target,
			postData: r.data,
			timeout: r.timeout,
			handleAs: "text"
		});
	}
);
*/

dojox.rpc.registerTransport(
	"GET",
	function(r){
		return dojo.xhrGet({
			url: r.target +'?'+  r.data,
			//content: r.data,
			timeout: r.timeout,
			handleAs: "text",
			preventCache: r.preventCache || true 	
		});
	}
);

//only works if you include dojo.io.script 
dojox.rpc.registerTransport(
	"JSONP",
	function(r){
		return dojo.io.script.get({
			url: r.target + ((r.target.indexOf("?") == -1) ? '?' : '&') + r.data,
			timeout: r.timeout,
			preventCache: r.preventCache || true, 
			callbackParamName: r.callbackParamName || "callback"
		});
	}
);
