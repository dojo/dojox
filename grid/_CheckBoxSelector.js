dojo.provide("dojox.grid._CheckBoxSelector");

dojo.require("dojox.grid.Selection");
dojo.require("dojox.grid._View");
dojo.require("dojox.grid._Builder");

(function(){
	dojox.grid._CheckBoxSelectorHeaderBuilder = dojo.extend(function(view){
		dojox.grid._HeaderBuilder.call(this, view);
	},dojox.grid._HeaderBuilder.prototype,{
		generateHtml: function(){
			var w = this.view.contentWidth || 0;
			var selectedCount = this.view.grid.selection.getSelectedCount();
			var checked = (selectedCount == this.view.grid.rowCount) ? 'checked="true" ':'';
			return '<table style="width:' + w + 'px;" ' +
				'border="0" cellspacing="0" cellpadding="0" ' +
				'role="' + (dojo.isFF<3 ? "wairole:" : "") + 'presentation"><tr><th>' +
				'<div><input type="checkbox" ' + checked + '/></div></th></tr></table>';
		},
		doclick: function(e){
			var input = dojo.query('input', this.view.headerNode)[0];
			var selectedCount = this.view.grid.selection.getSelectedCount();

			if(selectedCount==this.view.grid.rowCount){
				this.view.grid.selection.deselectAll();
			}else{
				this.view.grid.selection.selectRange(0, this.view.grid.rowCount-1);
			}
			return true;
		}
	});

	dojox.grid._CheckBoxSelectorContentBuilder = dojo.extend(function(view){
		dojox.grid._ContentBuilder.call(this, view);
	},dojox.grid._ContentBuilder.prototype,{
		generateHtml: function(inDataIndex, inRowIndex){
			var w = this.view.contentWidth || 0;
			return '<table class="dojoxGridRowbarTable" style="width:' + w + 'px;" border="0" ' + 
				'cellspacing="0" cellpadding="0" role="'+(dojo.isFF<3 ? "wairole:" : "")+'presentation"><tr>' + 
				'<td class="dojoxGridRowbarInner"><input type="checkbox" ' +
				(!!this.view.grid.selection.isSelected(inRowIndex)?'checked="true" ':'') + '/></td></tr></table>';
		},
		findTarget: function(){
			var t = dojox.grid._ContentBuilder.prototype.findTarget.apply(this, arguments);
			return t;
		},
		domouseover: function(e){
			this.view.grid.onMouseOverRow(e);
		},
		domouseout: function(e){
			if(!this.isIntraRowEvent(e)){
				this.view.grid.onMouseOutRow(e);
			}
		},
		doclick: function(e){
			var idx = e.rowIndex;
			var selected = this.view.grid.selection.isSelected(idx);

			if(!selected){
				this.view.grid.selection.addToSelection(idx);
			}else{
				this.view.grid.selection.deselect(idx);
			}

			return true;
		}
	});

	dojo.declare("dojox.grid._CheckBoxSelector", dojox.grid._View, {
		// summary:
		//	Custom grid view. If used in a grid structure, provides a small selectable region for grid rows.
		defaultWidth: "2em",
		noscroll: true,
		padBorderWidth: 2,

		_headerBuilderClass: dojox.grid._CheckBoxSelectorHeaderBuilder,
		_contentBuilderClass: dojox.grid._CheckBoxSelectorContentBuilder,

		postCreate: function(){
			this.inherited(arguments);
			this.connect(this.grid.selection, 'onSelected', 'onSelected');
			this.connect(this.grid.selection, 'onDeselected', 'onDeselected');
		},
		buildRendering: function(){
			this.inherited(arguments);
			this.scrollboxNode.style.overflow = "hidden";
		},	
		getWidth: function(){
			return this.viewWidth || this.defaultWidth;
		},
		resize: function(){
			this.adaptHeight();
		},
		setStructure: function(s){
			this.inherited(arguments);
			if(s.defaultWidth){
				this.defaultWidth = s.defaultWidth;
			}
		},
		adaptWidth: function(){
			// Only calculate this here - rather than every call to buildRowContent
			if(!("contentWidth" in this) && this.contentNode){
				this.contentWidth = this.contentNode.offsetWidth - this.padBorderWidth;
			}
		},
		// styling
		doStyleRowNode: function(inRowIndex, inRowNode){
			var n = [ "dojoxGridRowbar dojoxGridNonNormalizedCell" ];
			if(this.grid.rows.isOver(inRowIndex)){
				n.push("dojoxGridRowbarOver");
			}
			if(this.grid.selection.isSelected(inRowIndex)){
				n.push("dojoxGridRowbarSelected");
			}
			inRowNode.className = n.join(" ");
		},
		// event handlers
		onSelected: function(inIndex){
			this.grid.updateRow(inIndex);
		},
		onDeselected: function(inIndex){
			this.grid.updateRow(inIndex);
		}
	});
	if(!dojox.grid._View.prototype._headerBuilderClass &&
		!dojox.grid._View.prototype._contentBuilderClass){
		dojox.grid._CheckBoxSelector.prototype.postCreate = function(){
			this.connect(this.scrollboxNode,"onscroll","doscroll");
			dojox.grid.util.funnelEvents(this.contentNode, this, "doContentEvent", [ 'mouseover', 'mouseout', 'click', 'dblclick', 'contextmenu', 'mousedown' ]);
			dojox.grid.util.funnelEvents(this.headerNode, this, "doHeaderEvent", [ 'dblclick', 'mouseover', 'mouseout', 'mousemove', 'mousedown', 'click', 'contextmenu' ]);
			this.content = new this._contentBuilderClass(this);
			this.header = new this._headerBuilderClass(this);
			//BiDi: in RTL case, style width='9000em' causes scrolling problem in head node
			if(!dojo._isBodyLtr()){
				this.headerNodeContainer.style.width = "";
			}
			this.connect(this.grid.selection, 'onSelected', 'onSelected');
			this.connect(this.grid.selection, 'onDeselected', 'onDeselected');
		}
	}
})();
