define([
	"dojo/_base/kernel",
	"dojo/_base/lang",
	"./BindTwo",
	"./_atBindingExtension"
], function(kernel, lang, BindTwo){
	/*=====
	dojox.mvc.at.handle = {
		// summary:
		//		A handle of data binding target (a dojo.Stateful property), which is used for start synchronization with data binding source (another dojo.Stateful property).

		// target: dojo.Stateful|String
		//		The data binding literal or dojo.Stateful to be synchronized.
		target: new dojo.Stateful(),

		// targetProp: String
		//		The property name in target to be synchronized.
		targetProp: "",

		// direction: Number
		//		The data binding direction, choose from: dojox.mvc.BindTwo.from, dojox.mvc.BindTwo.to or dojox.mvc.BindTwo.both.
		direction: dojox.mvc.BindTwo.both,

		// converter: dojox.mvc.BindTwo.converter
		//		Class/object containing the converter functions used when the data goes between data binding target (e.g. data model or controller) to data binding origin (e.g. widget).
		converter: null,

		direct: function(direction){
			// summary:
			//		Sets data binding direction.
			// direction: Number
			//		The data binding direction, choose from: dojox.mvc.BindTwo.from, dojox.mvc.BindTwo.to or dojox.mvc.BindTwo.both.
		},

		attach: function(converter){
			// summary:
			//		Attach a data converter.
			// converter: dojox.mvc.BindTwo.converter
			//		Class/object containing the converter functions used when the data goes between data binding target (e.g. data model or controller) to data binding origin (e.g. widget).
		}
	};
	=====*/
	kernel.experimental("dojox.mvc");

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
		// |		<div data-dojo-type="my.widget" data-dojo-props="attribinwidget: dojox.mvc.at(stateful, 'propertyname')"></div>

		return {
			atsignature: "dojox.mvc.at",
			target: target,
			targetProp: targetProp,
			direction: BindTwo.both,
			direct: function(/*Number*/ direction){
				this.direction = direction;
				return this;
			},
			attach: function(/*dojox.mvc.BindTwo.converter*/ converter){
				this.converter = converter;
				return this;
			}
		}; // dojox.mvc.at.handle
	};

	return lang.setObject("dojox.mvc.at", at);
});
