define([
	"dojo/_base/window",
	"dojo/dom-style",
	"dojo/dom-construct",
	"dojo/_base/array",
	"dojo/_base/declare",
	"./common", // is this needed?
	"dijit/_WidgetBase",
	"dijit/_Container",
	"dijit/_Contained",
	"./View",
	"./Heading",
	"./_ItemBase", // is this needed?
	"./IconItem" // is this needed?
],
	function(win, domStyle, domConstruct, array, declare, mcommon, WidgetBase, Container, Contained, View, Heading, ItemBase, mobileIconItem){
	// module:
	//		dojox/mobile/IconContainer
	// summary:
	//		TODOC

	/*=====
		WidgetBase = dijit._WidgetBase;
		Container = dijit._Container;
		Contained = dijit._Contained;
	=====*/
	return declare("dojox.mobile.IconContainer", [WidgetBase, Container, Contained],{
		defaultIcon: "",
		transition: "below", // slide, flip, or below
		pressedIconOpacity: 0.4,
		iconBase: "",
		iconPos: "",
		back: "Home",
		label: "My Application",
		single: false,

		buildRendering: function(){
			this.domNode = this.containerNode = this.srcNodeRef || win.doc.createElement("UL");
			this.domNode.className = "mblIconContainer";
			var t = this._terminator = domConstruct.create("LI");
			t.className = "mblIconItemTerminator";
			t.innerHTML = "&nbsp;";
			this.domNode.appendChild(t);
		},

		_setupSubNodes: function(ul){
			array.forEach(this.getChildren(), function(w){
				if(this.single){
					w.subNode.firstChild.style.display = "none";
				}
				ul.appendChild(w.subNode);
			});
		},

		startup: function(){
			if(this._started){ return; }
			if(this.transition === "below"){
				this._setupSubNodes(this.domNode);
			}else{
				var view = new View({id:this.id+"_mblApplView"});
				var _this = this;
				view.onAfterTransitionIn = function(moveTo, dir, transition, context, method){
					_this._opening._open_1();
				};
				view.domNode.style.visibility = "hidden";
				var heading = view._heading
					= new Heading({back: this._cv(this.back),
									label: this._cv(this.label),
									moveTo: this.domNode.parentNode.id,
									transition: this.transition});
				view.addChild(heading);
				var ul = win.doc.createElement("UL");
				ul.className = "mblIconContainer";
				ul.style.marginTop = "0px";
				this._setupSubNodes(ul);
				view.domNode.appendChild(ul);
				win.doc.body.appendChild(view.domNode);
				heading.startup();
			}
			this.inherited(arguments);
		},

		closeAll: function(){
			var len = this.domNode.childNodes.length, child, w;
			for(var i = 0; i < len; i++){
				var child = this.domNode.childNodes[i];
				if(child.nodeType !== 1){ continue; }
				if(child === this._terminator){ break; }
				var w = dijit.byNode(child);
				w.containerNode.parentNode.style.display = "none";
				domStyle.style(w.iconNode, "opacity", 1);
			}
		},

		addChild: function(widget, /*Number?*/insertIndex){
			var children = this.getChildren();
			if(typeof insertIndex !== "number" || insertIndex > children.length){
				insertIndex = children.length;
			}
			var idx = insertIndex;
			var refNode = this.containerNode;
			if(idx > 0){
				refNode = children[idx - 1].domNode;
				idx = "after";
			}
			domConstruct.place(widget.domNode, refNode, idx);

			widget.transition = this.transition;
			if(this.transition === "below"){
				for(var i = 0, refNode = this._terminator; i < insertIndex; i++){
					refNode = refNode.nextSibling;
				}
				domConstruct.place(widget.subNode, refNode, "after");
			}
			widget.inheritParams();
			widget._setIconAttr(widget.icon);

			if(this._started && !widget._started){
				widget.startup();
			}
		},

		removeChild: function(/*Widget|Number*/widget){
			if(typeof widget === "number"){
				widget = this.getChildren()[widget];
			}
			if(widget){
				this.inherited(arguments);
				if(this.transition === "below"){
					this.containerNode.removeChild(widget.subNode);
				}
			}
		}
	});
});
