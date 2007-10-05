dojo.provide("dojox.grid.VirtualGrid");
dojo.require("dojox.grid._grid.lib");
dojo.require("dojox.grid._grid.scroller");
dojo.require("dojox.grid._grid.view");
dojo.require("dojox.grid._grid.views");
dojo.require("dojox.grid._grid.layout");
dojo.require("dojox.grid._grid.rows");
dojo.require("dojox.grid._grid.focus");
dojo.require("dojox.grid._grid.selection");
dojo.require("dojox.grid._grid.edit");
dojo.require("dojox.grid._grid.rowbar");
dojo.require("dojox.grid._grid.publicEvents");

dojo.declare('dojox.VirtualGrid', [dijit._Widget, dijit._Templated], {
	// plumbing
	//: private
	templateString: '<div class="dojoxGrid" hidefocus="hidefocus"><div class="dojoxGrid-master-header" dojoAttachPoint="headerNode"></div><div class="dojoxGrid-master-view" dojoAttachPoint="viewsNode"></div><span dojoAttachPoint="lastFocusNode" tabindex="0"></span></div>',
	classTag: 'dojoxGrid',
	// settings
	//: public
	//$ Default data getter.
	get: function(){
	},
	//$ Number of rows to display. 
	rowCount: 5,
	//$ Number of rows to keep in the rendering cache.
	keepRows: 75, 
	//$ Number of rows to render at a time.
	rowsPerPage: 25,
	//$ If <em>autoWidth</em> is true, grid width is automatically set to fit the data.
	autoWidth: false,
	//$ If <em>autoHeight</em> is true, grid height is automatically set to fit the data.
	autoHeight: false,
	//$ If <em>autoRender</em> is true, grid will render itself after initialization.
	autoRender: true,
	//$ <em>defaultHeight</em> of the grid.
	defaultHeight: '15em',
	//$ View layout defintion. Can be set to a layout object, or to the (string) name of a layout object.
	structure: '',
	//$ Override defaults and make this view elastic.
	elasticView: -1,
	//$ Single-click starts editing. Default is double-click
	singleClickEdit: false,
	//: private
	sortInfo: 0,
	themeable: true,
	// initialization
	buildRendering: function(){
		this.inherited(arguments);
		// reset get from blank function (needed for markup parsing) to null, if not changed
		if(this.get == dojox.VirtualGrid.prototype.get){
			this.get = null;
		}
		if(!this.domNode.getAttribute('tabIndex')){
			this.domNode.tabIndex = "0";
		}
		this.domNode.onReveal = dojo.hitch(this, "reveal");
		this.domNode.onSizeChange = dojo.hitch(this, "sizeChange");
		this.createScroller();
		this.createLayout();
		this.createViews();
		this.createManagers();
		//dojox.grid.watchTextSizePoll(this, 'textSizeChanged');
		dojox.grid.funnelEvents(this.domNode, this, 'doKeyEvent', dojox.grid.keyEvents);
	},
	postCreate: function(){
		// replace stock styleChanged with one that triggers an update
		this.styleChanged = this._styleChanged;
		this.setStructure(this.structure);
	},
	destroy: function(){
		this.domNode.onReveal = null;
		this.domNode.onSizeChange = null;
		this.edit.destroy();
		//dojox.grid.unwatchTextSizePoll(this, 'textSizeChanged');
		this.views.destroyViews();
		this.inherited(arguments);
	},
	styleChanged: function(){
		this.setStyledClass(this.domNode, '');
	},
	_styleChanged: function(){
		this.styleChanged();
		this.update();
	},
	textSizeChanged: function(){
		setTimeout(this, "_textSizeChanged", 1);
	},
	_textSizeChanged: function(){
		if(this.domNode){
			this.views.forEach(function(v){
				v.content.update();
			});
			this.render();
		}
	},
	reveal: function(){
		this.render();
	},
	sizeChange: function(){
		dojox.grid.jobs.job(this.widgetId + 'SizeChange', 50, dojo.hitch(this, "update"));
	},
	// managers
	createManagers: function(){
		// row manager
		this.rows = new dojox.grid.rows(this);
		// focus manager
		this.focus = new dojox.grid.focus(this);
		// selection manager
		this.selection = new dojox.grid.selection(this);
		// edit manager
		this.edit = new dojox.grid.edit(this);
	},
	// virtual scroller
	createScroller: function(){
		this.scroller = new dojox.grid.scroller.columns();
		this.scroller.renderRow = dojo.hitch(this, "renderRow");
		this.scroller.removeRow = dojo.hitch(this, "rowRemoved");
	},
	// layout
	createLayout: function(){
		this.layout = new dojox.grid.layout(this);
	},
	// views
	createViews: function(){
		this.views = new dojox.grid.views(this);
		this.views.createView = dojo.hitch(this, "createView");
	},
	createView: function(inClass){
		var c = eval(inClass);
		var view = new c({ grid: this });
		this.viewsNode.appendChild(view.domNode);
		this.headerNode.appendChild(view.headerNode);
		this.views.addView(view);
		return view;
	},
	buildViews: function(){
		for(var i=0, vs; (vs=this.layout.structure[i]); i++){
			this.createView(vs.type || "dojox.GridView").setStructure(vs);
		}
		this.scroller.setContentNodes(this.views.getContentNodes());
	},
	//: public
	//$ Install a new structure and rebuild the grid.
	setStructure: function(inStructure){
		this.views.destroyViews();
		this.structure = inStructure;
		if((this.structure)&&(dojo.isString(this.structure))){
			this.structure=dojox.grid.getProp(this.structure);
		}
		if(!this.structure){
			this.structure=window["layout"];
		}
		this.layout.setStructure(this.structure);
		if(!this.structure){
			return;
		}
		this.buildViews();
		if(this.autoRender){
			this.render();
		}
	},
	// sizing
	//: protected
	resize: function(){
		// useful measurement
		var padBorder = dojo._getPadBorderExtents(this.domNode);
		// grid height
		if(this.autoHeight){
			this.domNode.style.height = 'auto';
			this.viewsNode.style.height = '';
		}else if(this.flex > 0){
		}else if(this.domNode.clientHeight <= padBorder.h){
			if(this.domNode.parentNode == document.body){
				this.domNode.style.height = this.defaultHeight;
			}else{
				this.fitTo = "parent";
			}
		}
		if(this.fitTo == 'parent'){
			var h = dojo._getContentBox(this.domNode.parentNode).h;
			dojo._setMarginBox(this.domNode, { h: Math.max(0, h) });
		}
		// header height
		var t = this.views.measureHeader();
		this.headerNode.style.height = t + 'px';
		// content extent
		var l = 1, h = (this.autoHeight ? -1 : Math.max(this.domNode.clientHeight - t, 0) || 0);
		if(this.autoWidth){
			// grid width set to total width
			this.domNode.style.width = this.views.arrange(l, 0, 0, h) + 'px';
		}else{
			// views fit to our clientWidth
			var w = this.domNode.clientWidth || (this.domNode.offsetWidth - padBorder.width);
			this.views.arrange(l, 0, w, h);
		}
		// virtual scroller height
		this.scroller.windowHeight = h; 
		// default row height (FIXME: use running average(?), remove magic #)
		this.scroller.defaultRowHeight = this.rows.getDefaultHeightPx() + 1;
		this.postresize();
	},
	resizeHeight: function(){
		var t = this.views.measureHeader();
		this.headerNode.style.height = t + 'px';
		// content extent
		var h = (this.autoHeight ? -1 : Math.max(this.domNode.clientHeight - t, 0) || 0);
		//this.views.arrange(0, 0, 0, h);
		this.views.onEach('setSize', [0, h]);
		this.views.onEach('resizeHeight');
		this.scroller.windowHeight = h; 
	},
	// render 
	//: public
	//$ Render the grid, headers, and views. Edit and scrolling states are reset.
	//$ Compare to Update.
	render: function(){
		//dojox.grid.watchTextSizePoll(this, 'textSizeChanged');
		if(!this.domNode){
			console.log("Grid.render: domNode is null", this);
			return;
		}
		this.update = this.defaultUpdate;
		this.scroller.init(this.rowCount, this.keepRows, this.rowsPerPage);
		this.prerender();
		this.setScrollTop(0);
		this.postrender();
	},
	//: protected
	//$ Renders views and calls resize.
	prerender: function(){
		this.views.render();
		this.resize();
	},
	//$ Post-render tasks
	postrender: function(){
		//this.resizeHeight();
		this.postresize();
		this.focus.initFocusView();
	},
	postresize: function(){
		// views are position absolute, so they do not inflate the parent
		if(this.autoHeight){
			this.viewsNode.style.height = this.views.measureContent() + 'px';
		}
	},
	//: private
	renderRow: function(inRowIndex, inNodes){
		this.views.renderRow(inRowIndex, inNodes);
	},
	rowRemoved: function(inRowIndex){
		this.views.rowRemoved(inRowIndex);
	},
	//: public
	invalidated: null,
	updating: false,
	//$ batch updates
	beginUpdate: function(){
		// NOTE: not currently supporting nested begin/endUpdate calls
		this.invalidated = [];
		this.updating = true;
	},
	endUpdate: function(){
		this.updating = false;
		var i = this.invalidated;
		if(i.all){
			this.update();
		}else if(i.rowCount != undefined){
			this.updateRowCount(i.rowCount);
		}else{
			for(r in i){
				this.updateRow(Number(r));
			}
		}
		this.invalidated = null;
	},
	// update
	//: private
	defaultUpdate: function(){
		if(this.updating){
			this.invalidated.all = true;
			return;
		}
		//this.edit.saveState(inRowIndex);
		this.prerender();
		this.scroller.invalidateNodes();
		this.setScrollTop(this.scrollTop);		
		this.postrender();
		//this.edit.restoreState(inRowIndex);
	},
	//$ Update render the grid, retaining edit and scrolling states.
	update: function(){
		this.render();
	},
	//$ Update a single row
	updateRow: function(inRowIndex){
		inRowIndex = Number(inRowIndex);
		if(this.updating){
			this.invalidated[inRowIndex]=true;
			return;
		}
		this.views.updateRow(inRowIndex, this.rows.getHeight(inRowIndex));
		this.scroller.rowHeightChanged(inRowIndex);
	},
	//$ Change the number of rows.
	updateRowCount: function(inRowCount){
		if(this.updating){
			this.invalidated.rowCount = inRowCount;
			return;
		}
		this.rowCount = inRowCount;
		this.scroller.updateRowCount(inRowCount);
		this.setScrollTop(this.scrollTop);
		this.resize();
	},
	//$ Update the styles for a row after it's state has changed.
	updateRowStyles: function(inRowIndex){
		this.views.updateRowStyles(inRowIndex);
	},
	//$ Update grid when the height of a row has changed.
	rowHeightChanged: function(inRowIndex){
		this.views.renormalizeRow(inRowIndex);
		this.scroller.rowHeightChanged(inRowIndex);
	},
	//: protected
	// scrolling
	fastScroll: true,
	delayScroll: false,
	scrollRedrawThreshold: (dojo.isIE ? 100 : 50),
	// scroll methods
	scrollTo: function(inTop){
		if(!this.fastScroll){
			this.setScrollTop(inTop);
			return;
		}
		var delta = Math.abs(this.lastScrollTop - inTop);
		this.lastScrollTop = inTop;
		if(delta > this.scrollRedrawThreshold || this.delayScroll){
			this.delayScroll = true;
			this.scrollTop = inTop;
			this.views.setScrollTop(inTop);
			dojox.grid.jobs.job('dojoxGrid-scroll', 200, dojo.hitch(this, "finishScrollJob"));
		}else{
			this.setScrollTop(inTop);
		}
	},
	finishScrollJob: function(){
		this.delayScroll = false;
		this.setScrollTop(this.scrollTop);
	},
	setScrollTop: function(inTop){
		this.scrollTop = this.views.setScrollTop(inTop);
		this.scroller.scroll(this.scrollTop);
	},
	scrollToRow: function(inRow){
		this.setScrollTop(this.scroller.findScrollTop(inRow) + 1);
	},
	// styling
	styleRowNode: function(inRowIndex, inRowNode){
		if(inRowNode){
			this.rows.styleRowNode(inRowIndex, inRowNode);
		}
	},
	// selection
	//: public
	canSelect: function(inRowIndex){
		return true;
	},
	canDeselect: function(inRowIndex){
		return true;
	},
	//: protected
	selected: function(inRowIndex){
		this.updateRowStyles(inRowIndex);
	},
	deselected: function(inRowIndex){
		this.updateRowStyles(inRowIndex);
	},
	selectionChanged: function(){
	},
	// sorting
	//: public
	canSort: function(inSortInfo){
	},
	sort: function(){
	},
	getSortAsc: function(inSortInfo){
		inSortInfo = inSortInfo == undefined ? this.sortInfo : inSortInfo;
		return Boolean(inSortInfo > 0);
	},
	getSortIndex: function(inSortInfo){
		inSortInfo = inSortInfo == undefined ? this.sortInfo : inSortInfo;
		return Math.abs(inSortInfo) - 1;
	},
	setSortIndex: function(inIndex, inAsc){
		var si = inIndex +1;
		if(inAsc != undefined){
			si *= (inAsc ? 1 : -1);
		} else if(this.getSortIndex() == inIndex){
			si = -this.sortInfo;
		}
		this.setSortInfo(si);
	},
	//: protected
	getCell: function(inIndex){
		return this.layout.cells[inIndex];
	},
	setSortInfo: function(inSortInfo){
		if(this.canSort(inSortInfo)){
			this.sortInfo = inSortInfo;
			this.sort();
			this.update();
		}
	},
	// DOM event handler
	doKeyEvent: function(e){
		e.dispatch = 'do' + e.type;
		this.onKeyEvent(e);
	},
	// event dispatch
	//: protected
	_dispatch: function(m, e){
		if(m in this){
			return this[m](e);
		}
	},
	dispatchKeyEvent: function(e){
		this._dispatch(e.dispatch, e);
	},
	dispatchContentEvent: function(e){
		this.edit.dispatchEvent(e) || e.sourceView.dispatchContentEvent(e) || this._dispatch(e.dispatch, e);
	},
	dispatchHeaderEvent: function(e){
		e.sourceView.dispatchHeaderEvent(e) || this._dispatch('doheader' + e.type, e);
	},
	dokeydown: function(e){
		this.onKeyDown(e);
	},
	doclick: function(e){
		if(e.cellNode){
			this.onCellClick(e);
		}else{
			this.onRowClick(e);
		}
	},
	dodblclick: function(e){
		if(e.cellNode){
			this.onCellDblClick(e);
		}else{
			this.onRowDblClick(e);
		}
	},
	docontextmenu: function(e){
		if(e.cellNode){
			this.onCellContextMenu(e);
		}else{
			this.onRowContextMenu(e);
		}
	},
	doheaderclick: function(e){
		if(e.cellNode){
			this.onHeaderCellClick(e);
		}else{
			this.onHeaderClick(e);
		}
	},
	doheaderdblclick: function(e){
		if(e.cellNode){
			this.onHeaderCellDblClick(e);
		}else{
			this.onHeaderDblClick(e);
		}
	},
	doheadercontextmenu: function(e){
		if(e.cellNode){
			this.onHeaderCellContextMenu(e);
		}else{
			this.onHeaderContextMenu(e);
		}
	},
	//: protected
	doStartEdit: function(inCell, inRowIndex){
		this.onStartEdit(inCell, inRowIndex);
	},
	doApplyCellEdit: function(inValue, inRowIndex, inFieldIndex){
		this.onApplyCellEdit(inValue, inRowIndex, inFieldIndex);
	},
	doCancelEdit: function(inRowIndex){
		this.onCancelEdit(inRowIndex);
	},
	doApplyEdit: function(inRowIndex){
		this.onApplyEdit(inRowIndex);
	},
	//: public
	// row editing
	addRow: function(){
		this.updateRowCount(this.rowCount+1);
	},
	removeSelectedRows: function(){
		// FIXME: likely to confuse people
		this.updateRowCount(Math.max(0, this.rowCount - this.selection.getSelected().length));
		this.selection.clear();
	}
});

dojo.mixin(dojox.VirtualGrid.prototype, dojox.grid.publicEvents);
