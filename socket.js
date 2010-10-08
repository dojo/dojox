dojo.provide("dojox.socket");

dojox.socket = function(/*dojo.__XhrArgs*/ argsOrUrl){
	// summary:
	//		Provides a simple socket connection using WebSocket, or alternate
	// 		communication mechanisms in legacy browsers for comet-style communication. This is based
	//		on the WebSocket API and returns an object that implements the WebSocket interface:
	//		http://dev.w3.org/html5/websockets/#websocket
	//	description:
	//		Provides socket connections. This can be used with virtually any Comet protocol. 
	//	argsOrUrl:
	//		This uses the same arguments as the other I/O functions in Dojo, or a 
	// 		URL to connect to. The URL should be a relative URL in order to properly
	//		work with WebSockets (it can still be host relative, like //other-site.org/endpoint)
	// returns:
	// 		An object that implements the WebSocket API
	// example:
	//		| dojo.require("dojox.socket");
	//		| var socket = dojox.socket({"//comet-server/comet");
	//		| // we could also add auto-reconnect support
	//		| // now we can connect to standard HTML5 WebSocket-style events
	//		| dojo.connect(socket, "onmessage", function(event){
	//		|    var message = event.data;
	//		|    // do something with the message
	//		| });
	//		| // send something
	//		| socket.send("hi there");
	//		| whenDone(function(){
	//		|   socket.close();
	//		| });
	//		You can also use the Reconnect module:
	//		| dojo.require("dojox.socket");
	//		| dojo.require("dojox.socket.Reconnect");
	//		| var socket = dojox.socket({url:"/comet"});
	//		| // add auto-reconnect support
	//		| socket = dojox.socket.Reconnect(socket);
	if(typeof argsOrUrl == "string"){
		argsOrUrl = {url: argsOrUrl};
	}
	return window.WebSocket ? dojox.socket.WebSocket(argsOrUrl) : dojox.socket.LongPoll(argsOrUrl);
};

dojox.socket.WebSocket = function(args){
	// summary:
	//		A wrapper for WebSocket, than handles standard args and relative URLs 
	return new WebSocket(new dojo._Url(document.baseURI.replace(/^http/i,'ws').toString(), args.url));
};

dojox.socket.LongPoll = function(/*dojo.__XhrArgs*/ args){
	// summary:
	//		Provides a simple long-poll based comet-style socket/connection to a server and returns an
	// 		object implementing the WebSocket interface:
	//		http://dev.w3.org/html5/websockets/#websocket
	//	args:
	//		This uses the same arguments as the other I/O functions in Dojo, with this addition:
	//	args.transport:
	//		Provide an alternate transport like dojo.io.script.get
	// returns:
	// 		An object that implements the WebSocket API
	// example:
	//		| dojo.require("dojox.socket.LongPoll");
	//		| var socket = dojox.socket.LongPoll({url:"/comet"});
	//		or:
	//		| dojo.require("dojox.socket.LongPoll");
	//		| dojox.socket.LongPoll.add();
	//		| var socket = dojox.socket({url:"/comet"});

var cancelled = false,
		first = true,
		transport = args.transport || dojo.xhrPost,
		connections = [];
	
	// create the socket object
	var socket = {
		send: function(data){
			// summary:
			// 		Send some data using XHR or provided transport
			args.postData = data;
			var deferred = first ? (first = false) || socket.firstRequest(args, transport) :
				transport(args);
			connections.push(deferred);
			deferred.then(function(response){
				// got a response
				// remove the current connection
				connections.splice(dojo.indexOf(connections, deferred), 1);
				// reconnect to listen for the next message if there are no active connections, 
				// we queue it up in case one of the onmessage handlers has a message to send
				if(!connections.length){
					setTimeout(connect);
				}
				if(response){
					// now send the message along to listeners
					fire("message", deferred, {data: response});
				}
			}, function(error){
				connections.splice(dojo.indexOf(connections, deferred), 1);
				// an error occurred, fire the appropriate event listeners
				if(!cancelled){
					fire("error", deferred, {error:error});
					if(!connections.length){
						fire("close", deferred, {wasClean:false});
					}
				}
			});
			return deferred;
		},
		close: function(){
			// summary:
			// 		Close the connection
			cancelled = true;
			for(var i = 0; i < connections.length; i++){
				connections[i].cancel();
			}
			fire("close", deferred, {wasClean:true});
		},
		firstRequest: function(args, transport){
			// summary:
			// 		This allows for special handling for the first request. This is useful for
			//		providing information to disambiguate between the first request and
			//		subsequent long-poll requests so the server can properly setup a 
			// 		connection on the first connection or reject a request for an expired 
			// 		connection if the request is not expecting to be the first for a connection.
			//		This method can be overriden. The default behavior is to include a Pragma
			//		header with a value of "start-long-poll"
			var headers = (args.headers || (args.headers = {}));
			headers.Pragma = "start-long-poll";
			try{
				return transport(args);
			}finally{
				// cleanup the header so it is not used on subsequent requests
				delete headers.Pragma;
			}
		}
	};
	function connect(){
		// make the long-poll connection, to wait for response from the server
		if(!connections.length){
			socket.send();
		}
	}
	function fire(event, deferred, object){
		if(socket["on" + event]){
			object.name = event;
			object.ioArgs = deferred && deferred.ioArgs;
			socket["on" + event](object);
		}
	}
	// do the initial connection
	setTimeout(connect);
	return socket;
};
