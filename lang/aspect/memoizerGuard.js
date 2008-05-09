dojo.provide("dojox.lang.aspect.memoizerGuard");
dojo.require("dojox.lang.aspect.memoizer");

(function(){
	var aop = dojox.lang.aspect, reset = aop.memoizer._reset;

	aop.memoizerGuard = function(/*String|Array?*/ method){
		// summary:
		//		Invalidates cache (see dojox.lang.aspect.memoizer)
		//		after calling certain methods.
		//
		// method:
		//		Optional method's name to be guarded: only cache for
		//		this method will be invalidated on call. Can be a string
		//		or an array of method names. If omitted the whole cache
		//		will be invalidated.

		return {	// Object
			after: function(){ reset(method); }
		};
	};
})();