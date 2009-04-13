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
	var epsilon = 1e-6;
		eq = function(t, a, b){
			t.t(!isNaN(a) && ! isNaN(b));
			var delta = Math.abs((a - b) / (a + b));
			t.t(isNaN(delta) || delta < epsilon);
		},
		a1 = [1, 2, 1],
		a2 = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
	tests.register("dojox.math.tests.stats", [
		function approx1(t){ eq(t, dojox.math.approxLin(a1, 0), 1); },
		function approx2(t){ eq(t, dojox.math.approxLin(a1, 0.5), 2); },
		function approx3(t){ eq(t, dojox.math.approxLin(a1, 1), 1); },
		function approx4(t){ eq(t, dojox.math.approxLin(a1, 0.25), 1.5); },
		function approx5(t){ eq(t, dojox.math.approxLin(a1, 0.75), 1.5); },
		function approx6(t){ eq(t, dojox.math.approxLin(a1, 0.1), 1.2); },
		function summary1(t){
			var s = dojox.math.getSummary(a1);
			eq(t, s.min, 1);
			eq(t, s.p10, 1);
			eq(t, s.p25, 1);
			eq(t, s.med, 1);
			eq(t, s.p75, 1.5);
			eq(t, s.p90, 1.8);
			eq(t, s.max, 2);
		},
		function summary2(t){
			var s = dojox.math.getSummary(a2, true);
			eq(t, s.min, 0);
			eq(t, s.p10, 2);
			eq(t, s.p25, 5);
			eq(t, s.med, 10);
			eq(t, s.p75, 15);
			eq(t, s.p90, 18);
			eq(t, s.max, 20);
		}
	]);
})();
