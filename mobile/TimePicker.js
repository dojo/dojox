define([
	"dojo/_base/declare",
	"dojo/_base/lang"
], function(declare, lang){

	// module:
	//		dojox/mobile/TimePicker
	// summary:
	//		

	var dm = lang.getObject("dojox.mobile", true);
	var pickerClass = dm.currentTheme === "android" ?
		"dojox/mobile/ValuePickerTimePicker" : "dojox/mobile/SpinWheelTimePicker";

	var cls = declare("dojox.mobile.TimePicker", null, {});

	require([pickerClass], lang.hitch(this, function(module){
		cls.prototype = module.prototype;
	}));

	return cls;
});
