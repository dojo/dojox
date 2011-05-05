define(["dojo", "dojox", "dojox/mvc/_base"], function(dojo, dojox, base){
	// module:
	//		dojox/mvc
	// summary:
	//		Adds elements of MVC support to Dojo.

	dojo.getObject("mvc", true, dojox);
	dojo.experimental("dojox.mvc");

	return dojox.mvc;
});
