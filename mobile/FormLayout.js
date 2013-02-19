define([
	"dojo/_base/declare",
	"dojo/dom-class",
	"./Container"
], function(declare, domClass, Container){

	// module:
	//		dojox/mobile/FormLayout

	return declare("dojox.mobile.FormLayout", Container, {
		// summary:
		//		A responsive container to create mobile forms.
		// description:
		//		This container layouts form widgets according to the screen size and the value of the rightAlign property.
		//		Each row of a form is made of a <label> and a <fieldset> that contains one or more form widgets.
		//		If the width of the screen if greater than 500px, the label and the fieldset are placed side by side.
		//		Otherwise they are stacked vertically.
		//		Form controls are: "dojox/mobile/Button", "dojox/mobile/CheckBox", "dojox/mobile/ComboBox",
		//		"dojox/mobile/RadioButton", "dojox/mobile/Slider", "dojox/mobile/TextBox", "dojox/mobile/SearchBox",
		//		"dojox/mobile/ExpandingTextArea", "dojox/mobile/ToggleButton".
		// example:
		// |	<div data-dojo-type="dojox/mobile/FormLayout">
		// |		<div>
		// |			<label>Name:</label>
		// |			<fieldset>
		// |				<input data-dojo-type="dojox/mobile/TextBox">
		// |			</fieldset>
		// |		</div>
		// |		<div>
		// |			<label>Make a choice:</label>
		// |			<fieldset>
		// |				<input type="radio" id="rb1" data-dojo-type="dojox/mobile/RadioButton" name="mobileRadio" checked><label for="rb1">Small</label>
		// |				<input type="radio" id="rb2" data-dojo-type="dojox/mobile/RadioButton" name="mobileRadio" checked><label for="rb2">Medium</label>
		// |				<input type="radio" id="rb3" data-dojo-type="dojox/mobile/RadioButton" name="mobileRadio" checked><label for="rb3">Large</label>
		// |			</fieldset>
		// |		</div>
		// |	</div>

		// rightAlign: Boolean
		//		If true and screen width larger than 500px, widgets are aligned on the right. Default is false.
		rightAlign: false,

		/* internal properties */

		// baseClass: String
		//		The name of the CSS class of this widget.
		baseClass: "mblFormLayout",

		buildRendering: function(){
			this.inherited(arguments);
			if(this.rightAlign){
				domClass.add(this.domNode, "mblFormLayoutRightAlign");
			}
		}
	});
});
