define([
	"dojo/_base/declare",
	"dijit/form/_RadioButtonMixin",
	"./CheckBox"
], function(declare, RadioButtonMixin, CheckBox){
	/*=====
		CheckBox = dojox.mobile.CheckBox;
		RadioButtonMixin = dijit.form._RadioButtonMixin;
	=====*/
	return declare("dojox.mobile.RadioButton", [CheckBox, RadioButtonMixin], {
		// summary:
		//		A non-templated radiobutton widget that can be in two states (checked or not).

		baseClass: "mblRadioButton"
	});
});
