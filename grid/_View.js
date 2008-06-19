dojo.provide("dojox.grid._View");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dojox.html.metrics");
dojo.require("dojox.grid.util");

dojo.require("dojo.dnd.Moveable");
dojo.require("dojo.dnd.Source");
dojo.require("dojo.dnd.Manager");

(function(){
	// private
	var rowIndexTag = "gridRowIndex";
	var gridViewTag = "gridView";

	var getTdIndex = function(td){
		return td.cellIndex >=0 ? td.cellIndex : dojo.indexOf(td.parentNode.cells, td);
	};
	
	var getTrIndex = function(tr){
		return tr.rowIndex >=0 ? tr.rowIndex : dojo.indexOf(tr.parentNode.childNodes, tr);
	};
	
	var getTr = function(rowOwner, index){
		return rowOwner && ((rowOwner.rows||0)[index] || rowOwner.childNodes[index]);
	};

	var findTable = function(node){
		for (var n=node; n && n.tagName!='TABLE'; n=n.parentNode);
		return n;
	};
	
	var ascendDom = function(inNode, inWhile){
		for (var n=inNode; n && inWhile(n); n=n.parentNode);
		return n;
	};
	
	var makeNotTagName = function(inTagName){
		var name = inTagName.toUpperCase();
		return function(node){ return node.tagName != name; };
	};

	var getStyleText = function(inNode, inStyleText){
		return (inNode.style.cssText == undefined ? inNode.getAttribute("style") : inNode.style.cssText);
	};


	// base class for generating markup for the views
	var Builder = function(view){
		if(view){
			this.view = view;
			this.grid = view.grid;
		}
	};
	dojo.extend(Builder, {
		view: null,
		// boilerplate HTML
		_table: '<table class="dojoxGrid-row-table" border="0" cellspacing="0" cellpadding="0" role="wairole:presentation"',

		// Returns the table variable as an array - and with the view width, if specified
		getTableArray: function(){
			var html = [this._table];
			if(this.view.viewWidth){
				html.push([' style="width:', this.view.viewWidth, ';"'].join(''));
			}
			html.push('>');
			return html;
		},
		
		// generate starting tags for a cell
		generateCellMarkup: function(inCell, inMoreStyles, inMoreClasses, isHeader){
			var result = [], html;
			if (isHeader){
				html = [ '<th tabIndex="-1" role="wairole:columnheader"' ];
			}else{
				html = [ '<td tabIndex="-1" role="wairole:gridcell"' ];
			}
			inCell.colSpan && html.push(' colspan="', inCell.colSpan, '"');
			inCell.rowSpan && html.push(' rowspan="', inCell.rowSpan, '"');
			html.push(' class="dojoxGrid-cell ');
			inCell.classes && html.push(inCell.classes, ' ');
			inMoreClasses && html.push(inMoreClasses, ' ');
			// result[0] => td opener, style
			result.push(html.join(''));
			// SLOT: result[1] => td classes 
			result.push('');
			html = ['" idx="', inCell.index, '" style="'];
			html.push(inCell.styles, inMoreStyles||'');
			inCell.unitWidth && html.push('width:', inCell.unitWidth, ';');
			// result[2] => markup
			result.push(html.join(''));
			// SLOT: result[3] => td style 
			result.push('');
			html = [ '"' ];
			inCell.attrs && html.push(" ", inCell.attrs);
			html.push('>');
			// result[4] => td postfix
			result.push(html.join(''));
			// SLOT: result[5] => content
			result.push('');
			// result[6] => td closes
			result.push('</td>');
			return result; // Array
		},

		// cell finding
		isCellNode: function(inNode){
			return Boolean(inNode && inNode!=dojo.doc && dojo.attr(inNode, "idx"));
		},
		
		getCellNodeIndex: function(inCellNode){
			return inCellNode ? Number(dojo.attr(inCellNode, "idx")) : -1;
		},
		
		getCellNode: function(inRowNode, inCellIndex){
			for(var i=0, row; row=getTr(inRowNode.firstChild, i); i++){
				for(var j=0, cell; cell=row.cells[j]; j++){
					if(this.getCellNodeIndex(cell) == inCellIndex){
						return cell;
					}
				}
			}
		},
		
		findCellTarget: function(inSourceNode, inTopNode){
			var n = inSourceNode;
			while(n && (!this.isCellNode(n) || (gridViewTag in n.offsetParent.parentNode && n.offsetParent.parentNode[gridViewTag] != this.view.id)) && (n!=inTopNode)){
				n = n.parentNode;
			}
			return n!=inTopNode ? n : null 
		},
		
		// event decoration
		baseDecorateEvent: function(e){
			e.dispatch = 'do' + e.type;
			e.grid = this.grid;
			e.sourceView = this.view;
			e.cellNode = this.findCellTarget(e.target, e.rowNode);
			e.cellIndex = this.getCellNodeIndex(e.cellNode);
			e.cell = (e.cellIndex >= 0 ? this.grid.getCell(e.cellIndex) : null);
		},
		
		// event dispatch
		findTarget: function(inSource, inTag){
			var n = inSource;
			while(n && (n!=this.domNode) && (!(inTag in n) || (gridViewTag in n && n[gridViewTag] != this.view.id))){
				n = n.parentNode;
			}
			return (n != this.domNode) ? n : null; 
		},

		findRowTarget: function(inSource){
			return this.findTarget(inSource, rowIndexTag);
		},

		isIntraNodeEvent: function(e){
			try{
				return (e.cellNode && e.relatedTarget && dojo.isDescendant(e.relatedTarget, e.cellNode));
			}catch(x){
				// e.relatedTarget has permission problem in FF if it's an input: https://bugzilla.mozilla.org/show_bug.cgi?id=208427
				return false;
			}
		},

		isIntraRowEvent: function(e){
			try{
				var row = e.relatedTarget && this.findRowTarget(e.relatedTarget);
				return !row && (e.rowIndex==-1) || row && (e.rowIndex==row.gridRowIndex);			
			}catch(x){
				// e.relatedTarget on INPUT has permission problem in FF: https://bugzilla.mozilla.org/show_bug.cgi?id=208427
				return false;
			}
		},

		dispatchEvent: function(e){
			if(e.dispatch in this){
				return this[e.dispatch](e);
			}
		},

		// dispatched event handlers
		domouseover: function(e){
			if(e.cellNode && (e.cellNode!=this.lastOverCellNode)){
				this.lastOverCellNode = e.cellNode;
				this.grid.onMouseOver(e);
			}
			this.grid.onMouseOverRow(e);
		},

		domouseout: function(e){
			if(e.cellNode && (e.cellNode==this.lastOverCellNode) && !this.isIntraNodeEvent(e, this.lastOverCellNode)){
				this.lastOverCellNode = null;
				this.grid.onMouseOut(e);
				if(!this.isIntraRowEvent(e)){
					this.grid.onMouseOutRow(e);
				}
			}
		},
		
		domousedown: function(e){
			if (e.cellNode)
				this.grid.onMouseDown(e);
			this.grid.onMouseDownRow(e)
		}
	});

	// Produces html for grid data content. Owned by grid and used internally 
	// for rendering data. Override to implement custom rendering.
	var ContentBuilder = function(view){
		Builder.call(this, view);
	};
	ContentBuilder.prototype = new Builder();

	dojo.extend(ContentBuilder, {
		update: function(){
			this.prepareHtml();
		},

		// cache html for rendering data rows
		prepareHtml: function(){
			var defaultGet=this.grid.get, cells=this.view.structure.cells;
			for(var j=0, row; (row=cells[j]); j++){
				for(var i=0, cell; (cell=row[i]); i++){
					cell.get = cell.get || (cell.value == undefined) && defaultGet;
					cell.markup = this.generateCellMarkup(cell, cell.cellStyles, cell.cellClasses, false);
				}
			}
		},

		// time critical: generate html using cache and data source
		generateHtml: function(inDataIndex, inRowIndex){
			var
				html = this.getTableArray(),
				v = this.view,
				obr = v.onBeforeRow,
				cells = v.structure.cells,
				item = this.grid.getItem(inRowIndex);

			obr && obr(inRowIndex, cells);
			for(var j=0, row; (row=cells[j]); j++){
				if(row.hidden || row.header){
					continue;
				}
				html.push(!row.invisible ? '<tr>' : '<tr class="dojoxGrid-invisible">');
				for(var i=0, cell, m, cc, cs; (cell=row[i]); i++){
					m = cell.markup, cc = cell.customClasses = [], cs = cell.customStyles = [];
					// content (format can fill in cc and cs as side-effects)
					m[5] = cell.format(inRowIndex, item);
					// classes
					m[1] = cc.join(' ');
					// styles
					m[3] = cs.join(';');
					// in-place concat
					html.push.apply(html, m);
				}
				html.push('</tr>');
			}
			html.push('</table>');
			return html.join(''); // String
		},

		decorateEvent: function(e){
			e.rowNode = this.findRowTarget(e.target);
			if(!e.rowNode){return false};
			e.rowIndex = e.rowNode[rowIndexTag];
			this.baseDecorateEvent(e);
			e.cell = this.grid.getCell(e.cellIndex);
			return true; // Boolean
		}
	});

	var headerMoveable = null;

	// Produces html for grid header content. Owned by grid and used internally 
	// for rendering data. Override to implement custom rendering.
	var HeaderBuilder = function(view){
		Builder.call(this, view);
	};
	HeaderBuilder.prototype = new Builder();

	dojo.extend(HeaderBuilder, {

		bogusClickTime: 0,
		overResizeWidth: 4,
		minColWidth: 1,
		
		update: function(){
			this.tableMap = new TableMap(this.view.structure.cells);
		},

		generateHtml: function(inGetValue, inValue){
			var html = this.getTableArray(), cells = this.view.structure.cells;
			
			dojox.grid.util.fire(this.view, "onBeforeRow", [-1, cells]);
			for(var j=0, row; (row=cells[j]); j++){
				if(row.hidden){
					continue;
				}
				html.push(!row.invisible ? '<tr>' : '<tr class="dojoxGrid-invisible">');
				for(var i=0, cell, markup; (cell=row[i]); i++){
					cell.customClasses = [];
					cell.customStyles = [];
					if(this.view.simpleStructure){
						if(cell.headerClasses){
							if(cell.headerClasses.indexOf('dojoDndItem') == -1){
								cell.headerClasses += ' dojoDndItem';
							}
						}else{
							cell.headerClasses = 'dojoDndItem';
						}
						if(cell.attrs){
							if(cell.attrs.indexOf("dndType='gridColumn'") == -1){
								cell.attrs += " dndType='gridColumn_" + this.grid.id + "'";
							}
						}else{
							cell.attrs = "dndType='gridColumn_" + this.grid.id + "'";
						}
					}
					markup = this.generateCellMarkup(cell, cell.headerStyles, cell.headerClasses, true);
					// content
					markup[5] = (inValue != undefined ? inValue : inGetValue(cell));
					// styles
					markup[3] = cell.customStyles.join(';');
					// classes
					markup[1] = cell.customClasses.join(' '); //(cell.customClasses ? ' ' + cell.customClasses : '');
					html.push(markup.join(''));
				}
				html.push('</tr>');
			}
			html.push('</table>');
			return html.join('');
		},

		// event helpers
		getCellX: function(e){
			var x = e.layerX;
			if(dojo.isMoz){
				var n = ascendDom(e.target, makeNotTagName("th"));
				x -= (n && n.offsetLeft) || 0;
				var t = e.sourceView.getScrollbarWidth();
				if(!dojo._isBodyLtr() && e.sourceView.headerNode.scrollLeft < t)
					x -= t;
				//x -= getProp(ascendDom(e.target, mkNotTagName("td")), "offsetLeft") || 0;
			}
			var n = ascendDom(e.target, function(){
				if(!n || n == e.cellNode){
					return false;
				}
				// Mozilla 1.8 (FF 1.5) has a bug that makes offsetLeft = -parent border width
				// when parent has border, overflow: hidden, and is positioned
				// handle this problem here ... not a general solution!
				x += (n.offsetLeft < 0 ? 0 : n.offsetLeft);
				return true;
			});
			return x;
		},

		// event decoration
		decorateEvent: function(e){
			this.baseDecorateEvent(e);
			e.rowIndex = -1;
			e.cellX = this.getCellX(e);
			return true;
		},

		// event handlers
		// resizing
		prepareResize: function(e, mod){
			var i = getTdIndex(e.cellNode);
			e.cellNode = (i ? e.cellNode.parentNode.cells[i+mod] : null);
			e.cellIndex = (e.cellNode ? this.getCellNodeIndex(e.cellNode) : -1);
			return Boolean(e.cellNode);
		},

		canResize: function(e){
			if(!e.cellNode || e.cellNode.colSpan > 1){
				return false;
			}
			var cell = this.grid.getCell(e.cellIndex); 
			return !cell.noresize && !cell.canResize();
		},

		overLeftResizeArea: function(e){
			if(dojo._isBodyLtr()){
				return (e.cellIndex>0) && (e.cellX < this.overResizeWidth) && this.prepareResize(e, -1);
			}
			var t = e.cellNode && (e.cellX < this.overResizeWidth);
			return t;
		},

		overRightResizeArea: function(e){
			if(dojo._isBodyLtr()){
				return e.cellNode && (e.cellX >= e.cellNode.offsetWidth - this.overResizeWidth);
			}
			return (e.cellIndex>0) && (e.cellX >= e.cellNode.offsetWidth - this.overResizeWidth) && this.prepareResize(e, -1);
		},

		domousemove: function(e){
			//console.log(e.cellIndex, e.cellX, e.cellNode.offsetWidth);
			if(!headerMoveable){
				var c = (this.overRightResizeArea(e) ? 'e-resize' : (this.overLeftResizeArea(e) ? 'w-resize' : ''));
				if(c && !this.canResize(e)){
					c = 'not-allowed';
				}
				e.sourceView.headerNode.style.cursor = c || ''; //'default';
				if(c){
					dojo.stopEvent(e);
				}
			}
		},

		domousedown: function(e){
			if(!headerMoveable){
				if((this.overRightResizeArea(e) || this.overLeftResizeArea(e)) && this.canResize(e)){
					this.beginColumnResize(e);
				}else{
					this.grid.onMouseDown(e);
					this.grid.onMouseOverRow(e);
				}
				//else{
				//	this.beginMoveColumn(e);
				//}
			}
		},

		doclick: function(e) {
			if (new Date().getTime() < this.bogusClickTime) {
				dojo.stopEvent(e);
				return true;
			}
		},

		// column resizing
		beginColumnResize: function(e){
			this.moverDiv = document.createElement("div");
			dojo.body().appendChild(this.moverDiv);
			var m = headerMoveable = new dojo.dnd.Moveable(this.moverDiv);

			var spanners = [], nodes = this.tableMap.findOverlappingNodes(e.cellNode);
			for(var i=0, cell; (cell=nodes[i]); i++){
				spanners.push({ node: cell, index: this.getCellNodeIndex(cell), width: cell.offsetWidth });
				//console.log("spanner: " + this.getCellNodeIndex(cell));
			}

			var view = e.sourceView;
			var adj = dojo._isBodyLtr() ? 1 : -1;
			var views = e.grid.views.views;
			var followers = [];
			for(var i=view.idx+adj, cView; (cView=views[i]); i=i+adj){
				followers.push({ node: cView.headerNode, left: window.parseInt(cView.headerNode.style.left) });
			}
			var table = view.headerContentNode.firstChild;
			var drag = {
				scrollLeft: e.sourceView.headerNode.scrollLeft,
				view: view,
				node: e.cellNode,
				index: e.cellIndex,
				w: dojo.contentBox(e.cellNode).w,
				vw: dojo.contentBox(view.headerNode).w,
				table: table,
				tw: dojo.contentBox(table).w,
				spanners: spanners,
				followers: followers
			};

			m.onMove = dojo.hitch(this, "doResizeColumn", drag);

			dojo.connect(m, "onMoveStop", dojo.hitch(this, function(){
				this.endResizeColumn(drag);
				if(drag.node.releaseCapture){
					drag.node.releaseCapture();
				}
				headerMoveable.destroy();
				delete headerMoveable;
				headerMoveable = null;
			}));

			view.convertColPctToFixed();

			if(e.cellNode.setCapture){
				e.cellNode.setCapture();
			}
			m.onMouseDown(e);
		},

		doResizeColumn: function(inDrag, mover, leftTop){
			var isLtr = dojo._isBodyLtr();
			if(isLtr){
				var w = inDrag.w + leftTop.l;
				var vw = inDrag.vw + leftTop.l;
				var tw = inDrag.tw + leftTop.l;
			}else{
				var w = inDrag.w - leftTop.l;
				var vw = inDrag.vw - leftTop.l;
				var tw = inDrag.tw - leftTop.l;
			}
			if(w >= this.minColWidth){
				for(var i=0, s, sw; (s=inDrag.spanners[i]); i++){
					if(isLtr){
						sw = s.width + leftTop.l;
					}else{
						sw = s.width - leftTop.l;
					}
					s.node.style.width = sw + 'px';
					inDrag.view.setColWidth(s.index, sw);
					//console.log('setColWidth', '#' + s.index, sw + 'px');
				}
				for(var i=0, f, fl; (f=inDrag.followers[i]); i++){
					if(isLtr){
						fl = f.left + leftTop.l;
					}else{
						fl = f.left - leftTop.l;
					}
					f.node.style.left = fl + 'px';
				}
				inDrag.node.style.width = w + 'px';
				inDrag.view.setColWidth(inDrag.index, w);
				inDrag.view.headerNode.style.width = vw + 'px';
				inDrag.view.setColumnsWidth(tw);
				if(!isLtr){
					inDrag.view.headerNode.scrollLeft = (inDrag.scrollLeft - leftTop.l);
				}
			}
			if(inDrag.view.flexCells && !inDrag.view.testFlexCells()){
				var t = findTable(inDrag.node);
				t && (t.style.width = '');
			}
		},

		endResizeColumn: function(inDrag){
			dojo._destroyElement(this.moverDiv);
			delete this.moverDiv;
			this.bogusClickTime = new Date().getTime() + 30;
			setTimeout(dojo.hitch(inDrag.view, "update"), 50);
		}
	});

	// Maps an html table into a structure parsable for information about cell row and col spanning.
	// Used by HeaderBuilder.
	var TableMap = function(rows){
		this.mapRows(rows);
	};
	dojo.extend(TableMap, {
		map: null,

		mapRows: function(inRows){
			// summary: Map table topography

			//console.log('mapRows');
			// # of rows
			var rowCount = inRows.length;
			if(!rowCount){
				return;
			}
			// map which columns and rows fill which cells
			this.map = [ ];
			for(var j=0, row; (row=inRows[j]); j++){
				this.map[j] = [];
			}
			for(var j=0, row; (row=inRows[j]); j++){
				for(var i=0, x=0, cell, colSpan, rowSpan; (cell=row[i]); i++){
					while (this.map[j][x]){x++};
					this.map[j][x] = { c: i, r: j };
					rowSpan = cell.rowSpan || 1;
					colSpan = cell.colSpan || 1;
					for(var y=0; y<rowSpan; y++){
						for(var s=0; s<colSpan; s++){
							this.map[j+y][x+s] = this.map[j][x];
						}
					}
					x += colSpan;
				}
			}
			//this.dumMap();
		},

		dumpMap: function(){
			for(var j=0, row, h=''; (row=this.map[j]); j++,h=''){
				for(var i=0, cell; (cell=row[i]); i++){
					h += cell.r + ',' + cell.c + '   ';
				}
				console.log(h);
			}
		},

		getMapCoords: function(inRow, inCol){
			// summary: Find node's map coords by it's structure coords
			for(var j=0, row; (row=this.map[j]); j++){
				for(var i=0, cell; (cell=row[i]); i++){
					if(cell.c==inCol && cell.r == inRow){
						return { j: j, i: i };
					}
					//else{console.log(inRow, inCol, ' : ', i, j, " : ", cell.r, cell.c); };
				}
			}
			return { j: -1, i: -1 };
		},
		
		getNode: function(inTable, inRow, inCol){
			// summary: Find a node in inNode's table with the given structure coords
			var row = inTable && inTable.rows[inRow];
			return row && row.cells[inCol];
		},
		
		_findOverlappingNodes: function(inTable, inRow, inCol){
			var nodes = [];
			var m = this.getMapCoords(inRow, inCol);
			//console.log("node j: %d, i: %d", m.j, m.i);
			var row = this.map[m.j];
			for(var j=0, row; (row=this.map[j]); j++){
				if(j == m.j){ continue; }
				var rw = row[m.i];
				//console.log("overlaps: r: %d, c: %d", rw.r, rw.c);
				var n = (rw?this.getNode(inTable, rw.r, rw.c):null);
				if(n){ nodes.push(n); }
			}
			//console.log(nodes);
			return nodes;
		},
		
		findOverlappingNodes: function(inNode){
			return this._findOverlappingNodes(findTable(inNode), getTrIndex(inNode.parentNode), getTdIndex(inNode));
		}
	});


	// public
	dojo.declare('dojox.grid._View', [dijit._Widget, dijit._Templated], {
		// summary:
		//		A collection of grid columns. A grid is comprised of a set of views that stack horizontally.
		//		Grid creates views automatically based on grid's layout structure.
		//		Users should typically not need to access individual views directly.
		//
		// defaultWidth: String
		//		Default widget of the view
		defaultWidth: "18em",

		// viewWidth: String
		// 		Width for the view, in valid css unit
		viewWidth: "",

		templatePath: dojo.moduleUrl("dojox.grid","resources/View.html"),
		
		themeable: false,
		classTag: 'dojoxGrid',
		marginBottom: 0,
		rowPad: 2,

		postMixInProperties: function(){
			this.rowNodes = [];
		},

		postCreate: function(){
			this.connect(this.scrollboxNode,"onscroll","doscroll");
			dojox.grid.util.funnelEvents(this.contentNode, this, "doContentEvent", [ 'mouseover', 'mouseout', 'click', 'dblclick', 'contextmenu', 'mousedown' ]);
			dojox.grid.util.funnelEvents(this.headerNode, this, "doHeaderEvent", [ 'dblclick', 'mouseover', 'mouseout', 'mousemove', 'mousedown', 'click', 'contextmenu' ]);
			this.content = new ContentBuilder(this);
			this.header = new HeaderBuilder(this);
			//BiDi: in RTL case, style width='9000em' causes scrolling problem in head node
			if(!dojo._isBodyLtr()){
				this.headerNodeContainer.style.width = "";
			}
		},

		destroy: function(){
			dojo._destroyElement(this.headerNode);
			delete this.headerNode;
			dojo.forEach(this.rowNodes, dojo._destroyElement);
			this.rowNodes = [];
			if(this.source){
				dojo.disconnect(this._source_conn);
				dojo.unsubscribe(this._source_sub);
				this.source.destroy();
			}
			this.inherited(arguments);
		},

		// focus 
		focus: function(){
			if(dojo.isSafari || dojo.isOpera){
				this.hiddenFocusNode.focus();
			}else{
				this.scrollboxNode.focus();
			}
		},

		setStructure: function(inStructure){
			var vs = this.structure = inStructure;
			// FIXME: similar logic is duplicated in layout
			if(vs.width && !isNaN(vs.width)){
				this.viewWidth = vs.width + 'em';
			}else{
				this.viewWidth = vs.width || this.viewWidth; //|| this.defaultWidth;
			}
			this.onBeforeRow = vs.onBeforeRow;
			this.noscroll = vs.noscroll;
			if(this.noscroll){
				this.scrollboxNode.style.overflow = "hidden";
			}
			this.simpleStructure = Boolean(vs.cells.length == 1);
			// bookkeeping
			this.testFlexCells();
			// accomodate new structure
			this.updateStructure();
		},

		testFlexCells: function(){
			// FIXME: cheater, this function does double duty as initializer and tester
			this.flexCells = false;
			for(var j=0, row; (row=this.structure.cells[j]); j++){
				for(var i=0, cell; (cell=row[i]); i++){
					cell.view = this;
					this.flexCells = this.flexCells || cell.isFlex();
				}
			}
			return this.flexCells;
		},

		updateStructure: function(){
			// header builder needs to update table map
			this.header.update();
			// content builder needs to update markup cache
			this.content.update();
		},

		getScrollbarWidth: function(){
			var hasScrollSpace = this.hasVScrollbar();
			var overflow = dojo.style(this.scrollboxNode, "overflow");
			if(this.noscroll || !overflow || overflow == "hidden"){
				hasScrollSpace = false;
			}else if(overflow == "scroll"){
				hasScrollSpace = true;
			}
			return (hasScrollSpace ? dojox.html.metrics.getScrollbar().w : 0); // Integer
		},

		getColumnsWidth: function(){
			return this.headerContentNode.firstChild.offsetWidth; // Integer
		},

		setColumnsWidth: function(width){
			this.headerContentNode.firstChild.style.width = width + 'px';
			if(this.viewWidth){
				this.viewWidth = width + 'px';
			}
		},

		getWidth: function(){
			return this.viewWidth || (this.getColumnsWidth()+this.getScrollbarWidth()) +'px'; // String
		},

		getContentWidth: function(){
			return Math.max(0, dojo._getContentBox(this.domNode).w - this.getScrollbarWidth()) + 'px'; // String
		},

		render: function(){
			this.scrollboxNode.style.height = '';
			this.renderHeader();

			var cells = this.grid.layout.cells;
			var getSibling = dojo.hitch(this, function(node, before){
				var idx = this.header.getCellNodeIndex(node) + (before ? -1 : 1);
				var cell = cells[idx];
				if(cell){
					return cell.getHeaderNode();
				}
				return null;
			});
			if(this.grid.columnReordering && this.simpleStructure){
				if(this.source){
					dojo.disconnect(this._source_conn);
					dojo.unsubscribe(this._source_sub);
					this.source.destroy();
				}
				this.source = new dojo.dnd.Source(this.headerContentNode.firstChild.rows[0], {
					horizontal: true,
					accept: [ "gridColumn_" + this.grid.id ],
					viewIndex: this.index,
					onMouseDown: dojo.hitch(this, function(e){
						this.header.decorateEvent(e);
						if((this.header.overRightResizeArea(e) || this.header.overLeftResizeArea(e)) &&
							this.header.canResize(e) && !headerMoveable){
							this.header.beginColumnResize(e);
						}else{
							dojo.dnd.Source.prototype.onMouseDown.call(this.source, e);
						}
					}),
					_markTargetAnchor: dojo.hitch(this, function(before){
						var src = this.source;
						if(src.current == src.targetAnchor && src.before == before){ return; }
						if(src.targetAnchor && getSibling(src.targetAnchor, src.before)){
							src._removeItemClass(getSibling(src.targetAnchor, src.before), src.before ? "After" : "Before");
						}
						dojo.dnd.Source.prototype._markTargetAnchor.call(src, before);
						if(src.targetAnchor && getSibling(src.targetAnchor, src.before)){
							src._addItemClass(getSibling(src.targetAnchor, src.before), src.before ? "After" : "Before");
						}						
					}),
					_unmarkTargetAnchor: dojo.hitch(this, function(){
						var src = this.source;
						if(!src.targetAnchor){ return; }
						if(src.targetAnchor && getSibling(src.targetAnchor, src.before)){
							src._removeItemClass(getSibling(src.targetAnchor, src.before), src.before ? "After" : "Before");
						}
						dojo.dnd.Source.prototype._unmarkTargetAnchor.call(src);
					})
				});
				this._source_conn = dojo.connect(this.source, "onDndDrop", this, "_onDndDrop");
				this._source_sub = dojo.subscribe("/dnd/drop/before", this, "_onDndDropBefore");
				this.source.startup();
			}
		},

		_onDndDropBefore: function(source, nodes, copy){
			if(dojo.dnd.manager().target !== this.source){
				return;
			}
			this.source._targetNode = this.source.targetAnchor;
			this.source._beforeTarget = this.source.before;
			var views = this.grid.views.views;
			var srcView = views[source.viewIndex];
			var tgtView = views[this.index];
			if(tgtView != srcView){
				var s = srcView.convertColPctToFixed();
				var t = tgtView.convertColPctToFixed();
				if(s || t){
					setTimeout(function(){
						srcView.update();
						tgtView.update();
					}, 50);
				}
			}
		},

		_onDndDrop: function(source, nodes, copy){
			if(dojo.dnd.manager().target !== this.source){
				if(dojo.dnd.manager().source === this.source){
					this._removingColumn = true;
				}
				return;
			}

			var getIdx = function(n){
				return n ? dojo.attr(n, "idx") : null;
			}
			var w = dojo.marginBox(nodes[0]).w;
			if(source.viewIndex !== this.index){
				var views = this.grid.views.views;
				var srcView = views[source.viewIndex];
				var tgtView = views[this.index];
				if(srcView.viewWidth && srcView.viewWidth != "auto"){
					srcView.setColumnsWidth(srcView.getColumnsWidth() - w);
				}
				if(tgtView.viewWidth && tgtView.viewWidth != "auto"){
					tgtView.setColumnsWidth(tgtView.getColumnsWidth());
				}
			}
			this.grid.layout.moveColumn(
				source.viewIndex,
				this.index,
				getIdx(nodes[0]),
				getIdx(this.source._targetNode),
				this.source._beforeTarget
			);
			delete this.source._targetNode;
			delete this.source._beforeTarget;
		},

		renderHeader: function(){
			this.headerContentNode.innerHTML = this.header.generateHtml(this._getHeaderContent);
		},

		// note: not called in 'view' context
		_getHeaderContent: function(inCell){
			var n = inCell.name || inCell.grid.getCellName(inCell);
			if(inCell.index != inCell.grid.getSortIndex()){
				return n;
			}
			return [ '<div class="', inCell.grid.sortInfo > 0 ? 'dojoxGrid-sort-down' : 'dojoxGrid-sort-up', '"><div class="gridArrowButtonChar">', inCell.grid.sortInfo > 0 ? '&#9660;' : '&#9650;', '</div>', n, '</div>' ].join('');
		},

		resize: function(){
			this.adaptHeight();
			this.adaptWidth();
		},

		hasHScrollbar: function(reset){
			if(this._hasHScroll == undefined || reset){
				this._hasHScroll = (this.scrollboxNode.offsetWidth < this.contentNode.offsetWidth);
			}
			return this._hasHScroll; // Boolean
		},

		hasVScrollbar: function(reset){
			if(this._hasVScroll == undefined || reset){
				this._hasVScroll = (this.scrollboxNode.offsetHeight < this.contentNode.offsetHeight);
			}
			return this._hasVScroll; // Boolean
		},
		
		convertColPctToFixed: function(){
			// Fix any percentage widths to be pixel values
			var hasPct = false;
			var cellNodes = dojo.query("th", this.headerContentNode);
			var fixedWidths = dojo.map(cellNodes, function(c){
				var w = c.style.width;
				if(w && w.slice(-1) == "%"){
					hasPct = true;
					return dojo.contentBox(c).w;
				}else if(w && w.slice(-2) == "px"){
					return window.parseInt(w, 10);
				}
				return -1;
			});
			if(hasPct){
				dojo.forEach(this.grid.layout.cells, function(cell, idx){
					if(cell.view == this){
						var vIdx = cell.layoutIndex;
						this.setColWidth(idx, fixedWidths[vIdx]);
						cellNodes[vIdx].style.width = cell.unitWidth;
					}
				}, this);
				return true;
			}
			return false;
		},

		adaptHeight: function(){
			if(!this.grid.autoHeight){
				var h = this.domNode.clientHeight;
				dojox.grid.util.setStyleHeightPx(this.scrollboxNode, h);
			}
			this.hasVScrollbar(true);
		},

		adaptWidth: function(){
			if(this.flexCells){
				// the view content width
				this.contentWidth = this.getContentWidth();
				this.headerContentNode.firstChild.style.width = this.contentWidth;
			}
			// FIXME: it should be easier to get w from this.scrollboxNode.clientWidth, 
			// but clientWidth seemingly does not include scrollbar width in some cases
			var w = this.scrollboxNode.offsetWidth - this.getScrollbarWidth();
			if(!this._removingColumn){
				w = Math.max(w, this.getColumnsWidth()) + 'px';
			}else{
				w = Math.min(w, this.getColumnsWidth()) + 'px';
				this._removingColumn = false;
			}
			var cn = this.contentNode;
			cn.style.width = w;
			this.hasHScrollbar(true);
		},

		setSize: function(w, h){
			var ds = this.domNode.style;
			var hs = this.headerNode.style;

			if(w){
				ds.width = w;
				hs.width = w;
			}
			ds.height = (h >= 0 ? h + 'px' : '');
		},

		renderRow: function(inRowIndex, inHeightPx){
			var rowNode = this.createRowNode(inRowIndex);
			this.buildRow(inRowIndex, rowNode, inHeightPx);
			this.grid.edit.restore(this, inRowIndex);
			return rowNode;
		},

		createRowNode: function(inRowIndex){
			var node = document.createElement("div");
			node.className = this.classTag + '-row';
			node[gridViewTag] = this.id;
			node[rowIndexTag] = inRowIndex;
			this.rowNodes[inRowIndex] = node;
			return node;
		},

		buildRow: function(inRowIndex, inRowNode){
			this.buildRowContent(inRowIndex, inRowNode);
			this.styleRow(inRowIndex, inRowNode);
		},

		buildRowContent: function(inRowIndex, inRowNode){
			inRowNode.innerHTML = this.content.generateHtml(inRowIndex, inRowIndex); 
			if(this.flexCells){
				// FIXME: accessing firstChild here breaks encapsulation
				inRowNode.firstChild.style.width = this.contentWidth;
			}
		},

		rowRemoved:function(inRowIndex){
			this.grid.edit.save(this, inRowIndex);
			delete this.rowNodes[inRowIndex];
		},

		getRowNode: function(inRowIndex){
			return this.rowNodes[inRowIndex];
		},

		getCellNode: function(inRowIndex, inCellIndex){
			var row = this.getRowNode(inRowIndex);
			if(row){
				return this.content.getCellNode(row, inCellIndex);
			}
		},

		getHeaderCellNode: function(inCellIndex){
			if(this.headerContentNode){
				return this.header.getCellNode(this.headerContentNode, inCellIndex);
			}
		},

		// styling
		styleRow: function(inRowIndex, inRowNode){
			inRowNode._style = getStyleText(inRowNode);
			this.styleRowNode(inRowIndex, inRowNode);
		},

		styleRowNode: function(inRowIndex, inRowNode){
			if(inRowNode){
				this.doStyleRowNode(inRowIndex, inRowNode);
			}
		},

		doStyleRowNode: function(inRowIndex, inRowNode){
			this.grid.styleRowNode(inRowIndex, inRowNode);
		},

		// updating
		updateRow: function(inRowIndex, inHeightPx, inPageNode){
			var rowNode = this.getRowNode(inRowIndex);
			if(rowNode){
				rowNode.style.height = '';
				this.buildRow(inRowIndex, rowNode);
			}
			return rowNode;
		},

		updateRowStyles: function(inRowIndex){
			this.styleRowNode(inRowIndex, this.getRowNode(inRowIndex));
		},

		// scrolling
		lastTop: 0,
		firstScroll:0,

		doscroll: function(inEvent){
			//var s = dojo.marginBox(this.headerContentNode.firstChild);
			var isLtr = dojo._isBodyLtr();
			if(this.firstScroll < 2){
				if((!isLtr && this.firstScroll == 1) || (isLtr && this.firstScroll == 0)){
					var s = dojo.marginBox(this.headerNodeContainer);
					if(dojo.isIE){
						this.headerNodeContainer.style.width = s.w + this.getScrollbarWidth() + 'px';
					}else if(dojo.isMoz){
						//TODO currently only for FF, not sure for safari and opera
						this.headerNodeContainer.style.width = s.w - this.getScrollbarWidth() + 'px';
						//this.headerNodeContainer.style.width = s.w + 'px';
						//set scroll to right in FF
						if(!isLtr){
							this.scrollboxNode.scrollLeft = this.scrollboxNode.scrollWidth - this.scrollboxNode.clientWidth;
						}else{
							this.scrollboxNode.scrollLeft = this.scrollboxNode.clientWidth - this.scrollboxNode.scrollWidth;
						}
					}
				}
				this.firstScroll++;
			}
			this.headerNode.scrollLeft = this.scrollboxNode.scrollLeft;
			// 'lastTop' is a semaphore to prevent feedback-loop with setScrollTop below
			var top = this.scrollboxNode.scrollTop;
			if(top != this.lastTop){
				this.grid.scrollTo(top);
			}
		},

		setScrollTop: function(inTop){
			// 'lastTop' is a semaphore to prevent feedback-loop with doScroll above
			this.lastTop = inTop;
			this.scrollboxNode.scrollTop = inTop;
			return this.scrollboxNode.scrollTop;
		},

		// event handlers (direct from DOM)
		doContentEvent: function(e){
			if(this.content.decorateEvent(e)){
				this.grid.onContentEvent(e);
			}
		},

		doHeaderEvent: function(e){
			if(this.header.decorateEvent(e)){
				this.grid.onHeaderEvent(e);
			}
		},

		// event dispatch(from Grid)
		dispatchContentEvent: function(e){
			return this.content.dispatchEvent(e);
		},

		dispatchHeaderEvent: function(e){
			return this.header.dispatchEvent(e);
		},

		// column resizing
		setColWidth: function(inIndex, inWidth){
			this.grid.setCellWidth(inIndex, inWidth + 'px');
		},

		update: function(){
			var left = this.scrollboxNode.scrollLeft;
			this.content.update();
			this.grid.update();
			this.scrollboxNode.scrollLeft = left;
			this.headerNode.scrollLeft = left;
		}
	});

	dojo.declare("dojox.grid._GridAvatar", dojo.dnd.Avatar, {
		construct: function(){
			var dd = dojo.doc;

			var a = dd.createElement("table");
			a.cellPadding = a.cellSpacing = "0";
			a.className = "dojoxGridDndAvatar";
			a.style.position = "absolute";
			a.style.zIndex = 1999;
			a.style.margin = "0px"; // to avoid dojo.marginBox() problems with table's margins
			var b = dd.createElement("tbody");
			var tr = dd.createElement("tr");
			var td = dd.createElement("td");
			var img = dd.createElement("td");
			tr.className = "dojoxGridDndAvatarItem";
			img.className = "dojoxGridDndAvatarItemImage";
			img.style.width = "16px";
			var source = this.manager.source, node;
			if(source.creator){
				// create an avatar representation of the node
				node = source._normailzedCreator(source.getItem(this.manager.nodes[0].id).data, "avatar").node;
			}else{
				// or just clone the node and hope it works
				node = this.manager.nodes[0].cloneNode(true);
				if(node.tagName.toLowerCase() == "tr"){
					// insert extra table nodes
					var table = dd.createElement("table"),
						tbody = dd.createElement("tbody");
					tbody.appendChild(node);
					table.appendChild(tbody);
					node = table;
				}else if(node.tagName.toLowerCase() == "th"){
					// insert extra table nodes
					var table = dd.createElement("table"),
						tbody = dd.createElement("tbody"),
						r = dd.createElement("tr");
					table.cellPadding = table.cellSpacing = "0";
					r.appendChild(node);
					tbody.appendChild(r);
					table.appendChild(tbody);
					node = table;
				}
			}
			node.id = "";
			td.appendChild(node);
			tr.appendChild(img);
			tr.appendChild(td);
			dojo.style(tr, "opacity", 0.9);
			b.appendChild(tr);

			a.appendChild(b);
			this.node = a;

			var m = dojo.dnd.manager();
			this.oldOffsetY = m.OFFSET_Y;
			m.OFFSET_Y = 1;
		},
		destroy: function(){
			dojo.dnd.manager().OFFSET_Y = this.oldOffsetY;
			this.inherited(arguments);
		}
	});

	var oldMakeAvatar = dojo.dnd.manager().makeAvatar;
	dojo.dnd.manager().makeAvatar = function(){
		var src = this.source;
		if(typeof src.viewIndex != "undefined"){
			return new dojox.grid._GridAvatar(this);
		}
		return oldMakeAvatar.call(dojo.dnd.manager());
	}
})();
