define(["dojo/_base/kernel", "dijit/_HasDropDown"], function (dojo, _HasDropDown) {
dojo.deprecated("dojox.form._HasDropDown", "Use dijit._HasDropDown instead", "2.0");

dojo.setObject("dojox.form._HasDropDown", _HasDropDown);
return _HasDropDown;
});