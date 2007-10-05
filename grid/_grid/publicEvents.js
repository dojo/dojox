dojo.provide("dojox.grid._grid.publicEvents");

dojox.grid.publicEvents = {
	cellOverClass: "dojoxGrid-cell-over",
	//: public
	// top level handlers (more specifid handlers below)
	onKeyEvent: function(e){
		this.dispatchKeyEvent(e);
	},
	onContentEvent: function(e){
		this.dispatchContentEvent(e);
	},
	onHeaderEvent: function(e){
		this.dispatchHeaderEvent(e);
	},
	//$ Perform row styling 
	onStyleRow: function(inRow){
		with(inRow){
			customClasses += (odd?" dojoxGrid-row-odd":"") + (selected?" dojoxGrid-row-selected":"") + (over?" dojoxGrid-row-over":"");
		}
		this.focus.styleRow(inRow);
		this.edit.styleRow(inRow);
	},
	onKeyDown: function(e){
		if(e.altKey || e.ctrlKey || e.metaKey /*|| !this.isEditing()*/){
			return;
		}
		switch(e.keyCode){
			case dojo.keys.ESCAPE:
				this.edit.cancel();
				break;
			case dojo.keys.ENTER:
				if (!e.shiftKey)
					this.edit.apply();
				break;
			case dojo.keys.TAB:
				this.focus[e.shiftKey ? 'previousKey' : 'nextKey'](e);
				break;
		}
	},
	onMouseOver: function(e){
		e.rowIndex == -1 ? this.onHeaderCellMouseOver(e) : this.onCellMouseOver(e);
	},
	onMouseOut: function(e){
		e.rowIndex == -1 ? this.onHeaderCellMouseOut(e) : this.onCellMouseOut(e);
	},
	onMouseOverRow: function(e){
		if(!this.rows.isOver(e.rowIndex)){
			this.rows.setOverRow(e.rowIndex);
			e.rowIndex == -1 ? this.onHeaderMouseOver(e) : this.onRowMouseOver(e);
		}
	},
	onMouseOutRow: function(e){
		//console.log("onMouseOutRow: " + this.rows.overRow);
		if(this.rows.isOver(-1)){
			this.onHeaderMouseOut(e);
		}else if(!this.rows.isOver(-2)){
			this.rows.setOverRow(-2);
			this.onRowMouseOut(e);
		}
	},
	// cell events
	onCellMouseOver: function(e){
		dojo.addClass(e.cellNode, this.cellOverClass);
	},
	onCellMouseOut: function(e){
		dojo.removeClass(e.cellNode, this.cellOverClass);
	},
	onCellClick: function(e){
		this.focus.setFocusCell(e.cell, e.rowIndex);
		this.onRowClick(e);
	},
	onCellDblClick: function(e){
		this.edit.setEditCell(e.cell, e.rowIndex); 
		this.onRowDblClick(e);
	},
	onCellContextMenu: function(e){
		this.onRowContextMenu(e);
	},
	onCellFocus: function(inCell, inRowIndex){
		this.edit.cellFocus(inCell, inRowIndex);
	},
	// row events
	onRowClick: function(e){
		this.edit.rowClick(e);
		this.selection.clickSelectEvent(e);
	},
	onRowDblClick: function(e){
	},
	onRowMouseOver: function(e){
	},
	onRowMouseOut: function(e){
	},
	onRowContextMenu: function(e){
		dojo.stopEvent(e);
	},
	// header events
	onHeaderMouseOver: function(e){
	},
	onHeaderMouseOut: function(e){
	},
	onHeaderCellMouseOver: function(e){
		dojo.addClass(e.cellNode, this.cellOverClass);
	},
	onHeaderCellMouseOut: function(e){
		dojo.removeClass(e.cellNode, this.cellOverClass);
	},
	onHeaderClick: function(e){
	},
	onHeaderCellClick: function(e){
		this.setSortIndex(e.cell.index);
		this.onHeaderClick(e);
	},
	onHeaderDblClick: function(e){
	},
	onHeaderCellDblClick: function(e){
		this.onHeaderDblClick(e);
	},
	onHeaderCellContextMenu: function(e){
		this.onHeaderContextMenu(e);
	},
	onHeaderContextMenu: function(e){
		dojo.stopEvent(e);
	},
	// editing
	onStartEdit: function(inCell, inRowIndex){
	},
	onApplyCellEdit: function(inValue, inRowIndex, inFieldIndex){
	},
	onCancelEdit: function(inRowIndex){
	},
	onApplyEdit: function(inRowIndex){
	}
}