dojo.provide("dojox.wireml.tests.wireml");

try{
	if(dojo.isBrowser){
		doh.registerUrl("dojox.wireml.tests.Action", dojo.moduleUrl("dojox", "wireml/tests/markup/Action.html"));
		doh.registerUrl("dojox.wireml.tests.Transfer", dojo.moduleUrl("dojox", "wireml/tests/markup/Transfer.html"));
		doh.registerUrl("dojox.wireml.tests.Invocation", dojo.moduleUrl("dojox", "wireml/tests/markup/Invocation.html"));
		doh.registerUrl("dojox.wireml.tests.Data", dojo.moduleUrl("dojox", "wireml/tests/markup/Data.html"));
		doh.registerUrl("dojox.wireml.tests.DataStore", dojo.moduleUrl("dojox", "wireml/tests/markup/DataStore.html"));
		doh.registerUrl("dojox.wireml.tests.Service", dojo.moduleUrl("dojox", "wireml/tests/markup/Service.html"));
	}
}catch(e){
	doh.debug(e);
}
