dojo.provide("dojox.io.xhrWindowNamePlugin");
dojo.require("dojox.io.xhrPlugins");
dojo.require("dojox.io.windowName");
dojo.require("dojox.io.httpParse");
dojo.require("dojox.secure.capability"); // would like to have a safe JSON verifier instead (more compact)

dojox.io.xhrWindowNamePlugin = function(/*String*/url, /*Boolean?*/asHttp){
	// summary:
	//		Adds the windowName transport as an XHR plugin for the given site. See
	//		dojox.io.windowName for more information on the transport.
	//	url:
	//		Url prefix of the site which can handle windowName requests.
	//	asHttp:
	//		Indicates whether the target site will be sending response as an HTTP
	//		message (vs a direct response). If this is not defined, it will attempt to
	//		auto-detect whether a message is HTTP
	dojox.io.xhrPlugins.register(
		"windowName",
		function(method,args){
			 return args.sync !== true && 
				(method == "GET" || method == "POST" /*|| allowHeadersAndMethodsInURLParameters*/) && 
				(args.url.substring(0,url.length) == url);
		},
		function(method,args){
			if(asHttp !== false){
				args = args || {};
				args.windowName = "http"; // let the server know we want http 
			}
			var dfd = dojox.io.windowName.send(method, args); // use the windowName transport
			dfd.addCallback(function(result){
				var ioArgs = dfd.ioArgs;
				ioArgs.xhr = (asHttp || 
					// if asHttp isn't defined, we will try to auto-detect if it is HTTP
					(asHttp !== false && result.match(/^HTTP\/\d\.\d \d\d\d[\w\s]*\n/))) ?
					// parse as HTTP and put the resultant XHR emulation into ioArgs.xhr 
					dfd.dojox.io.httpParse(result)[0] :
					// simple XHR emulation for direct windowName results  
					{responseText : result}; 
				// use the XHR content handlers for handling
				if(ioArgs.handleAs == 'json'){
					// use a secure json verifier, using object capability validator for now
					return dojox.secure.capability.validate(result,[],{}); 
				}
				return dojo._contentHandlers[ioArgs.handleAs || "text"](ioArgs.xhr); 
			});
			return dfd;
		}
	);
};