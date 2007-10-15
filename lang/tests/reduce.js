dojo.provide("dojox.lang.tests.reduce");
dojo.require("dojox.lang.functional");

(function(){
	var df = dojox.lang.functional;
	tests.register("dojox.lang.tests.reduce", [
		function testFoldl1(t){ t.assertEqual(df.foldl([1, 2, 3], "+", 0), 6); },
		function testFoldl2(t){ t.assertEqual(df.foldl1([1, 2, 3], "*"), 6); },
		function testFoldl3(t){ t.assertEqual(df.foldl1([1, 2, 3], "/"), 1/6); },
		function testFoldl4(t){ t.assertEqual(df.foldl1([1, 2, 3], Math.max), 3); },
		function testFoldl5(t){ t.assertEqual(df.foldl1([1, 2, 3], Math.min), 1); },
		
		function testFoldr1(t){ t.assertEqual(df.foldr([1, 2, 3], "+", 0), 6); },
		function testFoldr2(t){ t.assertEqual(df.foldr1([1, 2, 3], "*"), 6); },
		function testFoldr3(t){ t.assertEqual(df.foldr1([1, 2, 3], "/"), 3/2); },
		function testFoldr4(t){ t.assertEqual(df.foldr1([1, 2, 3], Math.max), 3); },
		function testFoldr5(t){ t.assertEqual(df.foldr1([1, 2, 3], Math.min), 1); },
		
		function testScanl1(t){ t.assertEqual(df.scanl([1, 2, 3], "+", 0), [0, 1, 3, 6]); },
		function testScanl2(t){ t.assertEqual(df.scanl1([1, 2, 3], "*"), [1, 2, 6]); },
		function testScanl3(t){ t.assertEqual(df.scanl1([1, 2, 3], Math.max), [1, 2, 3]); },
		function testScanl4(t){ t.assertEqual(df.scanl1([1, 2, 3], Math.min), [1, 1, 1]); },
		
		function testScanr1(t){ t.assertEqual(df.scanr([1, 2, 3], "+", 0), [6, 5, 3, 0]); },
		function testScanr2(t){ t.assertEqual(df.scanr1([1, 2, 3], "*"), [6, 6, 3]); },
		function testScanr3(t){ t.assertEqual(df.scanr1([1, 2, 3], Math.max), [3, 3, 3]); },
		function testScanr4(t){ t.assertEqual(df.scanr1([1, 2, 3], Math.min), [1, 2, 3]); }
	]);
})();
