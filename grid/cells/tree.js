dojo.provide("dojox.grid.cells.tree");

dojo.require("dojox.grid.cells");

dojo.declare("dojox.grid.cells.TreeCell", dojox.grid.cells.Cell, {
	postscript: function(){
		this.openStates = {};
	},
	formatAggregate: function(inItem, level, inRowIndexes){
		var f, g=this.grid, i=g.edit.info, 
			d=g.aggregator ? g.aggregator.getForCell(this, level, inItem, level === this.level ? "cnt" : this.parentCell.aggregate) : (this.value || this.defaultValue);
		var v = (d != this.defaultValue && (f = this.formatter)) ? f.call(this, d, level - this.level, inRowIndexes) : d;
		return (typeof v == "undefined" ? this.defaultValue : v);
	},
	formatIndexes: function(inRowIndexes, inItem){
		var f, g=this.grid, i=g.edit.info, 
			d=this.get ? this.get(inRowIndexes[0], inItem, inRowIndexes) : (this.value || this.defaultValue);
		if(this.editable && (this.alwaysEditing || (i.rowIndex==inRowIndexes[0] && i.cell==this))){
			return this.formatEditing(d, inRowIndexes[0], inRowIndexes);
		}else{
			var v = (d != this.defaultValue && (f = this.formatter)) ? f.call(this, d, inRowIndexes[0], inRowIndexes) : d;
			return (typeof v == "undefined" ? this.defaultValue : v);
		}
	},
	getOpenState: function(itemId){
		var grid = this.grid, store = grid.store, itm = null;
		if(store.isItem(itemId)){
			itm = itemId;
			itemId = store.getIdentity(itemId);
		}
		if(typeof itemId != "string" || !(itemId in this.openStates)){
			this.openStates[itemId] = grid.getDefaultOpenState(this, itm);
		}
		return this.openStates[itemId];
	},
	formatAtLevel: function(inRowIndexes, inItem, level, summaryRow, toggleClass, cellClasses){
		if(!dojo.isArray(inRowIndexes)){
			inRowIndexes = [inRowIndexes];
		}
		if(level > this.level || (level === this.level && summaryRow)){
			cellClasses.push("dojoxGridSpacerCell");
			if(level === this.level){
				cellClasses.push("dojoxGridTotalCell");
			}
			return '<span></span>';
		}else if(level < this.level){
			cellClasses.push("dojoxGridSummaryCell");
			return '<span class="dojoxGridSummarySpan">' + this.formatAggregate(inItem, level, inRowIndexes) + '</span>';
		}else{
			var ret = "";
			if(this.isCollapsable){
				var store = this.grid.store, id = "";
				if(store.isItem(inItem)){
					id = store.getIdentity(inItem);
				}
				cellClasses.push("dojoxGridExpandoCell");
				ret = '<span dojoType="dojox.grid._Expando" class="dojoxGridExpando"' +
						'" toggleClass="' + toggleClass + '" itemId="' + id + '" cellIdx="' + this.index + '"></span>';
			}
			return ret + this.formatIndexes(inRowIndexes, inItem);
		}
	}
});
dojox.grid.cells.TreeCell.markupFactory = function(node, cell){
	dojox.grid.cells.Cell.markupFactory(node, cell);
};
