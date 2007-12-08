dojo.provide("dojox.fx.easing");
/*
	dojox.fx.easing is in this little file so you don't need dojox.fx to utilize this.
	dojox.fx has a lot of fun animations, but this module is optimized for size ... 

*/
dojox.fx.easing = {
	// summary: Collection of easing functions to use beyond the default dojo._defaultEasing
	// 
	// description:
	//	Easing functions are used to manipulate the iteration through
	//	an _Animation's _Line. _Line being the properties of an Animation,
	//	and the easing function progresses through that Line determing
	//	how quickly (or slowly) it should go. Or more accurately: modify
	//	the value of the _Line based on the percentage of animation completed.
	//	
	//	example:
	//	|	dojo.require("dojox.fx.easing");
	//	|	var anim = dojo.fadeOut({
	//	|		node: 'node',	
	//	|		duration: 2000,
	//	|		easing: dojox.fx.easing.easeIn
	//	|	}).play();
	//
	easeIn: function(/* Decimal? */n){
		// summary: an easing function that speeds an _Animation up closer to end
		return Math.pow(n, 3);
	},

	easeOut: function(/* Decimal? */n){ 
		// summary: an easing function that slows an _Animation down towards end
		return (1 - Math.pow(1-n,3));
	},
	
	linear: function(/* Decimal? */n){
		// summary: A linear easing function
		return n;
	}
};
