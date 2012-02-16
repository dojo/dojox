define(["dojo/_base/lang"], function(lang){
	/*=====
	dojox.mvc.getStatefulOptions = {
		// summary:
		//		An object that defines how model object should be created from plain object hierarchy.

		getType: function(v){
			// summary:
			//		Returns the type of the given value.
			// v: Anything
			//		The value.

			return "value"; // String
		},

		getStatefulType: function(v){
			// summary:
			//		Creates a stateful value from a plain value.
			//		The "Type" in this function name is actually what getType() returns, with first character uppercased, such as: getStatefulArray, getStatefulObject, getStatefulValue.
			// v: Anything
			//		The plain value.

			return v; // Anything
		}
	};
	=====*/

	var getStateful = /*===== dojox.mvc.getStateful = =====*/ function(/*Anything*/ value, /*dojox.mvc.getStatefulOptions*/ options){
		// summary:
		//		Create a dojo.Stateful object from a raw value.
		// description:
		//		Recursively iterates the raw value given, and convert them to stateful ones.
		// value: Anything
		//		The raw value.
		// options: Object
		//		The object that defines how model object should be created from plain object hierarchy.
		// returns: Anything
		//		 The converted value.

		return options["getStateful" + options.getType(value).replace(/^[a-z]/, function(c){ return c.toUpperCase(); })](value); // Anything
	};

	return lang.setObject("dojox.mvc.getStateful", getStateful);
});
