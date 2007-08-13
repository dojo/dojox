dojo.provide("dojox.charting.tests.charting");

try{
	dojo.require("dojox.charting.tests._color");
	dojo.require("dojox.charting.tests.Theme");
	dojo.require("dojox.charting.themes.PlotKit.blue");
	console.log(dojox.charting.themes.PlotKit.blue);
}catch(e){
	doh.debug(e);
}
