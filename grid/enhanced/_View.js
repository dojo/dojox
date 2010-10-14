dojo.provide("dojox.grid.enhanced._View");
dojo.require("dojox.grid._View");

dojo.declare('dojox.grid.enhanced._View', dojox.grid._View, {
	// summary:
	//		Overwrite dojox.grid._View
	
	_contentBuilderClass: dojox.grid.enhanced._ContentBuilder,
	
	postCreate: function(){
		if(this.grid.nestedSorting){
			this._headerBuilderClass = dojox.grid.enhanced._HeaderBuilder;	
		}
		this.inherited(arguments);
	},
	
	setColumnsWidth: function(width){
		//summary:
		//		Overwrite, fix rtl issue in IE.
		if(dojo.isIE && !dojo._isBodyLtr()){
			this.headerContentNode.style.width = width + 'px';
			this.headerContentNode.parentNode.style.width = width + 'px';		
		}
		this.inherited(arguments);
	}	
});
