define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/Stateful"
], function(array, declare, lang, Stateful){
	return declare("dojox.mvc.ModelRefControllerMixin", null, {
		// summary:
		//		A controller, used as a mixin to dojox.mvc._Controller or dijit._WidgetBase descendants, working with a data model as a reference.
		//		Manages change in model as well as change in model properties.
		//		NOTE - If this class is used with a widget by data-dojo-mixins, make sure putting the widget in data-dojo-type and putting this class to data-dojo-mixins.

		// ownProps: Object
		//		List of property names owned by this controller, instead of the data model.
		ownProps: null,

		// _refModelProp: String
		//		The property name for the data model.
		_refModelProp: "model",

		// _refInModelProp: String
		//		The property name for the data model, used as the input.
		//		Used when this controller needs data model (as input) that is different from the data model this controller provides.
		_refInModelProp: "model",

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
				return model && (model.get ? model.get(name) : model[name]);
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
				model && (model.set ? model.set(name, value) : (model[name] = value));
				return this;
			}
			return this.inherited(arguments);
		},

		watch: function(/*String?*/ name, /*Function*/ callback){
			// summary:
			//		Watch a property in the data model or in this object.
			// name: String?
			//		The property name.
			// callback: Function
			//		The callback function.

			if(this.hasControllerProperty(name)){
				return this.inherited(arguments);
			}

			if(!callback){
				callback = name;
				name = null;
			}

			var hm = null, hp = null;

			function watchPropertiesInModel(/*dojo.Stateful*/ model){
				// summary:
				//		Watch properties in referred model.
				// model: dojo.Stateful
				//		The model to watch for.

				// Unwatch properties of older model.
				if(hp){ hp.unwatch(); }
				// Watch properties of newer model.
				if(model && lang.isFunction(model.set) && lang.isFunction(model.watch)){
					hp = model.watch.apply(model, (name ? [name] : []).concat([function(name, old, current){ callback(name, old, current); }]));
				}
			}

			function reflectChangeInModel(/*dojo.Stateful*/ old, /*dojo.Stateful*/ current){
				// summary:
				//		Upon change in model, detect change in properties, and call watch callbacks.
				// old: dojo.Stateful
				//		The older model.
				// current: dojo.Stateful
				//		The newer model.

				// Gather list of properties to notify change in value as model changes.
				var props = {};
				if(!name){
					// If all properties are being watched, find out all properties from older model as well as from newer model.
					array.forEach([old, current], function(model){
						var props = model && model.get("properties");
						if(props){
							// If the model explicitly specifies the list of properties, use it.
							array.forEach(props, function(item){
								if(this.hasControllerProperty(item)){ props[item] = 1; }
							});
						}else{
							// Otherwise, iterate through own properties.
							for(var s in model){
								if(model.hasOwnProperty(s) && this.hasControllerProperty(s)){ props[s] = 1; }
							}
						}
					});
				}else{
					props[name] = 1;
				}

				// Call watch callbacks for properties.
				for(var s in props){
					callback(s, old && (old.get ? old.get(s) : old[s]), current && (current.get ? current.get(s) : current[s]));
				}
			}

			// Watch for change in model.
			hm = Stateful.prototype.watch.call(this, this._refModelProp, function(name, old, current){
				if(old === current){ return; }
				reflectChangeInModel(old, current);
				watchPropertiesInModel(current);
			});

			// Watch for properties in model.
			watchPropertiesInModel(this.get(this._refModelProp));

			return {
				unwatch: function(){
					if(hp){ hp.unwatch(); } if(hm){ hm.unwatch(); }
				}
			};
		},

		hasControllerProperty: function(/*String*/ name){
			// summary:
			//		Returns true if this controller itself owns the given property.
			// name: String
			//		The property name.

			return name == this._refModelProp || (name in (this.ownProps || {})) || (name in this.constructor.prototype);
		}
	});
});
