define([
	"dojo/_base/window",
	"dojo/_base/sniff",
	"dojo/dom-style",
	"dojo/dom-geometry",
	"dojo/dom-class",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/window",
	"dijit/_WidgetBase"
], function(win, has, domStyle, domGeometry, domClass, declare, lang, windowUtils, WidgetBase){

	/*=====
		WidgetBase = dijit._WidgetBase;
	=====*/
	return declare("dojox.mobile.Overlay", WidgetBase, {
		// summary:
		//		A non-templated widget that animates up from the bottom, overlaying the current content
		//

		baseClass: "mblOverlay mblOverlayHidden",

		show: function(/*DomNode?*/aroundNode){
			// summary:
			//		Scroll the overlay up into view
			var vp, popupPos;
			var reposition = lang.hitch(this, function(){
				domStyle.style(this.domNode, { position: "", top: "auto", bottom: "0px" });
				popupPos = domGeometry.position(this.domNode);
				vp = windowUtils.getBox();
				if((popupPos.y+popupPos.h) != vp.h){ // TODO: should be a has() test for position:fixed not scrolling
					popupPos.y = vp.t + vp.h - popupPos.h;
					domStyle.style(this.domNode, { position: "absolute", top: popupPos.y + "px", bottom: "auto" });
				}
			});
			reposition();
			if(aroundNode){
				var aroundPos = domGeometry.position(aroundNode);
				if(popupPos.y < aroundPos.y){ // if the aroundNode is under the popup, try to scroll it up
					win.global.scrollBy(0, aroundPos.y + aroundPos.h - popupPos.y);
					reposition();
				}
			}
			domClass.replace(this.domNode, ["mblCoverv", "mblIn"], ["mblOverlayHidden", "mblRevealv", "mblOut", "mblReverse"]);
			var timeoutHandler = null;
			this._moveHandle = this.connect(win.doc.documentElement, "ontouchmove", function(){
				if(timeoutHandler){
					clearTimeout(timeoutHandler);
				}
				timeoutHandler = setTimeout(function(){
					reposition();
					timeoutHandler = null;
				}, 0);
			});
		},

		hide: function(){
			// summary:
			//		Scroll the overlay down and then make it invisible
			if(this._moveHandle){
				this.disconnect(this._moveHandle);
				this._moveHandle = null;
			}
			if(has("webKit")){
				var handler = this.connect(this.domNode, "webkitAnimationEnd", function(){
					this.disconnect(handler);
					domClass.replace(this.domNode, ["mblOverlayHidden"], ["mblRevealv", "mblOut", "mblReverse"]);
				});
				domClass.replace(this.domNode, ["mblRevealv", "mblOut", "mblReverse"], ["mblCoverv", "mblIn"]);
			}else{
				domClass.replace(this.domNode, ["mblOverlayHidden"], ["mblCoverv", "mblIn", "mblRevealv", "mblOut", "mblReverse"]);
			}
		},

		onBlur: function(/*Event*/e){
			return false; // touching outside the overlay area does not call hide()
		}
	});
});
