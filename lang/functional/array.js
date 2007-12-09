dojo.provide("dojox.lang.functional.array");

dojo.require("dojox.lang.functional.lambda");

// This module adds high-level functions and related constructs:
//	- array-processing functions similar to standard JS functions

// Notes:
//	- this module provides JS standard methods similar to high-level functions in dojo/_base/array.js: 
//		forEach, map, filter, every, some

// Defined methods:
//	- take any valid lambda argument as the functional argument
//	- operate on dense arrays
//	- take a string as the array argument

(function(){
	var d = dojo, df = dojox.lang.functional;

	d.mixin(df, {
		// JS 1.6 standard array functions, which can take a lambda as a parameter.
		// Consider using dojo._base.array functions, if you don't need the lambda support.
		filter: function(/*Array*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: creates a new array with all elements that pass the test 
			//	implemented by the provided function.
			a = typeof a == "string" ? a.split("") : a; o = o || d.global; f = df.lambda(f);
			var n = a.length, t = [], v;
			for(var i = 0; i < n; ++i){
				v = a[i];
				if(f.call(o, v, i, a)){ t.push(v); }
			}
			return t;	// Array
		},
		forEach: function(/*Array*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: executes a provided function once per array element.
			a = typeof a == "string" ? a.split("") : a; o = o || d.global; f = df.lambda(f);
			var n = a.length;
			for(var i = 0; i < n; f.call(o, a[i], i, a), ++i);
		},
		map: function(/*Array*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: creates a new array with the results of calling 
			//	a provided function on every element in this array.
			a = typeof a == "string" ? a.split("") : a; o = o || d.global; f = df.lambda(f);
			var n = a.length, t = new Array(n);
			for(var i = 0; i < n; t[i] = f.call(o, a[i], i, a), ++i);
			return t;	// Array
		},
		every: function(/*Array*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: tests whether all elements in the array pass the test 
			//	implemented by the provided function.
			a = typeof a == "string" ? a.split("") : a; o = o || d.global; f = df.lambda(f);
			var n = a.length;
			for(var i = 0; i < n; ++i){
				if(!f.call(o, a[i], i, a)){
					return false;	// Boolean
				}
			}
			return true;	// Boolean
		},
		some: function(/*Array*/ a, /*Function|String|Array*/ f, /*Object?*/ o){
			// summary: tests whether some element in the array passes the test 
			//	implemented by the provided function.
			a = typeof a == "string" ? a.split("") : a; o = o || d.global; f = df.lambda(f);
			var n = a.length;
			for(var i = 0; i < n; ++i){
				if(f.call(o, a[i], i, a)){
					return true;	// Boolean
				}
			}
			return false;	// Boolean
		}
	});
})();
