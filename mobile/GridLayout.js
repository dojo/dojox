define([
	"dojo/_base/declare",
	"./IconMenu"
], function(declare, IconMenu){
	// module:
	//		dojox/mobile/GridLayout
	// summary:
	//		A container widget that places its children in the grid layout.

	return declare("dojox.mobile.GridLayout", IconMenu, {
		cols: 0,
		childItemClass: "mblGridItem",
		baseClass: "mblGridLayout",
		_tags: "div",
		_createTerminator: true
	});
});
