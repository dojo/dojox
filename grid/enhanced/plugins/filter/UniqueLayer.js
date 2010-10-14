dojo.provide("dojox.grid.enhanced.plugins.filter.UniqueLayer");

dojo.require("dojox.grid.enhanced.plugins.StoreLayer");

(function(){
	var ns = dojox.grid.enhanced.plugins,
		cmdUniqueCols = "uniqueCols",
		cmdClearCols = "clearUniqueCols";
	dojo.declare("dojox.grid.enhanced.plugins.filter.UniqueLayer", ns._StoreLayer, {
		// summary:
		//		To make the fetched items unique. Remove same items.
		constructor: function(){
			this.uniqueColumns(null);
		},
		name: function(){
			// summary:
			//		override from _StoreLayer
			return "unique";
		},
		uniqueColumns: function(/* Array? */columnNames){
			// summary:
			//		Get/set the columns that should be kept unique.
			// tags:
			//		public
			// columnNames: String[]?
			//		Names of the columns. If specified, set the unique columns
			// return: 
			//		Current unique columns if *columnNames* is undefined.
			if(dojo.isArray(columnNames) && dojo.toJson(columnNames.sort()) != dojo.toJson(this._uniqueCols.sort())){
				this._uniqueCols = columnNames;
			}else if(columnNames === null){
				this._uniqueCols = [];
			}else{
				return this._uniqueCols;
			}
		},
		_fetch: function(userRequest){
			// summary:
			//		override _StoreLayer._fetch
			if(this._uniqueCols.length){
				var s = this._store,
					uniqueCols = this._uniqueCols, 
					cache = {},
					oldOnComplete = userRequest.onComplete,
					oldOnItem = userRequest.onItem;
				userRequest.onComplete = function(items,req){
					items = dojo.filter(items, function(item){
						var key = dojo.toJson(dojo.map(uniqueCols, function(colName){
							return s.getValue(item, colName);
						}));
						if(cache[key]){
							return false;
						}else{
							oldOnItem && oldOnItem.call(userRequest.scope || dojo.global, item, req);
							return cache[key] = true;//intentional assignment
						}
					})
					oldOnComplete && oldOnComplete.call(userRequest.scope || dojo.global, items, req);
				}
				delete userRequest.onItem;
			}
			return dojo.hitch(this._store, this._originFetch)(userRequest);
		}
	});
})();
