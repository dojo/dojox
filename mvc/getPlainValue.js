define(["dojo/_base/lang"], function(lang){
	/*=====
	dojox.mvc.getPlainValueOptions = {
		// summary:
		//		An object that defines how model object should be created from plain object hierarchy.

		getType: function(v){
			// summary:
			//		Returns the type of the given value.
			// v: Anything
			//		The value.

			return "value"; // String
		},

		getPlainType: function(v){
			// summary:
			//		Creates a plain value from a stateful value.
			//		The "Type" in this function name is actually what getType() returns, with first character uppercased, such as: getPlainArray, getPlainObject, getPlainValue.
			// v: Anything
			//		The stateful value.

			return v; // Anything
		}
	};
	=====*/

	var getPlainValue = /*===== dojox.mvc.getPlainValue = =====*/ function(/*Anything*/ value, /*dojox.mvc.getPlainValueOptions*/ options){
		// summary:
		//		Create a raw value from a dojo.Stateful object.
		// description:
		//		Recursively iterates the stateful value given, and convert them to raw ones.
		// value: Anything
		//		The stateful value.
		// options: Object
		//		The object that defines how plain value should be created from stateful value.
		// returns: Anything
		//		 The converted value.

		return options["getPlain" + options.getType(value).replace(/^[a-z]/, function(c){ return c.toUpperCase(); })](value); // Anything
	};

	return lang.setObject("dojox.mvc.getPlainValue", getPlainValue);
});
