define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"./Stateful",
	"./_atBindingMixin"
], function(declare, lang, Stateful, _atBindingMixin){
	return declare("dojox.mvc._Controller", [Stateful, _atBindingMixin], {
		postscript: function(/*Object?*/ params, /*DomNode|String?*/ srcNodeRef){
			// summary:
			//		If this object is not called from Dojo parser, starts this up right away.
			//		Also, if widget registry is available, register this object.

			// If there is dijit._WidgetBase in upper class hierarchy (happens when this descendant is mixed into a widget), let _WidgetBase do all work
			if(this._applyAttributes){
				return this.inherited(arguments);
			}
			this._dbpostscript(params, srcNodeRef);
			if(params){
				this.params = params;
				for(var s in params){
					this.set(s, params[s]);
				}
			}
			var registry;
			try{
				// Usage of dijit/registry module is optional. Do not use it if it's not already loaded.
				registry = require("dijit/registry");
				this.id = this.id || (srcNodeRef || {}).id || registry.getUniqueId(this.declaredClass.replace(/\./g, "_"));
				registry.add(this);
			}catch(e){}
			if(!srcNodeRef){
				this.startup();
			}
		},

		startup: function(){
			// summary:
			//		Starts up data binding as this object starts up.

			// If there is dijit._WidgetBase in upper class hierarchy (happens when this descendant is mixed into a widget), let _WidgetBase do all work
			if(!this._applyAttributes){
				this._startAtWatchHandles();
			}
			this.inherited(arguments);
		},

		destroy: function(){
			// summary:
			//		Stops data binding as this object is destroyed.

			// If there is dijit._WidgetBase in upper class hierarchy (happens when this descendant is mixed into a widget), let _WidgetBase do all work
			if(!this._applyAttributes){
				this._stopAtWatchHandles();
			}
			this.inherited(arguments);
		},

		set: function(/*String*/ name, /*Anything*/ value){
			// summary:
			//		If the value given is dojox.mvc.at handle, use it for data binding.
			//		Otherwise, if setter function is there, use it.
			//		Otherwise, set the value to the data model or to this object.
			// name: String
			//		The property name.
			// value: Anything
			//		The property value.

			// If there is dijit._WidgetBase in upper class hierarchy (happens when this descendant is mixed into a widget), let _WidgetBase do all work
			if(!this._applyAttributes && (value || {}).atsignature == "dojox.mvc.at"){
				return this._setAtWatchHandle(name, value);
			}
			return this.inherited(arguments);
		}
	});
});
