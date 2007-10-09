dojo.provide("dojox.fx.scroll");
dojo.experimental("dojox.fx.scroll"); 

dojo.require("dojox.fx._core"); 

dojox.fx.smoothScroll = function(/* Object */args){
	// summary: Returns an animation that will smooth-scroll to a node (specified in etup())
	// description: This implementation support either horizental or vertical scroll, as well as
	//		both. In addition, element in iframe can be scrolled to correctly.
	// offset: {x: int, y: int} this will be added to the target position
	// duration: Duration of the animation in milliseconds.

	args = dojo.mixin({
		"window": args.win
	},args);
	if(!args.target){ args.target = dojo.coords(args.node,true); }

	var anim = new dojo._Animation(dojo.mixin({
		beforeBegin: function(){
			if(this.curve){ delete this.curve; }
			var current = dojo._docScroll();
			anim.curve = new dojox.fx._Line([current.x,current.y],[args.target.x,args.target.y]);
		},
		onAnimate: function(/* Decimal */value){
			args.window.scrollTo(value[0],value[1]);
		}
	},args));
	return anim; // dojo._Animation
};
