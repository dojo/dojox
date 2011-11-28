define(["doh", "dojo/_base/declare", "../_Invalidating", "dijit/_WidgetBase"], 
	function(doh, declare, _Invalidating, _WidgetBase){
	doh.register("tests._Invalidating", [
		function test_Lifecycle(t){
			var C = declare("MyWidget", [_WidgetBase, _Invalidating], {
				constructor: function(){
					this.watchedProperties = ["a"];
					this.addWatchedProperties(["b"]);
				}					
			});
			var o = new C();
			o.startup();
			t.is(["a", "b"], c.watchedProperties);
		}
	]);
});
