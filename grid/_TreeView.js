dojo.provide("dojox.grid._TreeView");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dojox.grid._View");

dojo.declare("dojox.grid._Expando", [ dijit._Widget, dijit._Templated ], {
	open: false,
	toggleClass: "",
	itemId: "",
	cellIdx: -1,
	view: null,
	rowNode: null,
	rowIdx: -1,
	expandoCell: null,
	templatePath: dojo.moduleUrl("dojox.grid", "resources/Expando.html"),
	_toggleRows: function(toggleClass, open){
		if(!toggleClass || !this.rowNode){ return; }
		if(dojo.query("table.dojoxGridRowTableNeedsRowUpdate").length){
			this.view.grid.updateRow(this.rowIdx);
			return;
		}
		var self = this;
		dojo.query("tr." + toggleClass, this.rowNode).forEach(function(n){
			if(dojo.hasClass(n, "dojoxGridExpandoRow")){
				var en = dojo.query(".dojoxGridExpando", n)[0];
				if(en){
					var ew = dijit.byNode(en);
					var toggleClass = ew ? ew.toggleClass : en.getAttribute("toggleClass");
					var wOpen = ew ? ew.open : self.expandoCell.getOpenState(en.getAttribute("itemId"));
					self._toggleRows(toggleClass, wOpen&&open);
				}
			}
			n.style.display = open ? "" : "none";
		});
	},
	setOpen: function(open){
		var grid = this.view.grid;
		var store = grid.store;
		if(store){
			if(open){
				var data = grid._by_idx[this.rowIdx];
				if(data&&!store.isItemLoaded(data.item)){
					this.expandoInner.innerHTML = "o";
					dojo.addClass(this.domNode, "dojoxGridExpandoLoading");
					store.loadItem({
						item: data.item,
						onItem: dojo.hitch(this, function(i){
							var idty = store.getIdentity(i);
							grid._by_idty[idty] = grid._by_idx[this.rowIdx] = { idty: idty, item: i };
							this._setOpen(open);
						})
					});
				}else{
					this._setOpen(open);
				}
			}else{
				this._setOpen(open);
			}
		}else{
			this._setOpen(open);
		}
	},
	_setOpen: function(open){
		if(open && this._tableRow && dojo.hasClass(this._tableRow, "dojoxGridNoChildren")){
			this._setOpen(false);
			return;
		}
		this.expandoInner.innerHTML = open ? "-" : "+";
		dojo.removeClass(this.domNode, "dojoxGridExpandoLoading");
		dojo.toggleClass(this.domNode, "dojoxGridExpandoOpened", open);
		if(this._tableRow){
			dojo.toggleClass(this._tableRow, "dojoxGridRowCollapsed", !open);
			var base = dojo.attr(this._tableRow, "dojoxTreeGridBaseClasses");
			var new_base = "";
			if(open){
				new_base = dojo.trim((" " + base + " ").replace(" dojoxGridRowCollapsed ", " "));
			}else{
				if((" " + base + " ").indexOf(' dojoxGridRowCollapsed ') < 0){
					new_base = base + (base ? ' ' : '' ) + 'dojoxGridRowCollapsed';
				}
			}
			dojo.attr(this._tableRow, 'dojoxTreeGridBaseClasses', new_base);
		}
		var changed = (this.open !== open);
		this.open = open;
		if(this.expandoCell && this.itemId){
			this.expandoCell.openStates[this.itemId] = open;
		}
		if(this.toggleClass && changed){
			if(!this._tableRow || !this._tableRow.style.display){
				this._toggleRows(this.toggleClass, open);
			}
		}
		if(this.view && this._initialized && this.rowIdx >= 0){
			this.view.grid.rowHeightChanged(this.rowIdx);
			this.view.grid.postresize();
			this.view.hasVScrollbar(true);
		}
	},
	onToggle: function(e){
		this.setOpen(!this.open);
		dojo.stopEvent(e);
	},
	setRowNode: function(rowIdx, rowNode, view){
		if(this.cellIdx < 0 || !this.itemId){ return false; }
		this._initialized = false;
		this.view = view;
		this.rowNode = rowNode;
		this.rowIdx = rowIdx;
		this.expandoCell = view.structure.cells[0][this.cellIdx];
		var d = this.domNode;
		if(d && d.parentNode && d.parentNode.parentNode){
			this._tableRow = d.parentNode.parentNode;
		}
		this.open = this.expandoCell.getOpenState(this.itemId);
		this.setOpen(this.open);
		this._initialized = true;
		return true;
	}
});

dojo.declare("dojox.grid._TreeContentBuilder", dojox.grid._ContentBuilder, {
	generateHtml: function(inDataIndex, inRowIndex){
		var
			html = this.getTableArray(),
			v = this.view,
			row = v.structure.cells[0],
			item = this.grid.getItem(inRowIndex),
			grid = this.grid,
			store = this.grid.store;

		dojox.grid.util.fire(this.view, "onBeforeRow", [inRowIndex, [row]]);
		
		var createRow = function(level, rowItem, summaryRow, toggleClasses, rowStack, shown){
			if(!shown){
				if(html[0].indexOf('dojoxGridRowTableNeedsRowUpdate') == -1){
					html[0] = html[0].replace("dojoxGridRowTable", "dojoxGridRowTable dojoxGridRowTableNeedsRowUpdate");
				}
				return; 
			}
			var rowNodeIdx = html.length;
			toggleClasses = toggleClasses || [];
			var tcJoin = toggleClasses.join('|');
			var tcString = toggleClasses[toggleClasses.length - 1];
			var clString = tcString + (summaryRow ? " dojoxGridSummaryRow" : "");
			html.push('<tr class="' + clString + '" dojoxTreeGridPath="' + rowStack.join('/') +  '" dojoxTreeGridBaseClasses="' + clString + '">');
			var nextLevel = level + 1;
			var parentCell = null;
			for(var i=0, cell; (cell=row[i]); i++){
				var m = cell.markup, cc = cell.customClasses = [], cs = cell.customStyles = [];
				// content (format can fill in cc and cs as side-effects)
				m[5] = cell.formatAtLevel(rowStack, rowItem, level, summaryRow, tcString, cc);
				// classes
				m[1] = cc.join(' ');
				// styles
				m[3] = cs.join(';');
				// in-place concat
				html.push.apply(html, m);
				if(!parentCell && cell.level === nextLevel && cell.parentCell){
					parentCell = cell.parentCell;
				}
			}
			html.push('</tr>');
			if(rowItem && store.isItem(rowItem)){
				var idty = store.getIdentity(rowItem);
				if(typeof grid._by_idty_paths[idty] == "undefined"){
					grid._by_idty_paths[idty] = rowStack.join('/');
				}
			}
			if(rowItem && parentCell && !summaryRow){
				var expandoCell = v.structure.cells[0][parentCell.level];
				var parentOpen = expandoCell.getOpenState(rowItem) && shown;
				if(store.hasAttribute(rowItem, parentCell.field)){
					var tToggle = tcJoin.split('|');
					tToggle.pop();
					var values = store.getValues(rowItem, parentCell.field);
					if(values.length){
						html[rowNodeIdx] = '<tr class="' + tToggle.join(' ') +' dojoxGridExpandoRow" dojoxTreeGridPath="' + rowStack.join('/') + '" dojoxTreeGridBaseClasses="' + tToggle.join(' ') + ' dojoxGridExpandoRow">';
						var iStack = dojo.map(rowStack, "return item;");
						dojo.forEach(values, function(cItm, idx){
							var nToggle = tcJoin.split('|');
							nToggle.push(nToggle[nToggle.length - 1] + "-" + idx);
							iStack.push(idx);
							createRow(nextLevel, cItm, false, nToggle, iStack, parentOpen);
							iStack.pop();
						});
						iStack.push(values.length);
						createRow(level, rowItem, true, toggleClasses, iStack, parentOpen);
					}else{
						html[rowNodeIdx] = '<tr class="' + tcString + ' dojoxGridNoChildren" dojoxTreeGridPath="' + rowStack.join('/') + '" dojoxTreeGridBaseClasses="' + tcString + ' dojoxGridNoChildren">';					
					}
				}else{
					if(!store.isItemLoaded(rowItem)){
						html[0] = html[0].replace("dojoxGridRowTable", "dojoxGridRowTable dojoxGridRowTableNeedsRowUpdate");
					}else{
						html[rowNodeIdx] = '<tr class="' + tcString + ' dojoxGridNoChildren" dojoxTreeGridPath="' + rowStack.join('/') + '" dojoxTreeGridBaseClasses="' + tcString + ' dojoxGridNoChildren">';
					}
				}
			}else if(rowItem && !summaryRow && toggleClasses.length > 1){
				html[rowNodeIdx] = '<tr class="' + toggleClasses[toggleClasses.length - 2] + '" dojoxTreeGridPath="' + rowStack.join('/') + '" dojoxTreeGridBaseClasses="' + toggleClasses[toggleClasses.length - 2] + '">';
			}
		};
		
		createRow(0, item, false, ["dojoxGridRowToggle-" + inRowIndex], [inRowIndex], true);
		html.push('</table>');
		return html.join(''); // String
	},
	findTarget: function(inSource, inTag){
		var n = inSource;
		while(n && (n!=this.domNode)){
			if(n.tagName && n.tagName.toLowerCase() == 'tr'){
				break;
			}
			n = n.parentNode;
		}
		return (n != this.domNode) ? n : null; 
	},
	getCellNode: function(inRowNode, inCellIndex){
		var node = dojo.query("td[idx='" + inCellIndex + "']", inRowNode)[0];
		if(node&&node.parentNode&&!dojo.hasClass(node.parentNode, "dojoxGridSummaryRow")){
			return node;
		}
	},
	decorateEvent: function(e){
		e.rowNode = this.findRowTarget(e.target);
		if(!e.rowNode){return false};
		e.rowIndex = dojo.attr(e.rowNode, 'dojoxTreeGridPath');
		this.baseDecorateEvent(e);
		e.cell = this.grid.getCell(e.cellIndex);
		return true; // Boolean
	}
});

dojo.declare("dojox.grid._TreeView", [dojox.grid._View], {
	_contentBuilderClass: dojox.grid._TreeContentBuilder,
	_onDndDrop: function(source, nodes, copy){
		if(this.grid && this.grid.aggregator){
			this.grid.aggregator.clearSubtotalCache();
		}
		this.inherited(arguments);
	},
	postMixInProperties: function(){
		this.inherited(arguments);
		this._expandos = [];
	},
	onBeforeRow: function(inRowIndex, cells){
		// Save off our expando if we have one so we don't have to create it
		// again
		this._expandos[inRowIndex] = this._expandos[inRowIndex] || {};
		this.inherited(arguments);
	},
	onAfterRow: function(inRowIndex, cells, inRowNode){
		dojo.forEach(dojo.query("span.dojoxGridExpando", inRowNode), function(n){
			if(n && n.parentNode){
				// Either create our expando or put the existing expando back
				// into place
				var tc = n.getAttribute("toggleClass");
				var expando = this._expandos[inRowIndex][tc];
				if(expando){
					dojo.place(expando.domNode, n, "replace");
					expando.itemId = n.getAttribute("itemId");
					expando.cellIdx = parseInt(n.getAttribute("cellIdx"));
					if(isNaN(expando.cellIdx)){
						expando.cellIdx = -1;
					}
				}else{
					this._expandos[tc] = expando = dojo.parser.parse(n.parentNode)[0];
				}
				if(!expando.setRowNode(inRowIndex, inRowNode, this)){
					expando.domNode.parentNode.removeChild(expando.domNode);
				}
			}
		}, this);
		this.inherited(arguments);
	},
	updateRowStyles: function(inRowIndex){
		var rowNodes = dojo.query("tr[dojoxTreeGridPath='" + inRowIndex + "']", this.domNode);
		if(rowNodes.length){
			this.styleRowNode(inRowIndex, rowNodes[0]);
		}
	},
	getCellNode: function(inRowIndex, inCellIndex){
		var row = dojo.query("tr[dojoxTreeGridPath='" + inRowIndex + "']", this.domNode)[0];
		if(row){
			return this.content.getCellNode(row, inCellIndex);
		}
	}
});
