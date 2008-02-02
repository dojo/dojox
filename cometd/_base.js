dojo.provide("dojox.cometd._base");
dojo.require("dojo.AdapterRegistry");
dojo.require("dojo.io.script");


/*
 * this file defines Comet protocol client. Actual message transport is
 * deferred to one of several connection type implementations. The default is a
 * long-polling implementation. A single global object named "dojox.cometd" is
 * used to mediate for these connection types in order to provide a stable
 * interface.
 *
 * extensions modules may be loaded (eg "dojox.cometd.timestamp", that use
 * the cometd._extendInList and cometd._extendOutList fields to provide functions
 * that extend and handling incoming and outgoing messages.
 */

dojox.cometd = new function(){
	
	// cometd states:
 	this.DISCONNECTED="DISCONNECTED";	// _initialized==false 	&& _connected==false
 	this.CONNECTING="CONNECTING";		// _initialized==true	&& _connected==false (handshake sent)
 	this.CONNECTED="CONNECTED";		// _initialized==true	&& _connected==true (first successful connect)
 	this.DISCONNECTING="DISCONNECING";	// _initialized==false 	&& _connected==true (disconnect sent)
 	
	this._initialized = false;
	this._connected = false;
	this._polling = false;

	this.connectionTypes = new dojo.AdapterRegistry(true);

	this.version="1.0";
	this.minimumVersion="0.9";
	this.clientId=null;
	this.messageId=0;
	this.batch=0;

	this._isXD = false;
	this.handshakeReturn=null;
	this.currentTransport=null;
	this.url = null;
	this.lastMessage=null;
	this._messageQ=[];
	this.handleAs="json-comment-optional";
	this._advice={};
	this._maxInterval=30000;
	this._backoffInterval=1000;
	this._deferredSubscribes={};
	this._deferredUnsubscribes={};
	this._subscriptions=[];
	this._extendInList=[];	// List of functions invoked before delivering messages
	this._extendOutList=[];	// List of functions invoked before sending messages

	this.state = function() {
		return this._initialized?(this._connected?this.CONNECTED:this.CONNECTING):(this._connected?this.DISCONNECTING:this.DISCONNECTED);
	}

	this.init = function(	/*String*/	root,
				/*Object?*/ props,
				/*Object?*/ bargs){	// return: dojo.Deferred
		//	summary:
		//		Initialize the cometd implementation of the Bayeux protocol
		//	description:
		//		Initialize the cometd implementation of the Bayeux protocol by
		//		sending a handshake message. The cometd state will be changed to CONNECTING
		//		until a handshake response is received and the first successful connect message
		//		has returned.
		//		The protocol state changes may be monitored
		//		by subscribing to the dojo topic "/cometd/meta" where events are
		//		published in the form {cometd:this,action:"handshake",successful:true,state:this.state()}
		//	root:
		//		The URL of the cometd server. If the root is absolute, the host
		//		is examined to determine if xd transport is needed. Otherwise the
		//		same domain is assumed.
		//	props:
		//		An optional object that is used as the basis of the handshake message
		//	bargs:
		//		An optional object of bind args mixed in with the send of the handshake
		//	example:
		//	|	dojox.cometd.init("/cometd");
		//	|	dojox.cometd.init("http://xdHost/cometd",{ext:{user:"fred",pwd:"secret"}});


		// FIXME: if the root isn't from the same host, we should automatically
		// try to select an XD-capable transport
		props = props||{};
		// go ask the short bus server what we can support
		props.version = this.version;
		props.minimumVersion = this.minimumVersion;
		props.channel = "/meta/handshake";
		props.id = ""+this.messageId++;

		this.url = root||dojo.config["cometdRoot"];
		if(!this.url){
			console.debug("no cometd root specified in djConfig and no root passed");
			return null;
		}

		// Are we x-domain? borrowed from dojo.uri.Uri in lieu of fixed host and port properties
		var regexp = "^(([^:/?#]+):)?(//([^/?#]*))?([^?#]*)(\\?([^#]*))?(#(.*))?$";
		var parts = (""+window.location).match(new RegExp(regexp));
		if(parts[4]){
			var tmp = parts[4].split(":");
			var thisHost = tmp[0];
			var thisPort = tmp[1]||"80"; // FIXME: match 443

			parts = this.url.match(new RegExp(regexp));
			if(parts[4]){
				tmp = parts[4].split(":");
				var urlHost = tmp[0];
				var urlPort = tmp[1]||"80";
				this._isXD = ((urlHost != thisHost)||(urlPort != thisPort));
			}
		}

		if(!this._isXD){
			if(props.ext){
				if(props.ext["json-comment-filtered"]!==true && props.ext["json-comment-filtered"]!==false){
					props.ext["json-comment-filtered"] = true;
				}
			}else{
				props.ext = { "json-comment-filtered": true };
			}
			props.supportedConnectionTypes = dojo.map(this.connectionTypes.pairs, "return item[0]");
		}

		props = this._extendOut(props);

		var bindArgs = {
			url: this.url,
			handleAs: this.handleAs,
			content: { "message": dojo.toJson([props]) },
			load: dojo.hitch(this,function(msg){
				this._finishInit(msg);
			}),
			error: dojo.hitch(this,function(e){
				console.debug("handshake error!:",e);
				this._finishInit([{}]);
			})
		};

		if(bargs){
			dojo.mixin(bindArgs, bargs);
		}
		this._props = props;
		for(var tname in this._subscriptions){
			for(var sub in this._subscriptions[tname]){
				if(this._subscriptions[tname][sub].topic){
		 			dojo.unsubscribe(this._subscriptions[tname][sub].topic);
				}
			}
		}
		this._messageQ = [];
		this._subscriptions = [];
		this._initialized = true;
		this.batch = 0;
		this.startBatch();
		
		var r;
		// if xdomain, then we assume jsonp for handshake
		if(this._isXD){
			bindArgs.callbackParamName = "jsonp";
			r = dojo.io.script.get(bindArgs);
		}else{
			r = dojo.xhrPost(bindArgs);
		}
		dojo.publish("/cometd/meta", [{cometd:this,action:"handshake",successful:true,state:this.state()}]);
		return r;
	}
	
	
	this.publish = function(/*String*/ channel, /*Object*/ data, /*Object?*/ props){
		// summary:
		//		publishes the passed message to the cometd server for delivery
		//		on the specified topic
		// channel:
		//		the destination channel for the message
		// data:
		//		a JSON object containing the message "payload"
		// properties:
		//		Optional. Other meta-data to be mixed into the top-level of the
		//		message
		var message = {
			data: data,
			channel: channel
		};
		if(props){
			dojo.mixin(message, props);
		}
		this._sendMessage(message);
	}

	
	this.subscribe = function(	/*String */	channel,
					/*Object */	objOrFunc,
					/*String */	funcName,
					/*Object?*/ props){ // return: dojo.Deferred
		// summary:
		//		inform the server of this client's interest in channel
		// channel:
		//		name of the cometd channel to subscribe to
		// objOrFunc:
		//		an object scope for funcName or the name or reference to a
		//		function to be called when messages are delivered to the
		//		channel
		// funcName:
		//		the second half of the objOrFunc/funcName pair for identifying
		//		a callback function to notifiy upon channel message delivery

		props = props||{};
		if(objOrFunc){
			var tname = "/cometd"+channel;
			var subs = this._subscriptions[tname];
			if(!subs || subs.length==0){
				subs = [];
				props.channel = "/meta/subscribe";
				props.subscription = channel;
				this._sendMessage(props);
				
				var _ds = this._deferredSubscribes;
				_ds[channel] = new dojo.Deferred();
				if(_ds[channel]){
					_ds[channel].cancel();
					delete _ds[channel];
				}
			}
			
			for(var i in subs){
				if( subs[i].objOrFunc === objOrFunc && (!subs[i].funcName&&!funcName||subs[i].funcName==funcName) ){
					return null;
				}
			}
			
			var topic = dojo.subscribe(tname, objOrFunc, funcName);
			subs.push({ 
				topic: topic, 
				objOrFunc: objOrFunc, 
				funcName: funcName
			});
			this._subscriptions[tname] =subs;
		}
		return this._deferredSubscribes[channel];
	}



	this.unsubscribe = function(	/*String*/	channel,
					/*Object?*/ objOrFunc,
					/*String?*/ funcName,
					/*Object?*/ props){
		// summary:
		//		inform the server of this client's disinterest in channel
		// channel:
		//		name of the cometd channel to unsubscribe from
		// objOrFunc:
		//		an object scope for funcName or the name or reference to a
		//		function to be called when messages are delivered to the
		//		channel. If null then all subscribers to the channel are unsubscribed.
		// funcName:
		//		the second half of the objOrFunc/funcName pair for identifying
		//		a callback function to notifiy upon channel message delivery
		
		var tname = "/cometd"+channel;
		var subs = this._subscriptions[tname];
		if(!subs || subs.length==0){
			return null;
		}

		var s=0;
		for(var i in subs){
			var sb = subs[i];
			if( (!objOrFunc) ||
				(
					sb.objOrFunc===objOrFunc &&
					(!sb.funcName && !funcName || sb.funcName==funcName)
				)
			){
				dojo.unsubscribe(subs[i].topic);
				delete subs[i];
			}else{
				s++;
			}
		}
		
		if(s==0){
			props = props||{};
			props.channel = "/meta/subscribe";
			props.subscription = channel;
			delete this._subscriptions[tname];
			this._sendMessage(props);
			this._deferredUnsubscribes[channel] = new dojo.Deferred();
			if (this._deferredSubscribes[channel]){
				this._deferredSubscribes[channel].cancel();
				delete this._deferredSubscribes[channel];
			}
		}
		return this._deferredUnsubscribes[channel];
	}
	
	
	this.disconnect = function(){
		//	summary:
		//		Disconnect from the server.
		//	description:
		//		Disconnect from the server by sending a disconnect message
		//	example:
		//	|	dojox.cometd.disconnect();

		for(var tname in this._subscriptions){
			for(var sub in this._subscriptions[tname]){
				if(this._subscriptions[tname][sub].topic){
					dojo.unsubscribe(this._subscriptions[tname][sub].topic);
				}
			}
		}
		this._subscriptions = [];
		this._messageQ = [];
		if(this._initialized && this.currentTransport){
			this._initialized=false;
			this.currentTransport.disconnect();
		}
		if(!this._polling) {
			this._connected=false;
			dojo.publish("/cometd/meta", [{cometd:this,action:"connect",successful:false,state:this.state()}]);
		}
		this._initialized=false;
		dojo.publish("/cometd/meta", [{cometd:this,action:"disconnect",successful:true,state:this.state()}]);
	}

	
	// public extension points
	
	this.subscribed = function(	/*String*/channel, /*Object*/message){ }

	this.unsubscribed = function(/*String*/channel, /*Object*/message){ }


	// private methods (TODO name all with leading _)

	this.tunnelInit = function(childLocation, childDomain){
		// placeholder - replaced by _finishInit
	}
	
	this.tunnelCollapse = function(){
		// placeholder - replaced by _finishInit
	}
	
	this._backoff = function(){
		if(!this._advice || !this._advice.interval){
			this._advice={reconnect:"retry",interval:0}; // TODO Is this good advice?
		}
		if(this._advice.interval<this._maxInterval){
			this._advice.interval+=this._backoffInterval;
		}
	}

	this._finishInit = function(data){
		//	summary:
		//		Handle the handshake return from the server and initialize
		//		connection if all is OK
		console.debug("_finishInit():", data);
		// data = data.length ? data[0] : data;
		data = data[0];
		this.handshakeReturn = data;
		
		// remember any advice
		if(data["advice"]){
			this._advice = data.advice;
		}

		var successful=data.successful?data.successful:false;
		
		// check version
		if(data.version < this.minimumVersion){
			console.debug("cometd protocol version mismatch. We wanted", this.minimumVersion, "but got", data.version);
			successful=false;
			this._advice.reconnect="none";
		}
		
		// If all OK
		if(successful){
			// pick a transport
			this.currentTransport = this.connectionTypes.match(
				data.supportedConnectionTypes,
				data.version,
				this._isXD
			);
			// initialize the transport
			this.currentTransport._cometd = this;
			this.currentTransport.version = data.version;
			this.clientId = data.clientId;
			this.tunnelInit = dojo.hitch(this.currentTransport, "tunnelInit");
			this.tunnelCollapse = dojo.hitch(this.currentTransport, "tunnelCollapse");
			this.currentTransport.startup(data);
		}

		dojo.publish("/cometd/meta", [{cometd:this,action:"handshook",successful:successful,state:this.state()}]);

		// If there is a problem
		if(!successful){
			console.debug("cometd init failed");
			this._backoff();
			// follow advice
			if(this._advice && this._advice["reconnect"]=="none"){
				console.debug("cometd reconnect: none");
			}else if(this._advice && this._advice["interval"] && this._advice.interval>0 ){
				setTimeout(
					dojo.hitch(this, "init", this.url, this._props),
					this._advice.interval
				);
			}else{
				this.init(this.url,this._props);
			}
		}
	}

	// fixme: lots of repeated code...why?

	this._extendIn = function(message){
		// Handle extensions for inbound messages
		dojo.forEach(dojox.cometd._extendInList, function(f){
			message = f(message)||message;
		});
		return message;
	}

	this._extendOut = function(message){
		// Handle extensions for inbound messages
		dojo.forEach(dojox.cometd._extendOutList, function(f){
			message = f(message)||message;
		});
		return message;
	}


	this.deliver = function(messages){
		dojo.forEach(messages, this._deliver, this);
		return messages;
	}

	this._deliver = function(message){
		// dipatch events along the specified path
		
		message=this._extendIn(message);

		if(!message["channel"]){
			if(message["success"] !== true){
				console.debug("cometd error: no channel for message!", message);
				return;
			}
		}
		this.lastMessage = message;

		if(message.advice){
			this._advice = message.advice; // TODO maybe merge?
		}

		// check to see if we got a /meta channel message that we care about
		var deferred=null;
		if(	(message["channel"]) &&
			(message.channel.length > 5)&&
			(message.channel.substr(0, 5) == "/meta")){
			// check for various meta topic actions that we need to respond to
			switch(message.channel){
				case "/meta/connect":
					if(message.successful && !this._connected){
						this._connected = this._initialized;
						this.endBatch();
					}else if(!this._initialized){
						this._connected = false; // finish disconnect
					}
					dojo.publish("/cometd/meta",[{cometd:this,action:"connect",successful:message.successful,state:this.state()}]);
					break;
				case "/meta/subscribe":
					deferred = this._deferredSubscribes[message.subscription];
					if(!message.successful){
						if(deferred){
							deferred.errback(new Error(message.error));
						}
						return;
					}
					dojox.cometd.subscribed(message.subscription, message);
					if(deferred){
						deferred.callback(true);
					}
					break;
				case "/meta/unsubscribe":
					deferred = this._deferredUnsubscribes[message.subscription];
					if(!message.successful){
						if(deferred){
							deferred.errback(new Error(message.error));
						}
						return;
					}
					this.unsubscribed(message.subscription, message);
					if(deferred){
						deferred.callback(true);
					}
					break;
			}
		}
		
		// send the message down for processing by the transport
		this.currentTransport.deliver(message);

		if(message.data){
			// dispatch the message to any locally subscribed listeners
			try {
				var tname = "/cometd"+message.channel;
				dojo.publish(tname, [ message ]);
			}catch(e){
				console.debug(e);
			}
		}
	}

	this._sendMessage = function(/* object */ message){
		// console.debug(this.currentTransport, this._connected, this.batch);
		// if(this.currentTransport && this._connected && !this.batch){
		if(this.currentTransport && !this.batch){
			return this.currentTransport.sendMessages([message]);
		}else{
			this._messageQ.push(message);
			return null;
		}
	}

	this.startBatch = function(){
		this.batch++;
	}

	this.endBatch = function(){
		if(--this.batch <= 0 && this.currentTransport){ // && this._connected){
			this.batch=0;

			var messages=this._messageQ;
			this._messageQ=[];
			if(messages.length>0){
				this.currentTransport.sendMessages(messages);
			}
		}
	}
	
	this._onUnload = function(){
		// make this the last of the onUnload method
		dojo.addOnUnload(dojox.cometd,"disconnect");
	}
}

/*
transport objects MUST expose the following methods:
	- check
	- startup
	- sendMessages
	- deliver
	- disconnect
optional, standard but transport dependent methods are:
	- tunnelCollapse
	- tunnelInit

Transports SHOULD be namespaced under the cometd object and transports MUST
register themselves with cometd.connectionTypes

here's a stub transport defintion:

cometd.blahTransport = new function(){
	this._connectionType="my-polling";
	this._cometd=null;
	this.lastTimestamp = null;

	this.check = function(types, version, xdomain){
		// summary:
		//		determines whether or not this transport is suitable given a
		//		list of transport types that the server supports
		return dojo.lang.inArray(types, "blah");
	}

	this.startup = function(){
		if(dojox.cometd._polling){ return; }
		// FIXME: fill in startup routine here
		dojox.cometd._polling = true;
	}

	this.sendMessages = function(message){
		// FIXME: fill in message array sending logic
	}

	this.deliver = function(message){
	}

	this.disconnect = function(){
	}
}
cometd.connectionTypes.register("blah", cometd.blahTransport.check, cometd.blahTransport);
*/

dojox.cometd.longPollTransport = new function(){
	this._connectionType="long-polling";
	this._cometd=null;

	this.check = function(types, version, xdomain){
		return ((!xdomain)&&(dojo.indexOf(types, "long-polling") >= 0));
	}

	this.tunnelInit = function(){
		var message = {
			channel:	"/meta/connect",
			clientId:	this._cometd.clientId,
			connectionType: this._connectionType,
			id:	""+this._cometd.messageId++
		};
		message=this._cometd._extendOut(message);
		this.openTunnelWith({message: dojo.toJson([message])});
	}

	this.tunnelCollapse = function(){
		// TODO handle transport specific advice
		
		if(!this._cometd._initialized){ return; }
			
		if(this._cometd._advice){
			if(this._cometd._advice["reconnect"]=="none"){
				return;
			}
			if(	(this._cometd._advice["interval"])&&
				(this._cometd._advice.interval>0) ){
				setTimeout(dojo.hitch(this,function(){ this._connect(); }),this._cometd._advice.interval);
			}else{
				this._connect();
			}
		}else{
			this._connect();
		}
	}

	this._connect = function(){
		if(!this._cometd._initialized){ return; }
		if(this._cometd._polling) {
			console.debug("wait for poll to complete or fail");
			return;
		}
			
		if(	(this._cometd._advice) &&
			(this._cometd._advice["reconnect"]=="handshake")
		){
			this._cometd._connected=false;
			this._initialized = false;
			this._cometd.init(this._cometd.url,this._cometd._props);
 		}else if(this._cometd._connected){
			var message={
				channel:	"/meta/connect",
				connectionType: this._connectionType,
				clientId:	this._cometd.clientId,
				id:	""+this._cometd.messageId++
			};
			message=this._cometd._extendOut(message);
			this.openTunnelWith({message: dojo.toJson([message])});
		}
	}

	this.deliver = function(message){
		// Nothing to do
	}

	this.openTunnelWith = function(content, url){
		this._cometd._polling = true;
		var d = dojo.xhrPost({
			url: (url||this._cometd.url),
			content: content,
			handleAs: this._cometd.handleAs,
			load: dojo.hitch(this, function(data){
				this._cometd._polling = false;
				this._cometd.deliver(data);
				this.tunnelCollapse();
			}),
			error: dojo.hitch(this, function(err){
				this._cometd._polling = false;
				console.debug("tunnel opening failed:", err);
				dojo.publish("/cometd/meta", [{cometd:this._cometd,action:"connect",successful:false,state:this._cometd.state()}]);
				this._cometd._backoff();
				this.tunnelCollapse();
			})
		});
	}

	this.sendMessages = function(messages){
		for(var i=0; i<messages.length; i++){
			messages[i].clientId = this._cometd.clientId;
			messages[i].id = ""+this._cometd.messageId++;
			messages[i]=this._cometd._extendOut(messages[i]);
		}
		return dojo.xhrPost({
			url: this._cometd.url||dojo.config["cometdRoot"],
			handleAs: this._cometd.handleAs,
			load: dojo.hitch(this._cometd, "deliver"),
			content: {
				message: dojo.toJson(messages)
			}
		});
	}

	this.startup = function(handshakeData){
		if(this._cometd._connected){ return; }
		this.tunnelInit();
	}

	this.disconnect = function(){
		var message={
			channel:	"/meta/disconnect",
			clientId:	this._cometd.clientId,
			id:	""+this._cometd.messageId++
		};
		message=this._cometd._extendOut(message);
		dojo.xhrPost({
			url: this._cometd.url||dojo.config["cometdRoot"],
			handleAs: this._cometd.handleAs,
			content: {
				message: dojo.toJson([message])
			}
		});
	}
}

dojox.cometd.callbackPollTransport = new function(){
	this._connectionType = "callback-polling";
	this._cometd = null;

	this.check = function(types, version, xdomain){
		// we handle x-domain!
		return (dojo.indexOf(types, "callback-polling") >= 0);
	}

	this.tunnelInit = function(){
		var message = {
			channel:	"/meta/connect",
			clientId:	this._cometd.clientId,
			connectionType: this._connectionType,
			id:	""+this._cometd.messageId++
		};
		message = this._cometd._extendOut(message);		
		this.openTunnelWith({
			message: dojo.toJson([message])
		});
	}

	this.tunnelCollapse = dojox.cometd.longPollTransport.tunnelCollapse;
	this._connect = dojox.cometd.longPollTransport._connect;
	this.deliver = dojox.cometd.longPollTransport.deliver;

	this.openTunnelWith = function(content, url){
		this._cometd._polling = true;
		dojo.io.script.get({
			load: dojo.hitch(this, function(data){
				this._cometd._polling = false;
				this._cometd.deliver(data);
				this.tunnelCollapse();
			}),
			error: dojo.hitch(this, function(err){
				this._cometd._polling = false;
				console.debug("tunnel opening failed:", err);
				dojo.publish("/cometd/meta", [{cometd:this._cometd,action:"connect",successful:false,state:this._cometd.state()}]);
				this._cometd._backoff();
				this.tunnelCollapse();
			}),
			url: (url||this._cometd.url),
			content: content,
			callbackParamName: "jsonp"
		});
	}

	this.sendMessages = function(/*array*/ messages){
		for(var i=0; i<messages.length; i++){
			messages[i].clientId = this._cometd.clientId;
			messages[i].id = ""+this._cometd.messageId++;
			messages[i]=this._cometd._extendOut(messages[i]);
		}
		var bindArgs = {
			url: this._cometd.url||dojo.config["cometdRoot"],
			load: dojo.hitch(this._cometd, "deliver"),
			callbackParamName: "jsonp",
			content: { message: dojo.toJson( messages ) }
		};
		return dojo.io.script.get(bindArgs);
	}

	this.startup = function(handshakeData){
		if(this._cometd._connected){ return; }
		this.tunnelInit();
	}

	this.disconnect = dojox.cometd.longPollTransport.disconnect;
	
	this.disconnect = function(){
		var message={
			channel:"/meta/disconnect",
			clientId:this._cometd.clientId,
			id:""+this._cometd.messageId++
		};
		message=this._cometd._extendOut(message);		
		dojo.io.script.get({
			url: this._cometd.url||dojo.config["cometdRoot"],
			callbackParamName: "jsonp",
			content: {
				message: dojo.toJson([message])
			}
		});
	}
}
dojox.cometd.connectionTypes.register("long-polling", dojox.cometd.longPollTransport.check, dojox.cometd.longPollTransport);
dojox.cometd.connectionTypes.register("callback-polling", dojox.cometd.callbackPollTransport.check, dojox.cometd.callbackPollTransport);

dojo.addOnUnload(dojox.cometd,"_onUnload");
