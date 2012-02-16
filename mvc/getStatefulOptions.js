define([
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/Stateful",
	"./getStateful",
	"./StatefulArray"
], function(darray, lang, Stateful, getStateful, StatefulArray){
	return {
		// summary:
		//		Options used for dojox.mvc.getStateful().

		getType: function(/*Anything*/ v){
			// summary:
			//		Returns the type of the given value.
			// v: Anything
			//		The value.

			return lang.isArray(v) ? "array" : {}.toString.call(v) == "[object Object]" ? "object" : "value";
		},

		getStatefulArray: function(/*Anything[]*/ a){
			// summary:
			//		Returns the stateful version of the given array.
			// a: Anything[]
			//		The array.

			return new StatefulArray(darray.map(a, function(item){ return getStateful(item, this); }, this)); // dojox.mvc.StatefulArray
		},

		getStatefulObject: function(/*Object*/ o){
			// summary:
			//		Returns the stateful version of the given object.
			// o: Object
			//		The object.

			var stateful = new Stateful();
			for(var s in o){
				stateful[s] = getStateful(o[s], this);
			}
			return stateful; // dojo.Stateful
		},

		getStatefulValue: function(/*Anything*/ v){
			// summary:
			//		Just returns the given value.

			return v; // Anything
		}
	};
});
