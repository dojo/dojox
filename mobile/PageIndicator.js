define([
	"dojo/_base/connect",
	"dojo/_base/declare",
	"dojo/_base/window",
	"dojo/dom",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dijit/registry",	// registry.byNode
	"dijit/_Contained",
	"dijit/_WidgetBase"
], function(connect, declare, win, dom, domClass, domConstruct, registry, Contained, WidgetBase){
	// module:
	//		dojox/mobile/Heading
	// summary:
	//		TODOC

	/*=====
		WidgetBase = dijit._WidgetBase;
		Contained = dijit._Contained;
	=====*/
	return declare("dojox.mobile.PageIndicator", [WidgetBase, Contained],{
		refId: "",

		buildRendering: function(){
			this.domNode = this.srcNodeRef || win.doc.createElement("DIV");
			this.domNode.className = "mblPageIndicator";
			this._tblNode = domConstruct.create("TABLE", {className:"mblPageIndicatorContainer"}, this.domNode);
			this._tblNode.insertRow(-1);
			this.connect(this.domNode, "onclick", "onClick");
			connect.subscribe("/dojox/mobile/viewChanged", this, function(view){
				this.reset();
			});
		},

		startup: function(){
			var _this = this;
			setTimeout(function(){ // to wait until views' visibility is determined
				_this.reset();
			}, 0);
		},

		reset: function(){
			var r = this._tblNode.rows[0];
			var i, c, a = [], dot;
			var refNode = (this.refId && dom.byId(this.refId)) || this.domNode;
			var children = refNode.parentNode.childNodes;
			for(i = 0; i < children.length; i++){
				c = children[i];
				if(this.isView(c)){
					a.push(c);
				}
			}
			if(r.cells.length !== a.length){
				domConstruct.empty(r);
				for(i = 0; i < a.length; i++){
					c = a[i];
					dot = domConstruct.create("DIV", {className:"mblPageIndicatorDot"});
					r.insertCell(-1).appendChild(dot);
				}
			}
			if(a.length === 0){ return; }
			var currentView = registry.byNode(a[0]).getShowingView();
			for(i = 0; i < r.cells.length; i++){
				dot = r.cells[i].firstChild;
				if(a[i] === currentView.domNode){
					domClass.add(dot, "mblPageIndicatorDotSelected");
				}else{
					domClass.remove(dot, "mblPageIndicatorDotSelected");
				}
			}
		},

		isView: function(node){
			return (node && node.nodeType === 1 && domClass.contains(node, "mblView"));
		},

		onClick: function(e){
			if(e.target !== this.domNode){ return; }
			if(e.layerX < this._tblNode.offsetLeft){
				connect.publish("/dojox/mobile/prevPage", [this]);
			}else if(e.layerX > this._tblNode.offsetLeft + this._tblNode.offsetWidth){
				connect.publish("/dojox/mobile/nextPage", [this]);
			}
		}
	});
});
