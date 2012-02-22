define([
	"dojo/_base/declare",
	"dojo/_base/Deferred",
	"./getStateful",
	"./ModelRefControllerMixin"
], function(declare, Deferred, getStateful, ModelRefControllerMixin){
	return declare("dojox.mvc.StoreRefControllerMixin", ModelRefControllerMixin, {
		// summary:
		//		A controller, used as a mixin to dojox.mvc._Controller or dijit._WidgetBase descendants, working with Dojo Object Store.
		//		It does not store/model in sync unless queryStore()/getStore() is called.
		//		NOTE - If this class is used with a widget by data-dojo-mixins, make sure putting the widget in data-dojo-type and putting this class to data-dojo-mixins.

		// store: dojo.store.*
		//		The Dojo Object Store in use.
		store: null,

		// getStatefulOptions: dojox.mvc.getStatefulOptions
		//		The options to get stateful object from plain value.
		getStatefulOptions: null,

		// _refSourceModelProp: String
		//		The property name for the data model, that serves as the data source.
		_refSourceModelProp: "sourceModel",

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
			if(this._queryObserveHandle){ this._queryObserveHandle.cancel(); }

			var _self = this;
			return Deferred.when(this.store.query(query, options), function(results){
				results = getStateful(results, _self.getStatefulOptions);
				_self.set(_self._refSourceModelProp, results);
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

			if(!(this.store || {}).get){ return; }
			if(this._queryObserveHandle){ this._queryObserveHandle.cancel(); }
			var _self = this;
			return Deferred.when(this.store.get(id, options), function(result){
				_self.set(_self._refSourceModelProp, result);
			});
		},

		putStore: function(/*Object*/ object, /*dojo.store.api.Store.PutDirectives?*/ options){
			// summary:
			//		Stores an object.
			// object: Object
			//		The object to store.
			// options: dojo.store.api.Store.PutDirectives?
			//		Additional metadata for storing the data.  Includes an "id" property if a specific id is to be used.
			// returns: Number

			if(!(this.store || {}).put){ return; }
			return this.store.put(object, options);
		},

		addStore: function(object, options){
			// summary:
			//		Creates an object, throws an error if the object already exists.
			// object: Object
			//		The object to store.
			// options: dojo.store.api.Store.PutDirectives?
			//		Additional metadata for storing the data.  Includes an "id" property if a specific id is to be used.
			// returns: Number

			if(!(this.store || {}).add){ return; }
			return this.store.add(object, options);
		},

		removeStore: function(/*Number*/ id, /*Object*/ options){
			// summary:
			//		Deletes an object by its identity
			// id: Number
			//		The identity to use to delete the object
			// options: Object
			//		The options for dojo.store.*.remove().
			// returns: Boolean
			// 		Returns true if an object was removed, falsy (undefined) if no object matched the id.

			if(!(this.store || {}).remove){ return; }
			return this.store.remove(id, options);
		}
	});
});
