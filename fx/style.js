dojo.provide("dojox.fx.style");
dojo.experimental("dojox.fx.style"); 
//
// summary: dojox.fx CSS Class _Animations: 
//
// description: a set of functions to animate properties based on
// 	normalized CSS class definitions.
//
//	provides: addClass, removeClass, and toggleClass
//	
dojo.require("dojox.fx._base"); 

dojox.fx.addClass = function(/* Object */args){
	// summary:
	//		returns an animation that will animate
	//		the properieds of a node to the properties
	//		defined in a standard CSS .class definition.
	//		(calculating the differences itself)
	//
	//		standard _Animation object rules apply. 
	//
	// additonal mixins:
	//
	//		args.cssClass: String - class string (to be added onEnd)
	//		
	var node = (args.node = dojo.byId(args.node)); 

	var pushClass = (function(){
		// summary: onEnd we want to add the class to the node 
		//	(as dojo.addClass naturally would) in case our 
		//	class parsing misses anything the browser would 
		// 	otherwise interpret. this may cause some flicker,
		//	and will only apply the class so children can inherit 
		//	after the animation is done (potentially more flicker)
		var innerNode = node; // FIXME: why do we do this like this?
		return function(){
			dojo.addClass(innerNode, args.cssClass); 
			innerNode.style.cssText = _beforeStyle; 
		}
	})();

	// _getCalculatedStleChanges is the core of our style/class animations
	var mixedProperties = dojox.fx._getCalculatedStyleChanges(args,true);
	var _beforeStyle = node.style.cssText; 
	var _anim = dojo.animateProperty(dojo.mixin({
		properties: mixedProperties
	},args));
	dojo.connect(_anim,"onEnd",_anim,pushClass); 
	return _anim; 
};

dojox.fx.removeClass = function(/* Object */args){
	// summary:
	//	returns an animation that will animate the properieds of a 
	// 	node (args.node) to the properties calculated after removing 
	//	a standard CSS className from a that node.
	//	
	//	calls dojo.removeClass(args.cssClass) onEnd of animation		
	//
	//	standard dojo._Animation object rules apply. 
	//
	// additonal mixins:
	//
	//	args.cssClass: String - class string (to be removed from node)
	//		
	var node = (args.node = dojo.byId(args.node)); 

	var pullClass = (function(){
		// summary: onEnd we want to remove the class from the node 
		//	(as dojo.removeClass naturally would) in case our class
		//	parsing misses anything the browser would otherwise 
		//	interpret. this may cause some flicker, and will only 
		//	apply the class so children can inherit after the
		//	animation is done (potentially more flicker)
		//
		var innerNode = node;
		return function(){
			dojo.removeClass(innerNode, args.cssClass); 
			innerNode.style.cssText = _beforeStyle; 
		}
	})();

	var mixedProperties = dojox.fx._getCalculatedStyleChanges(args,false);
	var _beforeStyle = node.style.cssText; 
	var _anim = dojo.animateProperty(dojo.mixin({
		properties: mixedProperties
	},args));
	dojo.connect(_anim,"onEnd",_anim,pullClass); 
	return _anim; // dojo._Animation
};

dojox.fx.toggleClass = function(/*HTMLElement*/node, /*String*/classStr, /*Boolean?*/condition){
        //      summary:
	//		creates an animation that will animate the effect of 
	//		toggling a class on or off of a node.
        //              Adds a class to node if not present, or removes if present.
        //              Pass a boolean condition if you want to explicitly add or remove.
        //      condition:
        //              If passed, true means to add the class, false means to remove.
        if(typeof condition == "undefined"){
                condition = !dojo.hasClass(node, classStr);
        }
        return dojox.fx[(condition ? "addClass" : "removeClass")](node, classStr); // dojo._Animation
};

dojox.fx._allowedProperties = [
	// summary:
	//	this is our pseudo map of properties we will check for.
	//	it should be much more intuitive. a way to normalize and
	//	"predict" intent, or even something more clever ... 
	//	open to suggestions.

	// no-brainers:
	"width",
	"height",
	// only if position = absolute || relative?
	"left", "top", "right", "bottom", 
	// these need to be filtered through dojo.colors?
	// "background", // normalize to:
	/* "backgroundImage", */
	// "backgroundPosition", // FIXME: to be effective, this needs "#px #px"?
	"backgroundColor",

	"color",

	// "border", 
	"borderBottomColor", "borderBottomWidth",
	"borderTopColor","borderTopWidth",
	"borderLeftColor","borderLeftWidth",
	"borderRightColor","borderRightWidth",

	//
	// "padding", // normalize to: 
	"paddingLeft", "paddingRight", "paddingTop", "paddingBottom",
	// "margin", // normalize to:
	"marginLeft", "marginTop", "marginRight", "marginBottom",

	// unit import/delicate?:
	"lineHeight",
	"letterSpacing",
	"fontSize"
];

dojox.fx._getStyleSnapshot = function(/* Object */cache){
	// summary: 
	//	uses a dojo.getComputedStyle(node) cache reference and
	// 	iterates through the 'documented/supported animate-able'
	// 	properties. 
	//
	// returns:  Array
	//	an array of raw, calculcated values (no keys), to be normalized/compared
	//	elsewhere	
	return dojo.map(dojox.fx._allowedProperties,function(style){
		return cache[style]; // String
	}); // Array
};

dojox.fx._getCalculatedStyleChanges = function(/* Object */args, /*Boolean*/addClass){
	// summary:
	//	calculate and normalize(?) the differences between two states
	//	of a node (args.node) by either quickly adding or removing 
	//	a class (and if that causes poor flicker later, we can attempt
	//	to create a cloned node offscreen and do other weird calculations
	//	
	// args:
	// 	we are expecting args.node (DomNode) and 
	//	args.cssClass (class String)
	// 
	// addClass: 
	// 	true to calculate what adding a class would do, 
	// 	false to calculate what removing the class would do

	var node = (args.node = dojo.byId(args.node)); 
	var compute = dojo.getComputedStyle(node);

	// take our snapShots
	var _before = dojox.fx._getStyleSnapshot(compute);
	dojo[(addClass ? "addClass" : "removeClass")](node,args.cssClass); 
	var _after = dojox.fx._getStyleSnapshot(compute);
	dojo[(addClass ? "removeClass" : "addClass")](node,args.cssClass); 

	var calculated = {};
	var i = 0;
	dojo.forEach(dojox.fx._allowedProperties,function(prop){
		if(_before[i] != _after[i]){
			// FIXME: the static unit: px is not good, either. need to parse unit from computed style?
			calculated[prop] = { end: parseInt(_after[i]), unit: 'px' }; 
		} 
		i++;
	});
	return calculated; 
};
