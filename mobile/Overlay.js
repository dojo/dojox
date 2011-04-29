define("dojox/mobile/Overlay", ["dojo", "dijit", "dojox", "dojo/window", "dijit/_WidgetBase"], function(dojo, dijit, dojox) {
dojo.experimental("dojox.mobile.Overlay");

dojo.declare(
	"dojox.mobile.Overlay", 
	[dijit._WidgetBase],
	{
		// summary:
		//		A non-templated widget that animates up from the bottom, overlaying the current content
		//

		baseClass: "mblOverlay mblOverlayHidden",

		reposition: function(){
			var p = dojo.byId("customPicker");
			var vp = dojo.window.getBox();
			var innerHeight = dojo.global.innerHeight || vp.h;
			var bot = vp.t + innerHeight - vp.h;
			dojo.removeClass(this.domNode, "mblOverlayTransition");
			dojo.style(this.domNode, { bottom: -bot + "px" });
		},

		show: function(){
			this.reposition();
			dojo.replaceClass(this.domNode, ["mblOverlayTransition", "mblOverlayVisible"], "mblOverlayHidden");
			dojo.style(this.domNode, { maxHeight: this.domNode.scrollHeight + "px" });
			var timeoutHandler = null;
			this._moveHandle = this.connect(dojo.doc.documentElement, "ontouchmove", function(){
				if(timeoutHandler){
					clearTimeout(timeoutHandler);
				}
				timeoutHandler = setTimeout(dojo.hitch(this, function(){
					this.reposition();
					timeoutHandler = null;
				}), 0);
			});
		},

		hide: function(){
			if(this._moveHandle){
				this.disconnect(this._moveHandle);
				this._moveHandle = null;
			}
			dojo.removeClass(this.domNode, "mblOverlayTransition");
			dojo.style(this.domNode, { maxHeight: this.domNode.offsetHeight + "px" }); // set to actual size so that the transition is smoother
			dojo.addClass(this.domNode, "mblOverlayTransition");
			dojo.style(this.domNode, { maxHeight: "0px" });
			dojo.replaceClass(this.domNode, "mblOverlayHidden", "mblOverlayVisible");
		}
	}
);

return dojox.mobile.Overlay;
});
