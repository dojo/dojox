define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"./ModelRefController"
], function(darray, declare, ModelRefController){
	return declare("dojox.mvc.ListController", ModelRefController, {
		// summary:
		//		A controller, used as a mixin to dojox.mvc._Controller or dijit._WidgetBase descendants, working with array model, managing its cursor.

		// idProperty: String
		//		The property name in element in the model array, that works as its identifier.
		idProperty: "uniqueId",

		// cursorId: String
		//		The ID of the selected element in the model array.
		cursorId: null,

		// cursorIndex: Number
		//		The index of the selected element in the model array.
		cursorIndex: -1,

		// cursor: dojo.Stateful
		//		The selected element in the model array.
		cursor: null,

		// model: dojox.mvc.StatefulArray
		//		The data model working as an array.
		model: null,

		// _modelWatchHandle: Object
		//		The watch handle of model.
		_modelWatchHandle: null,

		// _refModelProp: String
		//		The property name for the data model.
		_refModelProp: "cursor",

		destroy: function(){
			if(this._modelWatchHandle){
				this._modelWatchHandle.unwatch();
				this._modelWatchHandle = null;
			}
			this.inherited(arguments);
		},

		_setCursorIdAttr: function(/*String*/ value){
			// summary:
			//		Handler for calls to set("cursorId", val).
			// description:
			//		Finds the index associated with the given cursor ID, and updates cursorIndex property.

			if(!this.model){ return; }
			for(var i = 0; i < this.model.length; i++){
				if(this.model[i][this.idProperty] == value){
					this.set("cursorIndex", i);
					return;
				}
			}
			this._set("cursorIndex", -1);
		},

		_setCursorIndexAttr: function(/*Number*/ value){
			// summary:
			//		Handler for calls to set("cursorIndex", val).
			// description:
			//		Updates cursor, cursorId, cursorIndex properties internally and call watch callbacks for them.

			if(!this.model){ return; }
			this._set("cursor", this.model[value]);
			this._set("cursorId", this.model[value] && this.model[value][this.idProperty]);
			this._set("cursorIndex", value);
		},

		_setCursorAttr: function(/*dojo.Stateful*/ value){
			// summary:
			//		Handler for calls to set("cursor", val).
			// description:
			//		Finds the index associated with the given element, and updates cursorIndex property.

			var foundIdx = darray.indexOf(this.model, value);
			if(foundIdx < 0){
				var targetIdx = this.get("cursorIndex");
				if(targetIdx >= 0){
					this.model.set(targetIdx, value);
				}
			}else{
				this.set("cursorIndex", foundIdx);
			}
		},

		_setModelAttr: function(/*dojox.mvc.StatefulArray*/ value){
			// summary:
			//		Handler for calls to set("model", val).
			// description:
			//		Updates cursor upon the new model. Also watch for change in model so that cursor is maintained upon removals/adds.

			if(this._modelWatchHandle){
				this._modelWatchHandle.unwatch();
				this._modelWatchHandle = null;
			}
			var _self = this;
			this._modelWatchHandle = value.watchElements(function(idx, removals, adds){
				if(removals && adds){
					var curIdx = _self.get("cursorIndex");
					// If selected element is removed, make "no selection" state
					if(removals && curIdx >= idx && curIdx < idx + removals.length){
						this.set("cursorIndex", -1);
						return;
					}
					// If selected element is equal to or larger than the removals/adds point, update the selected index
					if((removals.length || adds.length) && curIdx >= idx){
						this.set("cursor", this.get("cursor"));
					}
				}else{
					// If there is a update to the whole array, update the selected index 
					this.set("cursor", this.get("cursor"));
				}
			});
			this._setCursorIndexAttr(this.cursorIndex);
			this._set("model", value);
		}
	});
});
