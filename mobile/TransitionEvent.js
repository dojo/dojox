define([
	"dojo/_base/Deferred",
	"dojo/_base/lang",
	"dojo/_base/declare",
	"dojo/on",
	"./transition"
],
	function(Deferred, lang, declare, on, transition){

	return declare("dojox.mobile.TransitionEvent", null, {
		constructor: function(target, transitionOptions, triggerEvent){
			this.transitionOptions=transitionOptions;	
			this.target = target;
			this.triggerEvent=triggerEvent||null;	
		},

		dispatch: function(){
			var opts = {bubbles:true, cancelable:true, detail: this.transitionOptions, triggerEvent: this.triggerEvent};	
			//console.log("Target: ", this.target, " opts: ", opts);

			var evt = on.emit(this.target,"startTransition", opts);
			//console.log('evt: ', evt);
			if(evt){
				Deferred.when(transition.call(this, evt), lang.hitch(this, function(results){
					this.endTransition(results);
				}));
			}
		},

		endTransition: function(results){
			on.emit(this.target, "endTransition" , {detail: results.transitionOptions});
		}
	});
});
