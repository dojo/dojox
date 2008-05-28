dojo.provide("dojox.grid._Layout");
dojo.require("dojox.grid.cells");
dojo.require("dojox.grid._RowSelector");

dojo.declare("dojox.grid._Layout", null, {
	// summary:
	//	Controls grid cell layout. Owned by grid and used internally.
	constructor: function(inGrid){
		this.grid = inGrid;
	},
	// flat array of grid cells
	cells: [],
	// structured array of grid cells
	structure: null,
	// default cell width
	defaultWidth: '6em',
	// methods
	setStructure: function(inStructure){
		this.fieldIndex = 0;
		this.cells = [];
		var s = this.structure = [];
		if(this.grid.rowSelector){
			var sel = { type: dojox._scopeName + ".grid._RowSelector" };

			if(dojo.isString(this.grid.rowSelector)){
				var width = this.grid.rowSelector;

				if(width == "false"){
					sel = null;
				}else if(width != "true"){
					sel['width'] = width;
				}
			}else{
				if(!this.grid.rowSelector){
					sel = null;
				}
			}

			if(sel){
				s.push(this.addViewDef(sel));
			}
		}

		if(dojo.isArray(inStructure)){
			for(var i=0, st; (st=inStructure[i]); i++){
				if(dojo.isArray(st)){
					// it's an array or array of arrays defining cells
					s.push(this.addViewDef({ cells: inStructure }));
					break;
				}else{
					if("name" in st || "field" in st || "get" in st){
						// it's a cell object
						s.push(this.addViewDef({ cells: inStructure }));
						break;
					}else{
						// it's a view object
						s.push(this.addViewDef(st));
					}
				}
			}
		}else if(inStructure != null && dojo.isObject(inStructure) &&
				 ("cells" in inStructure || "rows" in inStructure || "type" in inStructure)){
			// it's a view object
			s.push(this.addViewDef(inStructure));
		}

		this.cellCount = this.cells.length;
	},
	addViewDef: function(inDef){
		this._defaultCellProps = inDef.defaultCell || {};
		return dojo.mixin({}, inDef, {rows: this.addRowsDef(inDef.rows || inDef.cells)});
	},
	addRowsDef: function(inDef){
		var result = [];
		if(dojo.isArray(inDef)){
			if(dojo.isArray(inDef[0])){
				for(var i=0, row; inDef && (row=inDef[i]); i++){
					result.push(this.addRowDef(i, row));
				}
			}else{
				result.push(this.addRowDef(0, inDef));
			}
		}
		return result;
	},
	addRowDef: function(inRowIndex, inDef){
		var result = [];
		for(var i=0, def, cell; (def=inDef[i]); i++){
			cell = this.addCellDef(inRowIndex, i, def);
			result.push(cell);
			this.cells.push(cell);
		}
		return result;
	},
	addCellDef: function(inRowIndex, inCellIndex, inDef){
		var w = 0;
		if(inDef.colSpan > 1){
			w = 0;
		}else if(!isNaN(inDef.width)){
			w = inDef.width + "em";
		}else{
			w = inDef.width || this.defaultWidth;
		}
		var cell_type = inDef.type || this._defaultCellProps.type || dojox.grid.cells.Cell;
		return new cell_type(
			dojo.mixin({}, this._defaultCellProps, inDef, {
				grid: this.grid,
				subrow: inRowIndex,
				layoutIndex: inCellIndex,
				index: this.cells.length,
				unitWidth: w
			}));
	}
});
