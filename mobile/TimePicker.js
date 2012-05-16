define([
	"dojo/_base/declare",
	"./_PickerChooser!TimePicker"
], function(declare, TimePicker){

	// module:
	//		dojox/mobile/TimePicker
	// summary:
	//		A wrapper widget around SpinWheelTimePicker or ValuePickerTimePicker.
	//		Returns a wrapper class derived from ValuePickerTimePicker when the current theme is "android".
	//		Returns a wrapper class derived from SpinWheelTimePicker otherwise.

	return declare("dojox.mobile.TimePicker", [TimePicker]);
});
