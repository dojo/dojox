define(["dojo/_base/kernel", "dijit/form/Select"], function (dojo, Select) {
dojo.deprecated("dojox.form.DropDownSelect", "Use dijit.form.Select instead", "2.0");

dojo.setObject("dojox.form.DropDownSelect", Select);
return Select;
});