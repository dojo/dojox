define([
	"dojo/_base/lang",
	"./_PickerChooser!DatePicker"
], function(lang, DatePicker){

	// module:
	//		dojox/mobile/DatePicker

	/*=====
    return function(){
		// summary:
		//		A wrapper widget around SpinWheelDatePicker or ValuePickerDatePicker.
		//		Returns ValuePickerDatePicker when the current theme is "android".
		//		Returns SpinWheelDatePicker otherwise.

		// TODO: need to list all the properties/methods in the interface provided by
		// SpinWheelDatePicker / ValuePickerDatePicker
	 };
    =====*/

	return lang.setObject("dojox.mobile.DatePicker", DatePicker);
});
