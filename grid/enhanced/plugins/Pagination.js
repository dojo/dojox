dojo.provide("dojox.grid.enhanced.plugins.Pagination");

dojo.require("dojox.grid.enhanced._Plugin");
dojo.require("dijit.dijit");
dojo.require("dijit.Dialog");
dojo.require("dijit.form.NumberTextBox");
dojo.require("dijit.form.Button");
dojo.require("dojox.grid.enhanced.plugins.StoreLayer");
dojo.requireLocalization("dojox.grid.enhanced", "Pagination");

dojo.declare("dojox.grid.enhanced.plugins.Pagination", dojox.grid.enhanced._Plugin, {
	name: "pagination",
	// The page size ot use for the store
	// Default is 25.
	pageSize: 25,
	
	defaultRows: 25,
	
	//current page we are on
	_currentPage: 0,

	//The currently obtained max # of rows to page through.
	_maxSize: 0,

	constructor: function(inGrid, paginationArgs){
		this.grid = inGrid;
		this.gh = null;
		this.grid.rowsPerPage = this.pageSize = this.grid.rowsPerPage ? this.grid.rowsPerPage : this.pageSize;
		
		this._wrapStoreLayer();
		this.nls = dojo.i18n.getLocalization("dojox.grid.enhanced", "Pagination");
		// Reference to the query to send to the store
		this.query = this.grid.query;
		this._createPaginators(paginationArgs);
		this._store = inGrid.store;
		this._createConnections();
		this._regApis();
	},
	
	_createPaginators: function(paginationArgs){
		// summary:
		//		Function to create the pagination bar.
		this.paginationArgs = paginationArgs;
		this.paginators = [];
	 	if(paginationArgs.barPosition === "both"){
			var args1 = dojo.clone(paginationArgs);
			args1.barPosition = "bottom";
			paginationArgs.barPosition = "top";
			this.paginators = [
				new dojox.grid.enhanced.plugins._Paginator(this, args1),
				new dojox.grid.enhanced.plugins._Paginator(this, paginationArgs)
			];
		}else{
			this.paginators = [new dojox.grid.enhanced.plugins._Paginator(this, paginationArgs)];
		}
	},
	 
	_wrapStoreLayer: function(){
		var g = this.grid;
		this.forcePageStoreLayer = new dojox.grid.enhanced.plugins._ForcedPageStoreLayer(this);
		dojox.grid.enhanced.plugins.wrap(g.store, this.forcePageStoreLayer);
	},
	
	_createConnections: function(){
		this.connect(this.grid, "setStore", this, function(store){
			if(store !== this._store){
				this._store.unwrap(this.forcePageStoreLayer.name());
				this._wrapStore();
				this._store = store;
			}
		});
		this.connect(this.grid, "setQuery", this, function(query){
			if(query !== this.query){
				this.query = query;
			}
		});
	},
	
	_regApis: function(){
		var g = this.grid;
		g.gotoPage = dojo.hitch(this, this.gotoPage);
		g.nextPage = dojo.hitch(this, this.nextPage);
		g.prevPage = dojo.hitch(this, this.prevPage);
		g.gotoFirstPage = dojo.hitch(this, this.gotoFirstPage);
		g.gotoLastPage = dojo.hitch(this, this.gotoLastPage);
		g.changePageSize = dojo.hitch(this, this.changePageSize);
		g.showGotoPageButton = dojo.hitch(this, this.showGotoPageButton);
	},
	
	connect: function(obj, event, context, method){
		if(!this._connections){
			this._connections = [];
		}
		var handler = dojo.connect(obj, event, context, method);
		this._connections.push(handler);
		return handler;
	},
	
	disconnect: function(){
		if(this._connections){
			dojo.forEach(this._connections, dojo.disconnect);
		}
	},
	
	nextPage: function(){
		// summary:
		//		Function to handle shifting to the next page in the list.
		if(this._maxSize > ((this._currentPage + 1) * this.pageSize)){
			//Current page is indexed at 0 and gotoPage expects 1-X.  So to go 
			//up  one, pass current page + 2!
			this.gotoPage(this._currentPage + 2);
		}
	},

	prevPage: function(){
		// summary:
		//		Function to handle shifting to the previous page in the list.
		if(this._currentPage > 0){
			//Current page is indexed at 0 and gotoPage expects 1-X.  So to go 
			//back one, pass current page!
			this.gotoPage(this._currentPage);
		}
	},

	gotoPage: function(page){
		// summary:
		//		Function to handle shifting to an arbirtary page in the list.
		//	page:
		//		The page to go to, starting at 1.
		var totalPages = Math.ceil(this._maxSize / this.pageSize);
		page--;
		if(page < totalPages && page >= 0 && this._currentPage !== page){
			this._currentPage = page;
			this.grid.setQuery(this.query);
			// this.grid._refresh(true);
			this.grid.resize();
		}
	},
	
	gotoFirstPage: function(){
		this.gotoPage(1);
	},
	
	gotoLastPage: function(){
		var totalPages = Math.ceil(this._maxSize / this.pageSize);
		this.gotoPage(totalPages);
	},
	
	destroy: function(){
		try{
			this.disconnect();
			dojo.forEach(this.paginators, function(f){
				f.uninit();
				f = null;
			});
			this._store.unwrap(this.forcePageStoreLayer.name());
			this._store = null;
		}catch(e){
			console.log(e);
		}
	},

	changePageSize: function(size){
		// summary:
		//		Change size of items per page.
		//		This function will only be called by _Paginator
		if(typeof size == "string"){
			size = parseInt(size, 10);
		}
		var startIndex = this.pageSize * this._currentPage;
		dojo.forEach(this.paginators, function(f){
			f.currentPageSize = this.grid.rowsPerPage = this.pageSize = size;
			if(size >= this._maxSize){
				this.grid.rowsPerPage = this.defaultRows;
			}
		}, this);
		var endIndex = startIndex + Math.min(this.pageSize, this._maxSize);
		var cp = this._currentPage;
		
		if(endIndex > this._maxSize){
			this.gotoLastPage();
		}else{
			this._currentPage = Math.ceil(startIndex / this.pageSize) + 1;
			 if(cp !== this._currentPage){
			 	this.gotoPage(this._currentPage);
			}else{
				this.grid._refresh(true);
			}
		}
		this.grid.resize();
	},
	
	showGotoPageButton: function(flag){
		dojo.forEach(this.paginators, function(p){
			p._showGotoButton(flag);
		});
	}
});

dojo.declare("dojox.grid.enhanced.plugins._ForcedPageStoreLayer", dojox.grid.enhanced.plugins._StoreLayer, {
	tags: ["presentation"],
	
	constructor: function(plugin){
		this._plugin = plugin;
	},
	
	_fetch: function(request){
		var paginator = this._plugin.paginators[0];
		if(this._plugin.showAll || (!paginator.showSizeSwitch && !paginator.showPageStepper && !paginator.showGotoButton)){
			dojo.hitch(this, this._showAllFetch)(request);
		}else{
			this.updated = false;
			dojo.hitch(this, this._pagingFetch)(request);
		}
	},
	
	_showAllFetch: function(request){
		var self = this,
			scope = request.scope || dojo.global,
			onBegin = request.onBegin;
		if(onBegin){
			request.onBegin = function(size, req){
				if(self.updated && dojo.some(self._plugin.paginators, function(f){
					return f.pageSizeValue != null;
				})){
					self.updated = false;
				}
				if(!self.updated){
					self._plugin._maxSize = size;
					self.startIdx = 0;
					self.endIdx = size - 1;
					dojo.forEach(self._plugin.paginators, function(f){
						f.update();
					});
					self.updated = true;
				}
				req.onBegin = onBegin;
				req.onBegin.call(scope, size, req);
			}
		}
		return dojo.hitch(this._store, this._originFetch)(request);
	},
	
	_pagingFetch: function(request){
		var self = this,
			plugin = self._plugin,
			grid = plugin.grid,
			scope = request.scope || dojo.global,
			onBegin = request.onBegin;
			
		grid.showMessage(grid.loadingMessage);
		
		request.start = plugin._currentPage * plugin.pageSize + request.start;
		self.startIdx = request.start;
		self.endIdx = request.start + plugin.pageSize - 1;
		
		if(onBegin){
			request.onBegin = function(size, req){
				req.start = 0;
				req.count = plugin.pageSize;
				plugin._maxSize = size;
				self.endIdx = self.endIdx > size ? (size - 1) : self.endIdx;
				if(self.startIdx >= size && size != 0){
					grid._pending_requests[req.start] = false;
					plugin.gotoFirstPage();
				}
				dojo.forEach(plugin.paginators, function(f){
					f.update();
				});
				req.onBegin = onBegin;
				req.onBegin.call(scope, Math.min(plugin.pageSize, (size - self.startIdx)), req);
			};
		}
		return dojo.hitch(this._store, this._originFetch)(request);
	}
});

dojo.declare("dojox.grid.enhanced.plugins._Paginator", [dijit._Widget,dijit._Templated], {
	templatePath: dojo.moduleUrl("dojox.grid","enhanced/templates/Pagination.html"),
		
	// pagination bar position
	barPosition: "bottom",
	
	// max data item size
	_maxItemSize: 0,
	
	// description message status params
	showDescription: true,
	
	// fast step page status params
	showPageStepper: true,
	maxPageStep: 7,
	
	// items per page size switch params
	showSizeSwitch: true,
	pageSizeArr: ["10", "25", "50", "100", "All"],
	
	showGotoButton: false,
	
	constructor: function(paginationPlugin, params){
		this.plugin = paginationPlugin;
		this.grid = this.plugin.grid;
		this.itemTitle = this.plugin.nls["itemTitle"];
		this.descTemplate = this.plugin.nls["descTemplate"];
		dojo.mixin(this, params || {});
		this._connections = [];
	},
	
	postCreate: function(){
		this.inherited(arguments);
		this._hackGridResize();
		this._placeSelf();
	},
	
	uninit: function(){
		this.grid.focus.removeArea("pagination" + this.barPosition.toLowerCase());
		dojo.forEach(this._connections, dojo.disconnect);
		if(this._gotPageDialog){
			this._gotPageDialog.destroy();
		}
		dojo.destroy(this.domNode);
		this.grid._resize = this.gridResize;
		
		this.pageStepperDiv	= null;
		this.pageStepperTd	= null;
		this.sizeSwitchTd	= null;
		this.descriptionDiv	= null;
		this.descriptionTd	= null;
		this.paginatorBar	= null;
	},
	
	update: function(){
		// summary:
		//		Function to update paging information and update
		//		pagination bar display.
		this.currentPageSize = this.plugin.pageSize;
		this._maxItemSize = this.plugin._maxSize;
		
		// update pagination bar display information
		this._updateDescription();
		this._updatePageStepper();
		this._updateSizeSwitch();
		this._updateGotoButton();
	},
	
	_regFocusMgr: function(position){
		// summary:
		//		Function to register pagination bar to focus manager.
		var _this = this;
		this.grid.focus.addArea({
			name: "pagination" + position,
			onFocus: dojo.hitch(this, this._onFocusPaginator),
			onBlur: dojo.hitch(this, this._onBlurPaginator),
			onMove: dojo.hitch(this, this._moveFocus),
			onKeyDown: dojo.hitch(this, this._onKeyDown)
		});
		switch(position){
			case "top":
				this.grid.focus.placeArea("pagination" + position, "before", "header");
				break;
			case "bottom":
			default:
				this.grid.focus.placeArea("pagination" + position, "after", "content");
				break;
		}
	},
	
	_placeSelf: function(){
		// summary:
		//		Place pagination bar to a position.
		//		There are three options, top of the grid, after grid header,
		//		and bottom of the grid.
		var g = this.grid;
		var	position = dojo.trim(this.barPosition.toLowerCase());
		switch(position){
			case "top":
				this.placeAt(g.viewsHeaderNode, "before");
				this._regFocusMgr("top");
				break;
			case "bottom":
			default:
				this.placeAt(g.viewsNode, "after");
				this._regFocusMgr("bottom");
				break;
		}
	},
	
	_hackGridResize: function(){
		var g = this.grid, rowCount = this.plugin.pageSize;
		this.gridResize = dojo.hitch(g, g._resize);
		var resizeSelf = dojo.hitch(this, this._resetGridHeight);
		var _this = this;
		g._resize = function(changeSize, resultSize){
			_this.gridResize(changeSize, resultSize);
			resizeSelf(changeSize, resultSize);
		};
	},
	
	_resetGridHeight: function(changeSize, resultSize){
		// summary:
		//		Function of resize grid height to place this pagination bar.
		//		This function will resize the grid viewsNode height, scorllboxNode height
		//	changeSize&resultSize: for grid.resize(changeSize, resultSize)
		var g = this.grid;
		if(!g._autoHeight){
			var padBorder = g._getPadBorder().h;
			if(!this.plugin.gh){
				this.plugin.gh = dojo.contentBox(g.domNode).h + 2 * padBorder;
			}
			if(resultSize){
				changeSize = resultSize;
			}
			if(changeSize){
				this.plugin.gh = dojo.contentBox(g.domNode).h + 2 * padBorder;
			}
			var gh = this.plugin.gh,
				hh = g._getHeaderHeight(),
				ph = dojo.marginBox(this.domNode).h;
			ph = this.plugin.paginators[1] ? ph * 2 : ph;
			if(typeof g.autoHeight == "number"){
				var padBorder = g._getPadBorder().h;
				var cgh = gh + ph - g._getPadBorder().h;
				dojo.style(g.domNode, "height", cgh + "px");
				dojo.style(g.viewsNode, "height", (cgh - ph - hh) + "px");
				
				this._styleMsgNode(hh, dojo.marginBox(g.viewsNode).w, cgh - ph - hh);
			}else{
				var h = gh - ph - hh - g._getPadBorder().h;;
				dojo.style(g.viewsNode, "height", h + "px");
				dojo.forEach(g.viewsNode.childNodes, function(c){
					dojo.style(c, "height", h + "px");
				});
				dojo.forEach(g.views.views, function(v){
					if(v.scrollboxNode){
						dojo.style(v.scrollboxNode, "height", h + "px");
					}
				});
				
				this._styleMsgNode(hh, dojo.marginBox(g.viewsNode).w, h);
			}
		}
	},
	
	_styleMsgNode: function(top, width, height){
		var messagesNode = this.plugin.grid.messagesNode;
		dojo.style(messagesNode, "position", "absolute");
		dojo.style(messagesNode, "top", top + "px");
		dojo.style(messagesNode, "width", width + "px");
		dojo.style(messagesNode, "height", height + "px");
		dojo.style(messagesNode, "z-Index", "100");
	},
	
	_updateDescription: function(){
		// summary:
		//		Update size information.
		var s = this.plugin.forcePageStoreLayer;
		if(this.showDescription && this.descriptionDiv){
			if(this._maxItemSize > 0){
				this.descriptionDiv.innerHTML = dojo.string.substitute(this.descTemplate, [this.itemTitle, this._maxItemSize, s.startIdx + 1, s.endIdx + 1]);
			}else if(this._maxItemSize <= 0){
				this.descriptionDiv.innerHTML = "0 " + this.itemTitle;
			}
		}
	},
	
	_updateSizeSwitch: function(){
		// summary:
		//		Update "items per page" information.
		if(!this.sizeSwitchTd){
			return;
		}
		if(!this.showSizeSwitch){
			dojo.style(this.sizeSwitchTd, "width", "0");
			return;
		}
		if(this._maxItemSize <= 0){
			dojo.style(this.sizeSwitchTd, "display", "none");
			return;
		}else{
			dojo.style(this.sizeSwitchTd, "display", "");
		}
		if(this.sizeSwitchTd.childNodes.length < 1){
			this._createSizeSwitchNodes();
		}
		this._updateSwitchNodeClass();
		
		// move focus to next activable node
		this._moveToNextActivableNode(this._getAllPageSizeNodes(), this.pageSizeValue);
		this.pageSizeValue = null;
	},
	
	_createSizeSwitchNodes: function(){
		var node = null;
		if(!this.pageSizeArr || this.pageSizeArr.length < 1){
			return;
		}
		dojo.forEach(this.pageSizeArr, function(size){
			// create page size switch node
			size = dojo.trim(size);
			node = dojo.create("span", {innerHTML: size, value: size, tabindex: 0}, this.sizeSwitchTd, "last");
			// for accessibility
			var labelValue = size.toLowerCase() == "all" ? this.plugin.nls["allItemsLabelTemplate"] : dojo.string.substitute(this.plugin.nls["pageSizeLabelTemplate"], [size]);
			dijit.setWaiState(node, "label", labelValue);
			// connect event
			this.plugin.connect(node, "onclick", this, "_onSwitchPageSize");
			this.plugin.connect(node, "onmouseover", function(e){
				dojo.addClass(e.target, "hover");
			});
			this.plugin.connect(node, "onmouseout", function(e){
				dojo.removeClass(e.target, "hover");
			});
			// create a separation node
			node = dojo.create("span", {innerHTML: "|"}, this.sizeSwitchTd, "last");
		}, this);
		// delete last separation node
		dojo.destroy(node);
	},
	
	_updateSwitchNodeClass: function(){
		var size = null;
		var hasActivedNode = false;
		var styleNode = function(node, status){
			if(status){
				dojo.addClass(node, "activedSwitchClass");
				dojo.attr(node, "tabindex", "-1");
				hasActivedNode = true;
			}else{
				dojo.addClass(node, "inactiveSwitchClass");
				dojo.attr(node, "tabindex", "0");
			}
		};
		dojo.forEach(this.sizeSwitchTd.childNodes, function(node){
			if(node.value){
				size = node.value;
				dojo.removeClass(node);
				if(this.pageSizeValue){
					styleNode(node, size === this.pageSizeValue && !hasActivedNode);
				}else{
					if(size.toLowerCase() == "all"){
						size = this._maxItemSize;
					}
					styleNode(node, this.currentPageSize === parseInt(size, 10) && !hasActivedNode);
				}
			}
		}, this);
	},
	
	_updatePageStepper: function(){
		if(!this.pageStepperTd){
			return;
		}
		if(!this.showPageStepper){
			return;
		}
		if(this._maxItemSize <= 0){
			dojo.style(this.pageStepperTd, "display", "none");
			return;
		}else{
			dojo.style(this.pageStepperTd, "display", "");
		}
		if(this.pageStepperDiv.childNodes.length < 1){
			this._createPageStepNodes();
			this._createWardBtns();
		}else{
			this._resetPageStpeNodes();
		}
		this._updatePageStepNodeClass();
		
		this._moveToNextActivableNode(this._getAllPageStepNodes(), this.pageStepValue);
		this.pageStepValue = null;
	},
	
	_createPageStepNodes: function(){
		var startPage = this._getStartPage(),
			stepSize = this._getStepPageSize(),
			node = null;
		for(var i = startPage; i < this.maxPageStep + 1; i++){
			var tabIdx = i < startPage + stepSize ? 0 : -1;
			var visible = i < startPage + stepSize ? "block" : "none";
			node = dojo.create("div", {innerHTML: i, value: i, tabindex: tabIdx}, this.pageStepperDiv, "first");
			dijit.setWaiState(node, "label", dojo.string.substitute(this.plugin.nls["pageStepLabelTemplate"], [i + ""]));
			// connect event
			this.plugin.connect(node, "onclick", this, "_onPageStep");
			this.plugin.connect(node, "onmouseover", function(e){
				dojo.addClass(e.target, "hover");
			});
			this.plugin.connect(node, "onmouseout", function(e){
				dojo.removeClass(e.target, "hover");
			});
			dojo.style(node, "display", visible);
		}
	},
	
	_createWardBtns: function(){
		var self = this;
		var createWardBtn = function(value, label, position){
			var node = dojo.create("div", {value: value, title: label, tabindex: 1}, self.pageStepperDiv, position);
			self._connections.push(dojo.connect(node, "onclick", self, "_onPageStep"));
			dijit.setWaiState(node, "label", label);
			// for high contrast
			var highConrastNode = dojo.create("span", {value: value, title: label, innerHTML: "‹"}, node, position);
			dojo.addClass(highConrastNode, "wardButtonInnerClass");
		};
		createWardBtn("prevPage", this.plugin.nls["prevTip"], "last");
		createWardBtn("firstPage", this.plugin.nls["firstTip"], "last");
		createWardBtn("nextPage", this.plugin.nls["nextTip"], "first");
		createWardBtn("lastPage", this.plugin.nls["lastTip"], "first");
	},
	
	_resetPageStpeNodes: function(){
		var startPage = this._getStartPage(),
			stepSize = this._getStepPageSize(),
			stepNodes = this.pageStepperDiv.childNodes,
			node = null;
		for(var i = startPage, j = stepNodes.length - 3; j > 1; j--, i++){
			node = stepNodes[j];
			if(i < startPage + stepSize){
				dojo.attr(node, "innerHTML", i);
				dojo.attr(node, "value", i);
				dojo.style(node, "display", "block");
				dijit.setWaiState(node, "label", dojo.string.substitute(this.plugin.nls["pageStepLabelTemplate"], [i + ""]));
			}else{
				dojo.style(node, "display", "none");
			}
		}
	},
	
	_updatePageStepNodeClass: function(){
		var value = null,
			curPage = this._getCurrentPageNo(),
			pageCount = this._getPageCount();
			
		var updateClass = function(node, isWardBtn, status){
			var value = node.value,
				enableClass = isWardBtn ? value + "BtnClass" : "inactiveClass",
				disableClass = isWardBtn ? value + "BtnDisableClass" : "activedClass";
			if(status){
				dojo.addClass(node, disableClass);
				dojo.attr(node, "tabindex", "-1");
			}else{
				dojo.addClass(node, enableClass);
				dojo.attr(node, "tabindex", "0");
			}
		};
		dojo.forEach(this.pageStepperDiv.childNodes, function(node){
			dojo.removeClass(node);
			if(isNaN(parseInt(node.value, 10))){
				dojo.addClass(node, "wardButtonClass");
				var disablePageNum = node.value == "prevPage" || node.value == "firstPage" ? 1 : pageCount;
				updateClass(node, true, (curPage == disablePageNum));
			}else{
				value = parseInt(node.value, 10);
				updateClass(node, false, (value === curPage || dojo.style(node, "display") === "none"));
			}
		}, this);
	},
	
	_showGotoButton: function(flag){
		this.showGotoButton = flag;
		this._updateGotoButton();
	},
	
	_updateGotoButton: function(){
		if(!this.showGotoButton){
			if(this.gotoPageTd){
				if(this._gotPageDialog){
					this._gotPageDialog.destroy();
				}
				dojo.destroy(this.gotoPageTd);
				this.gotoPageTd = null;
			}
			return;
		}
		if(!this.gotoPageTd){
			this._createGotoNode();
		}
		this._updateGotoBtnClass();
	},
	
	_createGotoNode: function(){
		this.gotoPageTd = dojo.create("td", {}, dojo.query("tr", this.domNode)[0], "last");
		dojo.addClass(this.gotoPageTd, "paginatorGotoTdClass");
		this.gotoPageDiv = dojo.create("div", {tabindex: "0", title: this.plugin.nls["gotoButtonTitle"]}, this.gotoPageTd, "first");
		dojo.addClass(this.gotoPageDiv, "paginatorGotoDivClass");
		this.plugin.connect(this.gotoPageDiv, "onclick", this, "_openGotopageDialog");
		// for high contrast
		var highConrastNode = dojo.create("span", {title: this.plugin.nls["gotoButtonTitle"], innerHTML: "^"}, this.gotoPageDiv, "last");
		dojo.addClass(highConrastNode, "wardButtonInnerClass");
	},
	
	_updateGotoBtnClass: function(){
		if(this.plugin.pageSize >= this.plugin._maxSize){
			dojo.addClass(this.gotoPageDiv, "paginatorGotoDivDisabled");
		}else{
			dojo.removeClass(this.gotoPageDiv, "paginatorGotoDivDisabled");
		}
	},
	
	_openGotopageDialog: function(event){
		if(this.plugin.pageSize >= this.plugin._maxSize){
			return;
		}
		if(!this._gotPageDialog){
			this._gotPageDialog = new dojox.grid.enhanced.plugins.filter._GotoPageDialog(this.plugin);
		}
		// focus
		if(!this._currentFocusNode){
			this.grid.focus.focusArea("pagination" + this.barPosition, event);
		}else{
			this._currentFocusNode = this.gotoPageDiv;
		}
		if(this.focusArea != "pageStep"){
			this.focusArea = "pageStep";
		}
		this._gotPageDialog.updatePageCount();
		this._gotPageDialog.showDialog();
	},
	
	// ===== focus handlers ===== //
	_onFocusPaginator: function(event, step){
		if(!this._currentFocusNode){
			if(step > 0){
				return this._onFocusPageSizeNode(event) ? true : this._onFocusPageStepNode(event);
			}else if(step < 0){
				return this._onFocusPageStepNode(event) ? true : this._onFocusPageSizeNode(event);
			}
		}else if(this._currentFocusNode){
			if(step > 0){
				return this.focusArea === "pageSize" ? this._onFocusPageStepNode(event) : false;
			}else if(step < 0){
				return this.focusArea === "pageStep" ? this._onFocusPageSizeNode(event) : false;
			}
		}
	},
	
	_onFocusPageSizeNode: function(event){
		var pageSizeNodes = this._getPageSizeActivableNodes();
		if(event && event.type !== "click"){
			if(pageSizeNodes[0]){
				dijit.focus(pageSizeNodes[0]);
				this._currentFocusNode = pageSizeNodes[0];
				this.focusArea = "pageSize";
				try{
					dojo.stopEvent(event);
				}catch(e){return false;}
				return true;
			}else{
				return false;
			}
		}
		if(event && event.type == "click"){
			if(dojo.indexOf(this._getPageSizeActivableNodes(), event.target) > -1){
				this.focusArea = "pageSize";
				return true;
			}
		}
		return false;
	},
	
	_onFocusPageStepNode: function(event){
		var pageStepNodes = this._getPageStepActivableNodes();
		if(event && event.type !== "click"){
			if(pageStepNodes[0]){
				dijit.focus(pageStepNodes[0]);
				this._currentFocusNode = pageStepNodes[0];
				this.focusArea = "pageStep";
				try{
					dojo.stopEvent(event);
				}catch(e){return false;}
				return true;
			}else if(this.gotoPageDiv){
				dijit.focus(this.gotoPageDiv);
				this._currentFocusNode = this.gotoPageDiv;
				this.focusArea = "pageStep";
				try{
					dojo.stopEvent(event);
				}catch(e){return false;}
				return true;
			}else{
				return false;
			}
		}
		if(event && event.type == "click"){
			if(dojo.indexOf(this._getPageStepActivableNodes(), event.target) > -1){
				this.focusArea = "pageStep";
				return true;
			}else if(event.target == this.gotoPageDiv){
				dijit.focus(this.gotoPageDiv);
				this._currentFocusNode = this.gotoPageDiv;
				this.focusArea = "pageStep";
				try{
					dojo.stopEvent(event);
				} catch(e){return false;}
				return true;
			}
		}
		return false;
	},
	
	_onFocusGotoPageNode: function(event){
		if(!this.showGotoButton || !this.gotoPageTd){
			return false;
		}
		if(event && event.type !== "click" || (event.type == "click" && event.target == this.gotoPageDiv)){
			dijit.focus(this.gotoPageDiv);
			this._currentFocusNode = this.gotoPageDiv;
			this.focusArea = "gotoButton";
			try{
				dojo.stopEvent(event);
			}catch(e){return false;}
			return true;
		}
		return true;
	},
	
	_onBlurPaginator: function(event, step){
		var pageSizeNodes = this._getPageSizeActivableNodes(),
			pageStepNodes = this._getPageStepActivableNodes();
		
		if(step > 0 && this.focusArea === "pageSize" && (pageStepNodes.length > 1 || this.showGotoButton)){
			return false;
		}else if(step < 0 && this.focusArea === "pageStep" && pageSizeNodes.length > 1){
			return false;
		}
		this._currentFocusNode = null;
		this.focusArea = null;
		return true;
	},
	
	_onKeyDown: function(event, isBubble){
		if(isBubble){
			return;
		}
		if(event.altKey || event.metaKey){
			return;
		}
		var dk = dojo.keys;
		if(event.keyCode === dk.ENTER || event.keyCode === dk.SPACE){
			if(dojo.indexOf(this._getPageStepActivableNodes(), this._currentFocusNode) > -1){
				this._onPageStep(event);
			}else if(dojo.indexOf(this._getPageSizeActivableNodes(), this._currentFocusNode) > -1){
				this._onSwitchPageSize(event);
			}else if(this._currentFocusNode === this.gotoPageDiv){
				this._openGotopageDialog(event);
			}
		}
		try{
			dojo.stopEvent(event);
		}catch(e){}
	},
	
	_moveFocus: function(rowDelta, colDelta, evt){
		var nodes;
		if(this.focusArea == "pageSize"){
			nodes = this._getPageSizeActivableNodes();
		}else if(this.focusArea == "pageStep"){
			nodes = this._getPageStepActivableNodes();
			if(this.gotoPageDiv){
				nodes.push(this.gotoPageDiv);
			}
		}
		if(nodes.length < 1){
			return;
		}
		var currentIdx = dojo.indexOf(nodes, this._currentFocusNode);
		var focusIdx = currentIdx + colDelta;
		if(focusIdx >= 0 && focusIdx < nodes.length){
			dijit.focus(nodes[focusIdx]);
			this._currentFocusNode = nodes[focusIdx];
		}
		try{
			dojo.stopEvent(evt)
		}catch(e){}
	},
	
	_getPageSizeActivableNodes: function(){
		return dojo.query("span[tabindex='0']", this.sizeSwitchTd);
	},
	
	_getPageStepActivableNodes: function(){
		return (dojo.query("div[tabindex='0']", this.pageStepperDiv)).reverse();
	},
	
	_getAllPageSizeNodes: function(){
		var nodeList = [];
		dojo.forEach(this.sizeSwitchTd.childNodes, function(node){
			if(node.value){
				nodeList.push(node);
			}
		});
		return nodeList;
	},
	
	_getAllPageStepNodes: function(){
		var nodeList = [];
		for(var i = this.pageStepperDiv.childNodes.length - 1; i >= 0; i--){
			nodeList.push(this.pageStepperDiv.childNodes[i]);
		}
		return nodeList;
	},
	
	_moveToNextActivableNode: function(nodeList, curNodeValue){
		if(!curNodeValue){
			return;
		}
		if(nodeList.length < 2){
			this.grid.focus.tab(1);
		}
		var nl = [];
			node = null,
			index = 0;
		dojo.forEach(nodeList, function(n){
			if(n.value == curNodeValue){
				nl.push(n);
				node = n;
			}else if(dojo.attr(n, "tabindex") == "0"){
				nl.push(n);
			}
		});
		if(nl.length < 2){
			this.grid.focus.tab(1);
		}
		index = dojo.indexOf(nl, node);//nl.indexOf(node);
		if(dojo.attr(node, "tabindex") != "0"){
			node = nl[index + 1] ? nl[index + 1] : nl[index - 1];
		}
		dijit.focus(node);
		this._currentFocusNode = node;
	},

	// ===== pagination events handlers ===== //
	_onSwitchPageSize: function(/*Event*/e){
		var size = this.pageSizeValue = e.target.value;
		if(!size){
			return;
		}
		if(dojo.trim(size.toLowerCase()) == "all"){
			size = this._maxItemSize;
		}
		if(parseInt(size, 10) >= this._maxItemSize){
			this.plugin.showAll = true;
		}else{
			this.plugin.showAll = false;
		}
		
		size = parseInt(size, 10);
		if(isNaN(size) || size <= 0/* || size == this.currentPageSize*/){
			return;
		}
		
		if(!this._currentFocusNode){
			this.grid.focus.focusArea("pagination" + this.barPosition, e);
		}
		if(this.focusArea != "pageSize"){
			this.focusArea = "pageSize";
		}
		this.plugin.changePageSize(size);
	},
	
	_onPageStep: function(/*Event*/e){
		var p = this.plugin,
			value = e.target.value;
		this.pageStepValue = value;
		
		if(!this._currentFocusNode){
			this.grid.focus.focusArea("pagination" + this.barPosition, e);
		}
		if(this.focusArea != "pageStep"){
			this.focusArea = "pageStep";
		}
		if(!isNaN(parseInt(value, 10))){
			p.gotoPage(value);
		}else{
			switch(e.target.value){
				case "prevPage":
					p.prevPage();
					break;
				case "nextPage":
					p.nextPage();
					break;
				case "firstPage":
					p.gotoFirstPage();
					break;
				case "lastPage":
					p.gotoLastPage();
			}
		}
	},
	
	// ===== information getters ===== //
	_getCurrentPageNo: function(){
		return this.plugin._currentPage + 1;
	},
	
	_getPageCount: function(){
		if(!this._maxItemSize || !this.currentPageSize){
			return 0;
		}
		return Math.ceil(this._maxItemSize / this.currentPageSize);
	},
	
	_getStartPage: function(){
		var cp = this._getCurrentPageNo();
		var ms = parseInt(this.maxPageStep / 2, 10);
		var pc = this._getPageCount();
		if(cp < ms || (cp - ms) < 1){
			return 1;
		}else if(pc <= this.maxPageStep){
			return 1;
		}else{
			if(pc - cp < ms && cp - this.maxPageStep >= 0){
				return pc - this.maxPageStep + 1;
			}else{
				return (cp - ms);
			}
		}
	},
	
	_getStepPageSize: function(){
		var sp = this._getStartPage();
		var count = this._getPageCount();
		if((sp + this.maxPageStep) > count){
			return count - sp + 1;
		}else{
			return this.maxPageStep;
		}
	}

});

dojo.declare("dojox.grid.enhanced.plugins.filter._GotoPageDialog", null, {
	
	pageCount: 0,
	
	constructor: function(plugin){
		this.plugin = plugin;
		this.pageCount = this.plugin.paginators[0]._getPageCount();
		this._dialogNode = dojo.create("div", {}, dojo.body(), "last");
		this._gotPageDialog = new dijit.Dialog({"title": this.plugin.nls["dialogTitle"]}, this._dialogNode);
		this._createDialogContent();
		this._gotPageDialog.startup();
	},
	
	_createDialogContent: function(){
		this._specifyNode = dojo.create("div", {innerHTML: this.plugin.nls["dialogIndication"]}, this._gotPageDialog.containerNode, "last");
		
		this._pageInputDiv = dojo.create("div", {}, this._gotPageDialog.containerNode, "last");
		this._pageTextBox = new dijit.form.NumberTextBox();
		this._pageTextBox.constraints = {fractional:false, min:1, max:this.pageCount};
		this.plugin._connections.push(dojo.connect(this._pageTextBox.textbox, "onkeyup", this, "_setConfirmBtnState"));
		
		this._pageInputDiv.appendChild(this._pageTextBox.domNode);
		this._pageLabel = dojo.create("label", {innerHTML: dojo.string.substitute(this.plugin.nls["pageCountIndication"], [this.pageCount])}, this._pageInputDiv, "last");
		
		this._buttonDiv = dojo.create("div", {}, this._gotPageDialog.containerNode, "last");
		this._confirmBtn = new dijit.form.Button({label: this.plugin.nls["dialogConfirm"], onClick: dojo.hitch(this, this._onConfirm)});
		this._confirmBtn.set("disabled", true);
		
		this._cancelBtn = new dijit.form.Button({label: this.plugin.nls["dialogCancel"], onClick: dojo.hitch(this, this._onCancel)});
		this._buttonDiv.appendChild(this._confirmBtn.domNode);
		this._buttonDiv.appendChild(this._cancelBtn.domNode);
		this._styleContent();
		this._gotPageDialog.onCancel = dojo.hitch(this, this._onCancel);
		this.plugin._connections.push(dojo.connect(this._gotPageDialog, "_onKey", this, "_onKeyDown"));
	},
	
	_styleContent: function(){
		dojo.addClass(this._specifyNode, "dialogMarginClass");
		dojo.addClass(this._pageInputDiv, "dialogMarginClass");
		dojo.addClass(this._buttonDiv, "dialogButtonClass");
		dojo.style(this._pageTextBox.domNode, "width", "50px");
	},
	
	updatePageCount: function(){
		this.pageCount = this.plugin.paginators[0]._getPageCount();
		this._pageTextBox.constraints = {fractional:false, min:1, max:this.pageCount};
		dojo.attr(this._pageLabel, "innerHTML", dojo.string.substitute(this.plugin.nls["pageCountIndication"], [this.pageCount]));
	},
	
	showDialog: function(){
		this._gotPageDialog.show();
	},
	
	_onConfirm: function(event){
		if(this._pageTextBox.isValid() && this._pageTextBox.getDisplayedValue() !== ""){
			this.plugin.gotoPage(this._pageTextBox.getDisplayedValue());
			this._gotPageDialog.hide();
			this._pageTextBox.reset();
		}
		this._stopEvent(event);
	},
	
	_onCancel: function(event){
		this._pageTextBox.reset();
		this._gotPageDialog.hide();
		this._stopEvent(event);
	},
	
	_onKeyDown: function(event){
		if(event.altKey || event.metaKey){
			return;
		}
		var dk = dojo.keys;
		if(event.keyCode === dk.ENTER){
			this._onConfirm();
		}
	},
	
	_setConfirmBtnState: function(){
		if(this._pageTextBox.isValid() && this._pageTextBox.getDisplayedValue() !== ""){
			this._confirmBtn.set("disabled", false);
		}else{
			this._confirmBtn.set("disabled", true);
		}
	},
	
	_stopEvent: function(event){
		try{
			dojo.stopEvent(event)
		}catch(e){}
	},
	
	destroy: function(){
		this._pageTextBox.destroy();
		this._confirmBtn.destroy();
		this._cancelBtn.destroy();
		dojo.destroy(this._specifyNode);
		dojo.destroy(this._pageInputDiv);
		dojo.destroy(this._buttonDiv);
		this._gotPageDialog.destroy();
		dojo.destroy(this._dialogNode);
	}
});

dojox.grid.EnhancedGrid.registerPlugin('pagination', dojox.grid.enhanced.plugins.Pagination);
