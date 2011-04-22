define([
  "dojo",
  "dijit",
  "dojox",
  "dojox/mobile/_ItemBase"], function(dojo, dijit, dojox){
	// module:
	//		dojox/mobile/ListItem
	// summary:
	//		TODOC

dojo.declare(
	"dojox.mobile.ListItem",
	dojox.mobile._ItemBase,
{
	rightText: "",
	btnClass: "",
	btnClass2: "",
	anchorLabel: false,
	noArrow: false,
	selected: false,
	checked: false,
	rightIconClass: "",
	arrowClass: "mblDomButtonArrow",
	checkClass: "mblDomButtonCheck",

	buildRendering: function(){
		var a = this.anchorNode = dojo.create("A");
		a.className = "mblListItemAnchor";
		var box = this.box = dojo.create("DIV");
		box.className = "mblListItemTextBox";
		if(this.anchorLabel){
			box.style.cursor = "pointer";
		}
		var r = this.srcNodeRef;
		if(r){
			for(var i = 0, len = r.childNodes.length; i < len; i++){
				var n = r.firstChild;
				if(n.nodeType === 3 && dojo.trim(n.nodeValue) !== ""){
					n.nodeValue = this._cv(n.nodeValue);
					this.labelNode = dojo.create("SPAN");
					this.labelNode.appendChild(n);
					n = this.labelNode;
				}
				box.appendChild(n);
			}
		}
		if(this.label){
			this.labelNode = dojo.create("SPAN", {innerHTML:this._cv(this.label)}, box);
		}
		a.appendChild(box);
		if(this.anchorLabel){
			box.style.display = "inline"; // to narrow the text region
		}
		var li = this.domNode = this.containerNode = this.srcNodeRef || dojo.doc.createElement("LI");
		li.className = "mblListItem" + (this.selected ? " mblItemSelected" : "");
		li.appendChild(a);
	},

	startup: function(){
		if(this._started){ return; }
		this.inheritParams();
		var parent = this.getParent();
		if(this.moveTo || this.href || this.url || this.clickable){
			if(!this.noArrow && !(parent && parent.stateful)){
				this._setBtnClassAttr(this.arrowClass);
			}
			this.connect(this.anchorNode, "onclick", "onClick");
		}
		if(parent && parent.select){
			this.connect(this.anchorNode, "onclick", "onClick");
		}
		this.setIcon();
		this.inherited(arguments);
	},

	setIcon: function(){
		if(this.iconNode){ return; }
		var a = this.anchorNode;
		if(this.icon && this.icon.indexOf("mblDomButton") === 0){
			var div = this.iconNode = dojo.create("DIV", {className:this.icon + " mblLeftButton"});
			this.domNode.insertBefore(div, a);
			dojox.mobile.createDomButton(div);
			dojo.removeClass(a, "mblListItemAnchorNoIcon");
			a.style.paddingLeft = (div.offsetWidth + 11) + "px";
		}else if(this.icon && this.icon != "none"){
			var img = this.iconNode = dojo.create("IMG", {
				className: "mblListItemIcon",
				src: this.icon,
				alt: this.alt
			});
			this.domNode.insertBefore(img, a);
			dojox.mobile.setupIcon(this.iconNode, this.iconPos);
			dojo.removeClass(a, "mblListItemAnchorNoIcon");
		}else{
			dojo.addClass(a, "mblListItemAnchorNoIcon");
		}
	},

	onClick: function(e){
		var a = e.currentTarget;
		var li = a.parentNode;
		if(dojo.hasClass(li, "mblItemSelected")){ return; } // already selected
		if(this.anchorLabel){
			for(var p = e.target; p.tagName != "LI"; p = p.parentNode){
				if(p.className == "mblListItemTextBox"){
					dojo.addClass(p, "mblListItemTextBoxSelected");
					setTimeout(function(){
						dojo.removeClass(p, "mblListItemTextBoxSelected");
					}, 1000);
					this.onAnchorLabelClicked(e);
					return;
				}
			}
		}
		var parent = this.getParent();
		if(parent.stateful){
			for(var i = 0, c = li.parentNode.childNodes; i < c.length; i++){
				dojo.removeClass(c[i], "mblItemSelected");
			}
		}else{
			setTimeout(function(){
				dojo.removeClass(li, "mblItemSelected");
			}, 1000);
		}
		if(parent.select){
			if(parent.select === "single"){
				if(!this.checked){
					this.set("checked", true);
				}
			}else if(parent.select === "multiple"){
				this.set("checked", !this.checked);
			}
		}
		dojo.addClass(li, "mblItemSelected");
		this.setTransitionPos(e);
		this.transitionTo(this.moveTo, this.href, this.url, this.scene);
	},

	onAnchorLabelClicked: function(e){
		// Stub function to connect to from your application.
	},

	_setBtnClass: function(/*String*/btnClass, /*DomNode*/node, /*String*/className){
		var div;
		if(node){
			if(node.className.match(/(mblDomButton\w+)/)){
				dojo.removeClass(node, RegExp.$1);
			}
			dojo.addClass(node, btnClass);
			div = node;
		}else{
			div = dojo.create("DIV", {className:btnClass+" "+className}, this.anchorNode);
		}
		dojox.mobile.createDomButton(div);
		return div;
	},

	_setBtnClassAttr: function(/*String*/rightIconClass){
		this.rightIconNode = this._setBtnClass(rightIconClass, this.rightIconNode, "mblRightButton");
	},

	_setBtnClass2Attr: function(/*String*/rightIconClass){
		this.rightIconNode2 = this._setBtnClass(rightIconClass, this.rightIconNode2, "mblRightButton mblRightButton2");
		dojo.addClass(this.box, "mblListItemTextBox2");
	},

	_setCheckedAttr: function(/*Boolean*/checked){
		var parent = this.getParent();
		if(parent.select === "single" && !this.checked && checked){
			dojo.forEach(parent.getChildren(), function(child){
				child.set("checked", false);
			});
		}
		if(!this.checkNode){
			this._setBtnClassAttr(this.checkClass);
			this.checkNode = this.rightIconNode;
		}
		this.checkNode.style.display = checked ? "" : "none";
		dojo.toggleClass(this.domNode, "mblItemChecked", checked);
		if(this.checked !== checked){
			this.getParent().onCheckStateChanged(this, checked);
		}
		this.checked = checked;
	},

	_setRightTextAttr: function(/*String*/text){
		this.rightText = text;
		if(!this._rightTextNode){
			this._rightTextNode = dojo.create("DIV", {className:"mblRightText"}, this.anchorNode);
		}
		this._rightTextNode.innerHTML = this._cv(text);
	},

	_setLabelAttr: function(/*String*/text){
		this.labelNode.innerHTML = this._cv(text);
	}
});

return dojox.mobile.ListItem;
});
