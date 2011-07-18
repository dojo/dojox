define(["dojo/_base/kernel", "./CheckedMultiSelect", "./_SelectStackMixin", "dojo/_base/declare"], function (dojo, CheckedMultiSelect, _SelectStackMixin) {
return dojo.declare("dojox.form.RadioStack",
	[ CheckedMultiSelect, _SelectStackMixin ], {
	// summary: A radio-based select stack.
});
});