dojo.provide("dojox.mobile.TabBar");

dojo.require("dojox.mobile");

dojo.declare(
	"dojox.mobile.TabBar",
	dijit._Widget,
{
	iconBase: "",
	iconPos: "",
	barType: "tabBar", // "tabBar"(default) or "segmentedControl"

	_fixedButtonWidth: 76,
	_fixedButtonMargin: 17,
	_largeScreenWidth: 500,

	buildRendering: function(){
		this._clsName = this.barType == "segmentedControl" ? "mblTabButton" : "mblTabBarButton";
		this.domNode = this.containerNode = this.srcNodeRef || dojo.doc.createElement("H1");
		this.domNode.className = this.barType == "segmentedControl" ? "mblTabPanelHeader" : "mblTabBar";
		this._view = dijit.getEnclosingWidget(this.domNode.parentNode); // parentNode is null if created programmatically
	},

	postCreate: function(){
		if(dojo.global.onorientationchange !== undefined){
			this.connect(dojo.global, "onorientationchange", "onResize");
		}else{
			this.connect(dojo.global, "onresize", "onResize");
		}
	},

	startup: function(){
		var _this = this;
		setTimeout(function(){ // to get proper dimension
			_this.onResize();
		}, 0);
	},

	onResize: function(){
		var i;
		var w = dojo.marginBox(this.domNode.parentNode).w;
		var bw = this._fixedButtonWidth;
		var bm = this._fixedButtonMargin;

		var children = this.containerNode.childNodes;
		var arr = [];
		for(i = 0; i < children.length; i++){
			var c = children[i];
			if(c.nodeType != 1){ continue; }
			if(dojo.hasClass(c, this._clsName)){
				arr.push(c);
			}
		}

		var margin;
		if(this.barType == "segmentedControl"){
			margin = w;
			for(i = 0; i < arr.length; i++){
				margin -= dojo.marginBox(arr[i]).w;
				arr[i].style.marginTop = "3px";
			}
			margin = Math.floor(margin/2);
			this.containerNode.style.padding = "3px 0px 0px " + margin + "px";
		}else{
			margin = Math.floor((w - (bw + bm * 2) * arr.length) / 2);
			if(w < this._largeScreenWidth || margin < 0){
				// If # of buttons is 4, for example, assign "25%" to each button.
				// More precisely, 1%(left margin) + 98%(bar width) + 1%(right margin)
				for(i = 0; i < arr.length; i++){
					arr[i].style.width = Math.round(98/arr.length) + "%";
					arr[i].style.margin = "0px";
				}
				this.containerNode.style.padding = "0px 0px 0px 1%";
			}else{
				// Fixed width buttons. Mainly for larger screen such as iPad.
				for(i = 0; i < arr.length; i++){
					arr[i].style.width = bw + "px";
					arr[i].style.margin = "0 " + bm + "px";
				}
				this.containerNode.style.padding = "0px 0px 0px " + margin + "px";
			}
		}
	}
});

dojo.declare(
	"dojox.mobile.TabBarButton",
	dojox.mobile.AbstractItem,
{
	icon1: "", // unselected (dark) icon
	icon2: "", // selected (highlight) icon
	iconPos1: "", // unselected (dark) icon position
	iconPos2: "", // selected (highlight) icon position
	selected: false,
	transition: "none",
	tag: "LI",

	inheritParams: function(){
		var parent = this.getParentWidget();
		this.parent = parent;
		if(parent){
			if(!this.transition){ this.transition = parent.transition; }
			if(!this.icon1){ this.icon1 = parent.iconBase; }
			if(!this.iconPos1){ this.iconPos1 = parent.iconPos; }
			if(!this.icon2){ this.icon2 = parent.iconBase || this.icon1; }
			if(!this.iconPos2){ this.iconPos2 = parent.iconPos || this.iconPos1; }
		}
	},

	buildRendering: function(){
		this.inheritParams();

		this.anchorNode = dojo.create("A", {className:"mblTabBarButtonAnchor"});
		var a = this.anchorNode;
		this.connect(a, "onclick", "onClick");

		var div = dojo.create("DIV", {className:"mblTabBarButtonDiv"}, a);
		var divInner = dojo.create("DIV", {className:"mblTabBarButtonDiv mblTabBarButtonDivInner"}, div);

		this.img1 = dojo.create("IMG", {className:"mblTabBarButtonIcon", src:this.icon1}, divInner);
		this.img1.style.visibility = this.selected ? "hidden" : "";
		dojox.mobile.setupIcon(this.img1, this.iconPos1);
		this.img1.onload = function(){
			// iPhone and Windows Safari sometimes fail to draw icon images.
			// For some reason, this code solves the problem.
			// Other browsers, including Chrome, do not have this problem.
			this.style.width = this.width + "px";
			this.style.height = this.height + "px";
		};

		this.img2 = dojo.create("IMG", {className:"mblTabBarButtonIcon", src:this.icon2}, divInner);
		this.img2.style.visibility = this.selected ? "" : "hidden";
		dojox.mobile.setupIcon(this.img2, this.iconPos2);
		this.img2.onload = function(){
			this.style.width = this.width + "px";
			this.style.height = this.height + "px";
		};

		this.box = dojo.create("DIV", {className:"mblTabBarButtonTextBox"}, a);
		var box = this.box;
		var r = this.srcNodeRef;
		if(r){
			for(var i = 0, len = r.childNodes.length; i < len; i++){
				box.appendChild(r.firstChild);
			}
		}
		if(this.label){
			box.appendChild(dojo.doc.createTextNode(this.label));
		}

		this.domNode = this.srcNodeRef || dojo.create(this.tag);
		this.containerNode = this.domNode;
		var _clsName = this.parent ? this.parent._clsName : "mblTabBarButton";
		this.domNode.className = _clsName + (this.selected ? " mblTabButtonSelected" : "");
		this.domNode.appendChild(a);
	},

	startup: function(){
		var parent = this.getParentWidget();
		this.parent = parent;
		if(parent && parent.barType == "segmentedControl"){
			this.domNode.className = parent._clsName + (this.selected ? " mblTabButtonSelected" : "");
			this.box.className = "";
		}
	},

	select: function(deselect){
		if(deselect){
			this.selected = false;
			dojo.removeClass(this.domNode, "mblTabButtonSelected");
		}else{
			this.selected = true;
			dojo.addClass(this.domNode, "mblTabButtonSelected");
			for(var i = 0, c = this.domNode.parentNode.childNodes; i < c.length; i++){
				if(c[i].nodeType != 1){ continue; }
				var w = dijit.byNode(c[i]); // sibling widget
				if(w && w != this){
					w.select(true);
				}
			}
		}
		this.img1.style.visibility = this.selected ? "hidden" : "";
		this.img2.style.visibility = this.selected ? "" : "hidden";
	},

	onClick: function(e){
		var a = e.currentTarget;
		var li = a.parentNode;
		if(dojo.hasClass(li, "mblTabButtonSelected")){ return; } // already selected
		this.select();
		this.transitionTo(this.moveTo, this.href, this.url);
	}
});
