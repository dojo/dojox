dojo.provide("dojox.encoding.tests.crypto._base");
dojo.require("dojox.encoding.crypto.Blowfish");

try{
	dojo.require("dojox.encoding.tests.crypto.Blowfish");
	dojo.require("dojox.encoding.tests.crypto.SimpleAES");
}catch(e){
	doh.debug(e);
}
