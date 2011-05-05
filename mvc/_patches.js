define(["dijit/form/ValidationTextBox", "dijit/form/NumberTextBox"], function(vtb, ntb){

	dojo.getObject("mvc", true, dojox);

	(function(){
		// monkey patch dijit.form.ValidationTextBox.isValid to check this.inherited for isValid
		var oldValidationTextBoxIsValid = dijit.form.ValidationTextBox.prototype.isValid;
		dijit.form.ValidationTextBox.prototype.isValid = function(/*Boolean*/ isFocused){
			return (this.inherited("isValid", arguments) !== false && oldValidationTextBoxIsValid.apply(this, [isFocused]));
		};
	
		// monkey patch dijit.form.NumberTextBox.isValid to check this.inherited for isValid
		var oldNumberTextBoxIsValid = dijit.form.NumberTextBox.prototype.isValid;
		dijit.form.NumberTextBox.prototype.isValid = function(/*Boolean*/ isFocused){
			return (this.inherited("isValid", arguments) !== false && oldNumberTextBoxIsValid.apply(this, [isFocused]));
		};
	})();

	return dojox.mvc._patches;
});
