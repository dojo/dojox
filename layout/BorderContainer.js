dojo.provide("dojox.layout.BorderContainer");

dojo.require("dijit.layout._LayoutWidget");

dojo.experimental("dojox.layout.BorderContainer");

dojo.declare(
	"dojox.layout.BorderContainer",
//	[dijit._Widget, dijit._Container, dijit._Contained],
	dijit.layout._LayoutWidget,
{
	// summary
	//	Provides layout in 5 regions, a center and borders along its 4 sides.
	//
	// details
	//	A BorderContainer is a box with a specified size (like style="width: 500px; height: 500px;"),
	//	that contains children widgets marked with "position" of "top", "bottom", "left", "right", "center".
	//	It takes it's children marked as top/bottom/left/right, and lays them out along the edges of the center box,
	//	with "top" and "bottom" extending the full width of the container.
	//  The outer size must be specified on the BorderContainer node.
	//
	// usage
	//	<style>
	//		html, body{ height: 100%; width: 100%; }
	//	</style>
	//	<div dojoType="BorderContainer" style="width: 100%; height: 100%">
	//		<div dojoType="ContentPane" position="top">header text</div>
	//		<div dojoType="ContentPane" position="right" style="width: 200px;">table of contents</div>
	//		<div dojoType="ContentPane" position="center">client area</div>
	//	</div>

	// priority: String
	//  choose which panels get priority in the layout: "headline" where the top and bottom extend the full width
	//  of the container, or sidebar where the left and right sides extend from top to bottom.
	priority: "headline",

	_top: {},
	_bottom: {},
	_left: {}, // aka inside in LTR mode
	_right: {}, // aka outside in LTR mode
	_center: {},

	layout: function(){
		this._layoutChildren(this.domNode, this._contentBox, this.getChildren());
	},

	addChild: function(/*Widget*/ child, /*Integer?*/ insertIndex){
		dijit._Container.prototype.addChild.apply(this, arguments);
		if(this._started){
			this._layoutChildren(this.domNode, this._contentBox, this.getChildren());
		}
	},

	removeChild: function(/*Widget*/ widget){
		dijit._Container.prototype.removeChild.apply(this, arguments);
		if(this._started){
			this._layoutChildren(this.domNode, this._contentBox, this.getChildren());
		}
	},

	_layoutChildren: function(/*DomNode*/ container, /*Object*/ dim, /*Object[]*/ children){
		/**
		 * summary
		 *		Layout a bunch of child dom nodes within a parent dom node
		 * container:
		 *		parent node
		 * dim:
		 *		{l, t, w, h} object specifying dimensions of container into which to place children
		 * children:
		 *		an array like [ {domNode: foo, position: "bottom" }, {domNode: bar, position: "client"} ]
		 */

//TODO: what is dim and why doesn't it look right?
		// copy dim because we are going to modify it
//		dim = dojo.mixin({}, dim);

		this.domNode.style.position = "relative";

		//FIXME: do this once? somewhere else?
		dojo.addClass(container, "dijitBorderContainer");
		dojo.forEach(children, function(child){
			var style = child.domNode.style;
			style.position = "absolute";
			var position = child.position;
			if(position){
				if(position == "leading"){ position = "left"; }
				if(position == "trailing"){ position = "right"; }
				if(!dojo._isBodyLtr()){
					if(position == "left"){
						position = "right";
					}else if(position == "right"){
						position = "left";
					}
				}
				this["_"+position] = child.domNode;
			}
		}, this);

		var sidebarLayout = this.priority == "sidebar";
		var topStyle = this._top.style;
		var rightStyle = this._right.style;
		var leftStyle = this._left.style;
		var centerStyle = this._center.style;
		var bottomStyle = this._bottom.style;
		var rightCoords = dojo.coords(this._right);
		var leftCoords = dojo.coords(this._left);
		var centerCoords = dojo.coords(this._center);
		var bottomCoords = dojo.coords(this._bottom);
		var topCoords = dojo.coords(this._top);
		centerStyle.top = topCoords.h + "px";
		rightStyle.top = leftStyle.top = sidebarLayout ? "0px" : centerStyle.top;
		topStyle.top = "0px";
		bottomStyle.bottom = "0px";
		if(sidebarLayout){
			topStyle.left = bottomStyle.left = leftCoords.w + "px";
			topStyle.right = bottomStyle.right = rightCoords.w + "px";
		}else{
			topStyle.left = topStyle.right = "0px";
			bottomStyle.left = bottomStyle.right = "0px";
		}
		leftStyle.left = rightStyle.right = "0px";
		centerStyle.left = leftCoords.w + "px";
		centerStyle.right =  rightCoords.w + "px";
		centerStyle.bottom = bottomCoords.h + "px";
		rightStyle.bottom = leftStyle.bottom = sidebarLayout ? "0px" : centerStyle.bottom;

		dojo.forEach(["top", "left", "center", "right", "bottom"], function(pos){
			var widget = dijit.byNode(this["_"+pos]);
			if(widget && widget.resize){ widget.resize(); }
		}, this);
	},

	resize: function(args){
		this.layout();
	}
});

// This argument can be specified for the children of a BorderContainer.
// Since any widget can be specified as a LayoutContainer child, mix it
// into the base widget class.  (This is a hack, but it's effective.)
dojo.extend(dijit._Widget, {
	// position: String
	//		"top", "bottom", "leading", "trailing", "left", "right", "center".
	//		See the BorderContainer description for details on this parameter.
	position: 'none'
});
