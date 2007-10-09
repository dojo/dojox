dojo.provide("dojox.fx._arg");

dojox.fx._arg.StyleArgs = function(/*DOMNode*/ node, /*String*/ cssClass){
	// summary:
	//		The node and CSS class to use for style manipulations.
	// node:
	//		The node to manipulate
	// cssClass:
	//		The class to use during the manipulation
	this.node = node;
	this.cssClass = cssClass;
}

dojox.fx._arg.ShadowResizeArgs = function(/* Int */x, /* Int */y){
	// summary: 
	//	The odd way to document object parameters.
	// x:
	//	the width to set
	// y:
	//	the height to set	
	this.x = x;
	this.y = y;
}