define("dojox/mobile/RadioButton", ["dojo", "dijit", "dojox/mobile/CheckBox", "dijit/form/_RadioButtonMixin"], function(dojo, dijit) {

dojo.declare("dojox.mobile.RadioButton", [dojox.mobile.CheckBox, dijit.form._RadioButtonMixin], {
	// summary:
	//		A non-templated radiobutton widget that can be in two states (checked or not).

	baseClass: "mblRadioButton"
});

return dojox.mobile.RadioButton;
});
