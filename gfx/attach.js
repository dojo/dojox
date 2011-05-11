define(["dojox/gfx"],function(){
	dojo.getObject("dojox.gfx.arc", true);
	var r = dojox.gfx.svg.attach[dojox.gfx.renderer];
	dojo.gfx.attachSurface = r.attachSurface;
	dojo.gfx.attachNode = r.attachNode;
	return r;
});
