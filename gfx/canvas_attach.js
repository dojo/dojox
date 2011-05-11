define(["dojox/gfx/canvas"],function(){
	dojo.getObject("dojox.gfx.canvas_attach", true);

	dojo.experimental("dojox.gfx.canvas_attach");

	// not implemented
	return dojox.gfx.canvas.attachSurface = dojox.gfx.canvas.attachNode = function(){
		return null;	// for now
	}
});
