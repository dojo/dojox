define([
	"dojo/_base/kernel",
	"dojo/_base/lang",
	"./sync",
	"./_atBindingExtension"
], function(kernel, lang, sync){
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
		//		The data binding direction, choose from: dojox.mvc.sync.from, dojox.mvc.sync.to or dojox.mvc.sync.both.
		direction: dojox.mvc.sync.both,

		// converter: dojox.mvc.sync.converter
		//		Class/object containing the converter functions used when the data goes between data binding target (e.g. data model or controller) to data binding origin (e.g. widget).
		converter: null,

		direct: function(direction){
			// summary:
			//		Sets data binding direction.
			// direction: Number
			//		The data binding direction, choose from: dojox.mvc.sync.from, dojox.mvc.sync.to or dojox.mvc.sync.both.
		},

		attach: function(converter){
			// summary:
			//		Attach a data converter.
			// converter: dojox.mvc.sync.converter
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
		//		Two seconds later, the text box changes from "Foo" to "Bar" as the "value" property in model changes.
		// |		<html>
		// |			<head>
		// |				<script src="/path/to/dojo-toolkit/dojo/dojo.js" type="text/javascript" data-dojo-config="parseOnLoad: 0"></script>
		// |				<script type="text/javascript">
		// |					require([
		// |						"dojo/parser", "dojo/Stateful", "dijit/form/TextBox", "dojox/mvc/at", "dojo/domReady!"
		// |					], function(parser, Stateful){
		// |						model = new Stateful({value: "Foo"});
		// |						setTimeout(function(){ model.set("value", "Bar"); }, 2000);
		// |						parser.parse();
		// |					});
		// |				</script>
		// |			</head>
		// |			<body>
		// |				<input type="text" data-dojo-type="dijit.form.TextBox" data-dojo-props="value: dojox.mvc.at(model, 'value')">
		// |			</body>
		// |		</html>

		return {
			atsignature: "dojox.mvc.at",
			target: target,
			targetProp: targetProp,
			direction: sync.both,
			direct: function(/*Number*/ direction){
				this.direction = direction;
				return this;
			},
			attach: function(/*dojox.mvc.sync.converter*/ converter){
				this.converter = converter;
				return this;
			}
		}; // dojox.mvc.at.handle
	};

	// Data binding directions
	at.from = sync.from;
	at.to = sync.to;
	at.both = sync.both;

	// lang.setObject() thing is for back-compat, remove it in 2.0
	return lang.setObject("dojox.mvc.at", at);
});
