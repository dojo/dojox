define(["dojo/_base/lang","./common","dijit/_WidgetBase","./scrollable"], function(dlang, mcommon,WidgetBase,Scrollable){
	// module:
	//		dojox/mobile/_ScrollableMixin
	// summary:
	//		Mixin for widgets to have a touch scrolling capability.
	// description:
	//		Actual implementation is in scrollable.js.
	//		scrollable.js is not a dojo class, but just a collection
	//		of functions. This module makes scrollable.js a dojo class.

	dojo.declare("dojox.mobile._ScrollableMixin", null, {
		fixedHeader: "",
		fixedFooter: "",
		scrollableParams: {},

		destroy: function(){
			this.cleanup();
			this.inherited(arguments);
		},

		startup: function(){
			if(this._started){ return; }
			var node;
			var params = this.scrollableParams;
			if(this.fixedHeader){
				node = dojo.byId(this.fixedHeader);
				if(node.parentNode == this.domNode){ // local footer
					this.isLocalHeader = true;
				}
				params.fixedHeaderHeight = node.offsetHeight;
			}
			if(this.fixedFooter){
				node = dojo.byId(this.fixedFooter);
				if(node.parentNode == this.domNode){ // local footer
					this.isLocalFooter = true;
					node.style.bottom = "0px";
				}
				params.fixedFooterHeight = node.offsetHeight;
			}
			this.init(params);
			this.inherited(arguments);
		}
	});

	var obj = new Scrollable(dojo, dojox);
	dojo.extend(dojox.mobile._ScrollableMixin, obj);
	if(dojo.version.major == 1 && dojo.version.minor == 4){
		// dojo-1.4 had a problem in inheritance behavior. (#10709 and #10788)
		// This is a workaround to avoid the problem.
		// There is no such a problem in dojo-1.3 and dojo-1.5.
		dojo.mixin(dojox.mobile._ScrollableMixin._meta.hidden, obj);
	}

	return dojox.mobile._ScrollableMixin;
});
