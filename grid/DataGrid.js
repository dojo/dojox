dojo.provide("dojox.grid.DataGrid");

dojo.require("dojox.grid.VirtualGrid");

dojo.declare("dojox.grid.DataGrid", dojox.grid.VirtualGrid, {
	model: null,
	query: { name: '*' },
	fetchText: '...',

	_model_connects: null,
	_identity_map: null,
	_rows: null,
	_pages: null,
	_bop: -1,
	_eop: -1,
	_requests: 0,

	postCreate: function(){
		this._identity_map = {};
		this._pages = [];
		this._model_connects = [];
		this._rows = [];

		this.setModel(this.model);
		this.inherited(arguments);
	},

	get: function(inRowIndex, inAttr){
		return this.grid._getItemAttr.call(this.grid, inRowIndex, this.dataAttr);
	},

	_onSet: function(item, attribute, oldValue, newValue){
		var info = this._identity_map[this.model.getIdentity(item)];
		if(info){
			this.updateRow(info.idx);
		}
	},

	_onNew: function(item, parentInfo){
	},

	_onDelete: function(item){
	},

	_onRevert: function(){
	},

	setModel: function(model){
		if(this.model&&this._model_connects){
			dojo.forEach(this._model_connects,function(arr){
				dojo.forEach(arr, dojo.disconnect);
			});
		}
		this.model = model;

		var f = this.model.getFeatures();
		var h = [];

		this._canEdit = !!f["dojo.data.api.Write"];
		
		if(!!f["dojo.data.api.Notification"]){
			h.push(this.connect(this.model, "onSet", "_onSet"));
			h.push(this.connect(this.model, "onNew", "_onNew"));
			h.push(this.connect(this.model, "onDelete", "_onDelete"));
		}
		if(this._canEdit){
			h.push(this.connect(this.model, "revert", "_onRevert"));
		}

		this._model_connects = h;
	},

	_onFetchBegin: function(size, req){
		if(this.rowCount != size){
			this.updateRowCount(size);
		}
	},

	_onFetchComplete: function(items, req){
		if(!items || items.length == 0){ return; }
		//console.log(items);
		dojo.forEach(items, function(item, idx){
			this._identity_map[this.model.getIdentity(item)] = { idx: req.start+idx, item: item };
			this._rows[req.start+idx] = this.model.getIdentity(item);
			this.updateRow(req.start+idx);
		}, this);
	},

	_onFetchError: function(err, req){
		console.log(err);
	},

	_fetch: function(start){
		var start = start || 0;
		//console.log("fetch: ", start);
		this.model.fetch({
			start: start,
			count: this.rowsPerPage,
			query: this.query,
			sort: this.getSortProps(),
			queryOptions: this.queryOptions,
			onBegin: dojo.hitch(this, "_onFetchBegin"),
			onComplete: dojo.hitch(this, "_onFetchComplete"),
			onError: dojo.hitch(this, "_onFetchError"),
			scope: this
		});
	},

	_clearData: function(){
		this._identity_map = {};
		this._pages = [];
		this._rows = [];
		this._bop = this._eop = -1;
	},

	_getItem: function(idx){
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

	_getItemAttr: function(idx, attr){
		var item = this._getItem(idx);
		return (!item ? this.fetchText : this.model.getValue(item, attr));
	},

	// paging
	_requestsPending: function(inBoolean){
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
			this._requestsPending(true);
			setTimeout(dojo.hitch(this, "_fetch", row), 1);
			//this.requestRows(row, count);
		}
	},

	getCellName: function(inCell){
		//console.log(inCell);
	},

	_refresh: function(){
		this._clearData();
		this._fetch();
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
			return [{ attribute: c.dataAttr, descending: !(this.sortInfo>0) }];
		}
	},

	styleRowState: function(inRow){
		// summary: Perform row styling
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
	}
});

dojox.grid.DataGrid.markupFactory = function(props, node, ctor){
	// handle setting up a data model for a store if one
	// isn't provided. There are some caveats:
	//		* we only really handle dojo.data sources well. They're the future
	//		  so it's no big deal, but it's something to be aware of.
	//		* I'm pretty sure that colgroup introspection is missing some of
	//		  the available settable properties. 
	//		* No handling of cell formatting and content getting is done
	var d = dojo;
	var widthFromAttr = function(n){
		var w = d.attr(n, "width")||"auto";
		if((w != "auto")&&(w.substr(-2) != "em")){
			w = parseInt(w)+"px";
		}
		return w;
	}
	// if(!props.model){ console.debug("no model!"); }
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
					dataAttr: d.trim(d.attr(th, "dataAttr")||""),
					colSpan: parseInt(d.attr(th, "colspan")||1)
				};
				cellCount += cell.colSpan;
				cell.dataAttr = cell.dataAttr||cell.name;
				cell.width = widthFromAttr(th);
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
