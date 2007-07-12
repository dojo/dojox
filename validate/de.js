dojo.provide("dojox.validate.de");
dojo.require("dojox.validate._base");

dojox.validate.isGermanCurrency = function(/*String*/value) {
	//summary: checks to see if 'value' is a valid representation of German currency (Euros)
	var flags = {
		symbol: "\u20AC",
		placement: "after",
		signPlacement: "begin", //TODO: this is really locale-dependent.  Will get fixed in v0.5 currency rewrite. 
		decimal: ",",
		separator: "."
	};
	return dojox.validate.isCurrency(value, flags); // Boolean
}

