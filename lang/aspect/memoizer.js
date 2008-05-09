dojo.provide("dojox.lang.aspect.memoizer");

(function(){
	var aop = dojox.lang.aspect;

	var reset = function(/*String|Array?*/ method){
		var that = aop.getContext().instance, t;
		if(!(t = that.__memoizerCache)){ return; }
		if(arguments.length == 0){
			delete that.__memoizerCache;
		}else if(dojo.isArray(method)){
			dojo.forEach(method, function(m){ delete t[m]; });
		}else{
			delete t[method];
		}
	};
	var memoize1 = {
		around: function(key){
			var ctx = aop.getContext(), self = ctx.joinPoint, that = ctx.instance, t, u, ret;
			if((t = that.__memoizerCache) && (t = t[self.targetName]) && (key in t)){
				return t[key];
			}
			var ret = aop.proceed.apply(null, arguments);
			if(!(t = that.__memoizerCache)){ t = that.__memoizerCache = {}; }
			if(!(u = t[self.targetName])){ u = t[self.targetName] = {}; }
			return u[key] = ret;
		},
		reset: reset
	};

	var memoizeN = function(/*Function*/keyMaker){
		return {
			around: function(/*arguments*/){
				var ctx = aop.getContext(), self = ctx.joinPoint, that = ctx.instance, t, u, ret,
					key  = keyMaker.apply(that, arguments);
				if((t = that.__memoizerCache) && (t = t[self.targetName]) && (key in t)){
					return t[key];
				}
				var ret = aop.proceed.apply(null, arguments);
				if(!(t = that.__memoizerCache)){ t = that.__memoizerCache = {}; }
				if(!(u = t[self.targetName])){ u = t[self.targetName] = {}; }
				return u[key] = ret;
			},
			reset: reset
		};
	};

	aop.memoizer = function(/*Function?*/ keyMaker){
		// summary:
		//		Returns an object, which can be used to count calls to methods.
		//
		// keyMaker:
		//		the function, which takes method's arguments and returns a key,
		//		which can be used to index the result.

		return arguments.length == 0 ? memoize1 : memoizeN(keyMaker);	// Object
	};
	aop.memoizer._reset = reset;
})();