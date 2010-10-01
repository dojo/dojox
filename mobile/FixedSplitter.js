dojo.provide("dojox.mobile.FixedSplitter");

dojo.require("dijit._Widget");

// summary:
//		A layout container that splits the window horizontally or vertically.
// description:
//		FixedSplitter is a very simple container widget that layouts its child
//		dom nodes side by side either horizontally or vertically.
//		The main purpose of this widget is to achieve the split view on iPad.
//		There is no visual splitter between the children, and there is no
//		function to resize the child panes with drag-and-drop.
//		If you need a visual splitter, you can specify a border of a child
//		dom node with CSS.
//		For mobile webkit browsers, touch events are handled so that the user
//		can scroll a child pane without moving the entire page. You don't
//		have to use the two-finger operation to scroll the child pane.

dojo.declare(
	"dojox.mobile.FixedSplitter",
	dijit._Widget,
{
	orientation: "H", // "H" or "V"

	isContainer: true,

	buildRendering: function(){
		this.domNode = this.containerNode = this.srcNodeRef ? this.srcNodeRef : dojo.doc.createElement("DIV");
		dojo.addClass(this.domNode, "mblFixedSpliter");
	},

	startup: function(){
		var children = dojo.filter(this.domNode.childNodes, function(node){ return node.nodeType == 1; });
		dojo.forEach(children, function(node){
			dojo.addClass(node, "mblSplitPane mblSplitPane"+this.orientation);
			if(typeof dojo.body().ontouchstart != "undefined" && node.getAttribute("scrollable") != "false"){
				this.connect(node, "touchstart", "onTouchStart");
				this.connect(node, "touchend", "onTouchEnd");
				this.connect(node, "touchmove", "onTouchMove");
			}
		}, this);

		dojo.forEach(this.getChildren(), function(child){if(child.startup){child.startup();}});
		this._started = true;

		var _this = this;
		setTimeout(function(){
			_this.resize();
		}, 0);

		var parent = dijit.getEnclosingWidget(this.domNode.parentNode);
		if(!parent){
			this.connect(dojo.global, "onresize", "resize");
		}
	},

	resize: function(changeSize, resultSize){
		this.layout();
	},

	layout: function(){
		var sz = this.orientation == "H" ? "w" : "h";
		var children = dojo.filter(this.domNode.childNodes, function(node){ return node.nodeType == 1; });
		var offset = 0;
		for(var i = 0; i < children.length; i++){
			dojo.marginBox(children[i], this.orientation == "H" ? {l:offset} : {t:offset});
			if(i < children.length - 1){
				offset += dojo.marginBox(children[i])[sz];
			}
		}

		var l = dojo.marginBox(this.domNode)[sz] - offset;
		var props = {};
		props[sz] = l;
		dojo.marginBox(children[children.length - 1], props);

		dojo.forEach(this.getChildren(), function(child){
			if(child.resize){ child.resize(); }
		});
	},

	onTouchStart: function(e){
		this.touchStartX = e.touches[0].pageX;
		this.touchStartY = e.touches[0].pageY;
		scrollTop = e.currentTarget.scrollTop;
		if(e.target.nodeType != 1 || e.target.tagName != "SELECT"){
			e.preventDefault();
		}
	},

	onTouchMove: function(e){
		e.currentTarget.scrollTop = this.touchStartY+scrollTop-e.touches[0].pageY;
		e.preventDefault();
	},

	onTouchEnd: function(e){
		this.touchEndX = e.changedTouches[0].pageX;
		this.touchEndY = e.changedTouches[0].pageY;
		if(Math.abs(this.touchStartX - this.touchEndX) <= 1 && Math.abs(this.touchStartY - this.touchEndY) <= 1){
			var elem = e.target;
			if(elem.nodeType != 1){
				elem = elem.parentNode;
			}
			var ev = dojo.doc.createEvent("MouseEvents");
			ev.initEvent('click', true, true);
			elem.dispatchEvent(ev);
		}
	}
});
