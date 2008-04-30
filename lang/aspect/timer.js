dojo.provide("dojox.lang.aspect.timer");

(function(){
	var aop = dojox.lang.aspect,
		uniqueNumber = 0;
	
	var Timer = function(){
		this.name = "DojoAopTimer" + (++uniqueNumber);
		this.inCall = 0;
	};
	dojo.extend(Timer, {
		before: function(/*arguments*/){
			if(!(this.inCall++)){
				console.time(this.name);
			}
		},
		after: function(/*excp*/){
			if(!--this.inCall){
				console.timeEnd(this.name);
			}
		}
	});
	
	aop.timer = function(){
		// summary:
		//		Returns an object, which can be used to time calls to methods.
	
		return new Timer;	// Object
	};
})();