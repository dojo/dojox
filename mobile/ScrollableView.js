dojo.provide("dojox.mobile.ScrollableView");

dojo.require("dijit._WidgetBase");
dojo.require("dojox.mobile");
dojo.require("dojox.mobile._ScrollableMixin");

// summary:
//		A container that has a touch scrolling capability.
// description:
//		ScrollableView is a subclass of View (=dojox.mobile.View).
//		Unlike the base View class, ScrollableView's domNode always stays
//		at the top of the screen and its height is "100%" of the screen.
//		In this fixed domNode, containerNode scrolls. Browser's default
//		scrolling behavior is disabled, and the scrolling machinery is
//		re-implemented with JavaScript. Thus the user does not need to use the
//		two-finger operation to scroll an inner DIV (containerNode).
//		The main purpose of this widget is to realize fixed-positioned header
//		and/or footer bars.

dojo.declare(
	"dojox.mobile.ScrollableView",
	[dojox.mobile.View, dojox.mobile._ScrollableMixin],
{
	buildRendering: function(){
		this.inherited(arguments);
		dojo.addClass(this.domNode, "mblScrollableView");
		this.domNode.style.overflow = "hidden";
		this.domNode.style.top = "0px";
		this.containerNode = dojo.create("DIV",
			{className:"mblScrollableViewContainer"}, this.domNode);
		this.containerNode.style.position = "absolute";
		this.containerNode.style.top = "0px"; // view bar is relative
		if(this.scrollDir === "v"){
			this.containerNode.style.width = "100%";
		}
		this.reparent();
		this.findAppBars();
	},

	resize: function(){
		this.inherited(arguments); // scrollable#resize() will be called
		dojo.forEach(this.getChildren(), function(child){
			if(child.resize){ child.resize(); }
		});
	},

	// override dojox.mobile.scrollable
	isTopLevel: function(e){
		var parent = this.getParent && this.getParent();
		return (!parent || !parent.resize); // top level widget
	},

	addChild: function(widget){
		var c = widget.domNode;
		var fixed = this._checkFixedBar(c, true);
		if(fixed){
			this.domNode.appendChild(c);
			if(fixed === "top"){
				this.fixedHeaderHeight = c.offsetHeight;
				this.isLocalHeader = true;
				this.containerNode.style.paddingTop = this.fixedHeaderHeight + "px";
			}else if(fixed === "bottom"){
				this.fixedFooterHeight = c.offsetHeight;
				this.isLocalFooter = true;
				c.style.bottom = "0px";
			}
			this.resize();
		}else{
			this.containerNode.appendChild(c);
		}
		if(this._started && !widget._started){
			widget.startup();
		}
	},

	reparent: function(){
		// move all the children, except header and footer, to containerNode.
		var i, idx, len, c;
		for(i = 0, idx = 0, len = this.domNode.childNodes.length; i < len; i++){
			c = this.domNode.childNodes[idx];
			// search for view-specific header or footer
			if(c === this.containerNode || this._checkFixedBar(c, true)){
				idx++;
				continue;
			}
			this.containerNode.appendChild(this.domNode.removeChild(c));
		}
	},

	findAppBars: function(){
		// search for application-specific header or footer
		var i, len, c;
		for(i = 0, len = dojo.body().childNodes.length; i < len; i++){
			c = dojo.body().childNodes[i];
			this._checkFixedBar(c, false);
		}
		if(this.domNode.parentNode){
			for(i = 0, len = this.domNode.parentNode.childNodes.length; i < len; i++){
				c = this.domNode.parentNode.childNodes[i];
				this._checkFixedBar(c, false);
			}
		}
		this.fixedFooterHeight = this.fixedFooter ? this.fixedFooter.offsetHeight : 0;
	},

	_checkFixedBar: function(/*DomNode*/node, /*Boolean*/local){
		if(node.nodeType === 1){
			var fixed = node.getAttribute("fixed")
				|| (dijit.byNode(node) && dijit.byNode(node).fixed);
			if(fixed === "top"){
				if(local){
					node.style.top = "0px";
					this.fixedHeader = node;
				}
				return fixed;
			}else if(fixed === "bottom"){
				node.style.position = "absolute";
				this.fixedFooter = node;
				return fixed;
			}
		}
		return null;
	},

	onAfterTransitionIn: function(moveTo, dir, transition, context, method){
		this.flashScrollBar();
	},

	// override _WidgetBase#getChildren to add local fixed bars, which are not
	// under containerNode, to the children array.
	getChildren: function(){
		var children = this.inherited(arguments);
		if(this.fixedHeader && this.fixedHeader.parentNode === this.domNode){
			children.push(dijit.byNode(this.fixedHeader));
		}
		if(this.fixedFooter && this.fixedFooter.parentNode === this.domNode){
			children.push(dijit.byNode(this.fixedFooter));
		}
		return children;
	}
});
