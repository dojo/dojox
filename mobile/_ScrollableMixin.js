dojo.provide("dojox.mobile._ScrollableMixin");

dojo.require("dijit._Widget");
dojo.require("dojox.mobile.scrollable");

// summary:
//		Mixin for widgets to have a touch scrolling capability.
// description:
//		Actual implementation is in scrollable.js.
//		scrollable.js is not a dojo class, but just a collection
//		of functions. This module makes scrollable.js a dojo class.

dojo.declare(
	"dojox.mobile._ScrollableMixin",
	null,
{
	fixedHeader: "",
	
	destroy: function(){
		this.cleanup();
	},

	startup: function(){
		var params = {};
		if(this.fixedHeader){
			params.fixedHeaderHeight = dojo.byId(this.fixedHeader).offsetHeight;
		}
		if(this.fixedFooter){
			params.fixedFooterHeight = dojo.byId(this.fixedFooter).offsetHeight;
		}
		this.init(params);
		this.inherited(arguments);
	}
});
dojo.safeMixin(dojox.mobile._ScrollableMixin.prototype, new dojox.mobile.scrollable());
