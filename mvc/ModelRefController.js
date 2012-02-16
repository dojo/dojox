define([
	"dojo/_base/declare",
	"dojo/_base/lang"
], function(declare, lang){
	return declare("dojox.mvc.ModelRefController", null, {
		// summary:
		//		A controller, used as a mixin to dojox.mvc._Controller or dijit._WidgetBase descendants, working with a data model as a reference.
		//		Manages change in model as well as change in model properties.

		// ownProps: Object
		//		List of property names owned by this controller, instead of the data model.
		ownProps: null,

		// _refModelProp: String
		//		The property name for the data model.
		_refModelProp: "model",

		// model: dojo.Stateful
		//		The data model.
		model: null,

		postscript: function(/*Object?*/ params, /*DomNode|String?*/ srcNodeRef){
			// summary:
			//		Sets _relTargetProp so that the property specified by _refModelProp is used for relative data binding.

			this._relTargetProp = (params || {})._refModelProp || this._refModelProp;
			this.inherited(arguments);
		},

		get: function(/*String*/ name){
			// summary:
			//		If getter function is there, use it. Otherwise, get the data from data model of this object.
			// name: String
			//		The property name.

			var getterName = "_get" + name.replace(/^[a-z]/, function(c){ return c.toUpperCase(); }) + "Attr";
			if(!this[getterName] && name != this._refModelProp && !(name in (this.ownProps || {})) && !(name in this.constructor.prototype)){
				var model = this[this._refModelProp];
				return model && model.get(name);
			}
			return this.inherited(arguments);
		},

		_set: function(/*String*/ name, /*Anything*/ value){
			// summary:
			//		Set the value to the data model or to this object.
			// name: String
			//		The property name.
			// value: Anything
			//		The property value.

			if(name != this._refModelProp && !(name in (this.ownProps || {})) && !(name in this.constructor.prototype)){
				var model = this[this._refModelProp];
				model && model.set(name, value);
				return this;
			}
			return this.inherited(arguments);
		},

		watch: function(/*String?*/ name, /*Function*/ callback){
			// summary:
			//		Watch a propertyin  the data model or in this object.
			// name: String?
			//		The property name.
			// callback: Function
			//		The callback function.

			if(name == this._refModelProp || (name in (this.ownProps || {})) || (name in this.constructor.prototype)){
				return this.inherited(arguments);
			}

			if(!callback){
				callback = name;
				name = null;
			}

			var hm = null, hp = null;

			function watchModel(model){
				if(hp){ hp.unwatch(); }
				var args = (name ? [name] : []).concat([function(name, old, current){ callback(name, old, current); }]);
				hp = model && lang.isFunction(model.set) && lang.isFunction(model.watch) && model.watch.apply(model, args);
			}

			hm = this.inherited("watch", [this._refModelProp, function(name, old, current){ if(old !== current){ watchModel(current); } }]);
			watchModel(this[this._refModelProp]);

			return {
				unwatch: function(){
					if(hp){ hp.unwatch(); } if(hm){ hm.unwatch(); }
				}
			};
		}
	});
});
