define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"./getPlainValue",
	"./getPlainValueOptions",
	"./getStateful",
	"./getStatefulOptions",
	"./ModelRefController"
], function(declare, lang, getPlainValue, getPlainValueOptions, getStateful, getStatefulOptions, ModelRefController){
	function setRefSourceModel(/*Anything*/ value){
		// summary:
		//		A function called when this controller gets newer value as the data source.
		// value: Anything
		//		The data serving as the data source.

		this.set(this._refOriginalModelProp, this.holdModelUntilCommit ? value : this.cloneModel(value));
		this.set(this._refModelProp, this.holdModelUntilCommit ? this.cloneModel(value) : value);
		this._set(this._refSourceModelProp, value);
	}

	return declare("dojox.mvc.EditModelRefController", ModelRefController, {
		// summary:
		//		A controller, used as a mixin to dojox.mvc._Controller or dijit._WidgetBase descendants, that takes a data model as a data source.
		//		When this controller gets such data model, it creates a copy of that and works with it as the data model.
		//		This controller can reset the data model to the data source it originally got (reset()), or send the change back to the data source (commit()).
		//		NOTE - If this class is used with a widget by data-dojo-mixins, make sure putting the widget in data-dojo-type and putting this class to data-dojo-mixins.

		// holdModelUntilCommit: Boolean
		//		True not to send the change in model back to sourceModel until commit() is called.
		holdModelUntilCommit: false,

		// originalModel: dojo.Stateful
		//		The data model, that serves as the original data.
		originalModel: null,

		// originalModel: dojo.Stateful
		//		The data model, that serves as the data source.
		sourceModel: null,

		// _refOriginalModelProp: String
		//		The property name for the data model, that serves as the original data.
		_refOriginalModelProp: "originalModel",

		// _refSourceModelProp: String
		//		The property name for the data model, that serves as the data source.
		_refSourceModelProp: "sourceModel",

		postscript: function(/*Object?*/ params, /*DomNode|String?*/ srcNodeRef){
			// summary:
			//		Sets the setter for _refSourceModelProp.

			var setterName = "_set" + this._refSourceModelProp.replace(/^[a-z]/, function(c){ return c.toUpperCase(); }) + "Attr";
			this[setterName] = setRefSourceModel;
			this.inherited(arguments);
		},

		cloneModel: function(/*Anything*/ value){
			// summary:
			//		Create a clone object of the data source.
			//		Child classes of this controller can override it to achieve its specific needs.
			// value: Anything
			//		The data serving as the data source.

			var plain = lang.isFunction((value || {}).set) && lang.isFunction((value || {}).watch) ? getPlainValue(value, getPlainValueOptions) : value;
			return getStateful(plain, getStatefulOptions);
		},

		commit: function(){
			// summary:
			//		Send the change back to the data source.

			this.set(this.holdModelUntilCommit ? this._refSourceModelProp : this._refOriginalModelProp, this.get(this._refModelProp));
		},

		reset: function(){
			// summary:
			//		Change the model back to its original state.

			setRefSourceModel.call(this, this.get(this._refOriginalModelProp));
		}
	});
});
