define([
	"dojo/_base/declare",
	"dojo/_base/lang"
], function(declare, lang){

	// module:
	//		dojox/mobile/DatePicker
	// summary:
	//		

	var dm = lang.getObject("dojox.mobile", true);
	var pickerClass = dm.currentTheme === "android" ?
		"dojox/mobile/ValuePickerDatePicker" : "dojox/mobile/SpinWheelDatePicker";

	var cls = declare("dojox.mobile.DatePicker", null, {});

	require([pickerClass], lang.hitch(this, function(module){
		cls.prototype = module.prototype;
	}));

	return cls;
});
