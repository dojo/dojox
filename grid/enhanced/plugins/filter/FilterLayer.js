dojo.provide("dojox.grid.enhanced.plugins.filter.FilterLayer");

dojo.require("dojox.grid.enhanced.plugins.filter._FilterExpr");
dojo.require("dojox.grid.enhanced.plugins.StoreLayer");

(function(){
var ns = dojox.grid.enhanced.plugins,
	cmdSetFilter = "filter",
	cmdClearFilter = "clear",
	hitchIfCan = function(scope, func){
		return func ? dojo.hitch(scope || dojo.global, func) : function(){};
	},
	shallowClone = function(obj){
		var res = {};
		if(obj && dojo.isObject(obj)){
			for(var name in obj){
				res[name] = obj[name];
			}
		}
		return res;
	},
	_findLongestSequences = function (/* Integer[] */numArray,/* Integer */startIdx){
		// summary:
		//		Find all the continuous sequences in an ascending number array, 
		//		and sort them from the longest to the shortest.
		// complexity: 
		//		2n + Complexity of sort
		
		var res = [], res_q = [], start = 0, len = 1, i;
		for(i = 1;i < numArray.length; ++i){
			if(numArray[i] == numArray[i-1]+1){
				++len;
			}else{
				res[start] = len;
				start = i;
				len = 1;
			}
		}
		res[start] = len;
		for(i = 1; i < res.length; ++i){
			if(res[i] != undefined){
				res_q.push({
					idx: i+startIdx,
					cnt: res[i]
				});
			}
		}
		res_q.sort(function(a, b){
			return b.cnt - a.cnt;
		});
		return res_q;
	};
	dojo.declare("dojox.grid.enhanced.plugins.filter._FilterLayerMixin",null,{
/*=====
		// _filter: _ConditionExpr
		//		The filter definition
		_filter: null,
		
		filterDef: function(filter){
			// summary:
			//		Get/set/clear the filter definition
			// tags:
			//		public
			// filter: (_ConditionExpr|null)?
			//		null: clear filter definition
			//		undefined: it's getter
			// returns:
			//		A filter definition if it's getter.
		}
=====*/
		tags: ["sizeChange"],
		name: function(){
			// summary:
			//		override from _StoreLayer.name
			return "filter";	//string
		},
		onFiltered: function(filteredSize, totalSize){
			// summary:
			//		Called when store data is filtered. This event is before *onComplete*, after *onBegin*.
			// tags:
			//		callback extension
			// filteredSize: Integer
			//		The number of remaining fetched items after filtering.
			// totalSize: Integer
			//		The number of original fetched items.
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.ServerSideFilterLayer",
				[ns._ServerSideLayer, ns.filter._FilterLayerMixin],
	{
		constructor: function(args){
			this._onUserCommandLoad = args.setupFilterQuery || this._onUserCommandLoad;
			this.filterDef(null);
		},
		filterDef: function(/* (_ConditionExpr|null)? */filter){
			// summary:
			//		See _FilterLayerMixin.filterDef
			if(filter){
				this._filter = filter;
				var obj = filter.toObject();
				
				//Stateless implementation will need to parse the filter object.
				this.command(cmdSetFilter, this._isStateful ? dojo.toJson(obj) : obj);	
				this.command(cmdClearFilter, null);
				this.useCommands(true);
			}else if(filter === null){
				this._filter = null;
				this.command(cmdSetFilter, null);
				this.command(cmdClearFilter, true);
				this.useCommands(true);
			}else{
				return this._filter;	//_ConditionExpr
			}
		},
		onCommandLoad: function(/* (in)string */responce, /* (in|out)keywordArgs */ userRequest){
			// summary:
			//		override from _ServerSideLayer.onCommandLoad
			this.inherited(arguments);
			var oldOnBegin = userRequest.onBegin;
			if(this._isStateful){
				var filteredSize;
				if(responce){
					this.command(cmdSetFilter, null);
					this.command(cmdClearFilter, null);
					this.useCommands(false);
					var sizes = responce.split(',');
					if(sizes.length >= 2){
						filteredSize = this._filteredSize = parseInt(sizes[0]);
						this.onFiltered(filteredSize, parseInt(sizes[1]));
					}else{
						//Error here.
						return;
					}
				}else{
					filteredSize = this._filteredSize;
				}
				if(this.enabled()){
					userRequest.onBegin = function(size, req){
						hitchIfCan(userRequest.scope, oldOnBegin)(filteredSize, req);
					};
				}
			}else{
				var _this = this;
				userRequest.onBegin = function(size, req){
					if(!_this._filter){
						_this._storeSize = size;
					}
					_this.onFiltered(size, _this._storeSize || size);
					req.onBegin = oldOnBegin;
					hitchIfCan(userRequest.scope, oldOnBegin)(size, req);
				};
			}
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.ClientSideFilterLayer",
				[ns._StoreLayer, ns.filter._FilterLayerMixin],
	{
		// summary:
		//		Add a client side filter layer on top of the data store,
		//		so any filter expression can be applied to the store.

/*=====
		//_items: Array,
		//		Cached items (may contain holes)
		_items: [],
		
		//_result: Array,
		//		Current fetch result
		_result: [],
		
		//_resultStartIdx: Integer,
		//		The index in cache of the first result item
		_resultStartIdx: 0,
		
		//_indexMap: Array,
		//		A map from the row index of this._items to the row index of the original store.
		_indexMap: null,
		
		//_cacheHoles: Array,
		//		Hole objects. e.g. {idx:0,cnt:3} means _items[0],items[1],items[2] are not valid.
		_cacheHoles: [],
		
		//_getter: function(datarow, colArg, rowIndex, store);
		//		A user defined way to get data from store
		_getter: null,
		
		// _cachedItemCount: Integer
		//		The number of valid cached items. Because of holes, _items.length != _cachedItemsCount
		_cachedItemCount: 0,
		
		// _nextUnfetchedIdx: Integer
		//		The index of the next item in the store that is never fetched.
		_nextUnfetchedIdx: 0,
=====*/
		// _storeSize: Integer
		//		The actual size of the original store
		_storeSize: -1,
		
		// _cacheSize: Integer
		//		A cache size limit. Should not be 0, less than 0 means cache all.
		_cacheSize: -1,
		
		// _fetchAll
		//		If the store is small or store size must be correct when onBegin is called,
		//		we should fetch and filter all the items on the first query.
		_fetchAll: true,
		
		constructor: function(args){
			this.filterDef(null);
			args = dojo.isObject(args) ? args : {};
			this.filterCacheSize(args.cacheSize);
			this.fetchAllOnFirstFilter(args.fetchAll);
			this._getter = dojo.isFunction(args.getter) ? args.getter 
						: function(datarow,colName,rowIndex,store){
							return store.getValue(datarow,colName);
						};
		},
		filterDef: function(/* (_ConditionExpr|null)? */filter){
			// summary:
			//		See _FilterLayerMixin.filterDef
			if(filter === undefined){
				return this._filter;	//_ConditionExpr
			}else{
				this._filter = filter;
				this._restore();
			}
		},
		setGetter: function(/* function */getter){
			// summary:
			//		Set the user defined way to retrieve data from store.
			// tags:
			//		public
			// getter: function(datarow, colArg, rowIndex, store);
			if(dojo.isFunction(getter)){
				this._getter = getter;
			}
		},
		filterCacheSize: function(/* Integer? */size){
			// summary:
			//		The get/set function for filter cache size.
			// tags:
			//		public
			// size: Integer?
			//		if > 0, it's a reasonable cache size (hope so), if <=0, means cache all.
			//		if undefined, return the current cache size.
			// returns:
			//		The current filter cache size if it's a getter
			if(size === undefined){
				return this._cacheSize;	//Integer
			}
			this._cacheSize = size > 0 ? size : -1;
		},
		fetchAllOnFirstFilter: function(/* bool? */toFetchAll){
			// summary:
			//		The get/set function for fetchAll.
			// tags:
			//		public
			// toFetchAll: boolean?
			//		If provided, it's a set function, otherwise it's a get function.
			// returns:
			//		Whether fetch all on first filter if this is a getter
			if(toFetchAll === undefined){
				return this._fetchAll;	//Boolean
			}
			this._fetchAll = !!toFetchAll;
		},
		invalidate: function(){
			this._restore();
		},
		
		//----------------Private Functions-----------------------------
		_restore: function(){
			// summary:
			//		Clear all the status information of this layer
			// tags:
			//		private
			this._items = [];
			this._nextUnfetchedIdx = 0;
			this._result = [];
			this._indexMap = [];
			this._cacheHoles = [];
			this._cachedItemCount = 0;
			this._resultStartIdx = 0;
		},
		_fetch: function(userRequest,filterRequest){
			// summary:
			//		Implement _StoreLayer._fetch
			// tags:
			//		private callback
			// filterRequest: dojo.data.api.Request
			//		The actual request used in store.fetch. 
			//		This function is called recursively to fill the result store items 
			//		until the user specified item count is reached. Only in recursive calls,
			//		this parameter is valid.
			if(this._filter == null){
				//If we don't have any filter, use the original request and fetch.
				var old_onbegin = userRequest.onBegin, _this = this;
				userRequest.onBegin = function(size, r){
					hitchIfCan(userRequest.scope, old_onbegin)(size, r);
					_this.onFiltered(size, size);
				};
				dojo.hitch(this._store,this._originFetch)(userRequest);
				return userRequest;
			}
			try{
				//If the fetch is at the beginning, user's start position is used;
				//If we are in a recursion, our own request is used.
				var start = filterRequest ? filterRequest._nextResultItemIdx : userRequest.start;
				start = start || 0;
				if(!filterRequest){
					//Initially, we have no results.
					this._result = [];
					this._resultStartIdx = start;
					var sortStr;
					if(dojo.isArray(userRequest.sort) && userRequest.sort.length > 0 
						//Sort info will stay here in every re-fetch, so remember it!
						&& (sortStr = dojo.toJson(userRequest.sort)) != this._lastSortInfo){
						//If we should sort data, all the old caches are no longer valid.
						//console.log("restore by sort!!!!");
						this._restore();
						this._lastSortInfo = sortStr;
					}
				}
				//this._result contains the current fetch result (of every recursion).
				var end = typeof userRequest.count == "number" ?
							start + userRequest.count - this._result.length
							: this._items.length;
				//Try to retrieve all the items from our cache.
				//Only need items after userRequest.start, test it in case start is smaller.
				if(this._result.length){
					this._result = this._result.concat(this._items.slice(start, end));
				}else{
					this._result = this._items.slice(userRequest.start, typeof userRequest.count == "number" ?
						userRequest.start + userRequest.count : this._items.length);
				}
				
				//console.log("result:",this._result, start, end);
				if(this._result.length >= userRequest.count || this._hasReachedStoreEnd()){
					//We already have had enough items, or we have to stop fetching
					//because there's nothing more to fetch.
					this._completeQuery(userRequest);
				}else{
					//User's request hasn't been finished yet. Fetch more. 
					if(!filterRequest){
						//Initially, we've got to create a new request object.
						filterRequest = shallowClone(userRequest);
						//Use our own onBegin function to remember the total size of the original store.
						filterRequest.onBegin = dojo.hitch(this,this._onFetchBegin);
						filterRequest.onComplete = dojo.hitch(this, function(items, req){
							//We've fetched some more, so march ahead!
							this._nextUnfetchedIdx += items.length;
							//Actual filtering work goes here. Survived items are added to our cache.
							//req is our own request object.
							this._doFilter(items, req.start, userRequest);
							//Recursively call this function. Let's do this again!
							//console.log("refetch!");
							this._fetch(userRequest, req);
						});
					}
					//Fetch starts from the next unfetched item.
					filterRequest.start = this._nextUnfetchedIdx;
					//If store is small, we should only fetch once.
					if(this._fetchAll) delete filterRequest.count;
					//Remember we've (maybe) already added something to our result array,
					//so next time we should not start over again.
					filterRequest._nextResultItemIdx = end < this._items.length ? end : this._items.length;
					//Actual fetch work goes here.
					//console.log("user:",userRequest);
					//console.log("filter:",filterRequest);
					console.log("FETCHING...");
					this.originFetch(filterRequest);
				}
			}catch(e){
				if(userRequest.onError){
					hitchIfCan(userRequest.scope, userRequest.onError)(e, userRequest);
				}else{
					throw e;
				}
			}
			return userRequest;
		},
		_hasReachedStoreEnd: function(){
			// summary:
			//		Check whether all the items in the original store have been fetched.
			// tags:
			//		private
			return this._storeSize >= 0 && this._nextUnfetchedIdx >= this._storeSize;	//Boolean
		},
		_applyFilter: function(/* data item */datarow,/* Integer */rowIndex){
			// summary:
			//		Apply the filter to a row of data
			// tags:
			//		private
			// returns:
			//		whether this row survived the filter.
			var g = this._getter, s = this._store;
			try{
				return !!(this._filter.applyRow(datarow, function(item, arg){
					return g(item, arg, rowIndex, s);
				}).getValue());	
			}catch(e){
				console.log(e);
				return false;
			}
		},
		_doFilter: function(/* Array */items,/* Integer */startIdx,/* object */userRequest){
			// summary:
			//		Use the filter expression to filter items. Survived items are stored in this._items.
			//		The given items start from "startIdx" in the original store.
			// tags:
			//		private
			for(var i = 0, cnt = 0; i < items.length; ++i){
				if(this._applyFilter(items[i], startIdx + i)){
					hitchIfCan(userRequest.scope, userRequest.onItem)(items[i], userRequest);
					cnt += this._addCachedItems(items[i], this._items.length);
					this._indexMap.push(startIdx + i);
				}
			}
			//console.log("Filtered! "+cnt+" out of "+items.length);
		},
		_onFetchBegin: function(/* Integer */size,/* request object */req){
			// summary:
			//		This function is used to replace the user's onFetchBegin in store.fetch
			// tags:
			//		private
			this._storeSize = size;
		},
		_completeQuery: function(/* request object */userRequest){
			// summary:
			//		Logically, the user's query is completed here, i.e., all the filtered results are ready.
			//		(or their index mappings are ready)
			// tags:
			//		private
			
			//console.log("query complete.");
			var size = this._items.length;
			if(this._nextUnfetchedIdx < this._storeSize){
				//FIXME: There's still some items in the original store that are not fetched & filtered.
				//So we have to estimate a little bigger size to allow scrolling to these unfetched items.
				//However, this behavior is ONLY correct in Grid! Any better way to do this?
				size++;
			}
			hitchIfCan(userRequest.scope, userRequest.onBegin)(size,userRequest);
			this._fillUncachedResult(userRequest,0);
		},
		_fillUncachedResult: function(/* request object */userRequest,/* Integer */resultIdx){
			// summary:
			//		If the cache is not big enough to contain all the store data, there might be some "holes" in the cache
			//		that are only an index mapping. So we have to fill these holes here before give the result back to user.
			// tags:
			//		private callback
			// resultIdx: Integer
			//		Since this function is a callback when a "hole" is fixed, we have to remember where to start checking the
			//		result array again.
			
			//console.log("start _fillUncachedResult: result cnt:",this._result.length,", idx:",resultIdx);
			var i,filterIdx,j,m;
			if(this._cacheSize >= 0){
				//Not cache all, so maybe some holes.
				for(i = resultIdx; i < this._result.length; ++i){
					if(!this._result[i]){
						//Found a hole in the result, but maybe it's been fixed in the cache.
						filterIdx = i + this._resultStartIdx;
						if(this._result[i] = this._items[filterIdx]){//intentional assignment
							//Yes, it's fixed.
							//console.log("fixed");
							continue;
						}
						//It's a real cache hole.
						//console.log("need fill hole");
						for(j = 0; j < this._cacheHoles.length; ++j){
							//Try to find a hole object that contains this hole.
							m = this._cacheHoles[j];
							if(filterIdx >= m.idx && filterIdx < m.idx + m.cnt){
								//Found the hole object. Fetch missing items and fill the holes.
								//console.log("Hole Found! ", filterIdx, ", ",m);
								dojo.hitch(this._store,this._originFetch)({
									start: this._indexMap[m.idx],
									count: m.cnt,
									_filterIdx: m.idx,	//Index in the cache.
									_resultIdx: i,		//Index in the result array
									_holeObjIdx: j,		//Index in the hole queue
									onComplete: dojo.hitch(this, function(items, req){
										//FOR debug
										if(items.length != req.count){
											throw new Error("_fillUncachedResult: fatal error");
										}
										//Fill the holes
										this._addCachedItems(items, req._filterIdx);
										//console.log("Hole Filled! ", req._filterIdx, ", ", items.length);
										//Remove hole object
										this._cacheHoles.splice(req._holeObjIdx, 1);
										//Go on to check remaining result items.
										this._fillUncachedResult(userRequest, req._resultIdx);
									})
								});
								//Following work is in the callback: onComplete.
								return;
							}
						}
					}
				}
				//here we have no holes.
				//console.log("All holes filled");
			}
			//Before giving the control back to user, clear some cache if it's too big.
			this._checkCacheSize(userRequest);
			this.onFiltered(this._items.length, this._storeSize);
			hitchIfCan(userRequest.scope, userRequest.onComplete)(this._result, userRequest);
		},
		_checkCacheSize: function(/* request object */userRequest){
			// summary:
			//		Try to delete some items from the cache in case we've fetched too much.
			// tags:
			//		private
			
			//console.log("_checkCacheSize: cur holes:",this._cacheHoles.length,",cached cnt:",this._cachedItemCount,",cache size:",this._cacheSize);
			//If we cache all, it's a no-op.
			if(this._cacheSize < 0){
				return;
			}
			var dif, del_cnt = 0, start = userRequest.start || 0, end = start;
			if(userRequest.count){
				end += userRequest.count;
			}
			if((dif = this._cachedItemCount - this._cacheSize) > 0){
				//We have cached too much.
				var func = dojo.hitch(this, function(cnt, slice_start, slice_end){
					var arr = slice_end ? this._indexMap.slice(slice_start,slice_end) : this._indexMap.slice(slice_start);
					var q = _findLongestSequences(arr,slice_start);
					//console.log("HOLE_Q_Begin: ",q.length,",indexMap:",this._indexMap.length,",start:",slice_start,",end:",slice_end);
					while(cnt < dif && (m = q.shift())){ //intentional assignment
						//console.log("HOLE_OBJ: ",m);
						cnt += this._delCachedItems(m.idx,m.cnt);
						this._cacheHoles.push(m);
					}
					return cnt;
				});
				if(userRequest.start > 0){
					//Try to delete some cache before the user's request position.
					del_cnt = func(0,0,start);
				}
				if(del_cnt < dif && end < this._indexMap.length){
					//Try to delete some cache after the user's request position.
					del_cnt = func(del_cnt,end);
				}
			}
			console.log("DIF:",dif,",Deleted:",del_cnt,",cur holes:",this._cacheHoles.length,",cached cnt:",this._cachedItemCount,",cache size:",this._cacheSize);
		},
		_addCachedItems: function(/* Array */items,/* Integer */filterStartIdx){
			// summary:
			//		Add data items to the cache. The insert point is at *filterStartIdx*
			// tags:
			//		private
			// items: Array
			//		Data items to add.
			// filterStartIdx: Integer
			//		The start point to insert in the cache.
			if(!dojo.isArray(items)){
				items = [items];
			}
			for(var k = 0; k < items.length; ++k){
				this._items[filterStartIdx + k] = items[k];
			}
			this._cachedItemCount += items.length;
			//console.log("ADD CACHE: ",items.length,", cache:",this._cachedItemCount);
			return items.length;
		},
		_delCachedItems: function(/* Integer */filterStartIdx,/* Integer */count){
			// summary:
			//		Delete some data items from the cache.
			// tags:
			//		private
			// filterStartIdx: Integer
			//		The position in the cache to start deletion.
			// count: Integer
			//		The number of items to delete.
			for(var k = filterStartIdx, end = filterStartIdx + count; k < end && k < this._items.length; ++k){
				delete this._items[k];
			}
			this._cachedItemCount -= count;
			//console.log("DEL CACHE: ",count,", cache:",this._cachedItemCount);
			return count;
		},
		onRowMappingChange: function(mapping){
			//This function runs in FilterLayer scope!
			if(this._filter != null){
				console.log("filter onRowMapChange begin:",mapping);
				var m = dojo.clone(mapping),
					alreadyUpdated = {};
				for(var r in m){
					r = parseInt(r, 10);
					mapping[this._indexMap[r]] = this._indexMap[m[r]];
					if(!alreadyUpdated[this._indexMap[r]]){
						alreadyUpdated[this._indexMap[r]] = true;
					}
					if(!alreadyUpdated[r]){
						alreadyUpdated[r] = true;
						delete mapping[r];
					}
				}
				console.log("filter onRowMapChange end:",mapping);
			}
		}
	});
})();
