define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/dom-geometry",
	"dojo/dom-style",
	"dijit/_Contained",
	"dijit/_Container",
	"dijit/_WidgetBase",
	"./TabBarButton" // to load TabBarButton for you (no direct references)
], function(array, declare, domClass, domConstruct, domGeometry, domStyle, Contained, Container, WidgetBase, TabBarButton){

/*=====
	var Contained = dijit._Contained;
	var Container = dijit._Container;
	var WidgetBase = dijit._WidgetBase;
=====*/

	// module:
	//		dojox/mobile/TabBar
	// summary:
	//		A bar widget that has buttons to control visibility of views.

	return declare("dojox.mobile.TabBar", [WidgetBase, Container, Contained],{
		// summary:
		//		A bar widget that has buttons to control visibility of views.
		// description:
		//		TabBar is a container widget that has typically multiple
		//		TabBarButtons which controls visibility of views. It can be used
		//		as a tab container.

		// iconBase: String
		//		The default icon path for child items.
		iconBase: "",

		// iconPos: String
		//		The default icon position for child items.
		iconPos: "",

		// barType: String
		//		"tabBar", "segmentedControl", "tabPanel", or "slimTabBar".
		barType: "tabBar",

		// closable: Boolean
		//		True if user can close (destroy) a child tab by clicking the X on the tab.
		//		This property is effective only when barType is "tabPanel".
		closable: false,

		// inHeading: Boolean
		//		A flag that indicates whether this widget is in a Heading
		//		widget.
		inHeading: false,

		// syncWithViews: Boolean
		//		True if this widget listens to view transition events to be
		//		synchronized with view's visibility.
		syncWithViews: false,

		// tag: String
		//		A name of html tag to create as domNode.
		tag: "ul",

		/* internal properties */	
		selectOne: true,
		baseClass: "mblTabBar",
		_fixedButtonWidth: 76,
		_fixedButtonMargin: 17,
		_largeScreenWidth: 500,

		buildRendering: function(){
			this.domNode = this.srcNodeRef || domConstruct.create(this.tag);
			this.inherited(arguments);
			var t = this.barType,
				c = this.baseClass + t.charAt(0).toUpperCase() + t.substring(1);
			// mblTabPanelHeader -> mblTabBar mblTabBarSegmentedControl
			// mblTabBar -> mblTabBar mblTabBarTabBar
			domClass.add(this.domNode, c);

			if(this.barType !== "tabPanel" && this.barType !== "slimTabBar"){
				this.closable = false;
			}
		},

		postCreate: function(){
			if(this.syncWithViews){ // see also RoundRect#postCreate
				var f = function(view, moveTo, dir, transition, context, method){
					var child = array.filter(this.getChildren(), function(w){
						return w.moveTo === "#" + view.id || w.moveTo === view.id; })[0];
					if(child){ child.set("selected", true); }
				};
				this.subscribe("/dojox/mobile/afterTransitionIn", f);
				this.subscribe("/dojox/mobile/startView", f);
			}
		},

		startup: function(){
			if(this._started){ return; }
			this.inherited(arguments);
			this.resize();
		},

		resize: function(size){
			var i,w;
			if(size && size.w){
				domGeometry.setMarginBox(this.domNode, size);
				w = size.w;
			}else{
				// Calculation of the bar width varies according to its "position" value.
				// When the widget is used as a fixed bar, its position would be "absolute".
				w = domStyle.get(this.domNode, "position") === "absolute" ?
					domGeometry.getContentBox(this.domNode).w : domGeometry.getMarginBox(this.domNode).w;
			}
			var bw = this._fixedButtonWidth;
			var bm = this._fixedButtonMargin;
			var arr = dojo.map(this.getChildren(), function(w){ return w.domNode; });

			var margin;
			if(this.barType == "segmentedControl"){
				margin = w;
				var totalW = 0; // total width of all the buttons
				for(i = 0; i < arr.length; i++){
					margin -= domGeometry.getMarginBox(arr[i]).w;
					totalW += arr[i].offsetWidth;
				}
				margin = Math.floor(margin/2);
				var parent = this.getParent();
				var inHeading = this.inHeading || parent && domClass.contains(parent.domNode, "mblHeading");
				this.containerNode.style.paddingLeft = (inHeading ? 0 : margin) + "px";
				if(inHeading){
					domStyle.set(this.domNode, {
						background: "none",
						border: "none",
						width: totalW + 2 + "px"
					});
				}
			}else if (this.barType == "tabBar"){
				margin = Math.floor((w - (bw + bm * 2) * arr.length) / 2);
				if(w < this._largeScreenWidth || margin < 0){
					// If # of buttons is 4, for example, assign "25%" to each button.
					// More precisely, 1%(left margin) + 98%(bar width) + 1%(right margin)
					for(i = 0; i < arr.length; i++){
						arr[i].style.width = Math.round(98/arr.length) + "%";
						arr[i].style.margin = "0";
					}
				}else{
					// Fixed width buttons. Mainly for larger screen such as iPad.
					for(i = 0; i < arr.length; i++){
						arr[i].style.width = bw + "px";
						arr[i].style.margin = "0 " + bm + "px";
					}
					if(arr.length > 0){
						arr[0].style.marginLeft = margin + bm + "px";
					}
				}
			}

			domClass.toggle(this.domNode, "mblTabBarNoIcons",
							!array.some(this.getChildren(), function(w){ return w.iconNode1; }));
			domClass.toggle(this.domNode, "mblTabBarNoText",
							!array.some(this.getChildren(), function(w){ return w.label; }));
		},

		getSelectedTab: function(){
			return array.filter(this.getChildren(), function(w){ return w.selected; })[0];
		},

		onCloseButtonClick: function(/*TabBarButton*/tab){
			// summary:
			//		Called whenever the close button [X] of a child tab is clicked.
			return true;
		}
	});
});
