dojo.provide("dojox.socket.Reconnect");

dojox.socket.Reconnect = function(socket, options){
	// summary:
	//		Provides auto-reconnection to a websocket after it has been closed
	//	socket:
	//		Socket to add reconnection support to.
	// returns:
	// 		An object that implements the WebSocket API
	// example:
	//		You can use the Reconnect module:
	//		| dojo.require("dojox.socket");
	//		| dojo.require("dojox.socket.Reconnect");
	//		| var socket = dojox.socket({url:"/comet"});
	//		| // add auto-reconnect support
	//		| socket = dojox.socket.Reconnect(socket);
	options = options || {};
	var reconnectTime = options.reconnectTime || 10000;
	
	var connectHandle = dojo.connect(socket, "onclose", function(event){
		clearTimeout(checkForOpen);
		if(!event.wasClean){
			socket.disconnected(function(){
				newSocket = socket.reconnect();
				// make the original socket a proxy for the new socket 
				socket.send = dojo.hitch(newSocket, "send");
				socket.close = dojo.hitch(newSocket, "close");
				// redirect the events as well
				dojo.forEach(["message", "close", "error"], function(type){
					(newSocket.addEventListener || newSocket.on).call(newSocket, type, function(event){
						socket.dispatchEvent(event);
					});
				});
			});
	}
	});
	var checkForOpen, newSocket;
	if(!socket.disconnected){
		// add a default impl if it doesn't exist
		socket.disconnected = function(reconnect){
			setTimeout(function(){
				reconnect();
				checkForOpen = setTimeout(function(){
					//reset the backoff
					if(newSocket.readyState < 2){
						reconnectTime = options.reconnectTime || 10000;
					}
				}, 10000);
			}, reconnectTime);
			// backoff each time
			reconnectTime *= options.backoffRate || 2;
		};
	}
	if(!socket.reconnect){
		// add a default impl if it doesn't exist
		socket.reconnect = function(){
			return socket.args ?
				dojox.socket.LongPoll(socket.args) :
				dojox.socket(socket.URL);
		};
	}
	return socket;
};
