define([
	"./RoundRectList"
], function(RoundRectList){
	/*=====
		RoundRectList = dojox.mobile.RoundRectList;
	=====*/
	return dojo.declare("dojox.mobile.EdgeToEdgeList", RoundRectList, {
		buildRendering: function(){
			this.inherited(arguments);
			this.domNode.className = "mblEdgeToEdgeList";
		}
	});
});
