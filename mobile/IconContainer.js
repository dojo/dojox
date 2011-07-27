define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/window",
	"dojo/dom-construct",
	"dojo/dom-style",
	"dijit/_Contained",
	"dijit/_Container",
	"dijit/_WidgetBase",
	"./IconItem",
	"./Heading",
	"./View"
],
	function(array, declare, win, domConstruct, domStyle, Contained, Container, WidgetBase, IconItem, Heading, View){
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
				ul.appendChild(w.subNode);
			});
		},

		startup: function(){
			if(this._started){ return; }
			if(this.transition === "below"){
				this._setupSubNodes(this.domNode);
			}else{
				var view = this.appView = new View({id:this.id+"_mblApplView"});
				var _this = this;
				view.onAfterTransitionIn = function(moveTo, dir, transition, context, method){
					_this._opening._open_1();
				};
				view.domNode.style.visibility = "hidden";
				var heading = view._heading
					= new Heading({back: this._cv ? this._cv(this.back) : this.back,
									label: this._cv ? this._cv(this.label) : this.label,
									moveTo: this.domNode.parentNode.id,
									transition: this.transition});
				view.addChild(heading);
				var ul = view._ul = win.doc.createElement("UL");
				ul.className = "mblIconContainer";
				ul.style.marginTop = "0px";
				this._setupSubNodes(ul);
				view.domNode.appendChild(ul);

				var target;
				for(var w = this.getParent(); w; w = w.getParent()){
					if(w instanceof dojox.mobile.View){
						target = w.domNode.parentNode;
						break;
					}
				}
				if(!target){ target = win.body(); }
				target.appendChild(view.domNode);

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
			}else{
				domConstruct.place(widget.subNode, this.appView._ul, insertIndex);
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
				}else{
					this.appView._ul.removeChild(widget.subNode);
				}
			}
		}
	});
});
