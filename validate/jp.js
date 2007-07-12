dojo.provide("dojox.validate.jp");
dojo.require("dojox.validate._base");

dojox.validate.isJapaneseCurrency = function(/*String*/value) {
	//summary: checks to see if 'value' is a valid representation of Japanese currency
	var flags = {
		symbol: "\u00a5",
		fractional: false
	};
	return dojox.validate.isCurrency(value, flags); // Boolean
}
