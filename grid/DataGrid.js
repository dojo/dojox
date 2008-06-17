dojo.provide("dojox.grid.DataGrid");

dojo.require("dojox.grid._Grid");
dojo.require("dojox.grid.DataSelection");

dojo.declare("dojox.grid.DataGrid", dojox.grid._Grid, {
	store: null,
	query: null,
	queryOptions: null,
	fetchText: '...',

	_store_connects: null,
	_identity_map: null,
	_rows: null,
	_cache: null,
	_pages: null,
	_pending_requests: null,
	_bop: -1,
	_eop: -1,
	_requests: 0,
	rowCount: 0,

	postCreate: function(){
		this._identity_map = {};
		this._pages = [];
		this._store_connects = [];
		this._rows = [];
		this._cache = [];
		this._pending_requests = {};

		this._setStore(this.store);
		this.inherited(arguments);
	},

	createSelection: function(){
		this.selection = new dojox.grid.DataSelection(this);
	},

	get: function(inRowIndex, inItem){
		return (!inItem ? this.defaultValue : (!this.field ? this.value : this.grid.store.getValue(inItem, this.field)));
	},

	_onSet: function(item, attribute, oldValue, newValue){
		var info = this._identity_map[this.store.getIdentity(item)];
		if(info){
			this.updateRow(info.idx);
		}
	},

	_addItem: function(item, index){
		var idty = this.store.getIdentity(item);
		this._identity_map[idty] = {idx: index, item: item};
		this._rows[index] = idty;
		this.updateRow(index);
	},

	_onNew: function(item, parentInfo){
		this.updateRowCount(this.rowCount+1);
		this._addItem(item, this.rowCount-1);
	},

	_onDelete: function(item){
		var idx = this._getItemIndex(item, true);

		if(idx >= 0){
			this._rows.splice(idx, 1);
		}
		delete this._identity_map[this.store.getIdentity(item)];

		this.updateRowCount(this.rowCount-1);
	},

	_onRevert: function(){
		this._refresh();
	},

	setStore: function(store){
		this._setStore(store);
		this._refresh(true);
	},

	_setStore: function(store){
		if(this.store&&this._store_connects){
			dojo.forEach(this._store_connects,function(arr){
				dojo.forEach(arr, dojo.disconnect);
			});
		}
		this.store = store;

		if(this.store){
			var f = this.store.getFeatures();
			var h = [];

			this._canEdit = !!f["dojo.data.api.Write"];

			if(!!f["dojo.data.api.Notification"]){
				h.push(this.connect(this.store, "onSet", "_onSet"));
				h.push(this.connect(this.store, "onNew", "_onNew"));
				h.push(this.connect(this.store, "onDelete", "_onDelete"));
			}
			if(this._canEdit){
				h.push(this.connect(this.store, "revert", "_onRevert"));
			}

			this._store_connects = h;
		}
	},

	_onFetchBegin: function(size, req){
		if(this.rowCount != size){
			if(req.isRender){
				this.scroller.init(size, this.keepRows, this.rowsPerPage);
				this.prerender();
			}
			this.updateRowCount(size);
		}
	},

	_onFetchComplete: function(items, req){
		if(items && items.length > 0){
			//console.log(items);
			dojo.forEach(items, function(item, idx){
				this._addItem(item, req.start+idx);
			}, this);
			if(req.isRender){
				this.setScrollTop(0);
				this.postrender();
			}
		}
		this._pending_requests[req.start] = false;
	},

	_onFetchError: function(err, req){
		console.log(err);
		this.onFetchError(err, req);
	},

	onFetchError: function(err, req){
	},

	_fetch: function(start, isRender){
		var start = start || 0;
		if(this.store && !this._pending_requests[start]){
			this._pending_requests[start] = true;
			//console.log("fetch: ", start);
			this.store.fetch({
				start: start,
				count: this.rowsPerPage,
				query: this.query,
				sort: this.getSortProps(),
				queryOptions: this.queryOptions,
				isRender: isRender,
				onBegin: dojo.hitch(this, "_onFetchBegin"),
				onComplete: dojo.hitch(this, "_onFetchComplete"),
				onError: dojo.hitch(this, "_onFetchError")
			});
		}
	},

	_clearData: function(){
		this.rowCount = 0;
		this._identity_map = {};
		this._pages = [];
		this._rows = [];
		this._bop = this._eop = -1;
	},

	getItem: function(idx){
		var idty = this._rows[idx];
		var item = this._identity_map[idty];
		if(!item||(item&&!item.item)){
			item = null;
			this._preparePage(idx);
		}else{
			item = item.item;
		}
		return item;
	},

	getItemIndex: function(item){
		return this._getItemIndex(item, false);
	},
	
	_getItemIndex: function(item, isDeleted){
		if(!isDeleted && !this.store.isItem(item)){
			return -1;
		}
		var idty = this.store.getIdentity(item);
		var imap = this._identity_map[idty];
		return (imap ? imap.idx : -1);
	},

	filter: function(query, reRender){
		this.query = query;
		if(reRender){
			this._clearData();
		}
		this._fetch();
	},

	_getItemAttr: function(idx, attr){
		var item = this.getItem(idx);
		return (!item ? this.fetchText : this.store.getValue(item, attr));
	},

	// rendering
	_render: function(){
		if(this.domNode.parentNode){
			this.scroller.init(this.rowCount, this.keepRows, this.rowsPerPage);
			this.prerender();
			this._fetch(0, true);
		}
	},

	renderRows: function(inPageIndex, inRowsPerPage){
		this.views.renderRows(inPageIndex, inRowsPerPage);
	},

	// paging
	_requestsPending: function(inRowIndex){
		return this._pending_requests[inRowIndex];
	},

	_rowToPage: function(inRowIndex){
		return (this.rowsPerPage ? Math.floor(inRowIndex / this.rowsPerPage) : inRowIndex);
	},

	_pageToRow: function(inPageIndex){
		return (this.rowsPerPage ? this.rowsPerPage * inPageIndex : inPageIndex);
	},

	_preparePage: function(inRowIndex){
		if(inRowIndex < this._bop || inRowIndex >= this._eop){
			var pageIndex = this._rowToPage(inRowIndex);
			this._needPage(pageIndex);
			this._bop = pageIndex * this.rowsPerPage;
			this._eop = this._bop + (this.rowsPerPage || this.rowCount);
		}
	},

	_needPage: function(inPageIndex){
		if(!this._pages[inPageIndex]){
			this._pages[inPageIndex] = true;
			this._requestPage(inPageIndex);
		}
	},

	_requestPage: function(inPageIndex){
		var row = this._pageToRow(inPageIndex);
		var count = Math.min(this.rowsPerPage, this.rowCount - row);
		if(count > 0){
			this._requests++;
			if(!this._requestsPending(row)){
				setTimeout(dojo.hitch(this, "_fetch", row, false), 1);
				//this.requestRows(row, count);
			}
		}
	},

	getCellName: function(inCell){
		return inCell.field;
		//console.log(inCell);
	},

	_refresh: function(isRender){
		this._clearData();
		this._fetch(0, isRender);
	},

	sort: function(){
		this._refresh();
	},

	canSort: function(){
		return true;
	},

	getSortProps: function(){
		var c = this.getCell(this.getSortIndex());
		if(!c){
			return null;
		}else{
			var desc = c["sortDesc"];
			var si = !(this.sortInfo>0);
			if(typeof desc == "undefined"){
				desc = si;
			}else{
				desc = si ? !desc : desc;
			}
			return [{ attribute: c.field, descending: desc }];
		}
	},

	styleRowState: function(inRow){
		// summary: Perform row styling
		if(this.store && this.store.getState){
			var states=this.store.getState(inRow.index), c='';
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

	// editing
	canEdit: function(inCell, inRowIndex){
		return this._canEdit;
	},

	_copyAttr: function(idx, attr){
		var row = {};
		var backstop = {};
		var src = this.getItem(idx);
		return this.store.getValue(src, attr);
	},

	doStartEdit: function(inCell, inRowIndex){
		if(!this._cache[inRowIndex]){
			this._cache[inRowIndex] = this._copyAttr(inRowIndex, inCell.field);
		}
		this.onStartEdit(inCell, inRowIndex);
	},

	doApplyCellEdit: function(inValue, inRowIndex, inAttrName){
		this.store.fetchItemByIdentity({
			identity: this._rows[inRowIndex],
			onItem: dojo.hitch(this, function(item){
				this.store.setValue(item, inAttrName, inValue);
				this.onApplyCellEdit(inValue, inRowIndex, inAttrName);
			})
		});
	},

	doCancelEdit: function(inRowIndex){
		var cache = this._cache[inRowIndex];
		if(cache){
			this.updateRow(inRowIndex);
			delete this._cache[inRowIndex];
		}
		this.onCancelEdit.apply(this, arguments);
	},

	doApplyEdit: function(inRowIndex, inDataAttr){
		var cache = this._cache[inRowIndex];
		/*if(cache){
			var data = this.getItem(inRowIndex);
			if(this.store.getValue(data, inDataAttr) != cache){
				this.update(cache, data, inRowIndex);
			}
			delete this._cache[inRowIndex];
		}*/
		this.onApplyEdit(inRowIndex);
	},

	removeSelectedRows: function(){
		// summary:
		//		Remove the selected rows from the grid.
		if(this._canEdit){
			this.edit.apply();
			var items = this.selection.getSelected();
			if(items.length){
				dojo.forEach(items, this.store.deleteItem);
				this.selection.clear();
			}
		}
	}
});

dojox.grid.DataGrid.markupFactory = function(props, node, ctor){
	// handle setting up a data store for a store if one
	// isn't provided. There are some caveats:
	//		* we only really handle dojo.data sources well. They're the future
	//		  so it's no big deal, but it's something to be aware of.
	//		* I'm pretty sure that colgroup introspection is missing some of
	//		  the available settable properties.
	//		* No handling of cell formatting and content getting is done
	var d = dojo;
	var widthFromAttr = function(n){
		var w = d.attr(n, "width")||"auto";
		if((w != "auto")&&(w.slice(-2) != "em")&&(w.slice(-1) != "%")){
			w = parseInt(w)+"px";
		}
		return w;
	}
	// if(!props.store){ console.debug("no store!"); }
	// if a structure isn't referenced, do we have enough
	// data to try to build one automatically?
	if(	!props.structure &&
		node.nodeName.toLowerCase() == "table"){

		// try to discover a structure
		props.structure = d.query("> colgroup", node).map(function(cg){
			var sv = d.attr(cg, "span");
			var v = {
				noscroll: (d.attr(cg, "noscroll") == "true") ? true : false,
				__span: (!!sv ? parseInt(sv) : 1),
				cells: []
			};
			if(d.hasAttr(cg, "width")){
				v.width = widthFromAttr(cg);
			}
			return v; // for vendetta
		});
		if(!props.structure.length){
			props.structure.push({
				__span: Infinity,
				cells: [] // catch-all view
			});
		}
		// check to see if we're gonna have more than one view

		// for each tr in our th, create a row of cells
		d.query("thead > tr", node).forEach(function(tr, tr_idx){
			var cellCount = 0;
			var viewIdx = 0;
			var lastViewIdx;
			var cView = null;
			d.query("> th", tr).map(function(th){
				// what view will this cell go into?

				// NOTE:
				//		to prevent extraneous iteration, we start counters over
				//		for each row, incrementing over the surface area of the
				//		structure that colgroup processing generates and
				//		creating cell objects for each <th> to place into those
				//		cell groups.  There's a lot of state-keepking logic
				//		here, but it is what it has to be.
				if(!cView){ // current view book keeping
					lastViewIdx = 0;
					cView = props.structure[0];
				}else if(cellCount >= (lastViewIdx+cView.__span)){
					viewIdx++;
					// move to allocating things into the next view
					lastViewIdx += cView.__span;
					lastView = cView;
					cView = props.structure[viewIdx];
				}

				// actually define the cell from what markup hands us
				var cell = {
					name: d.trim(d.attr(th, "name")||th.innerHTML),
					field: d.trim(d.attr(th, "field")||""),
					colSpan: parseInt(d.attr(th, "colspan")||1),
					type: d.trim(d.attr(th, "cellType")||"")
				};
				cellCount += cell.colSpan;
				var rowSpan = d.attr(th, "rowspan");
				if(rowSpan){
					cell.rowSpan = rowSpan;
				}
				cell.field = cell.field||cell.name;
				if(d.hasAttr(th, "width")){
					cell.width = widthFromAttr(th);
				}

				cell.type = cell.type ? dojo.getObject(cell.type) : dojox.grid.cells.Cell;

				if(cell.type && cell.type.markupFactory){
					cell.type.markupFactory(th, cell);
				}

				if(!cView.cells[tr_idx]){
					cView.cells[tr_idx] = [];
				}
				cView.cells[tr_idx].push(cell);
			});
		});
		// console.debug(dojo.toJson(props.structure, true));
	}
	return new dojox.grid.DataGrid(props, node);
}
