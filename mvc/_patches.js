define([
	"dojo/_base/lang",
	"dojo/_base/array",
	"dijit/_WidgetBase",
	"./_DataBindingMixin",
	"dijit/form/ValidationTextBox",
	"dijit/form/NumberTextBox"
], function(lang, array, wb, dbm, vtb, ntb){
	/*=====
		vtb = dijit.form.ValidationTextBox;
		ntb = dijit.form.NumberTextBox;
		dbm = dojox.mvc._DataBindingMixin;
		wb = dijit._WidgetBase;
	=====*/

	//Apply the data binding mixin to all dijits, see mixin class description for details
	lang.extend(wb, new dbm());

	// monkey patch dijit._WidgetBase.startup to get data binds set up
	var oldWidgetBaseStartup = wb.prototype.startup;
	wb.prototype.startup = function(){
		this._dbstartup();
		oldWidgetBaseStartup.apply(this);
	};

	var oldWidgetBasePostScript = wb.prototype.postscript;
	wb.prototype.postscript = function(/*Object?*/ params, /*DomNode|String*/ srcNodeRef){
		this._dbpostscript(params, srcNodeRef);
		oldWidgetBasePostScript.apply(this, lang._toArray(arguments));
	};

	var oldWidgetBaseSet = wb.prototype.set;
	wb.prototype.set = function(/*String*/ name, /*Anything*/ value){
		if((value || {}).atsignature == "dojox.mvc.at"){
			return this._setAtWatchHandle(name, value);
		}
		return oldWidgetBaseSet.apply(this, lang._toArray(arguments));
	};

	// monkey patch dijit._WidgetBase.destroy to remove watches setup in _DataBindingMixin
	var oldWidgetBaseDestroy = wb.prototype.destroy;
	wb.prototype.destroy = function(/*Boolean*/ preserveDom){
		if(this._modelWatchHandles){
			array.forEach(this._modelWatchHandles, function(h){ h.unwatch(); });
		}
		if(this._viewWatchHandles){
			array.forEach(this._viewWatchHandles, function(h){ h.unwatch(); });
		}
		for(var s in this._atWatchHandles){
			this._atWatchHandles[s].unwatch();
			delete this._atWatchHandles[s];
		}
		oldWidgetBaseDestroy.apply(this, [preserveDom]);
	};

	// monkey patch dijit.form.ValidationTextBox.isValid to check this.inherited for isValid
	var oldValidationTextBoxIsValid = vtb.prototype.isValid;
	vtb.prototype.isValid = function(/*Boolean*/ isFocused){
		return (this.inherited("isValid", arguments) !== false && oldValidationTextBoxIsValid.apply(this, [isFocused]));
	};

	// monkey patch dijit.form.NumberTextBox.isValid to check this.inherited for isValid
	var oldNumberTextBoxIsValid = ntb.prototype.isValid;
	ntb.prototype.isValid = function(/*Boolean*/ isFocused){
		return (this.inherited("isValid", arguments) !== false && oldNumberTextBoxIsValid.apply(this, [isFocused]));
	};
});
