dojo.provide("dojox.drawing.plugins._Plugin");

dojox.drawing.plugins._Plugin = dojox.drawing.util.oo.declare(
	// summary:
	//		Base class for plugins.
	// description:
	//		When creating a plugin, use this class as the
	//		base to ensure full functionality.
	function(options){
		dojo.mixin(this, options);
	},
	{
		util:null,
		keys:null,
		mouse:null,
		drawing:null,
		stencils:null,
		anchors:null,
		canvas:null,
		node:null,
		type:"dojox.drawing.plugins._Plugin"
	}
);