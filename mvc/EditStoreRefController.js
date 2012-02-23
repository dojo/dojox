define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/Deferred",
	"./getPlainValue",
	"./EditModelRefController",
	"./StoreRefController"
], function(declare, lang, Deferred, getPlainValue, EditModelRefController, StoreRefController){
	return declare("dojox.mvc.EditStoreRefController", [StoreRefController, EditModelRefController], {
		// summary:
		//		A controller working with Dojo Object Store.
		//		It does not store/model in sync unless queryStore()/getStore()/commit() is called.
		//		NOTE - If this class is used with a widget by data-dojo-mixins, make sure putting the widget in data-dojo-type and putting this class to data-dojo-mixins.

		// getPlainValueOptions: dojox.mvc.getPlainValueOptions
		//		The options to get plain value from stateful object.
		getPlainValueOptions: null,

		// _removals: Object[]
		//		The list of removed elements.
		_removals: [],

		// _resultsWatchHandle: dojox.mvc.StatefulArray.watchElements.handle
		//		The watch handle for model array elements.
		_resultsWatchHandle: null,

		queryStore: function(/*Object*/ query, /*dojo.store.api.Store.QueryOptions?*/ options){
			// summary:
			//		Queries the store for objects.
			// query: Object
			//		The query to use for retrieving objects from the store.
			// options: dojo.store.api.Store.QueryOptions?
			//		The optional arguments to apply to the resultset.
			// returns: dojo.store.api.Store.QueryResults
			//		The results of the query, extended with iterative methods.

			if(!(this.store || {}).query){ return; }
			if(this._resultsWatchHandle){ this._resultsWatchHandle.unwatch(); }
			this._removals = [];
			var _self = this;
			return Deferred.when(this.inherited(arguments), function(results){
				if(lang.isArray(results)){
					_self._resultsWatchHandle = results.watchElements(function(idx, removals, adds){
						[].push.apply(_self._removals, removals);
					});
				}
				return results;
			});
		},

		getStore: function(/*Number*/ id, /*Object*/ options){
			// summary:
			//		Retrieves an object by its identity.
			// id: Number
			//		The identity to use to lookup the object.
			// options: Object
			//		The options for dojo.store.*.get().
			// returns: Object
			//		The object in the store that matches the given id.

			if(this._resultsWatchHandle){ this._resultsWatchHandle.unwatch(); }
			this.inherited(arguments);
		},

		commit: function(){
			// summary:
			//		Send the change back to the data source.

			if(this._removals){
				for(var i = 0; i < this._removals.length; i++){
					this.store.remove(this.store.getIdentity(this._removals[i]));
				}
				this._removals = [];
			}
			var data = getPlainValue(this.get(this._refModelProp), this.getPlainValueOptions);
			if(lang.isArray(data)){
				for(var i = 0; i < data.length; i++){
					this.store.put(data[i]);
				}
			}else{
				this.store.put(data);
			}
			this.inherited(arguments);
		},

		reset: function(){
			// summary:
			//		Change the model back to its original state.

			this.inherited(arguments);
			this._removals = [];
		},

		destroy: function(){
			// summary:
			//		Clean up model watch handle as this object is destroyed.

			if(this._resultsWatchHandle){ this._resultsWatchHandle.unwatch(); }
		}
	});
});
