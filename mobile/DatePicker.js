define([
	"dojo/_base/declare",
	"./_PickerChooser!DatePicker"
], function(declare, DatePicker){

	// module:
	//		dojox/mobile/DatePicker
	// summary:
	//		A wrapper widget around SpinWheelDatePicker or ValuePickerDatePicker.
	//		Returns a wrapper class derived from ValuePickerDatePicker when the current theme is "android".
	//		Returns a wrapper class derived from SpinWheelDatePicker otherwise.

	return declare("dojox.mobile.DatePicker", [DatePicker]);
});
