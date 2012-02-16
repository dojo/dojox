define([
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/Stateful",
	"./getPlainValue"
], function(darray, lang, Stateful, getPlainValue){
	return {
		// summary:
		//		Options used for dojox.mvc.getPlainValue().

		getType: function(/*Anything*/ v){
			// summary:
			//		Returns the type of the given value.
			// v: Anything
			//		The value.

			return lang.isArray(v) ? "array" : v.isInstanceOf && v.isInstanceOf(Stateful) || {}.toString.call(v) == "[object Object]" ? "object" : "value";
		},

		getPlainArray: function(/*Anything[]*/ a){
			// summary:
			//		Returns the stateful version of the given array.
			// a: Anything[]
			//		The array.

			return darray.map(a, function(item){ return getPlainValue(item, this); }, this); // Anything[]
		},

		getPlainObject: function(/*Object*/ o){
			// summary:
			//		Returns the stateful version of the given object.
			// o: Object
			//		The object.

			var plain = {};
			for(var s in o){
				if(!(s in Stateful.prototype) && s != "_watchCallbacks"){
					plain[s] = getPlainValue(o[s], this);
				}
			}
			return plain; // Object
		},

		getPlainValue: function(/*Anything*/ v){
			// summary:
			//		Just returns the given value.

			return v; // Anything
		}
	};
});
