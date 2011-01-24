dojo.provide("dojox.grid.enhanced.plugins.NestedSorting");

dojo.require("dojox.grid.enhanced._Plugin");

dojo.declare("dojox.grid.enhanced.plugins.NestedSorting", dojox.grid.enhanced._Plugin, {
	// summary:
	//		Provides nested sorting feature
	//
	// description:
	//		A flexible way to control multiple column sorting, including
	//		1. Set default sorting order
	//		2. Disable sorting for certain columns
	//		3. Set sorting order dynamically with JS API	
	//
	// example:
	// |	<script type="text/javascript">
	// |		var grid = new dojox.grid.EnhancedGrid({plugins : {nestedSorting: true}},
	// |	               sortFields: [{attribute: 'col4', descending: false},...],//set default sorting order
	// |			       canSort: function(index, field){ return true},//disable sorting for a column
	// |				   ... }, dojo.byId('gridDiv'));
	// |		grid.startup();
	// |		//set new sorting order
	// |		grid.setSortIndex([{attribute: 'col3', descending: true},...])
	// |	</script>
	
	// name: String
	//		Plugin name
	name: "nestedSorting",
	
	_currMainSort: 'none',//'none'|'asc'|'desc'
	
	_currRegionIdx: -1,
	
	_a11yText: {
		'dojoxGridDescending'   : '&#9662;',
		'dojoxGridAscending'    : '&#9652;',
		'dojoxGridAscendingTip' : '&#1784;',	
		'dojoxGridDescendingTip': '&#1783;',
		'dojoxGridUnsortedTip'  : 'x' //'&#10006;'
	},
	
	constructor: function(){
		this._sortDef = [];
		this._sortData = {};
		this._headerNodes = {};
		//column index that are hidden, un-sortable or indirect selection etc.
		this._excludedColIdx = [];
		this.nls = this.grid._nls;
		this.grid.setSortInfo = function(){};
		this.grid.setSortIndex = dojo.hitch(this, '_setGridSortIndex');
		this.grid.getSortProps = dojo.hitch(this, 'getSortProps');
		if(this.grid.sortFields){
			this._setGridSortIndex(this.grid.sortFields, null, true);
		}
		this.connect(this.grid.views, 'render', '_initSort');//including column resize
		this.initCookieHandler();
	},
	onStartUp: function(){
		//overwrite base Grid functions
		this.inherited(arguments);
		this.connect(this.grid, 'onHeaderCellClick', '_onHeaderCellClick');
		this.connect(this.grid, 'onHeaderCellMouseOver', '_onHeaderCellMouseOver');
		this.connect(this.grid, 'onHeaderCellMouseOut', '_onHeaderCellMouseOut');
	},
	_setGridSortIndex: function(inIndex, inAsc, noRefresh){
		if(!isNaN(inIndex)){
			if(inAsc === undefined){ return; }//header click from base DataGrid
			this.setSortData(inIndex, 'order', inAsc ? 'asc' : 'desc');
		}else if(dojo.isArray(inIndex)){
			var i, d, cell;
			this.clearSort();
			for(i = 0; i < inIndex.length; i++){
				d = inIndex[i];
				cell = this.grid.getCellByField(d.attribute);
				if(!cell){
					console.warn('Cell not found for sorting: ', d.attribute);
					continue;
				}
				this.setSortData(cell.index, 'index', i);
				this.setSortData(cell.index, 'order', d.descending ? 'desc': 'asc');
			}
		}else{
			return;
		}
		this._updateSortDef();
		if(!noRefresh){
			this.grid.sort();
		}
	},
	getSortProps: function(){
		// summary:
		//		Overwritten, see DataGrid.getSortProps()
		return this._sortDef;
	},
	_initSort: function(postSort){
		// summary:
		//		Initiate sorting
		var g = this.grid, n = g.domNode, len = this._sortDef.length;
		dojo.toggleClass(n, 'dojoxGridSorted', !!len);
		dojo.toggleClass(n, 'dojoxGridSingleSorted', len === 1);
		dojo.toggleClass(n, 'dojoxGridNestSorted', len > 1);
		if(len > 0){
			this._currMainSort = this._sortDef[0].descending ? 'desc' : 'asc';
		}
		var idx, excluded = this._excludedCoIdx = [];//reset it
		//cache column index of hidden, un-sortable or indirect selection
		this._headerNodes = dojo.query("th", g.viewsHeaderNode).forEach(function(n){
			idx = parseInt(dojo.attr(n, 'idx'), 10);
			if(dojo.style(n, 'display') === 'none' || g.layout.cells[idx]['noSort'] || (g.canSort && !g.canSort(idx, g.layout.cells[idx]['field']))){
				excluded.push(idx);
			}
		});
		this._headerNodes.forEach(this._initHeaderNode, this);
		this._initFocus();
		if(postSort){
			this._focusHeader();
		}
	},
	_initHeaderNode: function(node){
		// summary:
		//		Initiate sort for each header cell node
		if(dojo.indexOf(this._excludedCoIdx, dojo.attr(node,'idx')) >= 0){
			dojo.addClass(node, 'dojoxGridNoSort');
			return;
		}
		dojo.create('a', {
			className: 'dojoxGridSortBtn dojoxGridSortBtnNested',
			href: 'javascript:void(0);',
			onmousedown: dojo.stopEvent,
			title: this.nls.nestedSort,
			innerHTML: '1'
		}, node.firstChild, 'last');
		dojo.create('a', {
			className: 'dojoxGridSortBtn dojoxGridSortBtnSingle',
			href: 'javascript:void(0);',
			onmousedown: dojo.stopEvent,
			title: this.nls.singleSort
		}, node.firstChild, 'last');
		this._updateHeaderNodeUI(node);
	},
	_onHeaderCellClick: function(e){
		// summary
		//		See dojox.grid.enhanced._Events._onHeaderCellClick()		
		this._focusRegion(e.target);
		if(dojo.hasClass(e.target, 'dojoxGridSortBtn')){
			this._onSortBtnClick(e);
			dojo.stopEvent(e);
			this._focusRegion(this._getCurrentRegion());
		}
	},
	_onHeaderCellMouseOver: function(e){
		// summary
		//		See dojox.grid._Events._onHeaderCellMouseOver()
		//		When user mouseover other columns than sorted column in a single sorted grid,
		//		We need to show 1 in the sorted column
		if(!e.cell){return; }
		if(this._sortDef.length > 1){ return; }
		if(this._sortData[e.cellIndex] && this._sortData[e.cellIndex].index === 0){ return; }
		var p;
		for(p in this._sortData){
			if(this._sortData[p].index === 0){
				dojo.addClass(this._headerNodes[p], 'dojoxGridCellShowIndex');
				break;
			}
		}
		if(!dojo.hasClass(dojo.body(), 'dijit_a11y')){ return; }
		//a11y support
		var i = e.cell.index, node = e.cellNode;
		var singleSortBtn = dojo.query('.dojoxGridSortBtnSingle', node)[0];
		var nestedSortBtn = dojo.query('.dojoxGridSortBtnNested', node)[0];
		
		var sortMode = 'none';
		if(dojo.hasClass(this.grid.domNode, 'dojoxGridSingleSorted')){
			sortMode = 'single';
		}else if(dojo.hasClass(this.grid.domNode, 'dojoxGridNestSorted')){
			sortMode = 'nested';
		}
		var nestedIndex = dojo.attr(nestedSortBtn, 'orderIndex');
		if(nestedIndex === null || nestedIndex === undefined){
			dojo.attr(nestedSortBtn, 'orderIndex', nestedSortBtn.innerHTML);
			nestedIndex = nestedSortBtn.innerHTML;
		}
		if(this.isAsc(i)){
			nestedSortBtn.innerHTML = nestedIndex + this._a11yText.dojoxGridDescending;
		}else if(this.isDesc(i)){
			nestedSortBtn.innerHTML = nestedIndex + this._a11yText.dojoxGridUnsortedTip;
		}else{
			nestedSortBtn.innerHTML = nestedIndex + this._a11yText.dojoxGridAscending;
		}		
		if(this._currMainSort === 'none'){
			singleSortBtn.innerHTML = this._a11yText.dojoxGridAscending;
		}else if(this._currMainSort === 'asc'){
			singleSortBtn.innerHTML = this._a11yText.dojoxGridDescending;
		}else if(this._currMainSort === 'desc'){
			singleSortBtn.innerHTML = this._a11yText.dojoxGridUnsortedTip;
		}
	},
	_onHeaderCellMouseOut: function(e){
		// summary
		//		See dojox.grid.enhanced._Events._onHeaderCellMouseOut()
		var p;	
		for(p in this._sortData){
			if(this._sortData[p].index === 0){
				dojo.removeClass(this._headerNodes[p], 'dojoxGridCellShowIndex');
				break;
			}
		}
	},
	_onSortBtnClick: function(e){
		// summary:
		//		If the click target is single sort button, do single sort.
		//		Else if the click target is nested sort button, do nest sort.
		//		Otherwise return.
		var cellIdx = e.cell.index;
		if(dojo.hasClass(e.target, 'dojoxGridSortBtnSingle')){
			this._prepareSingleSort(cellIdx);
		}else if(dojo.hasClass(e.target, 'dojoxGridSortBtnNested')){
			this._prepareNestedSort(cellIdx);
		}else{
			return;
		}
		dojo.stopEvent(e);
		this._doSort(cellIdx);
	},
	_doSort: function(cellIdx){
		if(!this._sortData[cellIdx] || !this._sortData[cellIdx].order){
			this.setSortData(cellIdx, 'order', 'asc');	//no sorting data
		}else if(this.isAsc(cellIdx)){
			this.setSortData(cellIdx, 'order', 'desc');	//change to 'desc'
		}else if(this.isDesc(cellIdx)){
			this.removeSortData(cellIdx); //remove from sorting sequence
		}
		this._updateSortDef();
		this.grid.sort();
		this._initSort(true);
	},
	setSortData: function(cellIdx, attr, value){
		// summary:
		//		Set sorting data for a column.
		var sd = this._sortData[cellIdx];
		if(!sd){
			sd = this._sortData[cellIdx] = {};
		}
		sd[attr] = value;
	},
	removeSortData: function(cellIdx){
		var d = this._sortData, i = d[cellIdx].index, p;
		delete d[cellIdx];
		for(p in d){
			if(d[p].index > i){
				d[p].index--;
			}
		}
	},
	_prepareSingleSort: function(cellIdx){
		// summary:
		//		Prepare the single sort, also called main sort, this will clear any existing sorting and just sort the grid by current column.
		var d = this._sortData, p;
		for(p in d){
			delete d[p];
		}
		this.setSortData(cellIdx, 'index', 0);
		this.setSortData(cellIdx, 'order', this._currMainSort === 'none' ? null : this._currMainSort);
		if(!this._sortData[cellIdx] || !this._sortData[cellIdx].order){
			this._currMainSort = 'asc';
		}else if(this.isAsc(cellIdx)){
			this._currMainSort = 'desc';
		}else if(this.isDesc(cellIdx)){
			this._currMainSort = 'none';
		}
	},
	_prepareNestedSort: function(cellIdx){
		// summary
		//		Prepare the nested sorting, this will order the column on existing sorting result.
		var i = this._sortData[cellIdx] ? this._sortData[cellIdx].index : null;
		if(i === 0 || !!i){ return; }
		this.setSortData(cellIdx, 'index', this._sortDef.length);
	},
	_updateSortDef: function(){
		this._sortDef.length = 0;
		var d = this._sortData, p;
		for(p in d){
			this._sortDef[d[p].index] = {
				attribute: this.grid.layout.cells[p].field,
				descending: d[p].order === 'desc'
			};
		}
	},
	_updateHeaderNodeUI: function(node){
		// summary:
		//		Update the column header UI based on current sorting state.
		//		Show indicator of the sorting order of the column, no order no indicator
		var cell = this._getCellByNode(node);
		var cellIdx = cell.index;
		var data = this._sortData[cellIdx];
		var sortNode = dojo.query('.dojoxGridSortNode', node)[0];
		var singleSortBtn = dojo.query('.dojoxGridSortBtnSingle', node)[0];
		var nestedSortBtn = dojo.query('.dojoxGridSortBtnNested', node)[0];
		
		dojo.toggleClass(singleSortBtn, 'dojoxGridSortBtnAsc', this._currMainSort === 'asc');
		dojo.toggleClass(singleSortBtn, 'dojoxGridSortBtnDesc', this._currMainSort === 'desc');
		
		function setWaiState(){
			var columnInfo = 'Column ' + (cell.index + 1) + ' ' + cell.field;
			var orderState = 'none';
			var orderAction = 'ascending';
			if(data){
				orderState = data.order === 'asc' ? 'ascending' : 'descending';
				orderAction = data.order === 'asc' ? 'descending' : 'none';
			}
			var a11ySingleLabel = columnInfo + ' - is sorted by ' + orderState;
			var a11yNestedLabel = columnInfo + ' - is nested sorted by ' + orderState;
			var a11ySingleLabelHover = columnInfo + ' - choose to sort by ' + orderAction;
			var a11yNestedLabelHover = columnInfo + ' - choose to nested sort by ' + orderAction;
			
			dijit.setWaiState(singleSortBtn, 'label', a11ySingleLabel);
			dijit.setWaiState(nestedSortBtn, 'label', a11yNestedLabel);
			
			singleSortBtn.onmouseover = function(){
				dijit.setWaiState(this, 'label', a11ySingleLabelHover);
			};
			singleSortBtn.onmouseout = function(){
				dijit.setWaiState(this, 'label', a11ySingleLabel);
			};
			nestedSortBtn.onmouseover = function(){
				dijit.setWaiState(this, 'label', a11yNestedLabelHover);
			};
			nestedSortBtn.onmouseout = function(){
				dijit.setWaiState(this, 'label', a11yNestedLabel);
			};
		}
		setWaiState();

		var a11y = dojo.hasClass(dojo.body(), "dijit_a11y");
		if(!data){
			nestedSortBtn.innerHTML = this._sortDef.length + 1;
			return;
		}
		if(data.index || (data.index === 0 && this._sortDef.length > 1)){
			nestedSortBtn.innerHTML = data.index + 1;
		}
		dojo.addClass(sortNode, 'dojoxGridSortNodeSorted');
		if(this.isAsc(cellIdx)){
			dojo.addClass(sortNode, 'dojoxGridSortNodeAsc');
			if(a11y){sortNode.innerHTML = this._a11yText.dojoxGridAscendingTip;}
		}else if(this.isDesc(cellIdx)){
			dojo.addClass(sortNode, 'dojoxGridSortNodeDesc');
			if(a11y){sortNode.innerHTML = this._a11yText.dojoxGridDescendingTip;}
		}
		dojo.addClass(sortNode, (data.index === 0 ? 'dojoxGridSortNodeMain' : 'dojoxGridSortNodeSub'));
	},
	isAsc: function(cellIndex){
		return this._sortData[cellIndex].order === 'asc';
	},
	isDesc: function(cellIndex){
		return this._sortData[cellIndex].order === 'desc';
	},
	_getCellByNode: function(node){
		var i;
		for(i = 0; i < this._headerNodes.length; i++){
			if(this._headerNodes[i] === node){
				return this.grid.layout.cells[i];
			}
		}
		return null;
	},	
	clearSort: function(){
		this._sortData = {};
		this._sortDef.length = 0;
	},
	
	//persistence
	initCookieHandler: function(){
		if(this.grid.addCookieHandler){
			this.grid.addCookieHandler({
				name: "sortOrder",
				onLoad: dojo.hitch(this, '_loadNestedSortingProps'),
				onSave: dojo.hitch(this, '_saveNestedSortingProps')
			});	
		}
	},
	_loadNestedSortingProps: function(sortInfo, grid){
		this._setGridSortIndex(sortInfo);
	},
	_saveNestedSortingProps: function(grid){
		return this.getSortProps();
	},
	
	//focus & keyboard
	_initFocus: function(){
		var f = this.focus = this.grid.focus;
		this._focusRegions = this._getRegions();
		if(!this._headerArea){
			var area = this._headerArea = f.getArea('header');
			area.onFocus = f.focusHeader = dojo.hitch(this, '_focusHeader');
			area.onBlur = f.blurHeader = f._blurHeader = dojo.hitch(this, '_blurHeader');
			area.onMove = dojo.hitch(this, '_onMove');
			area.onKeyDown = dojo.hitch(this, '_onKeyDown');
			area._regions = [];
			area.getRegions = null;
		}
	},
	_focusHeader: function(evt){
		// summary:
		//		Overwritten, see _FocusManager.focusHeader()
		//delayed: Boolean
		//		If called from "this.focus._delayedHeaderFocus()"
		if(this._currRegionIdx === -1){
			this._onMove(0, 1, null);
		}else{
			this._focusRegion(this._getCurrentRegion());
		}
		return true;
	},
	_blurHeader: function(evt){
		this._blurRegion(this._getCurrentRegion());
		return true;
	},
	_onMove: function(rowStep, colStep, evt){
		var curr = this._currRegionIdx || 0, regions = this._focusRegions;
		var region = regions[curr + colStep];
		if(!region){
			return;
		}else if(dojo.style(region, 'display') === 'none' || dojo.style(region, 'visibility') === 'hidden'){
			//if the region is invisible, keep finding next
			this._onMove(rowStep, colStep + (colStep > 0 ? 1 : -1), evt);
			return;
		}
		this._focusRegion(region);
		//keep grid body scrolled by header
		var view = this._getRegionView(region);
		view.scrollboxNode.scrollLeft = view.headerNode.scrollLeft;
		
		dojo.stopEvent(evt);
	},
	_onKeyDown: function(e, isBubble){
		if(isBubble){
			switch(e.keyCode){
				case dojo.keys.ENTER:
				case dojo.keys.SPACE:
					if(dojo.hasClass(e.target, 'dojoxGridSortBtnSingle') ||
						dojo.hasClass(e.target, 'dojoxGridSortBtnNested')){
						this._onSortBtnClick(e);
					}
			}
		}
	},
	_getRegionView: function(region){
		var header = region;
		while(header && !dojo.hasClass(header, 'dojoxGridHeader')){ header = header.parentNode; }
		console.debug(header);
		if(header){
			return dojo.filter(this.grid.views.views, function(view){
				return view.headerNode === header;
			})[0] || null;
		}
		return null;
	},
	_getRegions: function(){
		var regions = [], cells = this.grid.layout.cells;
		this._headerNodes.forEach(function(n, i){
			if(dojo.style(n, 'display') === 'none'){return;}
			if(cells[i]['noSort']){
				regions.push(n);
				return;
			}
			dojo.query('.dojoxGridSortNode,.dojoxGridSortBtnNested,.dojoxGridSortBtnSingle', n)
				.forEach(function(node){
					dojo.attr(node, 'tabindex', 0);
					regions.push(node);
			});
		},this);
		return regions;
	},
	_focusRegion: function(region){
		// summary
		//		Focus the given region
		if(!region){return;}
		var currRegion = this._getCurrentRegion();
		if(currRegion && region !== currRegion){
			this._blurRegion(currRegion);
		}
		var header = this._getRegionHeader(region);
		dojo.addClass(header, 'dojoxGridCellSortFocus');
		if(dojo.hasClass(region, 'dojoxGridSortNode')){
			dojo.addClass(region, 'dojoxGridSortNodeFocus');
		}else if(dojo.hasClass(region, 'dojoxGridSortBtn')){
			dojo.addClass(region, 'dojoxGridSortBtnFocus');
		}
		region.focus();
		this.focus.currentArea('header');
		this._currRegionIdx = dojo.indexOf(this._focusRegions, region);
	},
	_blurRegion: function(region){
		if(!region){return;}
		var header = this._getRegionHeader(region);
		dojo.removeClass(header, 'dojoxGridCellSortFocus');
		if(dojo.hasClass(region, 'dojoxGridSortNode')){
			dojo.removeClass(region, 'dojoxGridSortNodeFocus');
		}else if(dojo.hasClass(region, 'dojoxGridSortBtn')){
			dojo.removeClass(region, 'dojoxGridSortBtnFocus');
		}
		region.blur();
	},
	_getCurrentRegion: function(){
		return this._focusRegions[this._currRegionIdx];
	},
	_getRegionHeader: function(region){
		while(region && !dojo.hasClass(region, 'dojoxGridCell')){
			region = region.parentNode;
		}
		return region;
	},	
	destroy: function(){
		this._sortDef = this._sortData = null;
		this._headerNodes = this._focusRegions = null;
		this.inherited(arguments);
	}
});
dojox.grid.EnhancedGrid.registerPlugin(dojox.grid.enhanced.plugins.NestedSorting);
