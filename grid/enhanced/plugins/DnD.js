dojo.provide("dojox.grid.enhanced.plugins.DnD");

dojo.require("dojox.grid.enhanced.dnd._DndMovingManager");

dojo.declare("dojox.grid.enhanced.plugins.DnD", dojox.grid.enhanced.dnd._DndMovingManager, {
	//	summary:
	//		 Provides dnd support for row(s) and column(s)
	// example:
	// 		 <div dojoType="dojox.grid.EnhancedGrid" plugins="{dnd: true}" ...></div>
	
	//name: String
	//		Plugin name
	name: "dnd",
		
	constructor: function(inGrid, option){
		inGrid.isDndSelectEnable = true;
	}
});