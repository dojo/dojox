dojo.provide("dojox.grid.tests.performance.module");

doh.register("dojox.grid.tests.performance.module", []);

try{
	var numRows = 100;
	
	// 5-minute timeout on each of these - since they can take quite a while...
	doh.registerUrl("Grid Creation - " + numRows + " Rows, Single Layout", 
		dojo.moduleUrl("dojox.grid.tests.performance", "creation.html") + "?rows=" + numRows + "&layout=single&rowSelector=false",
		300000);
	doh.registerUrl("Grid Creation - " + numRows + " Rows, Dual Layout", 
		dojo.moduleUrl("dojox.grid.tests.performance", "creation.html") + "?rows=" + numRows + "&layout=dual&rowSelector=false",
		300000);
	doh.registerUrl("Grid Creation - " + numRows + " Rows, Single Layout w/ selector", 
		dojo.moduleUrl("dojox.grid.tests.performance", "creation.html") + "?rows=" + numRows + "&layout=single&rowSelector=true",
		300000);
	doh.registerUrl("Grid Creation - " + numRows + " Rows, Dual Layout w/ selector", 
		dojo.moduleUrl("dojox.grid.tests.performance", "creation.html") + "?rows=" + numRows + "&layout=dual&rowSelector=true",
		300000);
}catch(e){
	doh.debug(e);
}
