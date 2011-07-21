define([
	"./CheckBox",
	"dijit/form/_RadioButtonMixin"
], function(CheckBox, RadioButtonMixin) {
	/*=====
		CheckBox = dojox.mobile.CheckBox;
		RadioButtonMixin = dijit.form._RadioButtonMixin;
	=====*/
	return dojo.declare("dojox.mobile.RadioButton", [CheckBox, RadioButtonMixin], {
		// summary:
		//		A non-templated radiobutton widget that can be in two states (checked or not).

		baseClass: "mblRadioButton"
	});
});
