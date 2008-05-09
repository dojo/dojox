dojo.provide("dojox.form.DateTextBox");

dojo.require("dojox.widget.Calendar");
dojo.require("dijit.form._DateTimeTextBox");

dojo.declare(
	"dojox.form.DateTextBox",
	dijit.form._DateTimeTextBox,
	{
		// summary:
		//		A validating, serializable, range-bound date text box with a popup calendar

		// popupClass: String
		//  The popup widget to use. In this case, a calendar with Day, Month and Year views.
		popupClass: "dojox.widget.Calendar",
		_selector: "date",
		
		_open: function(){
			this.inherited(arguments);
			dojo.style(this._picker.domNode.parentNode, "position", "absolute");
		}
	}
);

dojo.declare(
	"dojox.form.MonthTextBox",
	dojox.form.DateTextBox, 
	{
		// summary:
		//		A validating, serializable, range-bound date text box with a popup calendar that contains just months.
		
		
		// popupClass: String
		//  The popup widget to use. In this case, a calendar with just a Month view.
		popupClass: "dojox.widget.MonthlyCalendar",
		
		_open: function(){
			this.inherited(arguments);
			
			this._picker.onValueSelected = dojo.hitch(this, function(value){
				this.focus(); // focus the textbox before the popup closes to avoid reopening the popup
				setTimeout(dojo.hitch(this, "_close"), 1); // allow focus time to take
				dijit.form.TextBox.prototype.setValue.call(this,value + 1, true, value + 1);
			});			
		}
	}
);

dojo.declare(
	"dojox.form.YearTextBox",
	dojox.form.DateTextBox, 
	{
		// summary:
		//		A validating, serializable, range-bound date text box with a popup calendar that contains only years
		
		// popupClass: String
		//  The popup widget to use. In this case, a calendar with just a Year view.
		popupClass: "dojox.widget.YearlyCalendar",
		
		_open: function(){
			this.inherited(arguments);
			
			this._picker.onValueSelected = dojo.hitch(this, function(value){
				this.focus(); // focus the textbox before the popup closes to avoid reopening the popup
				setTimeout(dojo.hitch(this, "_close"), 1); // allow focus time to take
				dijit.form.TextBox.prototype.setValue.call(this,value, true, value);
			});						
		}
	}
);
