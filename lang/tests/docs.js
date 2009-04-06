dojo.provide("dojox.lang.tests.docs");

dojo.require("dojox.lang.docs");
dojo.require("dijit.ColorPalette");

tests.register("dojox.lang.tests.docs", [
	function hasSchema(t){
		t.is(!!dijit.ColorPalette.description, true);
		t.is(!!dijit.ColorPalette.properties.defaultTimeout.description, true);
		t.is(dijit.ColorPalette.properties.defaultTimeout.type, "number");	
		t.is(dijit.ColorPalette.methods.onChange.parameters[0].type, "string");	
		t.is(dijit.ColorPalette.methods.onChange.parameters[0].name, "color");
		t.is(dijit.ColorPalette["extends"], dijit._Widget);		
	},
	function testSchema(t){
		
	}
]);
