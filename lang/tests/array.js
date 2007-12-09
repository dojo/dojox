dojo.provide("dojox.lang.tests.array");

dojo.require("dojox.lang.functional");
dojo.require("dojox.lang.functional.fold");

(function(){
	var df = dojox.lang.functional, v, isOdd = "%2";
	tests.register("dojox.lang.tests.array", [
		function testFilter1(t){ t.assertEqual(df.filter([1, 2, 3], isOdd), [1, 3]); },
		function testFilter2(t){ t.assertEqual(df.filter([1, 2, 3], "%2==0"), [2]); },
		
		function testForEach(t){ t.assertEqual(
			(v = [], df.forEach([1, 2, 3], function(x){ v.push(x); }), v), [1, 2, 3]); },
		
		function testMap(t){ t.assertEqual(df.map([1, 2, 3], "+3"), [4, 5, 6]); },
		
		function testEvery1(t){ t.assertFalse(df.every([1, 2, 3], isOdd)); },
		function testEvery2(t){ t.assertTrue(df.every([1, 3, 5], isOdd)); },

		function testSome1(t){ t.assertFalse(df.some([2, 4, 6], isOdd)); },
		function testSome2(t){ t.assertTrue(df.some([1, 2, 3], isOdd)); },

		function testReduce1(t){ t.assertEqual(df.reduce([4, 2, 1], "x-y"), 1); },
		function testReduce2(t){ t.assertEqual(df.reduce([4, 2, 1], "x-y", 8), 1); },
		
		function testReduceRight1(t){ t.assertEqual(df.reduceRight([4, 2, 1], "x-y"), -5); },
		function testReduceRight2(t){ t.assertEqual(df.reduceRight([4, 2, 1], "x-y", 8), 1); }
	]);
})();
