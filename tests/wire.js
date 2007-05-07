dojo.provide("dojox.tests.wire");

try{
	dojo.require("dojox.tests.wire.common");
	dojo.require("dojox.tests.wire.Wire");
	dojo.require("dojox.tests.wire.DataWire");
	dojo.require("dojox.tests.wire.XmlWire");
	dojo.require("dojox.tests.wire.CompositeWire");
	dojo.require("dojox.tests.wire.TableAdapter");
	dojo.require("dojox.tests.wire.TreeAdapter");
	dojo.require("dojox.tests.wire.TextAdapter");
}catch(e){
	doh.debug(e);
}
