dojo.provide("dojox.lang.tests.docs");

dojo.require("dojox.lang.docs");
dojo.require("dijit.ColorPalette");

tests.register("dojox.lang.tests.docs", [
	function hasSchema(t){
		t.is(!!dijit.ColorPalette.description, true);
		t.is(!!dijit.ColorPalette.properties.defaultTimeout.description, true);
		t.is(dijit.ColorPalette.properties.defaultTimeout.type, "number");	
	},
	function testSchema(t){
		
	}
]);
