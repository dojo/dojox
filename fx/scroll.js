dojo.provide("dojox.fx.scroll");
dojo.experimental("dojox.fx.scroll"); 

dojo.require("dojox.fx._core"); 

dojox.fx.smoothScroll = function(/* Object */args){
	// summary: Returns an animation that will smooth-scroll to a node (specified in etup())
	// description: This implementation support either horizental or vertical scroll, as well as
	//		both. In addition, element in iframe can be scrolled to correctly.
	// offset: {x: int, y: int} this will be added to the target position
	// duration: Duration of the animation in milliseconds.
	// win: a node or window object to scroll
	
	if(!args.target){ args.target = dojo.coords(args.node,true); }
	
	var isWindow = (!dojo.isIE) ? dojo.isFunction(args["win"].scrollTo) : dojo.isObject(args["win"].scrollTo);
	var animFn;
	if(isWindow){
		animFn = function(/* Decimal[] */value){
			args.win.scrollTo(value[0],value[1]);
		};
	}else{
		animFn = function(/* Decimal[] */value){
			args.win.scrollLeft = value[0];
			args.win.scrollTop = value[1];
		};
	}

	var anim = new dojo._Animation(dojo.mixin({
		beforeBegin: function(){
			if(this.curve){ delete this.curve; }
			var current = isWindow ? dojo._docScroll() : {x: args.win.scrollLeft, y: args.win.scrollTop};
			anim.curve = new dojox.fx._Line([current.x,current.y],[args.target.x,args.target.y]);
		},
		onAnimate: animFn
	},args));
	return anim; // dojo._Animation
};