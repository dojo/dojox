
// experimental, still work-in-progress
// TODO: auto scroll?

define([
	"dojo/_base/array",
	"dojo/_base/connect",
	"dojo/_base/declare",
	"dojo/_base/event",
	"dojo/dom-class",
	"dojo/dom-geometry",
	"dojo/dom-style",
	"dijit/registry",
	"./ListItem",
	"./sniff"
], function(array, connect, declare, event, domClass, domGeometry, domStyle, registry, ListItem, has){

	// module:
	//		dojox/mobile/EditableRoundRectList
	// summary:
	//		A rounded rectangle list.

	return declare("dojox.mobile._EditableListMixin", null, {
		// summary:
		//		A rounded rectangle list.
		// description:
		//		EditableRoundRectList is a rounded rectangle list, which can be used to
		//		display a group of items. Each item must be
		//		dojox.mobile.ListItem.

		rightIconForEdit: "mblDomButtonGrayKnob",
		deleteIconForEdit: "mblDomButtonRedCircleMinus",

		// isEditing: Boolean
		//		A read-only flag that indicates whether the widget is in the edit mode.
		isEditing: false,

		destroy: function(){
			if(this._blankItem){
				this._blankItem.destroy();
			}
			this.inherited(arguments);
		},

		_setupMoveItem: function(/*DomNode*/node){
			domStyle.set(node, {
				width: domGeometry.getContentBox(node).w + "px",
				top: node.offsetTop + "px"
			});
			domClass.add(node, "mblListItemFloat");
		},

		_resetMoveItem: function(/*DomNode*/node){
			setTimeout(function(){ // iPhone needs setTimeout
				domClass.remove(node, "mblListItemFloat");
				domStyle.set(node, {
					width: "",
					top: ""
				});
			}, 0);
		},

		_onClick: function(e){
			// summary:
			//		Internal handler for click events.
			// tags:
			//		private
			if(this.onClick(e) === false){ return; } // user's click action
			var item = registry.getEnclosingWidget(e.target);
			for(var n = e.target; n !== item.domNode; n = n.parentNode){
				if(n === item.deleteIconNode){
					connect.publish("/dojox/mobile/deleteListItem", [item]);
					break;
				}
			}
		},

		onClick: function(/*Event*/ /*===== e =====*/){
			// summary:
			//		User defined function to handle clicks
			// tags:
			//		callback
		},

		onTouchStart: function(e){
			if(this.getChildren().length <= 1){ return; }
			if(!this._blankItem){
				this._blankItem = new ListItem();
			}
			var item = this._movingItem = registry.getEnclosingWidget(e.target);
			var rightIconPressed = false;
			for(var n = e.target; n !== item.domNode; n = n.parentNode){
				if(n === item.rightIconNode){
					rightIconPressed = true;
					break;
				}
			}
			if(!rightIconPressed){ return; }
			var ref = item.getNextSibling();
			ref = ref ? ref.domNode : null;
			this.domNode.insertBefore(this._blankItem.domNode, ref);
			this._setupMoveItem(item.domNode);
			this.domNode.appendChild(item.domNode);

			if(!this._conn){
				this._conn = [];
				this._conn.push(connect.connect(this.domNode, has('touch') ? "ontouchmove" : "onmousemove", this, "onTouchMove"));
				this._conn.push(connect.connect(this.domNode, has('touch') ? "ontouchend" : "onmouseup", this, "onTouchEnd"));
			}
			this._pos = [];
			array.forEach(this.getChildren(), function(c, index){
				this._pos.push(domGeometry.position(c.domNode, true).y);
			}, this);
			this.touchStartY = e.touches ? e.touches[0].pageY : e.pageY;
			this._startTop = domGeometry.getMarginBox(item.domNode).t;
			event.stop(e);
		},

		onTouchMove: function(e){
			var y = e.touches ? e.touches[0].pageY : e.pageY;
			var index = this._pos.length - 1;
			for(var i = 1; i < this._pos.length; i++){
				if(y < this._pos[i]){
					index = i - 1;
					break;
				}
			}
			var item = this.getChildren()[index];
			var blank = this._blankItem;
			if(item !== blank){
				var p = item.domNode.parentNode;
				if(item.getIndexInParent() < blank.getIndexInParent()){
					p.insertBefore(blank.domNode, item.domNode);
				}else{
					p.insertBefore(item.domNode, blank.domNode);
				}
			}
			this._movingItem.domNode.style.top = this._startTop + (y - this.touchStartY) + "px";
		},

		onTouchEnd: function(e){
			var ref = this._blankItem.getNextSibling();
			ref = ref ? ref.domNode : null;
			this.domNode.insertBefore(this._movingItem.domNode, ref);
			this.domNode.removeChild(this._blankItem.domNode);
			this._resetMoveItem(this._movingItem.domNode);

			array.forEach(this._conn, connect.disconnect);
			this._conn = null;
		},

		startEdit: function(){
			this.isEditing = true;
			domClass.add(this.domNode, "mblEditableRoundRectList");
			array.forEach(this.getChildren(), function(child){
				if(!child.deleteIconNode){
					child.set("rightIcon", this.rightIconForEdit);
					child.set("deleteIcon", this.deleteIconForEdit);
				}
				child.rightIconNode.style.display = "";
				child.deleteIconNode.style.display = "";
			}, this);
			if(!this._handles){
				this._handles = [];
				this._handles.push(this.connect(this.domNode, has('touch') ? "ontouchstart" : "onmousedown", "onTouchStart"));
				this._handles.push(this.connect(this.domNode, "onclick", "_onClick"));
			}
		},

		endEdit: function(){
			this.isEditing = false;
			domClass.remove(this.domNode, "mblEditableRoundRectList");
			array.forEach(this.getChildren(), function(child){
				child.rightIconNode.style.display = "none";
				child.deleteIconNode.style.display = "none";
			});
			if(this._handles){
				array.forEach(this._handles, this.disconnect, this);
				this._handles = null;
			}
		}
	});
});
