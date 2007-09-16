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