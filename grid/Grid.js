dojo.provide("dojox.grid.Grid");
dojo.require("dojox.grid.VirtualGrid");
dojo.require("dojox.grid._data.model");
dojo.require("dojox.grid._data.editors");

dojo.declare('dojox.Grid', dojox.VirtualGrid, {
	//	summary:
	//		A grid widget with virtual scrolling, cell editing, complex rows,
	//		sorting, fixed columns, sizeable columns, etc.
	//	description:
	//		Grid is a subclass of VirtualGrid, providing binding to a data
	//		store.
	//	example:
	//		define the grid structure:
	//	|	var structure = [ // array of view objects
	//	|		{ cells: [// array of rows, a row is an array of cells
	//	|			[	{ name: "Alpha", width: 6 }, 
	//	|				{ name: "Beta" }, 
	//	|				{ name: "Gamma", get: formatFunction }
	//	|			]
	//	|		]}
	//	|	];
	//	  	
	//		define a grid data model
	//	|	var model = new dojox.grid.data.table(null, data);
	//	|
	//	|	<div id="grid" model="model" structure="structure" 
	//	|		dojoType="dojox.VirtualGrid"></div>
	//	

	//	model:
	//		string or object grid data model
	model: 'dojox.grid.data.table',
	postCreate: function(){
		console.debug(this.model);
		if(this.model){
			var m;
			if(dojo.isString(this.model)){
				m = dojo.getObject(this.model);
			}
			this.model = (dojo.isFunction(m)) ? new m() : m;
			console.debug(this.model);
			this._setModel(this.model);
		}
		this.inherited(arguments);
	},
	// model
	_setModel: function(inModel){
		this.model = inModel;
		if(this.model){
			this.model.observer(this);
			this.measureModel();
		}
	},
	destroy: function(){
		this.model.unobserver(this);
	},
	setModel: function(inModel){
		// summary:
		//	set the grid's data model
		// inModel: model object
		if (this.model) 
			this.model.unobserver(this);
		this._setModel(inModel);
	},
	measureModel: function(){
		if(this.model){
			this.model.measure();
		}
	},
	// data socket (called in cell's context)
	get: function(inRowIndex){
		return this.grid.model.getDatum(inRowIndex, this.fieldIndex);
	},
	// model modifications
	modelAllChange: function(){
		this.rowCount = (this.model ? this.model.getRowCount() : 0);
		this.updateRowCount(this.rowCount);
	},
	modelRowChange: function(inData, inRowIndex){
		this.updateRow(inRowIndex);
	},
	modelDatumChange: function(inDatum, inRowIndex, inFieldIndex){
		this.updateRow(inRowIndex);
	},
	// model insertion
	modelInsertion: function(inRowIndex){
		this.updateRowCount(this.model.getRowCount());
	},
	// model removal
	modelRemoval: function(inKeys){
		this.updateRowCount(this.model.getRowCount());
	},
	// utility
	refresh: function(){
		// summary:
		//	re-render the grid, getting new data from the model
		this.edit.cancel();
		this.model.measure();
	},
	// sorting
	canSort: function(inSortInfo){
		var f = this.getSortField(inSortInfo);
		// 0 is not a valid sort field
		return f && this.model.canSort(f);
	},
	getSortField: function(inSortInfo){
		// summary:
		//	retrieves the model field on which to sort data.
		// inSortInfo: int
		//	1-based grid column index; positive if sort is ascending, otherwise negative
		var c = this.getCell(this.getSortIndex(inSortInfo));
		// we expect c.fieldIndex == -1 for non model fields
		// that yields a getSortField value of 0, which can be detected as invalid
		return (c.fieldIndex+1) * (this.sortInfo > 0 ? 1 : -1);
	},
	sort: function(){
		this.edit.apply();
		this.model.sort(this.getSortField());
	},
	// row editing
	addRow: function(inRowData, inIndex){
		this.edit.apply();
		var i = inIndex || -1;
		if(i<0){
			i = this.selection.getFirstSelected() || 0;
		}
		if(i<0){
			i = 0;
		}
		this.model.insert(inRowData, i);
		this.model.beginModifyRow(i);
		// begin editing row
		// FIXME: add to edit
		for(var j=0, c; ((c=this.getCell(j)) && !c.editor); j++){}
		if(c&&c.editor){
			this.edit.setEditCell(c, i);
		}
	},
	removeSelectedRows: function(){
		this.edit.apply();
		var s = this.selection.getSelected();
		if(s.length){
			this.model.remove(s);
			this.selection.clear();
		}
	},
	//: protected
	// editing
	canEdit: function(inCell, inRowIndex){
		// summary: 
		//	determines if a given cell may be edited
		//	inCell: grid cell
		// inRowIndex: grid row index
		// returns: true if given cell may be edited
		return (this.model.canModify ? this.model.canModify(inRowIndex) : true);
	},
	doStartEdit: function(inCell, inRowIndex){
		//console.log("doStartEdit [Row]", inRowIndex);
		var edit = this.canEdit(inCell, inRowIndex);
		if(edit){
			this.model.beginModifyRow(inRowIndex);
			this.onStartEdit(inCell, inRowIndex);
		}
		return edit;
	},
	doApplyCellEdit: function(inValue, inRowIndex, inFieldIndex){
		this.model.setDatum(inValue, inRowIndex, inFieldIndex);
		this.onApplyCellEdit(inValue, inRowIndex, inFieldIndex);
	},
	doCancelEdit: function(inRowIndex){
		this.model.cancelModifyRow(inRowIndex);
		this.onCancelEdit.apply(this, arguments);
	},
	doApplyEdit: function(inRowIndex){
		this.model.endModifyRow(inRowIndex);
		this.onApplyEdit(inRowIndex);
	},
	// Perform row styling 
	styleRowState: function(inRow){
		if(this.model.getState){
			var states=this.model.getState(inRow.index), c='';
			for(var i=0, ss=["inflight", "error", "inserting"], s; s=ss[i]; i++){
				if(states[s]){
					c = ' dojoxGrid-row-' + s;
					break;
				}
			}
			inRow.customClasses += c;
		}
	},
	onStyleRow: function(inRow){
		this.styleRowState(inRow);
		this.inherited(arguments);
	},
	junk: 0
});
