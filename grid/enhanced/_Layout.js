dojo.provide("dojox.grid.enhanced._Layout");
dojo.require("dojox.grid._Layout");

dojo.declare('dojox.grid.enhanced._Layout', dojox.grid._Layout, {
	// summary:
	//		Overwrite dojox.grid._Layout
	addViewDef: function(inDef){
		var viewDef = this.inherited(arguments);
		if(!viewDef['type']){
			viewDef['type'] = this.grid._viewClassStr;
		}
		return viewDef;
	}
});
