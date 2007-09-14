dojo.provide("dojox.fx.scroll");
dojo.experimental("dojox.fx.scroll"); 

dojo.require("dojox.fx._core"); 

dojox.fx.smoothScroll = function(/* Object */args){
	// summary: Returns an animation that will smooth-scroll to a node (specified in etup())
	// description: This implementation support either horizental or vertical scroll, as well as
	//		both. In addition, element in iframe can be scrolled to correctly.
	// offset: {x: int, y: int} this will be added to the target position
	// duration: Duration of the animation in milliseconds.

	// /*DOMNode*/ node,
	// /*Window*/ win,
	
	//
	// <a name="exampleScrollPoint"></a> that is there for the test file. 

	args = dojo.mixin({
		"window": args.win,
//		"offset": args.offset || {x:0,y:0},
		"target": dojo._abs(args.node,true) // port: dojo.html.boxSizing.BORDER_BOX, win),
	},args);
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
}
