dojo.provide("dojox.grid.enhanced.plugins.filter.SortLayer");

dojo.require("dojox.grid.enhanced.plugins.StoreLayer");
 
dojo.declare("dojox.grid.enhanced.plugins.filter.SortLayer",
	dojox.grid.enhanced.plugins._StoreLayer,
{
	constructor: function(){
		this._sortInfo = [];
	},
	sortColumns: function(sortInfo){
		if(sortInfo === undefined){
			return this._sortInfo;
		}
		this._sortInfo = dojo.isArray(sortInfo) ? sortInfo : [];
	},
	_fetch: function(userRequest){
		//If user has provided some sort info, they'll have higher priorities.
		userRequest.sort = userRequest.sort || [];
		dojo.forEach(this._sortInfo, function(info){
			if(!dojo.some(userRequest.sort, function(userSortInfo){
				return userSortInfo.attribute == info.attribute;
			})){
				userRequest.sort.push(info);
			}
		});
		return dojo.hitch(this._store, this._originFetch)(userRequest);
	}
});
