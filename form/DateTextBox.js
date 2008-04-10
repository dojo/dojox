dojo.provide("dojox.form.DateTextBox");

dojo.require("dojox.widget.Calendar");
dojo.require("dijit.form._DateTimeTextBox");

dojo.declare(
	"dojox.form.DateTextBox",
	dijit.form._DateTimeTextBox,
	{
		// summary:
		//		A validating, serializable, range-bound date text box with a popup calendar

		popupClass: "dojox.widget.Calendar",
		_selector: "date",
		useMonthOnly: false,
		useDayOnly: false,
		useYearOnly: false,
		
		_open: function(){
			this.inherited(arguments);
			dojo.style(this._picker.domNode.parentNode, "position", "absolute");
			
			var mode = this.useDayOnly ? "day" : (this.useMonthOnly ? "month" : (this.useYearOnly ? "year" : null));
			if(this.useMonthOnly || this.useYearOnly){
				this._picker.onValueSelected = dojo.hitch(this, function(value){
					this.focus(); // focus the textbox before the popup closes to avoid reopening the popup
					setTimeout(dojo.hitch(this, "_close"), 1); // allow focus time to take
					dijit.form.TextBox.prototype.setValue.call(this,value, true, value);
				});
			}
			if(mode){
				this._picker.setMode(mode);
			}
		}
	}
);
