dojo.provide("dojox.io.xhrPlugins");

dojo.require("dojo._base.xhr");
(function() {
	var registry;
	var plainXhr;
	dojox.io.xhrPlugins.register = function(){
		//	summary:
		// 		overrides the default xhr handler to implement a registry of
		// 		xhr handlers
		if(!registry){
			registry = new dojo.AdapterRegistry();
			plainXhr = dojox.io.xhrPlugins.plainXhr = dojo.xhr;
			// replaces the default xhr() method. Can we just use connect() instead?
			dojo.xhr = function(/*String*/ method, /*dojo.__XhrArgs*/ args, /*Boolean?*/ hasBody){
				return registry.match.apply(registry,arguments);						
			}
			registry.register(
				"xhr",
				function(method,args){ 
					if(!args.url.match(/^\w*:\/\//)){
						// if it is not an absolute url (or relative to the
						// protocol) we can use this plain XHR
						return true;
					}
					var root = window.location.href.match(/^.*?\/\/.*?\//)[0];
					return args.url.substring(0, root.length) == root; // or check to see if we have the same path
				},
				plainXhr
			);
		}
		return registry.register.apply(registry, arguments);
	}
	dojox.io.xhrPlugins.addProxy = function(proxyUrl){
		//	summary:
		//		adds a server side proxy xhr handler for cross-site URLs
		//	proxyUrl:
		//		This is URL to send the requests to.
		//	example:
		//		Define a proxy:
		//	|	dojox.io.xhrPlugins.addProxy("/proxy?url=");
		// 		And then when you call:
		//	|	dojo.xhr("GET",{url:"http://othersite.com/file"});
		// 		It would result in the request (to your origin server):
		//	|	GET /proxy?url=http%3A%2F%2Fothersite.com%2Ffile HTTP/1.1
		
		dojox.io.xhrPlugins.register(
			"proxy",
			function(method,args){
				// this will match on URL

				// really can be used for anything, but plain XHR will take
				// precedent by order of loading 
				return true; 
			},
			function(method, args, hasBody){
				args.url = proxyUrl + encodeURIComponent(args.url);
				return plainXhr.call(dojo, method, args, hasBody);
			});
	}
	dojox.io.xhrPlugins.addCrossSiteXhr = function(url){
		//	summary:
		// 		adds Cross site XHR handling for the given URL prefix This can
		// 		be used for servers that support W3C cross-site XHR. In order
		// 		for a server to allow a client to make cross-site XHR requests, 
		// 		it should respond with the header like:
		//	|	Access-Control: allow <*>
		//		see: http://www.w3.org/TR/access-control/
		
		dojox.io.xhrPlugins.register(
			"xhr",
			function(method,args){ 
				// the best clue I can think of is the presence of JS1.9 as an indicator for cross-site XHR support
				return Object.defineProperty && (args.url.substring(0,url.length) == url);
			},
			plainXhr
		);
	}
})();

dojox.io.xhrPlugins.addXdr = function(url){
	//	summary:
	//		adds XDomainRequest handling for the given URL prefix This can be
	//		used for servers that support XDomainRequest.
	//	description:
	//		In order for a server to support XDomainRequest, when it receives a
	//		request with a XDomainRequest header it should respond with the
	//		header:
	//	|	XDomainRequestAllowed: 1
	//		For example if you call:
	//	|	dojox.io.xhrPlugins.addXdr("http://microsoftlovers.com/")
	// 		Then all requests to microsoftlovers.com would use XDomainRequest
	
	dojox.io.xhrPlugins.register(
		"xdr",
		function(method,args){
			return (
				window.XDomainRequest && 
				args.sync !== true && 
				(method == "GET" || method == "POST" /*|| args.allowMethodInArgs*/) && 
				(args.url.substring(0,url.length) == url)
			);
		},
		function(){
			// TODO: may want to support putting methods in the URL
			var normalXhrObj = dojo._xhrObj;
			// we will just substitute this in temporarily so we can use XDomainRequest instead of XMLHttpRequest
			dojo._xhrObj = function(){
				var xdr = new XDomainRequest();
				xdr.readyState = 1;
				xdr.setRequestHeader = function(){}; // just absorb them, we can't set headers :/
				xdr.getResponseHeader = function(header){ // this is the only header we can access 
					return header == "Content-Type" ? xdr.contentType : null;
				}
				// adapt the xdr handlers to xhr
				function handler(status, readyState){
					return function(){
						xdr.readyState = readyState;
						xdr.status = status;
					}
				}
				xdr.onload = handler(200, 4);
				xdr.onprogress = handler(200, 3);
				xdr.onerror = handler(500, 4); // an error, who knows what the real status is
			};
			var dfd = plainXhr.apply(dojo,arguments);
			dojo._xhrObj = normalXhrObj;
			return dfd; 
		}
	);
}

