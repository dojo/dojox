dojo.provide("dojox.fx._core");

dojox.fx._Line = function(/*int*/ start, /*int*/ end){
	// summary: a custom _Line (ported from 0.4) to accomodate multi-dimensional values
	//	within the same line
	//	
	// description: a normal dojo._Line is the curve, and does Line(start,end)
	//	for propertyAnimation. as we make more complicatied animations, we realize
	//	some properties can have 2, or 4 values relevant (x,y) or (t,l,r,b) for example 
	//
	// 	this function provides support for those Lines, and is ported directly from 0.4
	//	this is a lot of extra code for something so seldom used, so we'll put it here as
	//	and optional core addition. you can create a new line, and use it during onAnimate
	//	as you see fit.
	//
	//
	// example: see dojox.fx.smoothScroll 
	
	this.start = start;
	this.end = end;
	if(dojo.isArray(start)){
		/* start: Array
		   end: Array
		   pId: a */
		var diff = [];
		dojo.forEach(this.start, function(s,i){
			diff[i] = this.end[i] - s;
		}, this);
		
		this.getValue = function(/*float*/ n){
			var res = [];
			dojo.forEach(this.start, function(s, i){
				res[i] = (diff[i] * n) + s;
			}, this);
			return res; // Array
		}
	}else{
		var diff = end - start;
		this.getValue = function(/*float*/ n){
			//	summary: returns the point on the line
			//	n: a floating point number greater than 0 and less than 1
			return (diff * n) + this.start; // Decimal
		}
	}
};
