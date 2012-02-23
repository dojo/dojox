define([
	"dojo/_base/array",
	"dojo/_base/lang",
	"dojo/_base/declare",
	"./ModelRefController"
], function(array, lang, declare, ModelRefController){
	function unwatchHandles(/*dojox.mvc.ListController*/ c){
		// summary:
		//		Unwatch model watch handles.

		for(var s in {"_listModelWatchHandle": 1, "_tableModelWatchHandle": 1}){
			if(c[s]){
				c[s].unwatch();
				c[s] = null;
			}
		}
	}

	function setRefInModel(/*dojox.mvc.StatefulArray*/ value){
		// summary:
		//		A function called when this controller gets newer value as the list data.
		// value: Anything
		//		The data serving as the list data.

		unwatchHandles(this);
		var _self = this;
		if(value){
			if(value.watchElements){
				this._listModelWatchHandle = value.watchElements(function(idx, removals, adds){
					if(removals && adds){
						var curIdx = _self.get("cursorIndex");
						// If selected element is removed, make "no selection" state
						if(removals && curIdx >= idx && curIdx < idx + removals.length){
							_self.set("cursorIndex", -1);
							return;
						}
						// If selected element is equal to or larger than the removals/adds point, update the selected index
						if((removals.length || adds.length) && curIdx >= idx){
							_self.set("cursor", _self.get("cursor"));
						}
					}else{
						// If there is a update to the whole array, update the selected index 
						_self.set("cursor", _self.get("cursor"));
					}
				});
			}else{
				if(_self.get("cursorIndex") < 0){ _self._set("cursorIndex", ""); }
				this._tableModelWatchHandle = value.watch(function(name, old, current){
					if(old !== current && name == _self.get("cursorIndex")){
						_self.set("cursor", current);
					}
				});
			}
		}
		this._set(this._refInModelProp, value);
		this._setCursorIndexAttr(this.cursorIndex);
	}

	return declare("dojox.mvc.ListController", ModelRefController, {
		// summary:
		//		A controller working with array model, managing its cursor.
		//		NOTE - If this class is used with a widget by data-dojo-mixins, make sure putting the widget in data-dojo-type and putting this class to data-dojo-mixins.

		// idProperty: String
		//		The property name in element in the model array, that works as its identifier.
		idProperty: "uniqueId",

		// cursorId: String
		//		The ID of the selected element in the model array.
		cursorId: null,

		// cursorIndex: Number|String
		//		The index of the selected element in the model.
		cursorIndex: -1,

		// cursor: dojo.Stateful
		//		The selected element in the model array.
		cursor: null,

		// model: dojox.mvc.StatefulArray
		//		The data model working as an array.
		model: null,

		// _listModelWatchHandle: Object
		//		The watch handle of model, watching for array elements.
		_listModelWatchHandle: null,

		// _tableModelWatchHandle: Object
		//		The watch handle of model.
		_tableModelWatchHandle: null,

		// _refModelProp: String
		//		The property name for the data model.
		_refModelProp: "cursor",

		postscript: function(/*Object?*/ params, /*DomNode|String?*/ srcNodeRef){
			// summary:
			//		Sets the setter for _refInModelProp.

			var setterName = "_set" + this._refInModelProp.replace(/^[a-z]/, function(c){ return c.toUpperCase(); }) + "Attr";
			this[setterName] = setRefInModel;
			this.inherited(arguments);
		},

		destroy: function(){
			unwatchHandles(this);
			this.inherited(arguments);
		},

		_setCursorIdAttr: function(/*String*/ value){
			// summary:
			//		Handler for calls to set("cursorId", val).
			// description:
			//		Finds the index associated with the given cursor ID, and updates cursorIndex property.

			var model = this[this._refInModelProp];
			if(!model){ return; }
			if(lang.isArray(model)){
				for(var i = 0; i < model.length; i++){
					if(model[i][this.idProperty] == value){
						this.set("cursorIndex", i);
						return;
					}
				}
				this._set("cursorIndex", -1);
			}else{
				for(var s in model){
					if(model[s][this.idProperty] == value){
						this.set("cursorIndex", s);
						return;
					}
				}
				this._set("cursorIndex", "");
			}
		},

		_setCursorIndexAttr: function(/*Number*/ value){
			// summary:
			//		Handler for calls to set("cursorIndex", val).
			// description:
			//		Updates cursor, cursorId, cursorIndex properties internally and call watch callbacks for them.

			this._set("cursorIndex", value);
			if(!this[this._refInModelProp]){ return; }
			this._set("cursor", this[this._refInModelProp][value]);
			this._set("cursorId", this[this._refInModelProp][value] && this[this._refInModelProp][value][this.idProperty]);
		},

		_setCursorAttr: function(/*dojo.Stateful*/ value){
			// summary:
			//		Handler for calls to set("cursor", val).
			// description:
			//		Finds the index associated with the given element, and updates cursorIndex property.

			var model = this[this._refInModelProp];
			if(!model){ return; }
			if(lang.isArray(model)){
				var foundIdx = array.indexOf(model, value);
				if(foundIdx < 0){
					var targetIdx = this.get("cursorIndex");
					if(targetIdx >= 0 && targetIdx < model.length){
						model.set(targetIdx, value);
					}
				}else{
					this.set("cursorIndex", foundIdx);
				}
			}else{
				for(var s in model){
					if(model[s] == value){
						this.set("cursorIndex", s);
						return;
					}
				}
				var targetIdx = this.get("cursorIndex");
				if(targetIdx){
					model.set(targetIdx, value);
				}
			}

		}
	});
});
