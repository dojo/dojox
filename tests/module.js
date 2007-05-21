dojo.provide("dojox.tests.module");

try{
	dojo.require("dojox.tests.date.posix");
	dojo.require("dojox.tests.data.CsvStore");
	dojo.require("dojox.tests.data.OpmlStore");
	dojo.requireIf(dojo.isBrowser, "dojox.tests.data.XmlStore");
	dojo.requireIf(dojo.isBrowser, "dojox.tests.data.dom");
	dojo.require("dojox.tests.wire");
}catch(e){
	doh.debug(e);
}

