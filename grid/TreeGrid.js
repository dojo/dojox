dojo.experimental("dojox.grid.TreeGrid");

dojo.provide("dojox.grid.TreeGrid");

dojo.require("dojox.grid.DataGrid");
dojo.require("dojox.grid._TreeView");
dojo.require("dojox.grid.cells.tree");
dojo.require("dojox.grid.TreeSelection");

dojo.declare("dojox.grid._TreeAggregator", null, {
	cells: [],
	grid: null,
	childFields: [],
	constructor: function(kwArgs){
		this.cells = kwArgs.cells || [];
		this.childFields = kwArgs.childFields || [];
		this.grid = kwArgs.grid;
		this.store = this.grid.store;
	},
	_cacheValue: function(cache, id, value){
		cache[id] = value;
		return value;
	},
	clearSubtotalCache: function(){
		// summary:
		//		Clears the subtotal cache so that we are forced to recalc it
		//		(or reread it) again.  This is needed, for example, when
		//		column order is changed.
		if(this.store){
			delete this.store._cachedAggregates;
		}
	},
	
	cnt: function(cell, level, item){
		// summary:
		//		calculates the count of the children of item at the given level
		var total = 0;
		var store = this.store;
		var childFields = this.childFields;
		if(childFields[level]){
			var children = store.getValues(item, childFields[level]);
			if (cell.index <= level + 1){
				total = children.length;
			}else{
				dojo.forEach(children, function(c){
					total += this.getForCell(cell, level + 1, c, "cnt");
				}, this);
			}
		}else{
			total = 1;
		}
		return total;
	},
	sum: function(cell, level, item){
		// summary:
		//		calculates the sum of the children of item at the given level
		var total = 0;
		var store = this.store;
		var childFields = this.childFields;
		if(childFields[level]){
			dojo.forEach(store.getValues(item, childFields[level]), function(c){
				total += this.getForCell(cell, level + 1, c, "sum");
			}, this);
		}else{
			total += store.getValue(item, cell.field);
		}
		return total;
	},
	value: function(cell, level, item){
		// summary:
		//		Empty function so that we can set "aggregate='value'" to
		//		force loading from the data - and bypass calculating
	},
	getForCell: function(cell, level, item, type){
		// summary:
		//		Gets the value of the given cell at the given level and type.
		//		type can be one of "sum", "cnt", or "value".  If itemAggregates
		//		is set and can be used, it is used instead.  Values are also
		//		cached to prevent calculating them too often.
		var store = this.store;
		if(!store || !item || !store.isItem(item)){ return ""; }
		var storeCache = store._cachedAggregates = store._cachedAggregates || {};
		var id = store.getIdentity(item);
		var itemCache = storeCache[id] = storeCache[id] || [];
		if(cell.declaredClass != "dojox.grid.cells.TreeCell"){
			cell = this.grid.getCell(cell.layoutIndex + level + 1);
		}
		var idx = cell.index;
		var idxCache = itemCache[idx] = itemCache[idx] || {};
		type = (type || (cell.parentCell ? cell.parentCell.aggregate : "sum"))||"sum";
		var attr = cell.field;
		if(attr == store.getLabelAttributes()[0]){
			// If our attribute is one of the label attributes, we should
			// use cnt instead (since it makes no sense to do a sum of labels)
			type = "cnt";
		}
		var typeCache = idxCache[type] = idxCache[type] || [];

		// See if we have it in our cache immediately for easy returning
		if(typeCache[level] != undefined){
			return typeCache[level];
		}

		// See if they have specified a valid field
		var field = ((cell.parentCell && cell.parentCell.itemAggregates) ? 
							cell.parentCell.itemAggregates[cell.idxInParent] : "")||"";
		if(field && store.hasAttribute(item, field)){
			return this._cacheValue(typeCache, level, store.getValue(item, field));
		}else if(field){
			return this._cacheValue(typeCache, level, 0);
		}
		
		// Calculate it
		return this._cacheValue(typeCache, level, this[type](cell, level, item));
	}
});

dojo.declare("dojox.grid._TreeLayout", dojox.grid._Layout, {
	// Whether or not we are collapsable - this is calculated when we
	// set our structure.
	_isCollapsable: false,
	
	_getInternalStructure: function(inStructure){
		//	Create a "Tree View" with 1 row containing references for
		//		each column (recursively)
		var g = this.grid;
		
		var s = inStructure;
		var cells = s[0].cells[0];
		var tree = {
			type: "dojox.grid._TreeView",
			cells: [[]]
		};
		var cFields = [];
		var maxLevels = 0;
		var getTreeCells = function(parentCell, level){
			var children = parentCell.children;
			var cloneTreeCell = function(originalCell, idx){
				var k, n = {};
				for(k in originalCell){
					n[k] = originalCell[k];
				}
				n = dojo.mixin(n, {
					type: dojox.grid.cells.TreeCell,
					level: level,
					idxInParent: level > 0 ? idx : -1,
					parentCell: level > 0 ? parentCell : null,
					originalCell: originalCell
				});
				return n;
			};
			var ret = [];
			dojo.forEach(children, function(c, idx){
				if("children" in c){
					cFields.push(c.field);
					var last = ret[ret.length - 1];
					last.isCollapsable = true;
					c.level = level;
					ret = ret.concat(getTreeCells(c, level + 1));
				}else{
					ret.push(cloneTreeCell(c, idx));
				}
			});
			maxLevels = Math.max(maxLevels, level);
			return ret;
		};
		var tCell = {children: cells, itemAggregates: []};
		tree.cells[0] = getTreeCells(tCell, 0);
		g.aggregator = new dojox.grid._TreeAggregator({cells: tree.cells[0], 
														grid: g,
														childFields: cFields});
		if(g.scroller && g.defaultOpen){
			g.scroller.defaultRowHeight = g.scroller._origDefaultRowHeight * (2 * maxLevels + 1);
		}
		return [ tree ];
	},

	setStructure: function(inStructure){
		// Mangle the structure a bit and make it work as desired
		var s = inStructure;
		// Only supporting single-view, single row or else we
		// are not collapsable
		if(s.length == 1 && s[0].cells.length == 1){
			var childCells = dojo.filter(s[0].cells[0], function(c){
				return ("children" in c);
			});
			if(childCells.length === 1){
				this._isCollapsable = true;
			}else{
				this._isCollapsable = false;
			}
		}
		if(this._isCollapsable){
			arguments[0] = this._getInternalStructure(s);
		}
		this.inherited(arguments);
	}
});

dojo.declare("dojox.grid.TreeGrid", dojox.grid.DataGrid, {
	// summary:
	//		A grid that supports nesting rows - it provides an expando function
	//		similar to dijit.Tree.  It also provides mechanisms for aggregating
	//		the values of subrows
	//
	// description:
	//		TreeGrid currently only works on "simple" structures.  That is, 
	//		single-view structures with a single row in them.
	//
	//		The TreeGrid works using the concept of "levels" - level 0 are the
	//		top-level items.
	
	// defaultOpen: Boolean
	//		Whether or not we default to open (all levels)
	defaultOpen: true,
	
	// openAtLevels: Array
	//		Which levels we are open at (overrides defaultOpen for the values
	//		that exist here).  Its values can be a boolean (true/false) or an
	//		integer (for the # of children to be closed if there are more than
	//		that)
	openAtLevels: [],
	
	// private values
	// aggregator: Object
	//		The aggregator class - it will be populated automatically if we
	//		are a collapsable grid
	aggregator: null,
	
	// Override this to get our "magic" layout
	_layoutClass: dojox.grid._TreeLayout,

	createSelection: function(){
		this.selection = new dojox.grid.TreeSelection(this);
	},
		
	getItem: function(/*integer|Array|String*/ idx){
		// summary:
		//		overridden so that you can pass in a '/' delimited string of indexes to get the
		//		item based off its path...that is, passing in "1/3/2" will get the
		//		3rd (0-based) child from the 4th child of the 2nd top-level item.
		var isArray = dojo.isArray(idx);
		if(dojo.isString(idx) && idx.indexOf('/')){
			idx = idx.split('/');
			isArray = true;
		}
		if(isArray && idx.length == 1){
			idx = idx[0];
			isArray = false;
		}
		if(!isArray){
			return dojox.grid.DataGrid.prototype.getItem.call(this, idx);
		}
		var s = this.store;
		var itm = dojox.grid.DataGrid.prototype.getItem.call(this, idx[0]);
		if(this.aggregator){
			var cf = this.aggregator.childFields||[];
			for(var i = 0; i < idx.length - 1 && itm; i++){
				if(cf[i]){
					itm = (s.getValues(itm, cf[i])||[])[idx[i + 1]];
				}else{
					itm = null;
				}
			}
		}
		return itm || null;
	},
	
	postMixInProperties: function(){
		var def = this.defaultOpen;
		this.openAtLevels = dojo.map(this.openAtLevels, function(l){
			if(typeof l == "string"){
				switch(l.toLowerCase()){
					case "true":
						return true;
						break;
					case "false":
						return false;
						break;
					default:
						var r = parseInt(l);
						if(isNaN(r)){
							return def;
						}
						return r;
						break;
				}
			}
			return l;
		});
		this.inherited(arguments);
	},
	
	createScroller: function(){
		this.inherited(arguments);
		this.scroller._origDefaultRowHeight = this.scroller.defaultRowHeight;
	},
	
	_setStore: function(store){
		this.inherited(arguments);
		if(this.aggregator){
			this.aggregator.store = store;
		}
	},
	
	getDefaultOpenState: function(cellDef, item){
		// summary:
		//		Returns the default open state for the given definition and item
		//		It reads from the openAtLevels and defaultOpen values of the
		//		grid to calculate if the given item should default to open or
		//		not.
		var cf;
		var store = this.store;
		if(!cellDef || !store || !store.isItem(item) || 
				!(cf = this.aggregator.childFields[cellDef.level])){
			return this.defaultOpen;
		}
		if(this.openAtLevels.length > cellDef.level){
			var dVal = this.openAtLevels[cellDef.level];
			if(typeof dVal == "boolean"){
				return dVal;
			}else if(typeof dVal == "number"){
				return (store.getValues(item, cf).length <= dVal);
			}
		}
		return this.defaultOpen;
	},
	onStyleRow: function(row){
		if(!this.layout._isCollapsable){
			this.inherited(arguments);
			return;
		}
		var base = dojo.attr(row.node, 'dojoxTreeGridBaseClasses');
		if(base){
			row.customClasses = base;
		}
		var i = row;
		var tagName = i.node.tagName.toLowerCase();
		i.customClasses += (i.odd?" dojoxGridRowOdd":"") +
						   (i.selected&&tagName=='tr'?" dojoxGridRowSelected":"") +
						   (i.over&&tagName=='tr'?" dojoxGridRowOver":"");
		this.focus.styleRow(i);
		this.edit.styleRow(i);
	},
	styleRowNode: function(inRowIndex, inRowNode){
		if(inRowNode){
			if(inRowNode.tagName.toLowerCase() == 'div'){
				dojo.query("tr[dojoxTreeGridPath]", inRowNode).forEach(function(rowNode){
					this.rows.styleRowNode(dojo.attr(rowNode, 'dojoxTreeGridPath'), rowNode);
				},this);
			}
			this.rows.styleRowNode(inRowIndex, inRowNode);
		}
	},
	onCanSelect: function(inRowIndex){
		var nodes = dojo.query("tr[dojoxTreeGridPath='" + inRowIndex + "']", this.domNode);
		if(nodes.length){
			if(dojo.hasClass(nodes[0], 'dojoxGridSummaryRow')){
				return false;
			}
		}
		return this.inherited(arguments);
	}
});
dojox.grid.TreeGrid.markupFactory = function(props, node, ctor, cellFunc){
	var d = dojo;
	var widthFromAttr = function(n){
		var w = d.attr(n, "width")||"auto";
		if((w != "auto")&&(w.slice(-2) != "em")&&(w.slice(-1) != "%")){
			w = parseInt(w, 10)+"px";
		}
		return w;
	};
	
	var cellsFromMarkup = function(table){
		var rows;
		// Don't support colgroup on our grid - single view, single row only
		if(table.nodeName.toLowerCase() == "table" &&
					d.query("> colgroup", table).length === 0 &&
					(rows = d.query("> thead > tr", table)).length == 1){
			var tr = rows[0];
			return d.query("> th", rows[0]).map(function(th){
				// Grab type and field (the only ones that are shared
				var cell = {
					type: d.trim(d.attr(th, "cellType")||""),
					field: d.trim(d.attr(th, "field")||"")
				};
				if(cell.type){ 
					cell.type = d.getObject(cell.type);
				}
				
				var subTable = d.query("> table", th)[0];
				if(subTable){
					// If we have a subtable, we are an aggregate and a summary cell
					cell.name = "";
					cell.children = cellsFromMarkup(subTable);
					if(d.hasAttr(th, "itemAggregates")){
						cell.itemAggregates = d.map(d.attr(th, "itemAggregates").split(","), function(v){ 
							return d.trim(v); 
						});
					}else{
						cell.itemAggregates = [];
					}
					if(d.hasAttr(th, "aggregate")){
						cell.aggregate = d.attr(th, "aggregate");
					}
					cell.type = cell.type || dojox.grid.cells.SubtableCell;
				}else{
					// Grab our other stuff we need (mostly what's in the normal 
					// Grid)
					cell.name = d.trim(d.attr(th, "name")||th.innerHTML);
					if(d.hasAttr(th, "width")){
						cell.width = widthFromAttr(th);
					}
					if(d.hasAttr(th, "relWidth")){
						cell.relWidth = window.parseInt(d.attr(th, "relWidth"), 10);
					}
					if(d.hasAttr(th, "hidden")){
						cell.hidden = d.attr(th, "hidden") == "true";
					}
					cell.field = cell.field||cell.name;
					if(cellFunc){
						cellFunc(th, cell);
					}
					cell.type = cell.type || dojox.grid.cells.Cell;
				}
				if(cell.type && cell.type.markupFactory){
					cell.type.markupFactory(th, cell);
				}			
				return cell;
			});
		}
		return [];
	};
	
	var rows;
	if(	!props.structure ){
		var row = cellsFromMarkup(node);
		if(row.length){
			// Set our structure here - so that we don't try and set it in the
			// markup factory
			props.structure = [{__span: Infinity, cells:[row]}];
		}
	}
	return dojox.grid.DataGrid.markupFactory(props, node, ctor, cellFunc);
};
