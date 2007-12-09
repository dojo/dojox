dojo.provide("dojox.lang.functional.adapter");

// This module adds high-level functions and related constructs:
//	- functional adapters

// Acknoledgements:
//	- parts of this module (constFun, invoke, pluck) are based on work by Oliver Steele 
//		(http://osteele.com/sources/javascript/functional/functional.js)
//		which was published under MIT License

dojo.mixin(dojox.lang.functional, {
	// functional adapters
	constFun: function(/*Object*/ x){
		// summary: returns a function, which produces a constant value 
		//	regardless of supplied parameters.
		return function(){ return x; };	// Function
	},
	invoke: function(/*String*/ m){
		// summary: returns a function, which invokes a method on supplied 
		//	object using optional parameters.
		return function(/*Object*/ o){	// Function
			return o[m].apply(o, Array.prototype.slice.call(arguments, 1));
		};
	},
	pluck: function(/*String*/ m){
		// summary: returns a function, which returns a named object member.
		return function(/*Object*/ o){	// Function
			return o[m];
		};
	}
});
