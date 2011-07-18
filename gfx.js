define(["dojo/_base/kernel", "./gfx/_base", "./gfx/renderer!"], function(dojo, base, renderer){
	var gfx = dojo.getObject("gfx", true, dojox);
	gfx.switchTo(renderer);
	return gfx;
});
