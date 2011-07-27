define([
	"dojo/_base/array",
	"dojo/_base/connect",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/has",
	"./common",
	"./_ItemBase",
	"./TransitionEvent"
],
	function(array, connect, declare, lang, domClass, domConstruct, has, common, ItemBase, TransitionEvent){
	// module:
	//		dojox/mobile/ListItem
	// summary:
	//		TODOC

	/*=====
		ItemBase = dojox.mobile._ItemBase;
	=====*/
	return declare("dojox.mobile.ListItem", ItemBase, {
		//icon: "", // inherit from _ItemBase
		//label: "", // inherit from _ItemBase
		rightText: "",
		rightIcon2: "",
		rightIcon: "",

		anchorLabel: false,
		noArrow: false,
		selected: false,
		checked: false,
		arrowClass: "mblDomButtonArrow",
		checkClass: "mblDomButtonCheck",
		variableHeight: false,

		rightIconTitle: "",
		rightIcon2Title: "",

		// for backward compatibility
		btnClass: "",
		btnClass2: "",
	
		postMixInProperties: function(){
			// for backward compatibility
			if(this.btnClass){
				this.rightIcon = this.btnClass;
			}
			this._setBtnClassAttr = this._setRightIconAttr;
			this._setBtnClass2Attr = this._setRightIcon2Attr;
		},

		buildRendering: function(){
			this.inherited(arguments);
			this.domNode.className = "mblListItem" + (this.selected ? " mblItemSelected" : "");

			// label
			var box = this.box = domConstruct.create("DIV");
			box.className = "mblListItemTextBox";
			if(this.anchorLabel){
				box.style.cursor = "pointer";
			}
			var r = this.srcNodeRef;
			if(r && !this.label){
				this.label = "";
				for(var i = 0, len = r.childNodes.length; i < len; i++){
					var n = r.firstChild;
					if(n.nodeType === 3 && lang.trim(n.nodeValue) !== ""){
						n.nodeValue = this._cv ? this._cv(n.nodeValue) : n.nodeValue;
						this.labelNode = domConstruct.create("SPAN", {className:"mblListItemLabel"});
						this.labelNode.appendChild(n);
						n = this.labelNode;
					}
					box.appendChild(n);
				}
			}
			if(!this.labelNode){
				this.labelNode = domConstruct.create("SPAN", {className:"mblListItemLabel"}, box);
			}
			if(this.anchorLabel){
				box.style.display = "inline"; // to narrow the text region
			}

			var a = this.anchorNode = domConstruct.create("A");
			a.className = "mblListItemAnchor";
			this.domNode.appendChild(a);
			a.appendChild(box);

			// right text
			this.rightTextNode = domConstruct.create("DIV", {className:"mblListItemRightText"}, a, "first");

			// right icon2
			this.rightIcon2Node = domConstruct.create("DIV", {className:"mblListItemRightIcon2"}, a, "first");

			// right icon
			this.rightIconNode = domConstruct.create("DIV", {className:"mblListItemRightIcon"}, a, "first");

			// icon
			this.iconNode = domConstruct.create("DIV", {className:"mblListItemIcon"}, a, "first");
		},

		startup: function(){
			if(this._started){ return; }
			this.inheritParams();
			var parent = this.getParent();
			if(this.moveTo || this.href || this.url || this.clickable){
				this.connect(this.anchorNode, "onclick", "onClick");
			}
			this.setArrow();
			if(parent && parent.select){
				this.connect(this.anchorNode, "onclick", "onClick");
			}

			if(domClass.contains(this.domNode, "mblVariableHeight")){
				this.variableHeight = true;
			}
			if(this.variableHeight){
				domClass.add(this.domNode, "mblVariableHeight");
				connect.subscribe("/dojox/mobile/resizeAll", this, "layoutVariableHeight");
				setTimeout(lang.hitch(this, "layoutVariableHeight"));
			}

			this.set("icon", this.icon);
			this.inherited(arguments);
		},

		onClick: function(e){
			var a = e.currentTarget;
			var li = a.parentNode;
			if(domClass.contains(li, "mblItemSelected")){ return; } // already selected
			if(this.anchorLabel){
				for(var p = e.target; p.tagName !== "LI"; p = p.parentNode){
					if(p.className == "mblListItemTextBox"){
						domClass.add(p, "mblListItemTextBoxSelected");
						setTimeout(function(){
							domClass.remove(p, "mblListItemTextBoxSelected");
						}, has('android') ? 300 : 1000);
						this.onAnchorLabelClicked(e);
						return;
					}
				}
			}
			var parent = this.getParent();
			if(parent.select){
				if(parent.select === "single"){
					if(!this.checked){
						this.set("checked", true);
					}
				}else if(parent.select === "multiple"){
					this.set("checked", !this.checked);
				}
			}
			this.select();

			var transOpts;
			if(this.moveTo || this.href || this.url || this.scene){
				transOpts = {moveTo: this.moveTo, href: this.href, url: this.url, scene: this.scene, transition: this.transition, transitionDir: this.transitionDir};
			}else if(this.transitionOptions){
				transOpts = this.transitionOptions;
			}	

			if(transOpts){
				this.setTransitionPos(e);
				return new TransitionEvent(this.domNode,transOpts,e).dispatch();
			}
		},
	
		deselect: function(){
			domClass.remove(this.domNode, "mblItemSelected");
		},
	
		select: function(){
			var parent = this.getParent();
			if(parent.stateful){
				parent.deselectAll();
			}else{
				var _this = this;
				setTimeout(function(){
					_this.deselect();
				}, has('android') ? 300 : 1000);
			}
			domClass.add(this.domNode, "mblItemSelected");
		},
	
		onAnchorLabelClicked: function(e){
			// Stub function to connect to from your application.
		},

		layoutVariableHeight: function(e){
			var h = this.anchorNode.offsetHeight;
			array.forEach([
					this.rightTextNode,
					this.rightIcon2Node,
					this.rightIconNode,
					this.iconNode
				], function(n){
					var t = Math.round((h - n.offsetHeight) / 2);
					n.style.marginTop = t + "px";
				});
		},

		setArrow: function(){
			if(this.checked){ return; }
			var c = "";
			var parent = this.getParent();
			if(this.moveTo || this.href || this.url || this.clickable){
				if(!this.noArrow && !(parent && parent.stateful)){
					c = this.arrowClass;
				}
			}
			if(c){
				this._setRightIconAttr(c);
			}
		},

		_setIconAttr: function(icon){
			if(!this.getParent()){ return; } // icon may be invalid because inheritParams is not called yet
			this.icon = icon;
			var a = this.anchorNode;
			domConstruct.empty(this.iconNode);
			if(icon && icon !== "none"){
				dojox.mobile.createIcon(icon, this.iconPos, null, this.alt, this.iconNode);
				if(this.iconPos){
					domClass.add(this.iconNode.firstChild, "mblListItemSpriteIcon");
				}
				domClass.remove(a, "mblListItemAnchorNoIcon");
			}else{
				domClass.add(a, "mblListItemAnchorNoIcon");
			}
		},
	
		_setCheckedAttr: function(/*Boolean*/checked){
			var parent = this.getParent();
			if(parent.select === "single" && checked){
				array.forEach(parent.getChildren(), function(child){
					child.set("checked", false);
				});
			}
			this._setRightIconAttr(this.checkClass);
			this.rightIconNode.style.display = checked ? "" : "none";
			domClass.toggle(this.domNode, "mblListItemChecked", checked);
			if(this.checked !== checked){
				this.getParent().onCheckStateChanged(this, checked);
			}
			this.checked = checked;
		},
	
		_setRightTextAttr: function(/*String*/text){
			this.rightText = text;
			this.rightTextNode.innerHTML = this._cv ? this._cv(text) : text;
		},
	
		_setRightIconAttr: function(/*String*/icon){
			this.rightIcon = icon;
			domConstruct.empty(this.rightIconNode);
			dojox.mobile.createIcon(icon, null, null, this.rightIconTitle, this.rightIconNode);
		},
	
		_setRightIcon2Attr: function(/*String*/icon){
			this.rightIcon2 = icon;
			domConstruct.empty(this.rightIcon2Node);
			dojox.mobile.createIcon(icon, null, null, this.rightIcon2Title, this.rightIcon2Node);
		},
	
		_setLabelAttr: function(/*String*/text){
			this.label = text;
			this.labelNode.innerHTML = this._cv ? this._cv(text) : text;
		}
	});
});
