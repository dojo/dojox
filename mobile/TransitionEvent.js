define(["dojo/_base/declare", "dojo/listen", "./transition"], function(declare,listen, transition){

	return declare("dojox.mobile.TransitionEvent", null, {
		target: null,
		currentTarget:null,
		relatedTarget: null,
		detail: null,
		cancelable: true,
		bubbles: true,
	
		constructor: function(params){
			dojo.mixin(this,params);
			if (this.detail){
				this.detail.clientX;
				this.detail.clientY;
			}
		},

		dispatch: function(){
				
			var evt = listen.dispatch(this.target,"startTransition", this);

			if (evt){
				dojo.when(transition.call(this, evt), dojo.hitch(this, function(results){
					this.endTransition(results);
				}));
			}
		},

		endTransition: function(){
			listen.dispatch(this.target, "endTransition" , dojo.mixin({cancelable:true, bubbles:true}, this));
			console.log('end transition');	
		}
	});
});
