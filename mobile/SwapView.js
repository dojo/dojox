define([
	"dojo/dom-class",
	"dojo/dom",
	"dojo/_base/declare",
	"dojo/_base/connect",
	"./View",
	"./_ScrollableMixin"
], function(domClass, dom, declare, connect, View, ScrollableMixin){
	// module:
	//		dojox/mobile/SwapView
	// summary:
	//		A container that can be flipped horizontally.
	// description:
	//		SwapView allows the user to swipe the screen left or right to
	//		flip between the views.
	//		When SwapView is flipped, it finds an adjacent SwapView,
	//		and opens it.

	/*=====
		View = dojox.mobile.View;
		ScrollableMixin = dojox.mobile._ScrollableMixin;
	=====*/
	return declare("dojox.mobile.SwapView", [View, ScrollableMixin], {
		scrollDir: "f",
		weight: 1.2,

		buildRendering: function(){
			this.inherited(arguments);
			domClass.add(this.domNode, "mblSwapView");
			this.setSelectable(this.domNode, false);
			this.containerNode = this.domNode;
			connect.subscribe("/dojox/mobile/nextPage", this, "handleNextPage");
			connect.subscribe("/dojox/mobile/prevPage", this, "handlePrevPage");
			this.findAppBars();
		},

		onTouchStart: function(e){
			var nextView = this.nextView(this.domNode);
			if(nextView){
				nextView.stopAnimation();
				domClass.add(nextView.domNode, "mblIn");
			}
			var prevView = this.previousView(this.domNode);
			if(prevView){
				prevView.stopAnimation();
				domClass.add(prevView.domNode, "mblIn");
			}
			this.inherited(arguments);
		},

		handleNextPage: function(/*Widget*/w){
			var refNode = w.refId && dom.byId(w.refId) || w.domNode;
			if(this.domNode.parentNode !== refNode.parentNode){ return; }
			if(this.getShowingView() !== this){ return; }
			this.goTo(1);
		},

		handlePrevPage: function(/*Widget*/w){
			var refNode = w.refId && dom.byId(w.refId) || w.domNode;
			if(this.domNode.parentNode !== refNode.parentNode){ return; }
			if(this.getShowingView() !== this){ return; }
			this.goTo(-1);
		},

		goTo: function(/*Number*/dir){
			var w = this.domNode.offsetWidth;
			var view = (dir == 1) ? this.nextView(this.domNode) : this.previousView(this.domNode);
			if(!view){ return; }
			view._beingFlipped = true;
			view.scrollTo({x:w*dir});
			view._beingFlipped = false;
			view.domNode.style.display = "";
			domClass.add(view.domNode, "mblIn");
			this.slideTo({x:0}, 0.5, "ease-out", {x:-w*dir});
		},

		isSwapView: function(node){
			return (node && node.nodeType === 1 && domClass.contains(node, "mblSwapView"));
		},

		nextView: function(node){
			for(var n = node.nextSibling; n; n = n.nextSibling){
				if(this.isSwapView(n)){ return dijit.byNode(n); }
			}
			return null;
		},

		previousView: function(node){
			for(var n = node.previousSibling; n; n = n.previousSibling){
				if(this.isSwapView(n)){ return dijit.byNode(n); }
			}
			return null;
		},

		scrollTo: function(/*Object*/to){
			if(!this._beingFlipped){
				var newView, x;
				if(to.x < 0){
					newView = this.nextView(this.domNode);
					x = to.x + this.domNode.offsetWidth;
				}else{
					newView = this.previousView(this.domNode);
					x = to.x - this.domNode.offsetWidth;
				}
				if(newView){
					newView.domNode.style.display = "";
					newView._beingFlipped = true;
					newView.scrollTo({x:x});
					newView._beingFlipped = false;
				}
			}
			this.inherited(arguments);
		},

		slideTo: function(/*Object*/to, /*Number*/duration, /*String*/easing, fake_pos){
			if(!this._beingFlipped){
				var w = this.domNode.offsetWidth;
				var pos = fake_pos || this.getPos();
				var newView, newX;
				if(pos.x < 0){ // moving to left
					newView = this.nextView(this.domNode);
					if(pos.x < -w/4){ // slide to next
						if(newView){
							to.x = -w;
							newX = 0;
						}
					}else{ // go back
						if(newView){
							newX = w;
						}
					}
				}else{ // moving to right
					newView = this.previousView(this.domNode);
					if(pos.x > w/4){ // slide to previous
						if(newView){
							to.x = w;
							newX = 0;
						}
					}else{ // go back
						if(newView){
							newX = -w;
						}
					}
				}
	
				if(newView){
					newView._beingFlipped = true;
					newView.slideTo({x:newX}, duration, easing);
					newView._beingFlipped = false;
	
					if(newX === 0){ // moving to another view
						dojox.mobile.currentView = newView;
					}
					newView.domNode._isShowing = (newView && newX === 0);
				}
				this.domNode._isShowing = !(newView && newX === 0);
			}
			this.inherited(arguments);
		},
	
		onFlickAnimationEnd: function(e){
			if(e && e.animationName && e.animationName !== "scrollableViewScroll2"){ return; }
			// Hide all the views other than the currently showing one.
			// Otherwise, when the orientation is changed, other views
			// may appear unexpectedly.
			var children = this.domNode.parentNode.childNodes;
			for(var i = 0; i < children.length; i++){
				var c = children[i];
				if(this.isSwapView(c)){
					domClass.remove(c, "mblIn");
					if(!c._isShowing){
						c.style.display = "none";
					}
				}
			}
			this.inherited(arguments);
			if(this.getShowingView() === this){
				connect.publish("/dojox/mobile/viewChanged", [this]);
			}
		}
	});
});
