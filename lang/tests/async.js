dojo.provide("dojox.lang.tests.async");

dojo.require("dojox.lang.async");
dojo.require("dojox.lang.async.timeout");
dojo.require("dojox.lang.async.topic");

(function(){
	var async = dojox.lang.async,
		wait = async.timeout.from,
		QUANT     = 50, // ms
		MAX_TICKS = 5;
		
	function randomTimes(n){
		var a = [];
		for(var i = 0; i < n; ++i){
			a.push((Math.floor(Math.random() * MAX_TICKS) + 1) * QUANT);
		}
		return a;
	}
	
	function getMin(a){
		return Math.min.apply(Math, a);
	}
	
	function getMax(a){
		return Math.max.apply(Math, a);
	}
	
	function waitAndExpect(expected, ms){
		return function(value){
			console.log("waitAndExpect: ", value, ", expected: ", expected);
			if(expected !== value){
				throw new Error("Unexpected value");
			}
			return wait(ms)();
		}
	}
	
	tests.register("dojox.lang.tests.async", [
		function smokeTest(){
			var a = randomTimes(1),
				r = new dojo.Deferred();
			wait(a[0])().addCallback(function(x){
				if(r == a[0]){
					throw new Error("smokeTest: wrong result");
				}
				r.callback();
			});
			return r;
		},
		function testSeq(){
			var a = randomTimes(5),
				fs = dojo.map(a, function(ms, i){
					return waitAndExpect(i && a[i - 1], ms);
				});
			return async.seq.apply(async, fs)(0).addCallback(function(value){
				if(a[a.length - 1] !== value){
					throw new Error("testSeq: wrong time");
				}
			});
		},
		function testPar(){
			var a = randomTimes(5),
				fs = dojo.map(a, function(ms){
					return waitAndExpect(0, ms);
				});
			return async.par.apply(async, fs)(0).addCallback(function(value){
				console.log(a, " - ", value);
				if(a !== value){
					throw new Error("testPar: wrong time");
				}
			});
		},
		function testAny(){
			var a = randomTimes(5),
				min = getMin(a),
				fs = dojo.map(a, function(ms){
					return waitAndExpect(0, ms);
				});
			return async.any.apply(async, fs)(0).addCallback(function(value){
				console.log(min, " - ", value);
				if(min !== value){
					throw new Error("testAny: wrong time");
				}
			});
		},
		function testSelect(){
			
		},
		function testIfThen(){
			
		},
		function testLoop(){
			
		}
	]);
})();
