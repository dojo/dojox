dojo.provide("dojox.lang.functional.scan");

dojo.require("dojox.lang.functional.lambda");

// This module adds high-level functions and related constructs:
//	- "scan" family of functions

// Notes:
//	- missing high-level functions are provided with the compatible API: 
//		scanl, scanl1, scanr, scanr1

// Defined methods:
//	- take any valid lambda argument as the functional argument
//	- operate on dense arrays
//	- take a string as the array argument

(function(){
	var d = dojo, df = dojox.lang.functional;

	d.mixin(df, {
		// classic reduce-class functions
		scanl: function(/*Array*/ a, /*Function|String|Array*/ f, /*Object*/ z, /*Object?*/ o){
			// summary: repeatedly applies a binary function to an array from left 
			//	to right using a seed value as a starting point; returns an array
			//	of values produced by foldl() at that point.
			a = typeof a == "string" ? a.split("") : a; o = o || d.global; f = df.lambda(f);
			var n = a.length, t = new Array(n + 1);
			t[0] = z;
			for(var i = 0; i < n; z = f.call(o, z, a[i], i, a), t[++i] = z);
			return t;	// Array
		},
		scanl1: function(/*Array*/ a, /*Function|String|Array*/ f, /*Object*/ z, /*Object?*/ o){
			// summary: repeatedly applies a binary function to an array from left 
			//	to right; returns an array of values produced by foldl1() at that 
			//	point.
			a = typeof a == "string" ? a.split("") : a; o = o || d.global; f = df.lambda(f);
			var n = a.length, t = new Array(n), z = a[0];
			t[0] = z;
			for(var i = 1; i < n; z = f.call(o, z, a[i], i, a), t[i++] = z);
			return t;	// Array
		},
		scanr: function(/*Array*/ a, /*Function|String|Array*/ f, /*Object*/ z, /*Object?*/ o){
			// summary: repeatedly applies a binary function to an array from right
			//	to left using a seed value as a starting point; returns an array
			//	of values produced by foldr() at that point.
			a = typeof a == "string" ? a.split("") : a; o = o || d.global; f = df.lambda(f);
			var n = a.length, t = new Array(n + 1);
			t[n] = z;
			for(var i = n; i > 0; --i, z = f.call(o, z, a[i], i, a), t[i] = z);
			return t;	// Array
		},
		scanr1: function(/*Array*/ a, /*Function|String|Array*/ f, /*Object*/ z, /*Object?*/ o){
			// summary: repeatedly applies a binary function to an array from right
			//	to left; returns an array of values produced by foldr1() at that 
			//	point.
			a = typeof a == "string" ? a.split("") : a; o = o || d.global; f = df.lambda(f);
			var n = a.length, t = new Array(n), z = a[n - 1];
			t[n - 1] = z;
			for(var i = n - 1; i > 0; --i, z = f.call(o, z, a[i], i, a), t[i] = z);
			return t;	// Array
		}
	});
})();
