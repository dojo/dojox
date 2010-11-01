dojo.provide("dojox.grid.enhanced.plugins.IndirectSelection");

dojo.require("dojox.grid.cells.dijit");
dojo.require("dojox.grid.enhanced._Plugin");

dojo.declare("dojox.grid.enhanced.plugins.IndirectSelection", dojox.grid.enhanced._Plugin, {
	// summary:
	//		Provides indirect selection feature - swipe selecting row(s)

	// description:
	//		For better rendering performance, div(images) are used to simulate radio button|check boxes
	//	
	// example:
	//		<div dojoType="dojox.grid.EnhancedGrid" plugins="{indirectSelection: true}" ...></div>
	//		or <div dojoType="dojox.grid.EnhancedGrid" plugins="{indirectSelection: {name: 'xxx', width:'30px', styles:'text-align: center;'}}" ...></div>	

	//name: String
	//		Plugin name
	name: "indirectSelection",
	
	constructor: function(){
		//Hook layout.setStructure(), so that indirectSelection is always included
		var layout = this.grid.layout;
		this.connect(layout, 'setStructure', dojo.hitch(layout, this.addRowSelectCell, this.option));
	},
	addRowSelectCell: function(option){
		// summary:
		//		Add indirectSelection cell(mapped to a column of radio button|check boxes)
		if(!this.grid.indirectSelection || this.grid.selectionMode == 'none'){
			return;
		}
		var rowSelectCellAdded = false, inValidFields = ['get', 'formatter', 'field', 'fields'],
		defaultCellDef = {type: dojox.grid.cells.MultipleRowSelector, name: '', editable: true, width:'30px',
					styles:'text-align: center;', notselectable: true, filterable: false, navigatable: true};
		if(option.headerSelector){ option.name = ''; }//mutual conflicting attrs

		if(this.grid.rowSelectCell){//remove the existed one
			defaultCellDef.defaultValue = this.grid.rowSelectCell.defaultValue;
			this.grid.rowSelectCell.destroy();
		}
		
		dojo.forEach(this.structure, dojo.hitch(this, function(view){
			var cells = view.cells;
			if(cells && cells.length > 0 && !rowSelectCellAdded){
				var firstRow = cells[0];
				if(firstRow[0] && firstRow[0].isRowSelector){
					console.debug('addRowSelectCell() - row selector cells already added, return.');
					rowSelectCellAdded = true;
					return;
				}
				var selectDef, cellType = this.grid.selectionMode == 'single' ? dojox.grid.cells.SingleRowSelector : dojox.grid.cells.MultipleRowSelector;
				selectDef = dojo.mixin(defaultCellDef, option, {type: cellType, editable: true});
				dojo.forEach(inValidFields, function(field){//remove invalid fields
					if(field in selectDef){ delete selectDef[field]; }
				});
				if(cells.length > 1){ selectDef.rowSpan = cells.length; }//for complicate layout
				dojo.forEach(this.cells, function(cell, i){
					if(cell.index >= 0){
						cell.index += 1;
						//console.debug('cell '+ (cell.index - 1) +  ' is updated to index ' + cell.index);
					}else{
						console.debug('Error:IndirectSelection.addRowSelectCell()-  cell ' + i + ' has no index!');
					}
				});
				var rowSelectCell = this.addCellDef(0, 0, selectDef);
				rowSelectCell.index = 0;
				firstRow.unshift(rowSelectCell);
				this.cells.unshift(rowSelectCell);
				this.grid.rowSelectCell = rowSelectCell;
				rowSelectCellAdded = true;
			}			
		}));		
		this.cellCount = this.cells.length;
	},
	destroy: function(){
		this.grid.rowSelectCell.destroy();
		delete this.grid.rowSelectCell;
		this.inherited(arguments);
	}	
});

dojo.declare("dojox.grid.cells.RowSelector", dojox.grid.cells._Widget, {
	// summary:
	//		 Common attributes & functions for row selectors(Radio|CheckBox)

	//inputType: String
	//		Input type - Radio|CheckBox
	inputType: "",	
	
	//map: Object
	//		Cache div refs of radio|checkbox to avoid querying each time
	map: null,
	
	//disabledMap: Object
	//		Cache index of disabled rows
	disabledMap: null,
	
	//isRowSelector: Boolean
	//		Marker of indirectSelection cell(column)
	isRowSelector: true,

	//defaultChecked: Boolean
	//		Default value for radio or checkbox
	//defaultChecked: false,
	
	//_connects: Array
	//		List of all connections.
	_connects: null,
	
	//_subscribes: Array
	//		List of all subscribes.
	_subscribes: null,

	//checkedText: String
	//		Checked character for high contrast mode
	checkedText: '&#8730;',

	//unCheckedText: String
	//		Unchecked character for high contrast mode	
	unCheckedText: 'O',

	constructor: function(){
		this.map = {}; this.disabledMap = {};
		this._connects = []; this._subscribes = [];
		this.inA11YMode = dojo.hasClass(dojo.body(), "dijit_a11y");
		
		this.baseClass = "dojoxGridRowSelector dijitReset dijitInline dijit" + this.inputType;
		this.checkedClass = " dijit" + this.inputType + "Checked";
		this.disabledClass = " dijit" + this.inputType + "Disabled";
		this.checkedDisabledClass = " dijit" + this.inputType + "CheckedDisabled";
		this.statusTextClass = " dojoxGridRowSelectorStatusText";//a11y use

		//this._subscribes.push(dojo.subscribe(this.grid.rowSelectionChangedTopic, this, this._selectionChanged));
		//this._subscribes.push(dojo.subscribe(this.grid.sortRowSelectionChangedTopic, this, this._selectionChanged));
		this._connects.push(dojo.connect(this.grid, 'dokeyup', this, '_dokeyup'));
		this._connects.push(dojo.connect(this.grid.selection, 'onSelected', this, '_onSelected'));
		this._connects.push(dojo.connect(this.grid.selection, 'onDeselected', this, '_onDeselected'));
		this._connects.push(dojo.connect(this.grid.scroller, 'invalidatePageNode', this, '_pageDestroyed'));
	},
	formatter: function(data, rowIndex){
		// summary:
		//		Overwritten, see dojox.grid.cells._Widget
		var clazz = this.baseClass;
		//var checked = this.getDefaultState(rowIndex);
		var checked = this.getValue(rowIndex);
		var disabled = !!this.disabledMap[rowIndex];//normalize 'undefined'
		
		if(checked){
			clazz += this.checkedClass;
			if(disabled){ clazz += this.checkedDisabledClass; }
		}else if(disabled){
			clazz += this.disabledClass;
		}
		return ["<div tabindex = -1 ",
				"id = '" + this.grid.id + "_rowSelector_" + rowIndex + "' ",
				"name = '" + this.grid.id + "_rowSelector' class = '" + clazz + "' ",
				"role = 'presentation' aria-pressed = '" + checked + "' aria-disabled = '" + disabled + "'>",
				"<span class = '" + this.statusTextClass + "'>" + (checked ? this.checkedText : this.unCheckedText) + "</span>",
				"</div>"].join("");
	},
	setValue: function(rowIndex, inValue){
		// summary:
		//		Overwritten, see dojox.grid.cells._Widget
		//		Simply return, no action
	},
	getValue: function(rowIndex){
		// summary:
		//		Overwritten, see dojox.grid.cells._Widget
		return this.grid.selection.isSelected(rowIndex);
	},
	getDefaultState: function(rowIndex){
		// summary:
		//		Get default value
		// rowIndex: Integer
		//		Row index of the widget			
		// return: Boolean
		//		True - checked | False - unchecked
		var checked = this.getValue(rowIndex);
		return (checked ? checked : this.defaultChecked);
	},
	toggleRow: function(index, value){
		// summary:
		//		toggle checked | unchecked state for given row
		// index: Integer
		//		Row index
		// value: Boolean
		//		True - checked | False - unchecked
		this._nativeSelect(index, value);
	},	
	setDisabled: function(index, disabled){
		// summary:
		//		toggle disabled | enabled state for given row
		// idx: Integer
		//		Row index
		// disabled: Boolean
		//		True - disabled | False - enabled
		this._toggleDisabledStyle(index, disabled);
	},
	doclick: function(e){
		// summary:
		//		Event handler for click event
		//      - from dojox.grid.cells._Base.dispatchEvent() 
		// e: Event
		//		Mouse down event
		this._selectRow(e);
		return true;//stop event bubbled
	},
	_dokeyup: function(e){
		// summary:
		//		Event handler for key up event
		//		- from dojox.grid.enhanced._Events.dokeyup()
		// e: Event
		//		Key up event
		if(e.cellIndex == this.index && e.rowIndex >= 0 && e.keyCode == dojo.keys.SPACE){
			this._selectRow(e);
		}
	},
	focus: function(rowIndex){
		// summary:
		//		Set focus to given row
		// rowIndex: Integer
		//		Target row			
		var selector = this.map[rowIndex];
		if(selector){ selector.focus(); }
	},
	_focusEndingCell: function(rowIndex, cellIndex){
		// summary:
		//		Set focus to the ending grid cell(rowIndex,cellIndex) when swipe selection finished
		// rowIndex: Integer
		//		Row index
		// cellIndex: Integer
		//		Column index							
		var cell = this.grid.getCell(cellIndex);
		this.grid.focus.setFocusCell(cell, rowIndex);
	},
	_nativeSelect: function(index, value){
		// summary:
		//		Use grid's native selection
		this.grid.selection[value ? 'select' : 'deselect'](index);
		//this._fireSelectionChanged();
	},
	_onSelected: function(index){
		// summary:
		//		Triggered when a row is selected
		this._toggleCheckedStyle(index, true);
	},
	_onDeselected: function(index){
		// summary:
		//		Triggered when a row is deselected
		this._toggleCheckedStyle(index, false);
	},
	_toggleCheckedStyle: function(index, value){
		// summary:
		//		Change css styles for checked | unchecked
		var selector = this._getSelector(index);
		if(selector){
			dojo.toggleClass(selector, this.checkedClass, value);
			if(this.disabledMap[index]){
				dojo.toggleClass(selector, this.checkedDisabledClass, value);
			}			
			dijit.setWaiState(selector, 'pressed', value);
			if(this.inA11YMode){
				dojo.attr(selector.firstChild, 'innerHTML', value ? this.checkedText : this.unCheckedText);
			}
		}
	},
	_toggleDisabledStyle: function(index, disabled){
		// summary:
		//		Change css styles for disabled | enabled	
		var selector = this._getSelector(index);
		if(selector){
			dojo.toggleClass(selector, this.disabledClass, disabled);
			if(this.getValue(index)){
				dojo.toggleClass(selector, this.checkedDisabledClass, disabled);
			}
			dijit.setWaiState(selector, 'disabled', disabled);
		}
		this.disabledMap[index] = disabled;
	},
	_getSelector: function(index){
		// summary:
		//		Find selector for given row caching it if 1st time founded		
		var selector = this.map[index];
		if(!selector){//use accurate query for better performance
			var rowNode = this.view.rowNodes[index];
			if(rowNode){
				selector = dojo.query('.dojoxGridRowSelector', rowNode)[0];
				if(selector){ this.map[index] = selector; }
			}
		}
		return selector;
	},
	_pageDestroyed: function(pageIndex){
		// summary:
		//		Explicitly empty map cache when a page destroyed
		//		See dojox.grid._Scroller.invalidatePageNode()
		// pageIndex: Integer
		//		Index of destroyed page
		var rowsPerPage = this.grid.scroller.rowsPerPage;
		var start = pageIndex * rowsPerPage, end = start + rowsPerPage - 1;
		for(var i = start; i <= end; i++){ 
			dojo.destroy(this.map[i]);
			delete this.map[i]; 
		}
		//console.log("Page ",pageIndex, " destroyed, Map=",this.map);
	},
	destroy: function(){
		for(var i in this.map){
			dojo.destroy(this.map[i]);
			delete this.map[i];
		}
		for(i in this.disabledMap){ delete this.disabledMap[i]; }
		dojo.forEach(this._connects, dojo.disconnect);
		dojo.forEach(this._subscribes, dojo.unsubscribe);
		delete this._connects;
		delete this._subscribes;
		console.log('Single(Multiple)RowSelector.destroy() executed!');
	}
});

dojo.declare("dojox.grid.cells.SingleRowSelector", dojox.grid.cells.RowSelector, {
	// summary:
	//		IndirectSelection cell(column) for single selection mode, using styles of dijit.form.RadioButton
	inputType: "Radio",

	_selectRow: function(e){
		// summary:
		//		Select the target row
		// e: Event
		//		Event fired on the target row		
		var index = e.rowIndex;
		if(this.disabledMap[index]){ return; }
		//dojo.stopEvent(e);
		this._focusEndingCell(index, 0);
		this._nativeSelect(index, !this.grid.selection.selected[index]);
		//this._fireSelectionChanged();
	}
});

dojo.declare("dojox.grid.cells.MultipleRowSelector", dojox.grid.cells.RowSelector, {
	// summary:
	//		Indirect selection cell for multiple or extended mode, using dijit.form.CheckBox
	inputType: "CheckBox",
	
	//swipeStartRowIndex: Integer
	//		Start row index for swipe selection
	swipeStartRowIndex: -1,

	//swipeMinRowIndex: Integer
	//		Min row index for swipe selection	
	swipeMinRowIndex: -1,
	
	//swipeMinRowIndex: Integer
	//		Max row index for swipe selection
	swipeMaxRowIndex: -1,
	
	//toSelect: Boolean
	//		new state for selection
	toSelect: false,
	
	//lastClickRowIdx: Integer
	//		Row index for last click, used for range selection via Shift + click	
	lastClickRowIdx: -1,
	
	//toggleAllTrigerred: Boolean
	//		Whether toggle all has been triggered or not	
	toggleAllTrigerred: false,
	
	unCheckedText: '&#9633;',	

	constructor: function(){
		this._connects.push(dojo.connect(dojo.doc, 'onmouseup', this, '_domouseup'));
		this._connects.push(dojo.connect(this.grid, 'onRowMouseOver', this, '_onRowMouseOver'));
		this._connects.push(dojo.connect(this.grid.focus, 'move', this, '_swipeByKey'));
		if(this.headerSelector){//option set by user to add a select-all checkbox in column header
			this._connects.push(dojo.connect(this.grid.views, 'render', this, '_addHeaderSelector'));
		}
	},
	toggleAllSelection:function(checked){
		// summary:
		//		Toggle select all|deselect all
		// checked: Boolean
		//		True - select all, False - deselect all
		var grid = this.grid, selection = grid.selection;
		if(checked){
			selection.selectRange(0, grid.rowCount-1);
		}else{
			selection.deselectAll();
		}
		//this.defaultChecked = checked;
		this.toggleAllTrigerred = true;
		//this._fireSelectionChanged();
	},
	domousedown: function(e){
		// summary:
		//		Event handler for mouse down event 
		//		- from dojox.grid.cells._Base.dispatchEvent()
		// e: Event
		//		Mouse down event
		this._startSelection(e.rowIndex);
		console.debug('domousedown()- set swipeStartRowIndex='+this.swipeStartRowIndex + ' toSelect='+this.toSelect);
		dojo.stopEvent(e);
	},
	domousemove: function(e){
		// summary:
		//		Event handler for mouse move event
		//		- from dojox.grid.cells._Base.dispatchEvent()
		// e: Event
		//		Mouse move event
		this._updateSelection(e, 0);
	},
	_onRowMouseOver: function(e){
		// summary:
		//		Event fired when mouse moves over a data row(outside of this column).
		//      - from dojox.grid.enhanced._Events.onRowMouseOver()
		// e: Event
		//		Decorated event object which contains reference to grid, cell, and rowIndex
		//if(!e.cell && e.cellIndex < 0/*row selector view*/ || e.cell && e.cell != this){
		if(e.cell != this){
			this._updateSelection(e, 0);
		}	
	},
	_domouseup: function(e){
		// summary:
		//		Event handler for mouse up event - from dojo.doc.domouseup()
		// e: Event
		//		Mouse up event
		if(dojo.isIE){
			this.view.content.decorateEvent(e);//TODO - why only e in IE hasn't been decorated?
		}
		var inSwipeSelection = e.cellIndex >= 0 && this.inSwipeSelection() && !this.grid.edit.isEditRow(e.rowIndex);
		if(inSwipeSelection){
			this._focusEndingCell(e.rowIndex, e.cellIndex);	
		}
		this._finisheSelect();
	},
	_dokeyup: function(e){
		// summary:
		//		Event handler for key up event
		//		- from dojox.grid.enhanced._Events.dokeyup()
		// e: Event
		//		Key up event
		this.inherited(arguments);
		if(!e.shiftKey){
			this._finisheSelect();
		}
	},
	_startSelection: function(rowIndex){
		// summary:
		//		Initialize parameters to start a new swipe selection
		// rowIndex: Integer
		//		Index of the start row
		this.swipeStartRowIndex = this.swipeMinRowIndex = this.swipeMaxRowIndex = rowIndex;
		this.toSelect = !this.getValue(rowIndex);
	},
	_updateSelection: function(e, delta){
		// summary:
		//		Update row selections, fired during a swipe selection
		// e: Event
		//		Event of the current row,
		// delta: Integer
		//		Row index delta, used for swipe selection via Shift + Arrow key
		//		0: not via key, -1 : Shift +  Up, 1 : Shift + Down
		if(!this.inSwipeSelection()){ return; }
		
		var byKey = delta !== 0;//whether via Shift + Arrow Key
		//this.defaultChecked = false;
		var currRow = e.rowIndex, deltaRow = currRow - this.swipeStartRowIndex + delta;
		if(deltaRow > 0 && this.swipeMaxRowIndex < currRow + delta){
			this.swipeMaxRowIndex = currRow + delta;	
		}
		if(deltaRow < 0 && this.swipeMinRowIndex > currRow + delta){
			this.swipeMinRowIndex = currRow + delta;
		}

		var min = deltaRow > 0 ? this.swipeStartRowIndex : currRow + delta;
		var max = deltaRow > 0 ? currRow + delta : this.swipeStartRowIndex;
		for(var i = this.swipeMinRowIndex; i <= this.swipeMaxRowIndex; i++){
			if(this.disabledMap[i] || i < 0){ continue; }
			if(i >= min && i <= max){//deltaRow != 0 || this.toSelect
				this._nativeSelect(i, this.toSelect);
			}else if(!byKey){
				this._nativeSelect(i, !this.toSelect);
			}
		}
		//this._fireSelectionChanged();
	},
	_swipeByKey: function(rowOffset, colOffset, e){
		// summary:
		//		Update row selections, fired when Shift + Cursor is used for swipe selection
		//		See dojox.grid.enhanced._Events.onKeyDown
		// e: Event
		//		Event of the current row,
		// rowOffset: Integer
		//		Row offset, used for swipe selection via Shift + Cursor
		//		-1 : Shift +  Up, 1 : Shift + Down
		if(rowOffset === 0 || !e.shiftKey || e.cellIndex != this.index || 
			this.grid.focus.rowIndex < 0){ //TBD - e.rowIndex == 0 && delta == -1
			return; 
		}
		var rowIndex = e.rowIndex;
		if(this.swipeStartRowIndex < 0){
			//A new swipe selection starts via Shift + Arrow key		
			this.swipeStartRowIndex = rowIndex;
			if(rowOffset > 0){//Shift + Down
				this.swipeMaxRowIndex = rowIndex + rowOffset;
				this.swipeMinRowIndex = rowIndex;
			}else{//Shift + UP
				this.swipeMinRowIndex = rowIndex + rowOffset;
				this.swipeMaxRowIndex = rowIndex;
			}
			this.toSelect = this.getValue(rowIndex);
		}
		this._updateSelection(e, rowOffset);
	},
	_finisheSelect: function(){
		// summary:
		//		Reset parameters to end a swipe selection
		this.swipeStartRowIndex = -1;
		this.swipeMinRowIndex = -1;
		this.swipeMaxRowIndex = -1;
		this.toSelect = false;
	},
	inSwipeSelection: function(){
		// summary:
		//		Check if during a swipe selection
		// return: Boolean
		//		Whether in swipe selection		
		return this.swipeStartRowIndex >= 0;
	},
	_nativeSelect: function(index, value){
		// summary:
		//		Overwritten		
		this.grid.selection[value ? 'addToSelection' : 'deselect'](index);
		//this._fireSelectionChanged();
	},
	_selectRow: function(e){
		// summary:
		//		Select the target row or range or rows
		// e: Event
		//		Event fired on the target row	
		var rowIndex = e.rowIndex;
		if(this.disabledMap[rowIndex]){ return; }
		dojo.stopEvent(e);
		this._focusEndingCell(rowIndex, 0);
		
		var delta = rowIndex - this.lastClickRowIdx;
		var newValue = !this.grid.selection.selected[rowIndex];
		if(this.lastClickRowIdx >= 0 && !e.ctrlKey && !e.altKey && e.shiftKey){
			var min = delta > 0 ? this.lastClickRowIdx : rowIndex;
			var max = delta > 0 ? rowIndex : this.lastClickRowIdx;
			for(var i = min; i >= 0 && i <= max; i++){
				this._nativeSelect(i, newValue);
			}
		}else{
			this._nativeSelect(rowIndex, newValue);
		}
		//this.defaultChecked = false;
		this.lastClickRowIdx = rowIndex;
		//this._fireSelectionChanged();
	},
	_addHeaderSelector: function(){
		// summary:
		//		Add selector in column header for selecting|deselecting all
		var headerCellNode = this.view.getHeaderCellNode(this.index);
		if(!headerCellNode){ return; }
		dojo.empty(headerCellNode);
		var selector = headerCellNode.appendChild(dojo.create("div", { 
			"tabindex": -1, "id": this.grid.id + "_rowSelector_-1", "class": this.baseClass, "role": "presentation",
			"innerHTML": "<span class = '" + this.statusTextClass + "'/>"}));
		this.map[-1] = selector;
		this._connects.push(dojo.connect(selector, 'onclick', this, '_toggletHeader'));
		this._connects.push(dojo.connect(this.grid, 'onSelectionChanged', this, '_onSelectionChanged'));
		this._connects.push(dojo.connect(this.grid, 'onKeyDown', dojo.hitch(this, function(e){
			if(e.rowIndex == -1 && e.cellIndex == this.index && e.keyCode == dojo.keys.SPACE){
				this._toggletHeader();//TODO - need a better way for this
			}
		})));
		this._onSelectionChanged();
	},
	_toggletHeader: function(){
		// summary:
		//		Toggle state for head selector		
		this._changing = true;
		this.toggleAllSelection(this.grid.rowCount != this.grid.selection.getSelectedCount());
		this._changing = false;
		this._onSelectionChanged();
	},
	_onSelectionChanged: function(){
		// summary:
		//		Update header selector anytime selection changed		
		if(this._changing){ return; }
		var grid = this.grid, headSelector = this.map[-1];
		var allSelected = (grid.rowCount == grid.selection.getSelectedCount());
		dojo.toggleClass(headSelector, this.checkedClass, allSelected);
		dijit.setWaiState(headSelector, 'pressed', allSelected);	
		if(this.inA11YMode){
			dojo.attr(headSelector.firstChild, 'innerHTML', allSelected ? this.checkedText : this.unCheckedText);
		}		
	}	
});

dojox.grid.EnhancedGrid.registerPlugin('indirectSelection', dojox.grid.enhanced.plugins.IndirectSelection, {
	"preInit": true
});