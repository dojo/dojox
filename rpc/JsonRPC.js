dojo.provide("dojox.rpc.JsonRPC");

dojox.rpc.registerEnvelope(
	"JSON-RPC-1.0",
	function(smd, method, data, options){
		//not converted to json it self. This  will be done, if appropriate, at the 
		//transport level
                var trans = method.transport || smd.transport || "POST";
                var d = dojox.rpc.toOrdered(method, data);
		d = dojo.toJson({id: this._requestId++, method: method.name, params: d});

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
		var obj = dojo.fromJson(results);
		if (obj.error) {
			var e = new Error(obj.error);
			e._rpcErrorObject = obj.error;
			return e;
		}
		return obj.result || true;
	}
);

dojox.rpc.registerEnvelope(
	"JSON-RPC-1.2",
	function(smd, method, data, options){
                var trans = method.transport || smd.transport || "POST";
                var d = dojox.rpc.toNamed(method, data);

		d = dojo.toJson({id: this._requestId++, method: method.name, params: data});
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
		console.log("results: ", results);
		var obj = dojo.fromJson(results);
		if (obj.error) {
			var e = new Error(obj.error.message);
			e._rpcErrorObject = obj.error;
			return e;
		}
		return obj.result || true;
	}
);
