dojo.require("dojo.parser"); // scan page for widgets and instantiate them
dojo.require("dojox.grid.Grid");
dojo.require("dojox.grid._data.model"); // dojox.grid.data.DojoData is in there
dojo.require("dojox.data.QueryReadStore");
var gridLayout = [
	{
		cells: [[
			{
				name: "row #",
				width:5,
				styles: "text-align:right;",
				get:function(inRowIndex) { return inRowIndex+1;} // this auto generates a row num
			} 
			,{
				name: "id",
				field: "id",
				styles: "text-align:right;",
				width:5
			} 
			,{
				name: "Name",
				field: "name",
				width:20
				//formatter: rs.chunk.adminUser.grid.formatUser
			}
			,{
				name: "Label",
				width:20,
				//styles: "text-align:right;",
				field: "label"
				//formatter: phpr.grid.formatDate
			}
			,{
				name: "Abbrev.",
				width:5,
				//styles: "text-align:right;",
				field: "abbreviation"
				//formatter: phpr.grid.formatDate
			}
		]]
	}
];





/**
 *
 *	This class is NOT being used on the simple page, it does the sorting etc.
 *
 */
dojo.declare("DojoDataSortable", dojox.grid.data.DojoData, {
	// We need to extend this class, to add the sort functionality since
	// that is done by default in the client, but using the QueryReadStore
	// we intentionally want it to be done on the server.
	// So we also have to tell the client not to worry about sorting and
	// pass the data for sorting to the server. This is done in here.
	// Additionally we need to handle the "numRows" parameter that the
	// server sends, since we are paging the data and only the 
	// 
	// Thanks to Maine for the kick start on how to do it right: http://dojotoolkit.org/book/dojo-book-0-9-1-0/part-2-dijit-dojo-widget-library/advanced-editing-and-display/grid-1-0/sortin#comment-9112
	
	// The number of items to load per request.
	// This is also the number of items (rows) initially shown.
	rowsPerPage:30,
	query:{name:"*"},
	// Explicitly tell the store that it must not sort the data on the client!
	clientSort:false,
	
	requestRows: function(inRowIndex, inCount){
		// This entire method is copied from the class dojox.grid.data.DojoData
		// which is located in dojox/grid/_data/model.js
		// We ONLY ADDED the serverQuery-parameter in the array, since this
		// is the special part for the QueryReadStore.
		var row  = inRowIndex || 0;
		var params = { 
			start: row,
			count: this.rowsPerPage,
			query: this.query,
			// The server knows how to handle those paramters, see the PHP script for that.
			serverQuery: dojo.mixin(
			  { start: row,
				count: this.rowsPerPage,
				sort:(this._sortColumn || '')
			  },
			  this.query
			),
			sort: this.sortFields,
			queryOptions: this.queryOptions,
			onBegin: dojo.hitch(this, "beginReturn"),
			onComplete: dojo.hitch(this, "processRows"), // add to deferred?
			onError: dojo.hitch(this, "processError")
		};
		this.store.fetch(params);
	},

	
	canSort:function() {
		return true;
	},
	
	sort:function(colIndex) {
		// clears old data to force loading of new, then requests new rows
		var name = this.fields.get(Math.abs(colIndex)-1).name;
		if (name) {
			this._sortColumn = (colIndex<0?'-':'')+name;
			// This clears the data and triggers the reload too.
			this.clearData();
		}
	},
	
	setData: function(inData){
		// Edited not to reset the store, the parent implementation would
		// reset this.store, which we dont really want it to do here!
		this.data = [];
		this.allChange();
	}
});
