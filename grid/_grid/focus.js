dojo.provide("dojox.grid._grid.focus");

// focus management
dojo.declare("dojox.grid.focus", null, {
	constructor: function(inGrid){
		this.grid = inGrid;
		this.cell = null;
		this.rowIndex = -1;
		dojo.connect(this.grid.domNode, "onfocus", this, "doFocus");
	},
	tabbingOut: false,
	focusClass: "dojoxGrid-cell-focus",
	focusView: null,
	initFocusView: function(){
		this.focusView = this.grid.views.getFirstScrollingView();
	},
	isFocusCell: function(inCell, inRowIndex){
		return (this.cell == inCell) && (this.rowIndex == inRowIndex);
	},
	isLastFocusCell: function(){
		return (this.rowIndex == this.grid.rowCount-1) && (this.cell.index == this.grid.layout.cellCount-1);
	},
	isFirstFocusCell: function(){
		return (this.rowIndex == 0) && (this.cell.index == 0);
	},
	isNoFocusCell: function(){
		return (this.rowIndex < 0) || !this.cell;
	},
	_focusifyCellNode: function(inBork){
		var n = this.cell && this.cell.getNode(this.rowIndex);
		if(n){
			dojo.toggleClass(n, this.focusClass, inBork);
		}
	},
	styleRow: function(inRow){
		if(inRow.index == this.rowIndex){
			this._focusifyCellNode(true);
		}
	},
	setFocusIndex: function(inRowIndex, inCellIndex){
		this.setFocusCell(this.grid.getCell(inCellIndex), inRowIndex);
	},
	setFocusCell: function(inCell, inRowIndex){
		if(!this.isFocusCell(inCell, inRowIndex)){
			this.tabbingOut = false;
			this.focusGrid();
			this._focusifyCellNode(false);
			this.cell = inCell;
			this.rowIndex = inRowIndex;
			this._focusifyCellNode(true);
		}
		// even if this cell isFocusCell, the document focus may need to be rejiggered
		// call opera on delay to prevent keypress from altering focus
		if(dojo.isOpera){
			setTimeout(dojo.hitch(this.grid, 'onCellFocus', this.cell, this.rowIndex), 1);
		}else{
			this.grid.onCellFocus(this.cell, this.rowIndex);
		}
	},
	next: function(){
		var row=this.rowIndex, col=this.cell.index+1, cc=this.grid.layout.cellCount-1, rc=this.grid.rowCount-1;
		if(col > cc){
			col = 0;
			row++;
		}
		if(row > rc){
			col = cc;
			row = rc;
		}
		this.setFocusIndex(row, col);
	},
	previous: function(){
		var row=(this.rowIndex || 0), col=(this.cell.index || 0) - 1;
		if(col < 0){
			col = this.grid.layout.cellCount-1;
			row--;
		}
		if(row < 0){
			row = 0;
			col = 0;
		}
		this.setFocusIndex(row, col);
	},
	previousKey: function(e){
		if(this.isFirstFocusCell()){
			this.tabOut(this.grid.domNode);
		}else{
			dojo.stopEvent(e);
			this.previous();
		}
	},
	nextKey: function(e) {
		if(this.isLastFocusCell()){
			this.tabOut(this.grid.lastFocusNode);
		}else{
			dojo.stopEvent(e);
			this.next();
		}
	},
	tabOut: function(inFocusNode){
		this.tabbingOut = true;
		inFocusNode.focus();
	},
	focusGrid: function(){
		dojox.grid.fire(this.focusView, "focus");
	},
	doFocus: function(e){
		// trap focus only for grid dom node
		if(e && e.target != e.currentTarget){
			return;
		}
		// do not focus for scrolling if grid is about to blur
		if(!this.tabbingOut && this.isNoFocusCell()){
			// establish our virtual-focus, if necessary
			this.setFocusIndex(0, 0);
		}
		this.tabbingOut = false;
	}
});