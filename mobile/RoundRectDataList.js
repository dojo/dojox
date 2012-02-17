define([
	"dojo/_base/kernel",
	"dojo/_base/declare",
	"./RoundRectList",
	"./_DataListMixin"
], function(kernel, declare, RoundRectList, DataListMixin){

/*=====
	var RoundRectList = dojox.mobile.RoundRectList;
	var DataListMixin = dojox.mobile._DataListMixin;
=====*/

	// module:
	//		dojox/mobile/RoundRectDataList
	// summary:
	//		An enhanced version of RoundRectList.

	kernel.deprecated("dojox.mobile.RoundRectDataList is deprecated", "Use dojox.mobile.RoundRectStoreList instead", 2.0);
	return declare("dojox.mobile.RoundRectDataList", [RoundRectList, DataListMixin], {
		// summary:
		//		An enhanced version of RoundRectList.
		// description:
		//		RoundRectDataList is an enhanced version of RoundRectList. It
		//		can generate ListItems according to the given dojo.data store.
	});
});
