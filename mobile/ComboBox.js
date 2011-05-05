define(["./TextBox", "./_ComboBoxMenu", "dijit/form/_AutoCompleterMixin", "./common"], function(TextBox, ComboBoxMenu, AutoCompleterMixin) {
	dojo.experimental("dojox.mobile.ComboBox"); // should be using a more native search-type UI

	return dojo.declare("dojox.mobile.ComboBox", [TextBox, AutoCompleterMixin], {
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
		_focusManager: null,

		_onFocus: function(){
			this.inherited(arguments);
			if(!this._opened){
				this._startSearchAll(); // show dropdown if user is selecting Next/Previous from virtual keyboard
			}
		},

		closeDropDown: function(){
			var wasOpened = this._opened;
			var ret = this.inherited(arguments);
			if(wasOpened && !this._opened){
				if(this.startHandler){
					this.disconnect(this.startHandler);
					this.startHandler = null;
					if(this.moveHandler){ this.disconnect(this.moveHandler); }
					if(this.endHandler){ this.disconnect(this.endHandler); }
				}
				if(this.clickHandler){
					this.disconnect(this.mouseHandler);
				}
			}
			return ret;
		},

		openDropDown: function(){
			var wasClosed = !this._opened;
			var ret = this.inherited(arguments);
			if(wasClosed && this._opened){
				if(ret.aroundCorner.charAt(0) == 'B'){ // is popup below?
					this.domNode.scrollIntoView(true); // scroll to top
				}
				this.clickHandler = this.connect(dojo.doc.documentElement, "onclick",
					function(){ this.closeDropDown(); });
				// monitor blurring touches (ie. touchstart and touchend w/o intervening touchmove)
				// can't reliably only use onclick since they don't get reported always
				this.startHandler = this.connect(dojo.doc.documentElement, "ontouchstart",
					dojo.hitch(this, function(){
						var isMove = false;
						this.moveHandler = this.connect(dojo.doc.documentElement, "ontouchmove", function(){ isMove = true; });
						this.endHandler = this.connect(dojo.doc.documentElement, "ontouchend", function(){ if(!isMove){ this.closeDropDown(); } });
					})
				);
			}
			return ret;
		}
	});
});
