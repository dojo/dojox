dojo.provide("dojox.math._base");

(function(){
	dojo.mixin(dojox.math, {
		degreesToRadians: function(/* Number */n){
			//	summary
			//	Convert the passed number to radians.
			return (n*Math.PI)/180;	// Number
		},
		radiansToDegrees: function(/* Number */n){
			//	summary
			//	Convert the passed number to degrees.
			return (n*180)/Math.PI;	//	Number
		},

		factorial: function(/* Number */n){
			//	summary
			//	Return the factorial of n
			if(n === 0){ 
				return 1;	// Number
			}else if(n < 0 || Math.floor(n) != n){
				return NaN; // NaN
			}

			var ret = 1;
			for(var i = 1; i <= n; i++){
				ret *= i;
			}
			return ret;	// Number
		},

		permutations: function(/* Number */n, /* Number */k){
			//	summary
			//	TODO
			if(n==0 || k==0){ 
				return 1; 	// Number
			}
			return this.factorial(n) / this.factorial(n-k);
		},

		combinations: function(/* Number */n, /* Number */r){
			//	summary
			//	TODO
			if(n==0 || r==0){ 
				return 1; 	//	Number
			}
			return this.factorial(n) / (this.factorial(n-r) * this.factorial(r));	// Number
		},

		bernstein: function(/* Number */t, /* Number */n, /* Number */ i){
			//	summary
			//	TODO
			return this.combinations(n, i) * Math.pow(t, i) * Math.pow(1-t, n-i);	//	Number
		},

		gaussian: function(){
			//	summary
			//	Return a random number based on the Gaussian algo.
			var k=2;
			do{
				var i=2*Math.random()-1;
				var j=2*Math.random()-1;
				k = i*i+j*j;
			}while(k>=1);
			return i * Math.sqrt((-2*Math.log(k))/k);	//	Number
		},

		//	basic statistics
		sd: function(/* Number[] */a){
			//	summary:
			//		Returns the standard deviation of the passed arguments.
			return Math.sqrt(this.variance(a));	//	Number
		},

		variance: function(/* Number[] */a){
			//	summary:
			//		Find the variance in the passed array of numbers.
			var mean=0, squares=0;
			dojo.forEach(a, function(item){
				mean+=item;
				squares+=Math.pow(item,2);
			});
			return (squares/a.length)-Math.pow(mean/a.length, 2);	//	Number
		},

		bestFit: function(/* Object[] || Number[] */a, /* String? */xProp, /* String? */yProp){
			//	summary:
			//		Calculate the slope and intercept in a linear fashion.  An array
			//		of objects is expected; optionally you can pass in the property
			//		names for "x" and "y", else x/y is used as the default.  If you
			//		pass an array of numbers, it will be mapped to a set of {x,y} objects
			//		where x = the array index.
			xProp = xProp || "x", yProp = yProp || "y";
			if(a[0] !== undefined && typeof(a[0]) == "number"){
				//	this is an array of numbers, so use the index as x.
				a = dojo.map(a, function(item, idx){
					return { x: idx, y: item };
				});
			}

			var sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, stt = 0, sts = 0, n = a.length, t;
			for(var i=0; i<n; i++){
				sx += a[i][xProp];
				sy += a[i][yProp];
				sxx += Math.pow(a[i][xProp], 2);
				syy += Math.pow(a[i][yProp], 2);
				sxy += a[i][xProp] * a[i][yProp];
			}

			//	we use the following because it's more efficient and accurate for determining the slope.
			for(i=0; i<n; i++){
				t = a[i][xProp] - sx/n;
				stt += t*t;
				sts += t*a[i][yProp];
			}
			var slope = sts/(stt||1);	//	prevent divide by zero.

			//	get Pearson's R
			var d = Math.sqrt((sxx - Math.pow(sx,2)/n) * (syy - Math.pow(sy,2)/n));
			if(d === 0){
				throw new Error("dojox.math.bestFit: the denominator for Pearson's R is 0.");
			}

			var r = (sxy-(sx*sy/n)) / d;
			var r2 = Math.pow(r, 2);
			if(slope < 0){
				r = -r;
			}

			//	to use:  y = slope*x + intercept;
			return {	//	Object
				slope: slope,
				intercept: (sy - sx*slope)/(n||1),
				r: r,
				r2: r2
			};
		},

		mean: function(/* Number[] */a){
			//	summary:
			//		Returns the mean value in the passed array.
			var t=0;
			dojo.forEach(a, function(v){
				t += v;
			});
			return t / Math.max(a.length, 1);	//	Number
		},

		min: function(/* Number[] */a){
			//	summary:
			//		Returns the min value in the passed array.
			return Math.min.apply(null, a);		//	Number
		},

		max: function(/* Number[] */a){
			//	summary:
			//		Returns the max value in the passed array.
			return Math.max.apply(null, a);		//	Number
		},

		median: function(/* Number[] */a){
			//	summary:
			//		Returns the value closest to the middle from a sorted version of the passed array.
			return a.slice(0).sort()[Math.ceil(a.length/2)-1];	//	Number
		},

		mode: function(/* Number[] */a){
			//	summary:
			//		Returns the mode from the passed array (number that appears the most often).
			//		This is not the most efficient method, since it requires a double scan, but
			//		is ensures accuracy.
			var o = {}, r = 0, m = Number.MIN_VALUE;
			dojo.forEach(a, function(v){
				(o[v]!==undefined)?o[v]++:o[v]=1;
			});

			//	we did the lookup map because we need the number that appears the most.
			for(var p in o){
				if(m < o[p]){
					m = o[p], r = p;
				}
			}
			return r;	//	Number
		},

		//	create a range of numbers
		range: function(/* Number */a, /* Number? */b, /* Number? */step){
			//	summary
			//	Create a range of numbers based on the parameters.
			if(arguments.length<2){
				b=a,a=0;
			}
			var range=[], s=step||1, i;
			if(s>0){
				for(i=a; i<b; i+=s){
					range.push(i);
				}
			}else{
				if(s<0){
					for(i=a; i>b; i+=s){
						range.push(i);
					}
				}else{
					throw new Error("dojox.math.range: step must not be zero.");
				}
			}
			return range; 	// Array
		},

		distance: function(/* Array */a, /* Array */b){
			//	summary
			//	Calculate the distance between point A and point B
			return Math.sqrt(Math.pow(b[0]-a[0],2)+Math.pow(b[1]-a[1],2));	//	Number
		},

		midpoint: function(/* Array */a, /* Array */b){
			//	summary
			//	Calculate the midpoint between points A and B.  A and B may be multidimensional.
			if(a.length!=b.length){
				console.error("dojox.math.midpoint: Points A and B are not the same dimensionally.", a, b);
			}
			var m=[];
			for(var i=0; i<a.length; i++){
				m[i]=(a[i]+b[i])/2;
			}
			return m;	//	Array
		}
	});

})();
