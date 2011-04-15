define("dojox/mobile/ToggleButton", ["dojo", "dijit", "dojox", "dojox/mobile/Button", "dijit/form/_ToggleButtonMixin"], function(dojo, dijit, dojox) {

dojo.declare("dojox.mobile.ToggleButton", [dojox.mobile.Button, dijit.form._ToggleButtonMixin], {
	// summary:
	//		A non-templated button widget that can be in two states (checked or not).
	//		Can be base class for things like tabs or checkbox or radio buttons

	baseClass: "mblToggleButton",

	_setCheckedAttr: function(){
		this.inherited(arguments);
		var button = this.focusNode || this.domNode;
		var newStateClasses = (this.baseClass+' '+this["class"]).split(" ");
		newStateClasses = dojo.map(newStateClasses, function(c){ return c+"Checked"; });
		if(this.checked){
			dojo.addClass(button, newStateClasses);
		}else{
			dojo.removeClass(button, newStateClasses);
		}
	}

});

return dojox.mobile.ToggleButton;
});
