dojo.provide("dojox.grid.enhanced._FocusManager");

dojo.declare("dojox.grid.enhanced._FocusArea",null,{
	// summary:
	//		This is a friend class of _FocusManager
/*=====
		// name: string
		//		Name of this area.
		name: "",
		
		// onFocus: function(event, step)
		//		Called when this area logically gets focus.
		//		event: Event object
		//				May be unavailable, should check before use.
		//		step: Integer
		//				The distance in the tab sequence from last focused area to this area.
		//		returns:
		//				whether this area is successfully focused. If not, the next area will get focus.
		onFocus: function(event, step){return true;},
		
		// onBlur: function(event, step)
		//		Called when this area logically loses focus.
		//		event: Event object
		//				May be unavailable, should check before use.
		//		step: Integer
		//				The distance in the tab sequence from this area to the area to focus.
		//		returns:
		//				If Boolean, means whether this area has successfully blurred. If not, the next area to focus is still this one.
		//				If String, means the next area to focus is given by this returned name.
		onBlur: function(event, step){return true;},
		
		// onMove: function(rowStep, colStep, event)
		//		Called when focus is moving around within this area.
		//		rowStep: Integer
		//		colStep: Integer
		//		event: Event object
		//				May be unavailable, should check before use.
		onMove: function(rowStep, colStep, event){},
		
		// onKey: function(event, isBubble)
		//		Called when some key is pressed when focus is logically in this area.
		//		event: Event object
		//		isBubble: Boolean
		//				Whether is in bubble stage (true) or catch stage (false).
		//		returns:
		//				If you do NOT want the event to propagate any further along the area stack, return exactly false.
		//				So if you return nothing (undefined), this event is still propagating.
		onKey: function(event, isBubble){return true},
		
		// getRegions: function()
		//		Define the small regions (dom nodes) in this area.
		//		returns: Array of dom nodes.
		getRegions: function(){},
		
		// onRegionFocus: function(event)
		//		Connected to the onfocus event of the defined regions (if any)
		onRegionFocus: function(event){},
		
		// onRegionBlur: function(event)
		//		Connected to the onblur event of the defined regions (if any)
		onRegionBlur: function(event){}
=====*/
	constructor: function(area, focusManager){
		this._fm = focusManager;
		this._evtStack = [area.name];
		var dummy = function(){return true;};
		area.onFocus = area.onFocus || dummy;
		area.onBlur = area.onBlur || dummy;
		area.onMove = area.onMove || dummy;
		area.onKey = area.onKey || dummy;
		area.onKeyUp = area.onKeyUp || dummy;
		area.onKeyDown = area.onKeyDown || dummy;
		dojo.mixin(this, area);
	},
	_onMove: function(rowStep, colStep, evt){
		var i, len = this._evtStack.length;
		for(i = len - 1; i >= 0; --i){
			if(this._fm._areas[this._evtStack[i]].onMove(rowStep, colStep, evt) === false){
				return false;
			}
		}
		return true;
	},
	_onKeyEvent: function(evt, funcName){
		var i, len = this._evtStack.length;
		for(i = len - 1; i >= 0; --i){
			if(this._fm._areas[this._evtStack[i]][funcName](evt, false) === false){
				return false;
			}
		}
		for(i = 0; i < len; ++i){
			if(this._fm._areas[this._evtStack[i]][funcName](evt, true) === false){
				return false;
			}
		}
		return true;
	},
	_onKey: function(evt){
		return this._onKeyEvent(evt, "onKey");
	},
	_onKeyDown: function(evt){
		return this._onKeyEvent(evt, "onKeyDown");
	},
	_onKeyUp: function(evt){
		return this._onKeyEvent(evt, "onKeyUp");
	},
	contentMouseEventPlanner: function(){
		return 0;
	},
	headerMouseEventPlanner: function(){
		return 0;
	}
});
dojo.declare("dojox.grid.enhanced._FocusManager",null,{
	_colHeadNode: null,
	_colHeadFocusIdx: null,
	_contextMenuBindNode: null,
	tabbingOut: false,
	focusClass: "dojoxGridCellFocus",
	focusView: null,
	
	constructor: function(grid){
		this.grid = grid;
		this._areas = {};
		this._areaQueue = [];
		this._connects = [];
		this._contentMouseEventHandlers = [];
		this._headerMouseEventHandlers = [];
		this._currentAreaIdx = -1;
		this._connectEvents();
		
		//backward compatibility
		this.cell = null;
		this.rowIndex = -1;
		
		this.addArea({
			name: "header",
			initialize: dojo.hitch(this, function(){
				this._connects.push(dojo.connect(grid,"postrender", this, "_delayedHeaderFocus"));
			}),
			onFocus: dojo.hitch(this, this._focusHeader),
			onBlur: dojo.hitch(this, this._blurHeader),
			onMove: dojo.hitch(this, this._navHeader),
			getRegions: dojo.hitch(this, this._findHeaderCells),
			onRegionFocus: dojo.hitch(this, this.doColHeaderFocus),
			onRegionBlur: dojo.hitch(this, this.doColHeaderBlur),
			onKeyDown: dojo.hitch(this, this._onHeaderKey)
		});
		this.addArea({
			name: "content",
			initialize: dojo.hitch(this, function(){
				this._connects.push(dojo.connect(grid,"_onFetchComplete", this, "_delayedCellFocus"));
			}),
			onFocus: dojo.hitch(this, this._focusContent),
			onBlur: dojo.hitch(this, this._blurContent),
			onMove: dojo.hitch(this, this._navContent),
			onKeyDown: dojo.hitch(this, this._onContentKey)
		});
		this.addArea({
			name: "editableCell",
			onFocus: dojo.hitch(this, this._focusEditableCell),
			onBlur: dojo.hitch(this, this._blurEditableCell),
			onKeyDown: dojo.hitch(this, this._onEditableCellKey),
			onContentMouseEvent: dojo.hitch(this, this._onEditableCellMouseEvent),
			contentMouseEventPlanner: function(evt, areas){
				return -1;
			}
		});
		this.placeArea("header");
		this.placeArea("content");
		this.placeArea("editableCell");
		this.placeArea("editableCell","above","content");
	},
	_connectEvents: function(){
		var cnct = this._connects,
			g = this.grid;
		cnct.push(dojo.connect(g.domNode, "onfocus", this, "doFocus"));
		cnct.push(dojo.connect(g.domNode, "onblur", this, "doBlur"));
		cnct.push(dojo.connect(g.domNode, "oncontextmenu", this, "doContextMenu"));
		cnct.push(dojo.connect(g.lastFocusNode, "onfocus", this, "doLastNodeFocus"));
		cnct.push(dojo.connect(g.lastFocusNode, "onblur", this, "doLastNodeBlur"));
	},
	destroy: function(){
		for(name in this._areas){
			var area = this._areas[name];
			if(area._connects){
				dojo.forEach(area._connects, dojo.disconnect);
				area._connects = null;
			}
			area.uninitialize && area.uninitialize();
		}
		dojo.forEach(this._connects, dojo.disconnect);
		this.grid = null;
		this.cell = null;
	},
	addArea: function(area){
		if(area.name && dojo.isString(area.name)){
//			if(this._areas[area.name]){
//				this.removeArea(area.name);
//			}
			this._areas[area.name] = new dojox.grid.enhanced._FocusArea(area, this);
			if(area.onHeaderMouseEvent){
				this._headerMouseEventHandlers.push(area.name);
			}
			if(area.onContentMouseEvent){
				this._contentMouseEventHandlers.push(area.name);
			}
		}
	},
	getArea: function(areaName){
		return this._areas[areaName];
	},
	_bindAreaEvents: function(){
		var area,r,hdl,areas = this._areas;
		dojo.forEach(this._areaQueue,function(name){
			area = areas[name];
			if(!area._initialized && dojo.isFunction(area.initialize)){
				area.initialize();
				area._initialized = true;
			}
			if(area.getRegions){
				area._regions = area.getRegions() || [];
				dojo.forEach(area._connects || [], dojo.disconnect);
				area._connects = [];
				dojo.forEach(area._regions, function(r){
					if(area.onRegionFocus){
						hdl = dojo.connect(r, "onfocus", area.onRegionFocus);
						area._connects.push(hdl);
					}
					if(area.onRegionBlur){
						hdl = dojo.connect(r, "onblur", area.onRegionBlur);
						area._connects.push(hdl);
					}
				});
			}
		});
	},
	removeArea: function(areaName){
		var area = this._areas[areaName];
		if(area){
			this.ignoreArea(areaName);
			var i = dojo.indexOf(this._contentMouseEventHandlers, areaName);
			if(i >= 0){
				this._contentMouseEventHandlers.splice(i, 1);
			}
			i = dojo.indexOf(this._headerMouseEventHandlers, areaName);
			if(i >= 0){
				this._headerMouseEventHandlers.splice(i, 1);
			}
			dojo.forEach(area._connects, dojo.disconnect);
			area.uninitialize && area.uninitialize();
			delete this._areas[areaName];
		}
	},
	currentArea: function(areaName, toBlurOld){
		// summary:
		//		Set current area to the one areaName refers.
		// areaName: String
		//		
		var idx,cai = this._currentAreaIdx;
		if(dojo.isString(areaName) && (idx = dojo.indexOf(this._areaQueue, areaName)) >= 0){
			if(cai != idx){
				this.tabbingOut = false;
				if(toBlurOld && cai >= 0 && cai < this._areaQueue.length){
					this._areas[this._areaQueue[cai]].onBlur();	
				}
				this._currentAreaIdx = idx;
			}
		}else{
			return (cai < 0 || cai >= this._areaQueue.length) ? null 
					: this._areas[this._areaQueue[this._currentAreaIdx]];
		}
	},
	placeArea: function(name,pos,otherAreaName){
		/*
		 * placeArea("myarea","before"|"after",...)
		 * placeArea("myarea","below"|"above",...)
		 */
		if(!this._areas[name]){
			return;
		}
		var idx = dojo.indexOf(this._areaQueue,otherAreaName);
		switch(pos){
			case "after":
				idx >= 0 && ++idx;
				//intentional drop through
			case "before":
				if(idx >= 0){
					this._areaQueue.splice(idx,0,name);
					break;
				}
				//intentional drop through
			default:
				this._areaQueue.push(name);
				break;
			case "above":
				var isAbove = true;
				//intentional drop through
			case "below":
				if(otherArea = this._areas[otherAreaName]){
					if(isAbove){
						otherArea._evtStack.push(name);
					}else{
						otherArea._evtStack.splice(0,0,name);
					}
				}
		}
	},
	ignoreArea: function(name){
		this._areaQueue = dojo.filter(this._areaQueue,function(areaName){
			return areaName != name;
		});
	},
	focusArea: function(/* int|string|areaObj */areaId,evt){
		var idx, curArea;
		if(typeof areaId == "number"){
			idx = areaId < 0 ? this._areaQueue.length + areaId : areaId;
		}else{
			idx = dojo.indexOf(this._areaQueue,
				dojo.isString(areaId) ? areaId : (areaId && areaId.name));
		}
		if(idx < 0){
			idx = 0;
		}
		var step = idx - this._currentAreaIdx;
		if(step){
			this.tab(step, evt);
		}else if(curArea = this.currentArea()){//intentional assignment
			curArea.onFocus(evt,step);
		}
	},
	tab: function(step,evt){
		console.log("===========tab",step,"curArea",this._currentAreaIdx,"areaCnt",this._areaQueue.length);
		this.tabbingOut = false;
		if(step == 0){
			return;
		}
		var cai = this._currentAreaIdx;
		var dir = step > 0 ? 1:-1;
		if(cai < 0 || cai >= this._areaQueue.length){
			cai = (this._currentAreaIdx += step);
		}else{
			var nextArea = this._areas[this._areaQueue[cai]].onBlur(evt,step);
			if(nextArea === true){
				cai = (this._currentAreaIdx += step);
			}else if(dojo.isString(nextArea) && this._areas[nextArea]){
				cai = this._currentAreaIdx = dojo.indexOf(this._areaQueue,nextArea);
			}
		}
		//console.log("target area:",cai);
		for(; cai >= 0 && cai < this._areaQueue.length; cai += dir){
			this._currentAreaIdx = cai;
			if(this._areaQueue[cai] && this._areas[this._areaQueue[cai]].onFocus(evt,step)){
				console.log("final target area:",this._currentAreaIdx);
				return;
			}
		}
		console.log("tab out");
		this.tabbingOut = true;
		if(step < 0){
			this._currentAreaIdx = -1;
			dijit.focus(this.grid.domNode);
		}else{
			this._currentAreaIdx = this._areaQueue.length;
			dijit.focus(this.grid.lastFocusNode);
		}
	},
	keydown: function(evt){
		if(area = this.currentArea()){//intentional assignment
			area._onKeyDown(evt);
		}
	},
	keyup: function(evt){
		if(area = this.currentArea()){//intentional assignment
			area._onKeyUp(evt);
		}
	},
	keypress: function(evt){
		if(area = this.currentArea()){//intentional assignment
			area._onKey(evt);
		}
	},
	move: function(rowStep,colStep,evt){
		if(area = this.currentArea()){//intentional assignment
			area._onMove(rowStep,colStep,evt);
		}
	},
	contentMouseEvent: function(evt){
		var handlers = this._contentMouseEventHandlers, 
			res = dojo.map(handlers, function(areaName){
				return {
					"area": areaName,
					"idx": this._areas[areaName].contentMouseEventPlanner(evt, handlers)
				};
			}, this).sort(function(a, b){
				return b.idx - a.idx;
			}),
			resHandlers = dojo.map(res, function(handler){
				return res.area;
			}),
			i = res.length;
		while(--i >= 0){
			if(this._areas[res[i].area].onContentMouseEvent(evt, resHandlers) === false){
				return;
			}
		}
	},
	headerMouseEvent: function(evt){
		var handlers = this._headerMouseEventHandlers, 
			res = dojo.map(handlers, function(areaName){
				return {
					"area": areaName,
					"idx": this._areas[areaName].headerMouseEventPlanner(evt, handlers)
				};
			}, this).sort(function(a, b){
				return b.idx - a.idx;
			}),
			resHandlers = dojo.map(res, function(handler){
				return res.area;
			}),
			i = res.length;
		while(--i >= 0){
			console.log(this._areas[res[i].area]);
			if(this._areas[res[i].area].onHeaderMouseEvent(evt, resHandlers) === false){
				return;
			}
		}
	},
	//---------------events---------------------
	doFocus: function(e){
		//console.log("doFocus",e.target==e.currentTarget,this.tabbingOut);
		// trap focus only for grid dom node
		// do not focus for scrolling if grid is about to blur
		if(e && e.target == e.currentTarget && !this.tabbingOut){
			if(this._currentAreaIdx >= 0 && this._currentAreaIdx < this._areaQueue.length){
				this.focusArea(this._currentAreaIdx, e);
			}else{
				this.focusArea(0, e);
			}
		}else{
			this.tabbingOut = false;
		}
		dojo.stopEvent(e);
	},
	doBlur: function(e){
		//console.log("doBlur", this.tabbingOut);
		dojo.stopEvent(e);	// FF2
	},
	doContextMenu: function(e){
		//stop contextMenu event if no header Menu to prevent default/browser contextMenu
		if(!this.grid.headerMenu){
			dojo.stopEvent(e); 
		}
	},
	doLastNodeFocus: function(e){
		//console.log("doLastNodeFocus");
		if(this.tabbingOut){
			this.tabbingOut = false;
		}else{
			this.focusArea(-1, e);
		}
		dojo.stopEvent(e);	 // FF2
	},
	doLastNodeBlur: function(e){
		dojo.stopEvent(e);	 // FF2
	},

	//---------------Header Area------------------------------------------
	_focusHeader: function(evt,step){
		//console.log("focus header");
		var didFocus = false;
		if(!this._isHeaderHidden()){
			var headerNodes = this._findHeaderCells();
			var saveColHeadFocusIdx = this._colHeadFocusIdx; 
			if(this._colHeadFocusIdx === null){
				if(this.isNoFocusCell()){
					this._colHeadFocusIdx = 0;
				}else{
					this._colHeadFocusIdx = this.cell.index;
				}
			}
			this._colHeadNode = headerNodes[this._colHeadFocusIdx];
			while(this._colHeadNode && this._colHeadFocusIdx >= 0 && this._colHeadFocusIdx < headerNodes.length &&
					this._colHeadNode.style.display == "none"){
				// skip over hidden column headers
				this._colHeadFocusIdx++;
				this._colHeadNode = headerNodes[this._colHeadFocusIdx];
			}
			if(this._colHeadNode && this._colHeadNode.style.display != "none"){
				this._changeMenuBindNode(this.grid.viewsHeaderNode,this.grid.domNode);
				this._setActiveColHeader(this._colHeadNode, this._colHeadFocusIdx, saveColHeadFocusIdx);
				//Already done in _setActiveColHeader:
				//this._scrollHeader(this._colHeadFocusIdx);
				this._focusifyCellNode(false);
				//Oliver: This is correct in logic, 'cause after all we should focuse the header.
				//but will lead to strange behavior on FireFox, when using Pagenation.
				this._colHeadNode.focus();
				didFocus = true;
			}
			// all col head nodes are hidden - focus the grid
		}
		if(didFocus){
			evt && dojo.stopEvent(evt);
		}
		return didFocus;
	},
	_blurHeader: function(evt,step){
		//console.log("blur header");
		if(this._colHeadNode){
			dojo.removeClass(this._colHeadNode, this.focusClass);
		}
		dojo.removeAttr(this.grid.domNode,"aria-activedescendant");
		// reset contextMenu onto viewsHeaderNode so right mouse on header will invoke (see focusHeader)
		this._changeMenuBindNode(this.grid.domNode,this.grid.viewsHeaderNode);
		//moved here from nextKey
		this._colHeadNode = this._colHeadFocusIdx = null;
		return true;
	},
	_navHeader: function(rowStep,colStep,evt){
		//console.log("nav header");
		var headers = this._findHeaderCells(),
			savedIdx = dojo.indexOf(headers, this._colHeadNode),
			currentIdx = savedIdx + colStep,
			colDir = colStep < 0 ? -1 : 1;
		if(savedIdx >= 0 && (evt.shiftKey && evt.ctrlKey)){
			this.colSizeAdjust(evt, savedIdx, colDir * 5);
			return;
		}
		while(currentIdx >= 0 && currentIdx < headers.length && headers[currentIdx].style.display == "none"){
			// skip over hidden column headers
			currentIdx += colDir;
		}
		if(currentIdx >= 0 && currentIdx < headers.length){
			this._setActiveColHeader(headers[currentIdx], currentIdx, savedIdx);
		}
	},
	_onHeaderKey: function(e, isBubble){
		//console.log("_onHeaderKey");
		if(isBubble){
			var dk = dojo.keys;
			switch(e.keyCode){
				case dk.ENTER:
				case dk.SPACE:
					colIdx = this.getHeaderIndex();
					if(colIdx >= 0 && !this.grid.pluginMgr.isFixedCell(e.cell)/*TODO*/){
						this.grid.setSortIndex(colIdx,null,e);
						dojo.stopEvent(e);
					}
					break;
			}
		}
		return true;
	},
	_delayedHeaderFocus: function(){
		if(this.isNavHeader()){
			this._focusHeader();
		}
	},
	//----support functions--------
	_changeMenuBindNode: function(oldBindNode,newBindNode){
		var hm = this.grid.headerMenu;
		if(hm && this._contextMenuBindNode == oldBindNode){
			hm.unBindDomNode(oldBindNode);
			hm.bindDomNode(newBindNode);
			this._contextMenuBindNode = newBindNode;
		}
	},
	_findHeaderCells: function(){
		// This should be a one liner:
		//	dojo.query("th[tabindex=-1]", this.grid.viewsHeaderNode);
		// But there is a bug in dojo.query() for IE -- see trac #7037.
		var allHeads = dojo.query("th", this.grid.viewsHeaderNode);
		var headers = [];
		for(var i = 0; i < allHeads.length; i++){
			var aHead = allHeads[i];
			var hasTabIdx = dojo.hasAttr(aHead, "tabIndex");
			var tabindex = dojo.attr(aHead, "tabIndex");
			if(hasTabIdx && tabindex < 0){
				headers.push(aHead);
			}
		}
		return headers;
	},
	isNoFocusCell: function(){
		return (this.rowIndex < 0) || !this.cell;
	},
	_isHeaderHidden: function(){
		// summary:
		//		determine if the grid headers are hidden
		//		relies on documented technique of setting .dojoxGridHeader { display:none; } 
		// returns: Boolean
		//		true if headers are hidden
		//		false if headers are not hidden
		var curView = this.focusView;
		if(!curView){
			// find one so we can determine if headers are hidden
			// there is no focusView after adding items to empty grid (test_data_grid_empty.html)
			for(var i = 0, cView; (cView = this.grid.views.views[i]); i++){
				if(cView.headerNode){
					curView = cView;
					break;
				}
			}
		}
		return (curView && dojo.getComputedStyle(curView.headerNode).display == "none");
	},
	_setActiveColHeader: function(/*Node*/colHeaderNode, /*Integer*/colFocusIdx, /*Integer*/ prevColFocusIdx){
		//console.log("setActiveColHeader() - colHeaderNode:colFocusIdx:prevColFocusIdx = " + colHeaderNode + ":" + colFocusIdx + ":" + prevColFocusIdx);
		dojo.attr(this.grid.domNode, "aria-activedescendant",colHeaderNode.id);
		if(prevColFocusIdx != null && prevColFocusIdx >= 0 && prevColFocusIdx != colFocusIdx){
			dojo.toggleClass(this._findHeaderCells()[prevColFocusIdx],this.focusClass,false);
		}
		dojo.toggleClass(colHeaderNode,this.focusClass, true);
		this._colHeadNode = colHeaderNode;
		this._colHeadFocusIdx = colFocusIdx;
		this._scrollHeader(this._colHeadFocusIdx);
	},
	_scrollHeader: function(currentIdx){
		var info = null;
		if(this._colHeadNode){
			var cell = this.grid.getCell(currentIdx);
			info = this._scrollInfo(cell, cell.getNode(0));
		}
		if(info && info.s && info.sr && info.n){
			// scroll horizontally as needed.
			var scroll = info.sr.l + info.sr.w;
			if(info.n.offsetLeft + info.n.offsetWidth > scroll){
				info.s.scrollLeft = info.n.offsetLeft + info.n.offsetWidth - info.sr.w;
			}else if(info.n.offsetLeft < info.sr.l){
				info.s.scrollLeft = info.n.offsetLeft;
			}else if(dojo.isIE <= 7 && cell && cell.view.headerNode){
				// Trac 7158: scroll dojoxGridHeader for IE7 and lower
				cell.view.headerNode.scrollLeft = info.s.scrollLeft;
			}
		}
	},
	_focusifyCellNode: function(inBork){
		var n = this.cell && this.cell.getNode(this.rowIndex);
		if(n){
			dojo.toggleClass(n, this.focusClass, inBork);
			if(inBork){
				var sl = this.scrollIntoView();
				try{
					if(!this.grid.edit.isEditing()){
						dojox.grid.util.fire(n, "focus");
						if(sl){ this.cell.view.scrollboxNode.scrollLeft = sl; }
					}
				}catch(e){}
			}
		}
	},
	scrollIntoView: function(){
		var info = (this.cell ? this._scrollInfo(this.cell) : null);
		if(!info || !info.s){
			return null;
		}
		var rt = this.grid.scroller.findScrollTop(this.rowIndex);
		// place cell within horizontal view
		if(info.n && info.sr){
			if(info.n.offsetLeft + info.n.offsetWidth > info.sr.l + info.sr.w){
				info.s.scrollLeft = info.n.offsetLeft + info.n.offsetWidth - info.sr.w;
			}else if(info.n.offsetLeft < info.sr.l){
				info.s.scrollLeft = info.n.offsetLeft;
			}
		}
		// place cell within vertical view
		if(info.r && info.sr){
			if(rt + info.r.offsetHeight > info.sr.t + info.sr.h){
				this.grid.setScrollTop(rt + info.r.offsetHeight - info.sr.h);
			}else if(rt < info.sr.t){
				this.grid.setScrollTop(rt);
			}
		}
		return info.s.scrollLeft;	
	},
	_scrollInfo: function(cell, domNode){
		if(cell){
			var cl = cell,
				sbn = cl.view.scrollboxNode,
				sbnr = {
					w: sbn.clientWidth,
					l: sbn.scrollLeft,
					t: sbn.scrollTop,
					h: sbn.clientHeight
				},
				rn = cl.view.getRowNode(this.rowIndex);
			return {
				c: cl,
				s: sbn,
				sr: sbnr,
				n: (domNode ? domNode : cell.getNode(this.rowIndex)),
				r: rn
			};
		}
		return null;
	},
	colSizeAdjust: function (e, colIdx, delta){ // adjust the column specified by colIdx by the specified delta px
		var headers = this._findHeaderCells();
		var view = this.focusView;
		if(!view){
			for(var i = 0, cView; (cView = this.grid.views.views[i]); i++){
				// find first view with a tableMap in order to work with empty grid
				if(cView.header.tableMap.map){
					view = cView;
					break;
				}
			}
		}
		var curHeader = headers[colIdx];
		if(!view || (colIdx == headers.length-1 && colIdx === 0)){
			return; // can't adjust single col. grid
		}	
		view.content.baseDecorateEvent(e);
		// need to adjust event with header cell info since focus is no longer on header cell
		e.cellNode = curHeader; //this.findCellTarget(e.target, e.rowNode);
		e.cellIndex = view.content.getCellNodeIndex(e.cellNode);
		e.cell = (e.cellIndex >= 0 ? this.grid.getCell(e.cellIndex) : null);
		if(view.header.canResize(e)){ 
			var deltaObj = {
				l: delta
			};
			var drag = view.header.colResizeSetup(e,false);
			view.header.doResizeColumn(drag, null, deltaObj);
			view.update();
		}
	},
	//---------------Content Area------------------------------------------
	_focusContent: function(evt,step){
		//console.log("focus content");
		var didFocus = true;
		var isEmpty = (this.grid.rowCount === 0); // If grid is empty this.grid.rowCount == 0
		if(this.isNoFocusCell() && !isEmpty){
			//skip all the hidden cells
			for(var i = 0, cell = this.grid.getCell(0);
				cell && cell.hidden;
				cell = this.grid.getCell(++i));
			//console.log("focusing: ",0,cell?i:0);
			this.setFocusIndex(0, cell ? i : 0);
			//this.grid.updateRow(0);
		}else if(this.cell && !isEmpty){
			if(this.focusView && !this.focusView.rowNodes[this.rowIndex]){
				// if rowNode for current index is undefined (likely as a result of a sort and because of #7304) 
				// scroll to that row
				this.grid.scrollToRow(this.rowIndex);
				this.focusGrid();
			}else{
				//console.log("focusing: ",this.rowIndex,this.cell.index);
				this.setFocusIndex(this.rowIndex,this.cell.index);
				//this.grid.updateRow(this.rowIndex);
			}
		}else{
			didFocus = false;
		}
		if(didFocus){
			evt && dojo.stopEvent(evt);
		}
		return didFocus;
	},
	_blurContent: function(evt,step){
		//console.log("blur content");
		this._focusifyCellNode(false);
		return true;
	},
	_navContent: function(rowStep,colStep,evt){
		//console.log("nav content",rowStep,colStep);
		if(!this.cell)return;
		// Handle grid proper.
		var g = this.grid,
			sc = g.scroller,
			r = this.rowIndex,
			row = Math.min(g.rowCount-1, Math.max(0, r+rowStep)),
			cc = g.layout.cellCount-1,
			i = this.cell.index,
			col = Math.min(cc, Math.max(0, i+colStep)),
			t = g.scrollTop - sc.findScrollTop(r),
			top = sc.findScrollTop(row),
			colDir = colStep < 0 ? -1 : 1,
			cell;
		if(rowStep > 0 && row > sc.getLastPageRow(sc.page)){
			//need to load additional data, let scroller do that
			g.setScrollTop(t + top);
		}else if(rowStep < 0 && row <= sc.getPageRow(sc.page)){
			//need to load additional data, let scroller do that
			g.setScrollTop(t - top);
		}
		// skip hidden cells
		for(cell = g.getCell(col);
			col >= 0 && col < cc && cell && cell.hidden === true;
			col += colDir, cell = g.getCell(col));
		// don't change col if would move to hidden
		if(!cell || cell.hidden === true){
			col = i;
		}
		this.setFocusIndex(row, col);
		if(row != r){
			//g.updateRow(r);
		}
	},
	_onContentKey: function(e, isBubble){
		//console.log("_onContentKey");
		if(isBubble){
			var isAtEnd, dk = dojo.keys, s = this.grid.scroller;
			switch(e.keyCode){
				case dk.ENTER:
				case dk.SPACE:
					var g = this.grid;
						//if no focusView than only one view
						//curView = this.focusView || g.views.views[0];
					if(g.indirectSelection){ break; } //TODO - remove this dependency
					g.selection.clickSelect(this.rowIndex, dojo.isCopyKey(e), e.shiftKey);
					//console.log("content decoreate event");
					//curView.content.decorateEvent(e);
					g.onRowClick(e);
					dojo.stopEvent(e);
					break;
				case dk.PAGE_UP:
					if(this.rowIndex !== 0){
						if(this.rowIndex != s.firstVisibleRow+1){
							this._navContent(s.firstVisibleRow - this.rowIndex, 0);
						}else{
							this.grid.setScrollTop(s.findScrollTop(this.rowIndex - 1));
							this._navContent(s.firstVisibleRow - s.lastVisibleRow + 1, 0);
						}
						dojo.stopEvent(e);
					}
					break;
				case dk.PAGE_DOWN:
					if(this.rowIndex + 1 != this.grid.rowCount){
						dojo.stopEvent(e);
						if(this.rowIndex != s.lastVisibleRow-1){
							this._navContent(s.lastVisibleRow - this.rowIndex - 1, 0);
						}else{
							this.grid.setScrollTop(s.findScrollTop(this.rowIndex + 1));
							this._navContent(s.lastVisibleRow - s.firstVisibleRow - 1, 0);
						}
						dojo.stopEvent(e);
					}
					break;
			}
		}
		return true;
	},
	_delayedCellFocus: function(){
		var area = this.currentArea();
		if(area && area.name == "content"){
			this.focusArea(this._currentAreaIdx);
		}
	},
	//----support functions--------
	setFocusIndex: function(inRowIndex, inCellIndex){
		// summary:
		//	focuses the given grid cell
		// inRowIndex: int
		//	grid row index
		// inCellIndex: int
		//	grid cell index
		this.setFocusCell(this.grid.getCell(inCellIndex), inRowIndex);
	},
	setFocusCell: function(inCell, inRowIndex){
		// summary:
		//	focuses the given grid cell
		// inCell: object
		//	grid cell object
		// inRowIndex: int
		//	grid row index
		if(inCell){
			this.currentArea(this.grid.edit.isEditing() ? "editableCell" : "content", true);
			//This is very slow when selecting cells!
			//this.focusGridView();
			this._focusifyCellNode(false);
			this.cell = inCell;
			this.rowIndex = inRowIndex;
			this._focusifyCellNode(true);
		}
		var func = dojo.hitch(this,function(){
			this.grid.onCellFocus(this.cell, this.rowIndex);
		});
		// even if this cell isFocusCell, the document focus may need to be rejiggered
		// call opera on delay to prevent keypress from altering focus
		if(dojo.isOpera){
			setTimeout(func, 1);
		}else{
			func();
		}
	},
	focusGrid: function(inSkipFocusCell){
		this.focusGridView();
		this._focusifyCellNode(true);
	},
	focusGridView: function(){
		dojox.grid.util.fire(this.focusView, "focus");
	},
	//------------------editable content area-------------------------
	_blurFromEditableCell: false,
	_isNavigating: false,
	_navElems: null,
	_focusEditableCell: function(evt,step){
		var didFocus = false;
		if(this._isNavigating){
			didFocus = true;
		}else if(this.grid.edit.isEditing() && this.cell){
			if(this._blurFromEditableCell || !this._blurEditableCell(evt, step)){
				this.setFocusIndex(this.rowIndex,this.cell.index);
				didFocus = true;
			}
			evt && dojo.stopEvent(evt);
		}
		return didFocus;
	},
	_blurEditableCell: function(evt,step){
		console.log("_blurEditableCell",evt);
		this._blurFromEditableCell = false;
		if(this._isNavigating){
			var toBlur = true;
			if(evt){
				var elems = this._navElems;
				var firstElem = elems.lowest || elems.first;
				var lastElem = elems.last || elems.highest || firstElem;
				var target = dojo.isIE ? evt.srcElement : evt.target;
				toBlur = target == (step > 0 ? lastElem : firstElem);	
			}
			if(toBlur){
				this._isNavigating = false;
				return "content";
			}
			return false;
		}else if(this.grid.edit.isEditing() && this.cell){
			var dir = step > 0 ? 1 : -1;
			var cc = this.grid.layout.cellCount;
			for(var cell, col = this.cell.index + dir; col >= 0 && col < cc; col += dir){
				cell = this.grid.getCell(col);
				if(cell.editable){
					this.cell = cell;
					this._blurFromEditableCell = true;
					return false;
				}
			}
			if((this.rowIndex > 0 || dir == 1) && (this.rowIndex < this.grid.rowCount || dir == -1)){
				//console.log("blur from last editable cell");
				this.rowIndex += dir;
				//this.cell = this.grid.getCell(0); //There must be an editable cell, so this is not necessary.
				for(col = dir > 0 ? 0 : cc - 1; col >= 0 && col < cc; col += dir){
					cell = this.grid.getCell(col);
					if(cell.editable){
						this.cell = cell;
						break;
					}
				}
				this.grid.edit.apply();
				return "content";
			}
		}
		return true;
	},
	_initNavigatableElems: function(){
		this._navElems = dijit._getTabNavigable(this.cell.getNode(this.rowIndex));
	},
	_onEditableCellKey: function(e, isBubble){
		var dk = dojo.keys,
			g = this.grid,
			edit = g.edit,
			editApplied = false,
			toPropagate = true;
		switch(e.keyCode){
			case dk.ENTER:
				if(isBubble && edit.isEditing()){
					try{
						edit.apply();
					}catch(e){
						console.log("_onEditableCellKey:",e);
					}
					editApplied = true;
				}
				//intentional drop through
			case dk.SPACE:
				if(!isBubble && this._isNavigating){
					toPropagate = false;
					break;
				}
				if(isBubble){
					if(!this.cell.editable && this.cell.navigatable){
						this._initNavigatableElems();
						var toFocus = this._navElems.lowest || this._navElems.first;
						if(toFocus){
							this._isNavigating = true;
							dijit.focus(toFocus);
							dojo.stopEvent(e);
							this.currentArea("editableCell", true);
							break;
						}
					}
					if(!editApplied && !edit.isEditing() && !g.pluginMgr.isFixedCell(this.cell)){
						edit.setEditCell(this.cell, this.rowIndex);
					}
					if(this.cell.editable && g.canEdit()){
						dojo.stopEvent(e);
						this.currentArea("editableCell", true);
					}
				}
				break;
			case dk.PAGE_UP:
			case dk.PAGE_DOWN:
				if(!isBubble && edit.isEditing()){
					//prevent propagating to content area
					toPropagate = false;
				}
				break;
			case dk.ESCAPE:
				if(!isBubble){
					edit.cancel();
					this.currentArea("content", true);
				}
		}
		
		return toPropagate;
	},
	_onEditableCellMouseEvent: function(evt){
		if(evt.type == "click"){
			var cell = this.cell || evt.cell; 
			if(cell && !cell.editable && cell.navigatable){
				this._initNavigatableElems();
				if(this._navElems.lowest || this._navElems.first){
					var target = dojo.isIE ? evt.srcElement : evt.target;
					if(target != cell.getNode(evt.rowIndex)){
						this._isNavigating = true;
						this.focusArea("editableCell", evt);
						dijit.focus(target);
						return false;
					}
				}
			}
		}
	},
	
	//--------------------backward compatibility----------------------
	initFocusView: function(){
		this.focusView = this.grid.views.getFirstScrollingView() || this.focusView;
		this._bindAreaEvents();
	},
	doColHeaderFocus: function(e){
		//console.log("doColHeaderFocus new");
		this._setActiveColHeader(e.target,dojo.attr(e.target, "idx"),this._colHeadFocusIdx);
		this._scrollHeader(this.getHeaderIndex());
		dojo.stopEvent(e);
	},
	doColHeaderBlur: function(e){
		//console.log("doColHeaderBlur new");
		dojo.toggleClass(e.target, this.focusClass, false);
	},
	isNavHeader: function(){
		// summary:
		//	states whether currently navigating among column headers.
		// returns:
		//	true if focus is on a column header; false otherwise. 
		return this._areaQueue[this._currentAreaIdx] == "header";
		//return (!!this._colHeadNode);
	},
	getHeaderIndex: function(){
		// summary:
		//	if one of the column headers currently has focus, return its index.
		// returns:
		//	index of the focused column header, or -1 if none have focus.
		if(this._colHeadNode){
			return dojo.indexOf(this._findHeaderCells(), this._colHeadNode);
		}else{
			return -1;
		}
	},
	styleRow: function(inRow){
		return;
	},
	previousKey: function(e){
		this.tab(-1,e);
		//dojo.stopEvent(e);
	},
	nextKey: function(e){
		this.tab(1,e);
		//dojo.stopEvent(e);
	},
	focusHeader: function(){
		this._focusHeader();
	}
});
