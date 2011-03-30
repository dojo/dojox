define("dojox/mobile/ComboBox", ["dojo", "dijit", "dojox.mobile.TextBox", "dojox/mobile/_ComboBoxMenu", "dijit/form/_AutoCompleterMixin"], function(dojo, dijit) {

dojo.declare(
	"dojox.mobile.ComboBox",
	[dojox.mobile.TextBox, dijit.form._AutoCompleterMixin],
	{
		// summary:
		//		A non-templated auto-completing text box widget
		//

		// dropDownClass: [protected extension] String
		//		Name of the dropdown widget class used to select a date/time.
		//		Subclasses should specify this.
		dropDownClass: "dojox.mobile._ComboBoxMenu",

		// initially disable selection since iphone displays selection handles that makes it hard to pick from the list
		selectOnClick: false,
		autoComplete: false,

		_onFocus: function(){
			this.inherited(arguments);
			if(!this._opened){
				this._startSearchAll(); // show dropdown if user is selecting Next/Previous from virtual keyboard
			}
		},

		openDropDown: function(){
			var ret = null;
			if(!this._opened){
				ret = this.inherited(arguments);
				if(ret.aroundCorner.charAt(0) == 'B'){ // is popup below?
					this.domNode.scrollIntoView(true); // scroll to top
				}
			}
			return ret;
		}
	}
);

return dojox.mobile.ComboBox;
});
