define([
	"dojo/_base/kernel",
	"dojo/_base/lang",
	"dojo/dom-style",
	"dojox/widget/Calendar",
	"dojox/widget/CalendarViews",
	"dijit/form/_DateTimeTextBox",
	"dijit/form/TextBox",
	"dojox/form/DayTextBox",
	"dojox/form/MonthTextBox",
	"dojox/form/YearTextBox",
	"dojo/_base/declare",
	], function(kernel, lang, domStyle, Calendar, CalendarViews, _DateTimeTextBox, 
		TextBox, DayTextBox, MonthTextBox, YearTextBox, declare){
	kernel.experimental("dojox/form/DateTextBox");
	return declare( "dojox.form.DateTextBox", _DateTimeTextBox,
		{
			// summary:
			//		A validating, serializable, range-bound date text box with a popup calendar

			// popupClass: String
			//  	The popup widget to use. In this case, a calendar with Day, Month and Year views.
			popupClass: "dojox/widget/Calendar",

			_selector: "date",

			openDropDown: function(){
				this.inherited(arguments);
				domStyle.set(this.dropDown.domNode.parentNode, "position", "absolute");
			}
		}
	);
});
