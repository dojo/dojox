dojo.provide("dojox.mvc.tests.module");

try{
	var userArgs = window.location.search.replace(/[\?&](dojoUrl|testUrl|testModule)=[^&]*/g,"").replace(/^&/,"?");
	// DOH
	doh.registerUrl("dojox.mvc.tests.doh_mvc_new_shipto-billto-simple", dojo.moduleUrl("dojox.mvc","tests/doh_mvc_new_shipto-billto-simple.html"+userArgs), 999999);
	doh.registerUrl("dojox.mvc.tests.doh_mvc_new_ref-set-repeat", dojo.moduleUrl("dojox.mvc","tests/doh_mvc_new_ref-set-repeat.html"+userArgs), 999999);
	doh.registerUrl("dojox.mvc.tests.multiattrib.doh_mvc_test_Toolbar", dojo.moduleUrl("dojox.mvc","tests/multiattrib/doh_mvc_test_Toolbar.html"+userArgs), 999999);
	// Robot
	doh.registerUrl("dojox.mvc.tests.regression.robot.mvc_loan-stateful", dojo.moduleUrl("dojox.mvc","tests/regression/robot/mvc_loan-stateful.html"+userArgs), 999999);
}catch(e){
	doh.debug(e);
}
