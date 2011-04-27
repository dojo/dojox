define([
  "dojo",
  "dijit",
  "dojox",
  "dojox/mobile/RoundRectList"], function(dojo, dijit, dojox){
	// module:
	//		dojox/mobile/EdgeToEdgeList
	// summary:
	//		TODOC

dojo.declare(
	"dojox.mobile.EdgeToEdgeList",
	dojox.mobile.RoundRectList,
{
	stateful: false, // keep the selection state or not
	buildRendering: function(){
		this.inherited(arguments);
		this.domNode.className = "mblEdgeToEdgeList";
	},

	_setStatefulAttr: function(stateful){
		this.stateful = stateful;
		dojo.forEach(this.getChildren(), function(child){
			child.setArrow && child.setArrow();
		});
	},

	deselect: function(/*ListItem*/item){
		item.deselect();
	},

	deselectAll: function(){
		dojo.forEach(this.getChildren(), function(child){
			child.deselect && child.deselect();
		});
	},

	select: function(/*ListItem*/item){
		item.select();
	}
});

return dojox.mobile.EdgeToEdgeList;
});
