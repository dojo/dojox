define([
	"dojo/_base/lang",
	"./resolve",
	"./Bind"
], function(lang, resolve, Bind){
	/*=====
	dojox.mvc.at.handle = {
		// summary:
		//		A handle of data binding target (a dojo.Stateful property), which is used for start synchronization with data binding source (another dojo.Stateful property).

		setParent: function(parent){
			// summary:
			//		Set parent binding.
			// parent: dojo.Stateful
			//		The parent binding to set.
		},

		direct: function(direction){
			// summary:
			//		Sets data binding direction.
			// direction: Number
			//		The data binding direction, choose from: dojox.mvc.Bind.from, dojox.mvc.Bind.to or dojox.mvc.Bind.both.
		},

		attach: function(converter){
			// summary:
			//		Attach a data converter.
			// converter: dojox.mvc.Bind.converter
			//		Class/object containing the converter functions used when the data goes between data binding target (e.g. data model or controller) to data binding origin (e.g. widget).
		},

		bind: function(source, sourceProp){
			// summary:
			//		Start data binding synchronization with specified data binding source, with the data binding target defined in this handle.
			// source: dojo.Stateful|String
			//		The dojo.Stateful of data binding source.
			// sourceProp: String
			//		The property name in dojo.Stateful of data binding source.
			// example:
			//		Start synchronizing dojo.Stateful property with another dojo.Stateful property:
			// |		dojox.mvc.at(stateful, "propertyname").bind(anotherstateful, "propertynameinanotherstateful") 
		}
	};
	=====*/

	function logBindingFailure(target, targetProp){
		console.warn(targetProp + " could not be resolved" + (typeof target == "string" ? (" with " + target) : "") + ".");
	}

	var at = /*===== dojox.mvc.at = =====*/ function(/*dojo.Stateful|String*/ target, /*String*/ targetProp){
		// summary:
		//		Returns a handle of data binding target (a dojo.Stateful property), which is used for start synchronization with data binding source (another dojo.Stateful property).
		// description:
		//		Typically used in ref property in data-dojo-props so that a widget can synchronize its attribute with another dojo.Stateful, like shown in the example.
		// target: dojo.Stateful|String
		//		dojo.Stateful to be synchronized.
		// targetProp: String
		//		The property name in target to be synchronized.
		// returns:
		//		A handle of data binding target (a dojo.Stateful property), which is used for start synchronization with data binding source (another dojo.Stateful property).
		// example:
		//		Synchronize attrbinwidget attribute in my.widget with propertyname in stateful.
		// |		<div data-dojo-type="my.widget" data-dojo-props="ref: {attribinwidget: dojox.mvc.at(stateful, 'propertyname')}"></div>

		var _parent = null, _direction = Bind.both, _converter = null;

		return {
			atsignature: "dojox.mvc.at",

			setParent: function(/*dojo.Stateful*/ parent){
				_parent = parent;
				return this; // dojox.mvc.at.handle
			},

			direct: function(/*Number*/ direction){
				_direction = direction;
				return this;
			},

			attach: function(/*dojox.mvc.Bind.converter*/ converter){
				_converter = converter;
				return this;
			},

			bind: function(/*dojo.Stateful|String*/ source, /*String*/ sourceProp){
				var resolvedTarget = resolve(target, _parent) || {};
				if(!resolvedTarget.set || !resolvedTarget.watch){
					logBindingFailure(target, targetProp);
				}

				var resolvedSource = resolve(source, _parent) || {};
				if(!resolvedSource.set || !resolvedTarget.watch){
					logBindingFailure(source, sourceProp);
				}

				if(!resolvedTarget.set || !resolvedTarget.watch || !resolvedSource.set || !resolvedTarget.watch){ return; }

				return Bind.bindTwo(resolvedTarget, targetProp, resolvedSource, sourceProp, {direction: _direction, converter: _converter}); // dojox.mvc.Bind.handle
			}
		}; // dojox.mvc.at.handle
	};

	return lang.setObject("dojox.mvc.at", at);
});
