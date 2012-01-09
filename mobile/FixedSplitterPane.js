define([
	"dojo/_base/kernel",
	"dojox/mobile/Container"
], function(kernel, Container){
	kernel.deprecated("dojox.mobile.FixedSplitterPane is deprecated", "Use dojox.mobile.Container instead", 2.0);
	dojox.mobile.FixedSplitterPane = Container;
	return Container;
});
