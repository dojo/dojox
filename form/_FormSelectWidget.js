define(["dojo/_base/kernel", "dijit/_FormSelectWidget"], function (dojo, _FormSelectWidget) {
dojo.deprecated("dojox.form._FormSelectWidget", "Use dijit.form._FormSelectWidget instead", "2.0");

dojo.setObject("dojox.form._FormSelectWidget", _FormSelectWidget);
return _FormSelectWidget;
});