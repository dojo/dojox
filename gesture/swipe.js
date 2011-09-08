define([
	"dojo/_base/kernel",
	"dojo/_base/declare",
	"./Base",
	"../main"
], function(dojo, declare, Base, dojox){
// module:
//		dojox/gesture/swipe
// summary:
//		This module provides swipe gestures including:
//		1. dojox.gesture.swipe
//			A series of "swipe" will be fired during touchmove, this will mostly
//			be used to keep sliding the Dom target based on the swiped distance(dX, dY).
//
//		2. dojox.gesture.swipe.end	
//			Fired when a swipe is ended so that an bounce animation may be applied
//			to the Dom target sliding to the final position.
//
//		Following information will be included in the fired swipe events:
//		1. type: "swipe"|"swipe.end"
//		2. time: an integer indicating the delta time(in milliseconds)
//		3. dX: delta distance on X axis, dX < 0 -> moving left, dX > 0 - moving right
//		4. dY: delta distance on Y axis, dY < 0 -> moving up, dX > 0 - moving down
//		Note - dX and dY can be used together for a hybrid swipe(both vertically and horizontally)
//
// example:
//		A. Used with dojo.connect()
//		|	dojo.connect(node, dojox.gesture.swipe, function(e){});
//		|	dojo.connect(node, dojox.gesture.swipe.end, function(e){});
//
//		B. Used with dojo.on
//		|	define(["dojo/on", "dojox/gesture/swipe"], function(on, swipe){
//		|		on(node, swipe, function(e){});
//		|		on(node, swipe.end, function(e){});
//
//		C. Used with dojox.gesture.swipe.* directly
//		|	dojox.gesture.swipe(node, function(e){});
//		|	dojox.gesture.swipe.end(node, function(e){});

dojo.experimental("dojox.gesture.swipe");

var clz = declare(Base, {

	// defaultEvent: String
	//		Default event - "swipe"
	defaultEvent: "swipe",

	// subEvents: Array
	//		Read-only, list of sub events, used by 
	//		being combined with defaultEvent as "swipe.end"
	subEvents: ["end"],

	press: function(/*Object*/data, /*Event*/e){
		// summary:
		//		Overwritten, set initial swipe info
		if(e.touches && e.touches.length >= 2){
			//currently only support single-touch swipe
			delete data.context;
			return;
		}
		if(!data.context){
			data.context = {x: 0, y: 0, t: 0};
		}
		data.context.x = e.screenX;
		data.context.y = e.screenY;
		data.context.t = new Date().getTime();
		this.lock(e.currentTarget);
	},
	move: function(/*Object*/data, /*Event*/e){
		// summary:
		//		Overwritten, fire matched "swipe" during touchmove
		this._recognize(data, e, "swipe");
	},
	release: function(/*Object*/data, /*Event*/e){
		// summary:
		//		Overwritten, fire matched "swipe.end" when touchend
		this._recognize(data, e, "swipe.end");		
		delete data.context;
		this.unLock();
	},
	cancel: function(data, e){
		// summary:
		//		Overwritten
		delete data.context;
		this.unLock();
	},
	_recognize: function(/*Object*/data, /*Event*/e, /*String*/type){
		// summary:
		//		Recognize and fire appropriate gesture events
		if(!data.context){
			return;
		}
		var info = this._getSwipeInfo(data, e);
		if(!info){
			return; //no swipe happened
		}
		info.type = type;
		this.fire(e.target, info);
	},
	_getSwipeInfo: function(/*Object*/data, /*Event*/e){
		// summary:
		//		Calculate swipe information - time, dX and dY
		var dX, dY, info = {}, startData = data.context;
		
		info.time = new Date().getTime() - startData.t;
		
		dX = e.screenX - startData.x;
		dY = e.screenY - startData.y;
		
		if(dX === 0 && dY === 0){
			return null; // no swipes happened
		}
		info.dX = dX;
		info.dY = dY;
		return info;
	}
});

// the default swipe instance for handy use
dojox.gesture.swipe = new clz();
// Class for creating a new Swipe instance
dojox.gesture.swipe.Swipe = clz;

return dojox.gesture.swipe;

});