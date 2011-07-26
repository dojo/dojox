define([
	"dojo/_base/kernel",
	"dojo/_base/lang",
	"../_base"	
], function(dojo,lang,dd){
	/*=====
		dd = dojox.dtl;
	=====*/
	lang.getObject("dtl.contrib.objects", true, dojox);

	lang.mixin(dd.contrib.objects, {
		key: function(value, arg){
			return value[arg];
		}
	});

	dd.register.filters("dojox.dtl.contrib", {
		"objects": ["key"]
	});
	return dojox.dtl.contrib.objects;
});