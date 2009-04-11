dojo.provide("dojox.lang.tests.array");

dojo.require("dojox.math");

(function(){
	tests.register("dojox.math.tests.factorial", [
		function fact0(t){ t.assertEqual(1, dojox.math.factorial(0)); },
		function fact5(t){ t.assertEqual(120, dojox.math.factorial(5)); },
		function factneg(t){ t.assertTrue(isNaN(dojox.math.factorial(-1))); }
	]);
	tests.register("dojox.math.tests.bestFit", [
		function bf(t){
			var points = [
				{x:1, y:42}, {x:1, y:7}, {x:2, y:17}, {x:4, y:41},
				{x:5, y:60}, {x:7, y:19}, {x:7, y:16}, {x:8, y:15},
				{x:10, y:29}, {x:11, y:1}, {x:12, y:10}, {x:13, y:22},
				{x:13, y:16}, {x:14, y:29}, {x:20, y:37}, {x:21, y:10},
				{x:21, y:60}, {x:22, y:4}, {x:22, y:33}, {x:25, y:52},
				{x:25, y:32}, {x:25, y:18}, {x:27, y:46}, {x:28, y:2},
				{x:28, y:56}, {x:29, y:12}, {x:32, y:53}, {x:32, y:14},
				{x:36, y:18}, {x:37, y:23}, {x:38, y:18}, {x:45, y:37},
				{x:48, y:43}, {x:50, y:9}, {x:53, y:48}, {x:55, y:60},
				{x:55, y:28}, {x:57, y:19}, {x:58, y:48}, {x:58, y:29}
			];
			var result = dojox.math.bestFit(points);
			t.assertEqual(0.208, Math.round(result.slope*1000)/1000);
			t.assertEqual(22.829, Math.round(result.intercept*1000)/1000);
			t.assertEqual(0.045, Math.round(result.r2*1000)/1000);
			t.assertEqual(0.212, Math.round(result.r*1000)/1000);
		}
	]);
})();
