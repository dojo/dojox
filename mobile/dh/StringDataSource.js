define([
	"dojo/_base/declare"
], function(declare){

	return declare("dojox.mobile.dh.StringDataSource", null, {
		text: "",

		constructor: function(/*String*/ text){
			this.text = text;
		},

		getData: function(){
			return this.text;
		}
	});
});
