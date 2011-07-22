define([
	"dojo/_base/declare",
	"./RoundRectList"
], function(declare, RoundRectList){
	/*=====
		RoundRectList = dojox.mobile.RoundRectList;
	=====*/
	return declare("dojox.mobile.EdgeToEdgeList", RoundRectList, {
		buildRendering: function(){
			this.inherited(arguments);
			this.domNode.className = "mblEdgeToEdgeList";
		}
	});
});
