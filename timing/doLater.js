dojo.provide("dojox.timing.doLater");
dojo.experimental("dojox.timing.doLater"); 

dojox.timing.doLater = function(/*anything*/conditional,/*Object ?*/context, /* Number ? */interval, /* Float ? */decay){
	// summary:
	//		Check if a parameter is ready, and if not,
	//		"do later". doLater will ping the parameter
	//		until it evaluates to something (truthy).
	//		It thens calls the caller with original
	//		arguments, using the supplied context or 
	//		window.
	//	description:
	//		dojox.timing.doLater(conditional) is testing if the call
	//		should be done later. So it returns
	//		true if the param is false. 
	//	arguments:
	//		conditional: anything
	//			Can be a property that eventually gets set, or
	//			an expression, method... anything that can be
	//			evaluated.
	//		context:	Object
	//			The namespace where the call originated.
	//			Defaults to global and anonymous functions
	//		interval:	Number
	//			Poll time to check conditional in Milliseconds
	//		decay: Float
	//			A number that will be multiplied with the interval
	//			to either increase or decrease the poll time. A typical
	//			example would be 1.2, which will gradually increase the time.
	//			Less than 1 will poll progressivly faster. 1 will do nothing.
	// example:
	//		| setTimeout(function(){
	//		| 		if(dojox.timing.doLater(app.ready)){return;}
	//		| 		console.log("Code is ready! anonymous.function SUCCESS")
	//		| 	},700);
	//
	if(conditional){ return false; }  // Boolean
	var callback = dojox.timing.doLater.caller,
		args = dojox.timing.doLater.caller.arguments;
	interval = interval || 100;
	context = context || dojo.global;
	
	interval = callback._decay ? interval * callback._decay : interval;
	callback._decay = callback._decay ? callback._decay * decay : decay;
	setTimeout(function(){
		callback.apply(context, args);
	},interval);
	return true; // Boolean
}
