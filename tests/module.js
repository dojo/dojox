dojo.provide("dojox.tests.module");

try{
	dojo.require("dojox.tests.date.posix");
	dojo.require("dojox.tests.data.CsvStore");
	dojo.requireIf(dojo.isBrowser, "dojox.tests.data.XmlStore");
	dojo.requireIf(dojo.isBrowser, "dojox.tests.data.dom");
}catch(e){
	doh.debug(e);
}

