dojo.provide("dojox.lang.functional.fold");

dojo.require("dojox.lang.functional.lambda");

// This module adds high-level functions and related constructs:
//	- "fold" family of functions

// Notes:
//	- missing high-level functions are provided with the compatible API: 
//		foldl, foldl1, foldr, foldr1
//	- missing JS standard functions are provided with the compatible API: 
//		reduce, reduceRight

// Defined methods:
//	- take any valid lambda argument as the functional argument
//	- operate on dense arrays
//	- take a string as the array argument

(function(){
	var d = dojo, df = dojox.lang.functional;

	d.mixin(df, {
		// classic reduce-class functions
		foldl: function(/*Array*/ a, /*Function*/ f, /*Object*/ z, /*Object?*/ o){
			// summary: repeatedly applies a binary function to an array from left 
			//	to right using a seed value as a starting point; returns the final 
			//	value.
			a = typeof a == "string" ? a.split("") : a; o = o || d.global; f = df.lambda(f);
			for(var i = 0; i < a.length; z = f.call(o, z, a[i], i, a), ++i);
			return z;	// Object
		},
		foldl1: function(/*Array*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: repeatedly applies a binary function to an array from left 
			//	to right; returns the final value.
			a = typeof a == "string" ? a.split("") : a; o = o || d.global; f = df.lambda(f);
			var z = a[0];
			for(var i = 1; i < a.length; z = f.call(o, z, a[i], i, a), ++i);
			return z;	// Object
		},
		foldr: function(/*Array*/ a, /*Function|String|Array*/ f, /*Object*/ z, /*Object?*/ o){
			// summary: repeatedly applies a binary function to an array from right
			//	to left using a seed value as a starting point; returns the final 
			//	value.
			a = typeof a == "string" ? a.split("") : a; o = o || d.global; f = df.lambda(f);
			for(var i = a.length; i > 0; --i, z = f.call(o, z, a[i], i, a));
			return z;	// Object
		},
		foldr1: function(/*Array*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: repeatedly applies a binary function to an array from right
			//	to left; returns the final value.
			a = typeof a == "string" ? a.split("") : a; o = o || d.global; f = df.lambda(f);
			var n = a.length, z = a[n - 1];
			for(var i = n - 1; i > 0; --i, z = f.call(o, z, a[i], i, a));
			return z;	// Object
		},
		// JS 1.8 standard array functions, which can take a lambda as a parameter.
		reduce: function(/*Array*/ a, /*Function*/ f, /*Object?*/ z){
			// summary: apply a function simultaneously against two values of the array 
			//	(from left-to-right) as to reduce it to a single value.
			return arguments.length < 3 ? df.foldl1(a, f) : df.foldl(a, f, z);	// Object
		},
		reduceRight: function(/*Array*/ a, /*Function*/ f, /*Object?*/ z){
			// summary: apply a function simultaneously against two values of the array 
			//	(from right-to-left) as to reduce it to a single value.
			return arguments.length < 3 ? df.foldr1(a, f) : df.foldr(a, f, z);	// Object
		}
	});
})();
