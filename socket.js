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

	var deferred, cancelled = false, transport = args.transport || dojo.xhrPost;
	// create the socket object
	var socket = {
		send: function(data){
			// send some data, just using another XHR request
			args.postData = data;
			return transport(args).then(null, onError);
		},
		close: function(){
			// close the connection
			cancelled = true;
			deferred.cancel();
		}
	};
	function connect(){
		// make the long-poll connection, to wait for response from the server
		deferred = transport(args);
		deferred.then(function(response){
			// got a response, reconnect right away, to listen for the next message
			connect();
			// now send the message along to listeners
			setTimeout(function(){
				if(socket.onmessage){
					socket.onmessage({
						name: "message",
						data: response,
						ioArgs: deferred.ioArgs
					});
				}
			});
		}, function(error){
			// an error occurred, fire the appropriate event listeners
			if(socket.onerror && !cancelled){
				socket.onerror({
					name: "error",
					error: error,
					ioArgs: deferred.ioArgs
				});
			}
			if(socket && socket.onclose){
				socket.onclose({
					name: "close",
					wasClean: cancelled,
					ioArgs: deferred.ioArgs
				});
			}
		});
	}
	// do the initial connection
	connect();
	return socket;
};
