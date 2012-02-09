dojo.provide("dojox.mobile.tests.doh.module");

try{
	doh.registerUrl("dojox.mobile.tests.doh.Button", dojo.moduleUrl("dojox.mobile", "tests/doh/Button.html"),999999);
	doh.registerUrl("dojox.mobile.tests.doh.Button", dojo.moduleUrl("dojox.mobile", "tests/doh/Button_Programmatic.html"),999999);
}catch(e){
	doh.debug(e);
}


