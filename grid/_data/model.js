dojo.provide('dojox.grid._data.model');
dojo.require('dojox.grid._data.fields');

dojo.declare("dojox.grid.data.model", null, {
	// summary:
	//	Base abstract grid data model.
	//	Makes no assumptions about the structure of grid data.
	constructor: function(inFields, inData){
		this.observers = [];
		this.fields = new dojox.grid.data.fields();
		if(inFields){
			this.fields.set(inFields);
		}
		this.setData(inData);
	},
	count: 0,
	updating: 0,
	// observers 
	observer: function(inObserver, inPrefix){
		this.observers.push({o: inObserver, p: inPrefix||'model' });
	},
	unobserver: function(inObserver){
		for(var i=0, m, o; (o=this.observers[i]); i++){
			if(o.o==inObserver){
				this.observers.splice(i, 1);
				return;
			}
		}
	},
	notify: function(inMsg, inArgs){
		if(!this.isUpdating()){
			var a = inArgs || [];
			for(var i=0, m, o; (o=this.observers[i]); i++){
				m = o.p + inMsg, o = o.o;
				(m in o)&&(o[m].apply(o, a));
			}
		}
	},
	// updates
	clear: function(){
		this.fields.clear();
		this.clearData();
	},
	beginUpdate: function(){
		this.updating++;
	},
	endUpdate: function(){
		if(this.updating){
			this.updating--;
		}
		/*if(this.updating){
			if(!(--this.updating)){
				this.change();
			}
		}
		}*/
	},
	isUpdating: function(){
		return Boolean(this.updating);
	},
	// data
	clearData: function(){
		this.setData(null);
	},
	// observer events
	change: function(){
		this.notify("Change", arguments);
	},
	insertion: function(/* index */){
		this.notify("Insertion", arguments);
		this.notify("Change", arguments);
	},
	removal: function(/* keys */){
		this.notify("Removal", arguments);
		this.notify("Change", arguments);
	},
	// insert
	insert: function(inData /*, index */){
		if(!this._insert.apply(this, arguments)){
			return false;
		}
		this.insertion.apply(this, dojo._toArray(arguments, 1));
		return true;
	},
	// remove
	remove: function(inData /*, index */){
		if(!this._remove.apply(this, arguments)){
			return false;
		}
		this.removal.apply(this, arguments);
		return true;
	},
	// sort
	canSort: function(/* (+|-)column_index+1, ... */){
		return this.sort != null;
	},
	sort: null,
	dummy: 0
});

dojo.declare("dojox.grid.data.rows", dojox.grid.data.model, {
	// observer events
	allChange: function(){
		this.notify("AllChange", arguments);
		this.notify("Change", arguments);
	},
	rowChange: function(){
		this.notify("RowChange", arguments);
	},
	datumChange: function(){
		this.notify("DatumChange", arguments);
	},
	// copyRow: function(inRowIndex); // abstract
	// update
	beginModifyRow: function(inRowIndex){
		if(!this.cache[inRowIndex]){
			this.cache[inRowIndex] = this.copyRow(inRowIndex);
		}
	},
	endModifyRow: function(inRowIndex){
		var cache = this.cache[inRowIndex];
		if(cache){
			var data = this.getRow(inRowIndex);
			if(!dojox.grid.arrayCompare(cache, data)){
				this.update(cache, data, inRowIndex);
			}
			delete this.cache[inRowIndex];
		}
	},
	cancelModifyRow: function(inRowIndex){
		var cache = this.cache[inRowIndex];
		if(cache){
			this.setRow(cache, inRowIndex);
			delete this.cache[inRowIndex];
		}
	},
});

dojo.declare("dojox.grid.data.table", dojox.grid.data.rows, {
	// summary:
	//	Basic grid data model for static data in the form of an array of rows that are arrays of cell data
	constructor: function(){
		this.cache = [];
	},
	colCount: 0, // tables introduce cols
	data: null,
	cache: null,
	// morphology
	measure: function(){
		this.count = this.getRowCount();
		this.colCount = this.getColCount();
		this.allChange();
		//this.notify("Measure");
	},
	getRowCount: function(){
		return (this.data ? this.data.length : 0);
	},
	getColCount: function(){
		return (this.data && this.data.length ? this.data[0].length : this.fields.count());
	},
	badIndex: function(inCaller, inDescriptor){
		console.debug('dojox.grid.data.table: badIndex');
	},
	isGoodIndex: function(inRowIndex, inColIndex){
		return (inRowIndex >= 0 && inRowIndex < this.count && (arguments.length < 2 || (inColIndex >= 0 && inColIndex < this.colCount)));
	},
	// access
	getRow: function(inRowIndex){
		return this.data[inRowIndex];
	},
	copyRow: function() {
		this.getRow(inRowIndex).slice(0);
	},
	getDatum: function(inRowIndex, inColIndex){
		return this.data[inRowIndex][inColIndex];
	},
	get: function(){
		throw('Plain "get" no longer supported. Use "getRow" or "getDatum".');
	},
	setData: function(inData){
		this.data = (inData || []);
		this.allChange();
	},
	setRow: function(inData, inRowIndex){
		this.data[inRowIndex] = inData;
		this.rowChange(inData, inRowIndex);
		this.change();
	},
	setDatum: function(inDatum, inRowIndex, inColIndex){
		this.data[inRowIndex][inColIndex] = inDatum;
		this.datumChange(inDatum, inRowIndex, inColIndex);
	},
	set: function(){
		throw('Plain "set" no longer supported. Use "setData", "setRow", or "setDatum".');
	},
	setRows: function(inData, inRowIndex){
		for(var i=0, l=inData.length, r=inRowIndex; i<l; i++, r++){
			this.setRow(inData[i], r);
		}
	},
	// update
	update: function(inOldData, inNewData, inRowIndex){
		//delete this.cache[inRowIndex];	
		//this.setRow(inNewData, inRowIndex);
		return true;
	},
	// insert
	_insert: function(inData, inRowIndex){
		dojox.grid.arrayInsert(this.data, inRowIndex, inData);
		this.count++;
		return true;
	},
	// remove
	_remove: function(inKeys){
		for(var i=inKeys.length-1; i>=0; i--){
			dojox.grid.arrayRemove(this.data, inKeys[i]);
		}
		this.count -= inKeys.length;
		return true;
	},
	// sort
	makeComparator: function(inIndices){
		var result = null;
		for(var i=inIndices.length-1, col; i>=0; i--){
			col = Math.abs(inIndices[i]) - 1;
			if(col >= 0){
				result = dojox.grid.data.generateComparator(this.fields.get(col).compare, inIndices[i], result);
			}
		}
		return result;
	},
	sort: function(/* (+|-)column_index+1, ... */){
		this.data.sort(this.makeComparator(arguments));
	},
	swap: function(inIndexA, inIndexB){
		dojox.grid.arraySwap(this.data, inIndexA, inIndexB);
		this.rowChange(this.getRow(inIndexA), inIndexA);
		this.rowChange(this.getRow(inIndexB), inIndexB);
		this.change();
	},
	dummy: 0
});

dojo.declare("dojox.grid.data.dynamic", dojox.grid.data.table, {
	// summary:
	//	Grid data model for dynamic data such as data retrieved from a server.
	//	Retrieves data automatically when requested and provides notification when data is received
	constructor: function(){
		this.page = [];
		this.pages = [];
	},
	page: null,
	pages: null,
	rowsPerPage: 100,
	requests: 0,
	bop: -1,
	eop: -1,
	// data
	clearData: function(){
		this.pages = [];
		this.bop = this.eop = -1;
		this.setData([]);
	},
	getRowCount: function(){
		return this.count;
	},
	getColCount: function(){
		return this.fields.count();
	},
	setRowCount: function(inCount){
		this.count = inCount;
		this.change();
	},
	// paging
	requestsPending: function(inBoolean){
	},
	rowToPage: function(inRowIndex){
		return (this.rowsPerPage ? Math.floor(inRowIndex / this.rowsPerPage) : inRowIndex);
	},
	pageToRow: function(inPageIndex){
		return (this.rowsPerPage ? this.rowsPerPage * inPageIndex : inPageIndex);
	},
	requestRows: function(inRowIndex, inCount){
	},
	rowsProvided: function(inRowIndex, inCount){
		this.requests--;
		if(this.requests == 0){
			this.requestsPending(false);
		}
	},
	requestPage: function(inPageIndex){
		var row = this.pageToRow(inPageIndex);
		var count = Math.min(this.rowsPerPage, this.count - row);
		if(count > 0){
			this.requests++;
			this.requestsPending(true);
			setTimeout(dojo.hitch(this, "requestRows", row, count), 1);
			//this.requestRows(row, count);
		}
	},
	needPage: function(inPageIndex){
		if(!this.pages[inPageIndex]){
			this.pages[inPageIndex] = true;
			this.requestPage(inPageIndex);
		}
	},
	preparePage: function(inRowIndex, inColIndex){
		if(inRowIndex < this.bop || inRowIndex >= this.eop){
			var pageIndex = this.rowToPage(inRowIndex);
			this.needPage(pageIndex);
			this.bop = pageIndex * this.rowsPerPage;
			this.eop = this.bop + (this.rowsPerPage || this.count);
		}
	},
	isRowLoaded: function(inRowIndex){
		return Boolean(this.data[inRowIndex]);
	},
	// removal
	removePages: function(inRowIndexes){
		for(var i=0, r; ((r=inRowIndexes[i]) != undefined); i++){
			this.pages[this.rowToPage(r)] = false;
		}
		this.bop = this.eop =-1;
	},
	remove: function(inRowIndexes){
		this.removePages(inRowIndexes);
		dojox.grid.data.table.prototype.remove.apply(this, arguments);
	},
	// access
	getRow: function(inRowIndex){
		var row = this.data[inRowIndex];
		if(!row){
			this.preparePage(inRowIndex);
		}
		return row;
	},
	getDatum: function(inRowIndex, inColIndex){
		var row = this.getRow(inRowIndex);
		return (row ? row[inColIndex] : this.fields.get(inColIndex).na);
	},
	setDatum: function(inDatum, inRowIndex, inColIndex){
		var row = this.getRow(inRowIndex);
		if(row){
			row[inColIndex] = inDatum;
			this.datumChange(inDatum, inRowIndex, inColIndex);
		}else{
			console.debug('[' + this.declaredClass + '] dojox.grid.data.dynamic.set: cannot set data on an non-loaded row');
		}
	},
	// sort
	canSort: function(){
		return false;
	}
});
