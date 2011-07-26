define([
	"dojo/_base/declare",
	"dojo/_base/window",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/dom-style",
	"./_ItemBase"
],
	function(declare, win, domClass, domConstruct, domStyle, ItemBase){
	// module:
	//		dojox/mobile/ToolBarButton
	// summary:
	//		TODOC

	/*=====
		ItemBase = dojox.mobile._ItemBase;
	=====*/
	return declare("dojox.mobile.ToolBarButton", ItemBase, {
		selected: false,
		btnClass: "",
		_defaultColor: "mblColorDefault",
		_selColor: "mblColorDefaultSel",

		buildRendering: function(){
			this.domNode = this.containerNode = this.srcNodeRef || win.doc.createElement("div");
			this.inheritParams();
			domClass.add(this.domNode, "mblToolbarButton mblArrowButtonText");
			var color;
			if(this.selected){
				color = this._selColor;
			}else if(this.domNode.className.indexOf("mblColor") == -1){
				color = this._defaultColor;
			}
			domClass.add(this.domNode, color);
	
			if(!this.label){
				this.label = this.domNode.innerHTML;
			}
			this.domNode.innerHTML = this._cv(this.label);
	
			if(this.icon && this.icon != "none"){
				var img;
				if(this.iconPos){
					var iconDiv = domConstruct.create("DIV", null, this.domNode);
					img = domConstruct.create("IMG", null, iconDiv);
					img.style.position = "absolute";
					var arr = this.iconPos.split(/[ ,]/);
					domStyle.style(iconDiv, {
						position: "relative",
						width: arr[2] + "px",
						height: arr[3] + "px"
					});
				}else{
					img = domConstruct.create("IMG", null, this.domNode);
				}
				img.src = this.icon;
				img.alt = this.alt;
				dojox.mobile.setupIcon(img, this.iconPos);
				this.iconNode = img;
			}else{
				if(dojox.mobile.createDomButton(this.domNode)){
					domClass.add(this.domNode, "mblToolbarButtonDomButton");
				}
			}
			this.connect(this.domNode, "onclick", "onClick");
		},
	
		select: function(){
			domClass.toggle(this.domNode, this._selColor, !arguments[0]);
			this.selected = !arguments[0];
		},
		
		deselect: function(){
			this.select(true);
		},
	
		onClick: function(e){
			this.setTransitionPos(e);
			this.defaultClickAction();
		},
	
		_setBtnClassAttr: function(/*String*/btnClass){
			var node = this.domNode;
			if(node.className.match(/(mblDomButton\w+)/)){
				domClass.remove(node, RegExp.$1);
			}
			domClass.add(node, btnClass);
			if(dojox.mobile.createDomButton(this.domNode)){
				domClass.add(this.domNode, "mblToolbarButtonDomButton");
			}
		}
	});
});
