define(["doh", "dojo/_base/declare", "../TreeMap", "dojo/store/JsonRest", "dojo/_base/Deferred"],
	function(doh, declare, TreeMap, JsonRest, Deferred){
	doh.register("dojox.treemap.tests.Store", [
		function test_Error(t){
			var treeMap = new TreeMap();
			var d = Deferred.when(treeMap.set("store", new JsonRest({ target: "/" }), function(){
				t.f(true, "ok fct must not have been called");
			}, function(){
				t.t(true, "failure fct must have been called");
			}));
			treeMap.startup();
		}
	]);
});
