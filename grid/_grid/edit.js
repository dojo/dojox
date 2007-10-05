dojo.provide("dojox.grid._grid.edit");

dojo.declare("dojox.grid.edit", null, {
	constructor: function(inGrid){
		this.grid = inGrid;
		this.connections = [];
		if(dojo.isIE){
			this.connections.push(dojo.connect(document.body, "onfocus", dojo.hitch(this, "_boomerangFocus")));
		}
	},
	info: {},
	destroy: function(){
		dojo.forEach(this.connections, function(c){
			dojo.disconnect(c);
		});
	},
	cellFocus: function(inCell, inRowIndex){
		if(this.grid.singleClickEdit || this.isEditRow(inRowIndex)){
			// if same row or quick editing, edit
			this.setEditCell(inCell, inRowIndex);
		}else{
			// otherwise, apply any pending row edits
			this.apply();
		}
		// if dynamic or static editing...
		if(this.isEditing() || (inCell.editor||0).static){
			// let the editor focus itself as needed
			this._focusEditor(inCell, inRowIndex);
		}
	},
	rowClick: function(e){
		if(this.isEditing() && !this.isEditRow(e.rowIndex)){
			this.apply();
		}
	},
	styleRow: function(inRow){
		if(inRow.index == this.info.rowIndex){
			inRow.customClasses += ' dojoxGrid-row-editing';
		}
	},
	dispatchEvent: function(e){
		var c = e.cell, ed = c && c.editor;
		return ed && ed.dispatchEvent(e.dispatch, e);
	},
	// Editing
	isEditing: function(){
		return this.info.rowIndex !== undefined;
	},
	isEditCell: function(inRowIndex, inCellIndex){
		return (this.info.rowIndex === inRowIndex) && (this.info.cell.index == inCellIndex);
	},
	isEditRow: function(inRowIndex){
		return this.info.rowIndex === inRowIndex;
	},
	setEditCell: function(inCell, inRowIndex){
		if(!this.isEditCell(inRowIndex, inCell.index)){
			var editing = !(inCell.editor||0).static || (inRowIndex == this.info.rowIndex);
			this.start(inCell, inRowIndex, editing);
		}
	},
	_focusEditor: function(inCell, inRowIndex){
		dojox.grid.fire(inCell.editor, "focus", [inRowIndex]);
	},
	focusEditor: function(){
		if(this.isEditing()){
			this._focusEditor(this.info.cell, this.info.rowIndex);
		}
	},
	// implement fix for focus boomerang effect on IE
	_boomerangWindow: 500,
	_shouldCatchBoomerang: function(){
		return this._catchBoomerang > new Date().getTime();
	},
	_boomerangFocus: function(){
		//console.log("_boomerangFocus");
		if(this._shouldCatchBoomerang()){
			// make sure we don't utterly lose focus
			this.grid.focus.focusGrid();
			// let the editor focus itself as needed
			this.focusEditor();
			// only catch once
			this._catchBoomerang = 0;
			//console.log("_boomerangFocus: caught boomerang");
		}
	},
	_doCatchBoomerang: function(){
		// give ourselves a few ms to boomerang IE focus effects
		if(dojo.isIE){this._catchBoomerang = new Date().getTime() + this._boomerangWindow;}
	},		
	// end boomerang fix API
	start: function(inCell, inRowIndex, inEditing){
		this.grid.beginUpdate();
		this.editorApply();
		if(this.isEditing() && !this.isEditRow(inRowIndex)){
			this.applyRowEdit();
			this.grid.updateRow(inRowIndex);
		}
		if(inEditing){
			this.info = { cell: inCell, rowIndex: inRowIndex };
			this.grid.doStartEdit(inCell, inRowIndex); 
			this.grid.updateRow(inRowIndex);
		}else{
			this.info = {};
		}
		this.grid.endUpdate();
		// make sure we don't utterly lose focus
		this.grid.focus.focusGrid();
		// let the editor focus itself as needed
		this._focusEditor(inCell, inRowIndex);
		// give ourselves a few ms to boomerang IE focus effects
		this._doCatchBoomerang();
	},
	_editorDo: function(inMethod){
		var c = this.info.cell
		//c && c.editor && c.editor[inMethod](c, this.info.rowIndex);
		c && c.editor && c.editor[inMethod](this.info.rowIndex);
	},
	editorApply: function(){
		this._editorDo("apply");
	},
	editorCancel: function(){
		this._editorDo("cancel");
	},
	applyCellEdit: function(inValue, inCell, inRowIndex){
		this.grid.doApplyCellEdit(inValue, inRowIndex, inCell.fieldIndex);
	},
	applyRowEdit: function(){
		this.grid.doApplyEdit(this.info.rowIndex);
	},
	apply: function(){
		if(this.isEditing()){
			this.grid.beginUpdate();
			this.editorApply();
			this.applyRowEdit();
			this.info = {};
			this.grid.endUpdate();
			this.grid.focus.focusGrid();
			this._doCatchBoomerang();
		}
	},
	cancel: function(){
		if(this.isEditing()){
			this.grid.beginUpdate();
			this.editorCancel();
			this.info = {};
			this.grid.endUpdate();
			this.grid.focus.focusGrid();
			this._doCatchBoomerang();
		}
	},
	save: function(inRowIndex, inView){
		var c = this.info.cell;
		if(this.isEditRow(inRowIndex) && (!inView || c.view==inView)){
			c.editor.save(c, this.info.rowIndex);
		}
	},
	restore: function(inView, inRowIndex){
		var c = this.info.cell;
		if(this.isEditRow(inRowIndex) && c.view == inView){
			c.editor.restore(c, this.info.rowIndex);
		}
	}
});