dojo.provide("dojox.cometd.HttpChannels");
dojo.require("dojox.cometd.BaseChannels");
// Note that cometd _base is _not_ required, this can run standalone, but ifyou want 
// cometd functionality, you must explicitly load/require it elsewhere, and cometd._base
// MUST be loaded prior to HttpChannels ifyou use it.

// summary:
// 		HTTP Channels - An HTTP Based approach to Comet transport with full HTTP messaging 
// 		semantics including REST
// 		HTTP Channels is a efficient, reliable duplex transport for Comet

// description:
// 		This can be used:
// 		1. As a cometd transport
// 		2. As an enhancement for the REST RPC service, to enable "live" data (real-time updates directly alter the data in indexes)
// 		2a. With the JsonRestStore (which is driven by the REST RPC service), so this dojo.data has real-time data. Updates can be heard through the dojo.data notification API.
// 		3. As a standalone transport. To use it as a standalone transport looks like this:
// 	|		dojox.cometd.HttpChannels.open();
// 	|		dojox.cometd.HttpChannels.get("/myResource",{callback:function(){
// 	|			// this is called when the resource is first retrieved and any time the 
// 	|			// resource is changed in the future. This provides a means for retrieving a
// 	|			// resource and subscribing to it in a single request
// 	|		});
// 	|	dojox.cometd.HttpChannels.subscribe("/anotherResource",{callback:function(){
// 	|		// this is called when the resource is changed in the future
// 	|	});
// 		Channels HTTP can be configured to a different delays:
// 	|	dojox.cometd.HttpChannels.autoReconnectTime = 60000; // reconnect after one minute
//
	
dojox.cometd.HttpChannels = dojox.cometd.BaseChannels({
	_connectionType : "http-channels",
	acceptType : "application/http,*/*;q=0.8",
	publish : function(channel,data){
		// summary:
		//		Publish an event.
		// description:
		// 		This does a simple POST operation to the provided URL,
		// 		POST is the semantic equivalent of publishing a message within REST/Channels
		// channel:
		// 		Channel/resource path to publish to
		// data:
		//		data to publish
		headers={};
		dojo.rawXhrPost({
			url: channel,
			postData: dojo.toJson(data),
			headers:headers,
			contentType : 'application/json'
		});
	},
	
	_processMessage: function(message){
//		console.log("process message ",message);
		message.event = message.getResponseHeader('X-Event');
		if(message.event == "connection-conflict"){
			return "conflict"; // indicate an error
		}
		try{
			message.data = dojo.fromJson(message.responseText);
		}catch(e){ /* squelch */}

		var self = this;	
		message.channel = message.getResponseHeader('Content-Location');//for cometd
		var loc = new dojo._Url(location.href, message.channel); // TODO: more robust URL matching
		if(loc in this.subscriptions){
			this.subscriptions[loc] = message.getResponseHeader('Last-Modified'); 
		}
		if(this.subCallbacks[loc]){
			setTimeout(function(){ //give it it's own stack 
				self.subCallbacks[loc](message);
			},0);
		}
		this.receive(message);
		return null;		
	},
	
	onprogress : function(xhr,xdr,data,contentType){
		// internal XHR progress handler
		if(contentType.match(/application\/http/)){
			// do tunnel parsing
			var topHeaders = '';
			if(!xdr){
				// mixin/inherit headers from the container response
	    		topHeaders = xhr.getAllResponseHeaders();
			}
			while(data){
				var headers = {};
				var httpParts = data.match(/(\n*[^\n]+)/); // get the HTTP header line
				if(!httpParts){ 
					return null;
				}
				data = data.substring(httpParts[0].length+1); // move ahead in our parsing
				httpParts = httpParts[1];
				var headerParts = data.match(/([^\n]+\n)*/)[0]; // get the HTTP headers
				data = data.substring(headerParts.length+1);
				headerParts = topHeaders + headerParts;
				var headerStr = headerParts;
				headerParts = headerParts.match(/[^:\n]+:[^\n]+\n/g); // parse the containing and contained response headers with the contained taking precedence (by going last)
				for(var j = 0; j < headerParts.length; j++){
					var colonIndex = headerParts[j].indexOf(':');
					headers[headerParts[j].substring(0,colonIndex)] = headerParts[j].
							substring(colonIndex+1).replace(/(^[ \r\n]*)|([ \r\n]*)$/g,''); // trim
				}

				httpParts = httpParts.split(' ');
				var message = { // make it look like an xhr object, at least for the response part of the API
					status : parseInt(httpParts[1],10),
					statusText : httpParts[2],
					readyState : 4,
					getAllResponseHeaders : function(){ return headerStr; },
					getResponseHeader : function(name){ return headers[name]; }
				}; 
				
				var contentLength = headers['Content-Length']; 
				if(contentLength){
					if(contentLength <= data.length){
						message.responseText = data.substring(0,contentLength);
						data = data.substring(contentLength);
						this.lastIndex = xhr.responseText.length - data.length; // need to pick up from where we left on streaming connections
					}else{
						return null; // the response not finished
					}
				}else{// TODO: Need to check if the headers are complete before incrementing the last index
					this.lastIndex = xhr.responseText.length - data.length; // need to pick up from where we left on streaming connections
				}
				if(this._processMessage(message)){
					return "conflict";
				}
			}
			return null;
		}
		if(xhr.readyState != 4){ // we only want finished responses here if we are not streaming 
			return null;
		}
		
		if(xhr.__proto__){// firefox uses this property, so we create an instance to shadow this property
			xhr = { channel:"channel", __proto__:xhr };
		}
		return this._processMessage(xhr);
	
	}
});
