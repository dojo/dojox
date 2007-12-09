dojo.provide("dojox.lang.functional.reversed");

dojo.require("dojox.lang.functional.lambda");

// This module adds high-level functions and related constructs:
//	- reversed versions of array-processing functions similar to standard JS functions

// Notes:
//	- this module provides reversed versions of standard array-processing functions: 
//		forEachRev, mapRev, filterRev

// Defined methods:
//	- take any valid lambda argument as the functional argument
//	- operate on dense arrays
//	- take a string as the array argument

(function(){
	var d = dojo, df = dojox.lang.functional;

	d.mixin(df, {
		// JS 1.6 standard array functions, which can take a lambda as a parameter.
		// Consider using dojo._base.array functions, if you don't need the lambda support.
		filterRev: function(/*Array*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: creates a new array with all elements that pass the test 
			//	implemented by the provided function.
			a = typeof a == "string" ? a.split("") : a; o = o || d.global; f = df.lambda(f);
			var t = [], v;
			for(var i = a.length - 1; i >= 0; --i){
				v = a[i];
				if(f.call(o, v, i, a)){ t.push(v); }
			}
			return t;	// Array
		},
		forEachRev: function(/*Array*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: executes a provided function once per array element.
			a = typeof a == "string" ? a.split("") : a; o = o || d.global; f = df.lambda(f);
			for(var i = a.length - 1; i >= 0; f.call(o, a[i], i, a), --i);
		},
		mapRev: function(/*Array*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: creates a new array with the results of calling 
			//	a provided function on every element in this array.
			a = typeof a == "string" ? a.split("") : a; o = o || d.global; f = df.lambda(f);
			var n = a.length, t = new Array(n);
			for(var i = a.length - 1; i >= 0; t[i] = f.call(o, a[i], i, a), --i);
			return t;	// Array
		}
	});
})();
