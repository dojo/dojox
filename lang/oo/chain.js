dojo.provide("dojox.lang.oo.chain");

dojo.require("dojox.lang.oo.Decorator");

(function(){
	var oo = dojox.lang.oo, md = oo.makeDecorator, ooc = oo.chain,

	// decorator functions used for chaining

	cb = ooc._before = function(name, newValue, oldValue){
		//	summary:
		//		creates a chain of calls where the new method is called
		//		before the old method
		return typeof oldValue == "function" ?
			function(){
				newValue.apply(this, arguments);
				return oldValue.apply(this, arguments);
			} : newValue;
	},

	ca = ooc._after = function(name, newValue, oldValue){
		//	summary:
		//		creates a chain of calls where the new method is called
		//		after the old method
		return typeof oldValue == "function" ?
			function(){
				oldValue.apply(this, arguments);
				return newValue.apply(this, arguments);
			} : newValue;
	};

	// two standard decorators for method chaining

	/*=====
	ooc.before = md(function(name, newValue, oldValue){
		// summary: chains new function before the old one

		// dummy body
	});

	ooc.after = md(function(name, newValue, oldValue){
		// summary: chains new function after the old one

		// dummy body
	});
	=====*/

	ooc.before = md(cb);
	ooc.after  = md(ca);
})();
