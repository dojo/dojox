dojo.provide("dojox.data.S3Store");
dojo.require("dojox.rpc.ProxiedPath");
dojo.require("dojox.data.JsonRestStore");

// S3JsonRestStore is an extension of JsonRestStore to handle
// Amazon's S3 service using JSON data

dojo.declare("dojox.data.S3Store",
	dojox.data.JsonRestStore,
	{
		_processResults : function(results){
			// unfortunately, S3 returns query results in XML form
			var keyElements = results.getElementsByTagName("Key");
			var jsResults = [];
			var self = this;
			for(var i=0; i <keyElements.length;i++){
				var keyElement = keyElements[i];
				// manually create lazy loaded Deferred items for each item in the result array
				var val = new dojo.Deferred();
				(function(key,val){
					var connectId = dojo.connect(val,"addCallbacks",function(){
						// when a callback is added we will fetch it
						dojo.disconnect(connectId);
						self.service(key).addCallback(dojo.hitch(val,val.callback));
					});
				})(keyElement.firstChild.nodeValue,val);
				jsResults.push(val);
			}
			return {totalCount:jsResults.length, items: jsResults};
		}
	}
);
