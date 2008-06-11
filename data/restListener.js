dojo.provide("dojox.data.restListener");
dojo.require("dojox.rpc.Rest");

dojox.data.restListener = function(message){
	// Summary
	// this function can be used to receive REST notifications, from Comet or from another frame
	// Example usage:
	// dojo.connect(window,"onMessage",null,function(event) {
	//		var data = dojo.fromJson(event.data);
	// 		dojox.restListener(data);
	//	});
	var channel = message.channel;
	var service = dojox.rpc.Rest.getServiceAndId(channel).service;
	var result = service.cache.intake(message.data, message.event == 'put' && channel);
	var target = dojox.rpc.Rest._index && dojox.rpc.Rest._index[channel];
	var onEvent = 'on' + message.event.toLowerCase();
	var store = service && service._store;
	if(target){
		if(target[onEvent]){
			target[onEvent](result); // call the REST handler if available
			return;
		}
	}
	// this is how we respond to different events
	if(store){
		switch(onEvent){
			case 'onpost':
				store.onNew(result); // call onNew for the store;
				break;
			case 'ondelete':
		 		store.onDelete(target);
		 		break;
				 	// put is handled by JsonReferencing
				 	//TODO: we may want to bring the JsonReferencing capability into here...
				 	// that is really tricky though because JsonReferencing handles sub object,
				 	// it would be expensive to do full object graph searches from here
		}
	}
};
