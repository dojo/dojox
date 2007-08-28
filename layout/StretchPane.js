dojo.experimental("dojox.layout.StretchPane"); 
//
// StretchPane - a widget sensitive to window resizing. Allows
// options for setting the rules for resizing child widgets
//
// Usage: just like ContentPane, but with the ability to provide
// expressions in x,y,w,h html attributes.
// 
// Each 'x', 'y', 'w' or 'y' attribute you provide will be evaluated
// as an expression, then assigned to the dom node's corresponding
// 'left', 'top', 'width' or 'height' attribute.
// The context in which this expression is executed is a function
// which is called with the parent's width and height values, as
// arguments 'w' and 'h'.
//
// For example:
//   <div dojoType="StretchPane" x="20+w/2"...
// becomes:   
//   this.domNode.style.left = '' + (20+w/2) + 'px';
//
//  Refer test_StretchPane.html for a clear simple example of usage.

//dojo.debug("StretchPane.js: loading...");

dojo.provide("dojox.layout.StretchPane");

dojo.require("dojox.layout.ContentPane");
dojo.require("dijit.layout._LayoutWidget");
dojo.require("dijit._Container");
dojo.require('dijit._Templated');

//dojo.debug("StretchPane.js: loading(2)...");

dojo.declare("dojox.layout.StretchPane", [dojox.layout.ContentPane, dijit.layout._LayoutWidget, dijit._Container], {
	widgetType: "dojox.layout.StretchPane",
	
	// for setting sizer funcs
	x:"", y:"", w:"", h:"",
	sizerFunc: null,
	
	// initialisation
	postCreate: function() {
	
		//this.inherited("postCreate",[]);
		this.parent = this.getParent();
		// get a domNode ref, if none exists
		if (this.domNode == null) {
			this.domNode = dojo.byId(this.widgetId);
		}
	
		this.setupSizer()
	},
	
	// if any of x,y,w,h attributes given, then this method
	// sets up a function to be executed every time the window
	// or a parent widget is resized
	setupSizer: function () {
	
		// bail of no x, y, w or h attributes defined
		if (!(this.x || this.y || this.w || this.h)) {
			return;
		}
	
		// widget must have absolute position
		this.domNode.style.position = "absolute";
	
		// set up to receive onResize, but only if we are the top
		// of the tree. If we're not at top of tree, we should receive
		// onResized events from our parent
		if (!this.parent) {
			dojo.connect(window, "onresize", this, "onResized");
		}
		this.setupSizerFunc();
	
	},
	
	setupSizerFunc: function() {
	
		// build and install a resizer function, if one or more
		// sizer expressions given
		stmts = "";
		//stmts = "dojo.debug(\"w=\"+w+\" h=\"+h);\n"
		if (this.x != "") {
			stmts += "s.left=''+("+this.x+")+'px'; ";
		}
		if (this.y != "") {
			stmts += "s.top=''+("+this.y+")+'px'; "
		}
		if (this.w != "") {
			stmts += "s.width=''+("+this.w+")+'px'; "
		}
		if (this.h != "") {
			stmts += "s.height=''+("+this.h+")+'px'; "
		}
	
		// if we have one or more sizer expressions, then build
		// and install the sizerFunc function into this instance
		if (stmts != "") {
			// function preamble
			var code = "function func(w,h){var s=this.domNode.style; ";
	
			// stick in the resizing statements
			code += (stmts + "}");
			//dojo.debug("func="+code);
	
			//var func = eval(code); <-- phooey - IE can't handle this
			eval(code);           // <-- but IE *can* cope with this
			//dojo.debug("func compiled ok, func="+func);
	
			// last step - plug the newly compiled resizer function
			// into this widget instance
			this.sizerFunc = func;
		}
	},
	
	// executes sizer expression, if any
	doResize: function() {
	
		if (this.sizerFunc == null) {
			//dojo.debug("doResize: no resizer func?");
			return;
		}
	
		// get parent dimensions
		var w, h;
		if (this.parent) {
			// get parent size
			w = this.parent.domNode.offsetWidth;
			h = this.parent.domNode.offsetHeight;
			//dojo.debug("doResize: from parent: w="+w+" h="+h);
		} else {
			// get window size
			if (dojo.isIE) {
				w = dojo.body().clientWidth;
				h = dojo.body().clientHeight;
			} else {
				w = window.innerWidth;
				h = window.innerHeight;
			}
			//dojo.debug("doResize: from window: w="+w+" h="+h);
		}
	
		//dojo.debug("calling sizerfunc("+w+","+h+")");
		this.sizerFunc(w, h);
	},
	
	onResized: function() {
		//dojo.debug("got onResized!");
		this.doResize();
		//dojo.debug("back from resizer");
		
		// resize the kids
		//this.notifyChildrenOfResize();
	},
	
	show: function () {
	
		this.domNode.style.display = "inline";
	},
	
	hide: function () {
	
		this.domNode.style.display = "none";
	},
	
	// set the rule or position for the left (x) coordinate
	
	setLeft: function (/*int/string*/left) {
		this.x = left;
		this.setupSizerFunc();
		this.onResized();
		return true;
	},
	
	// set the rule or position for the top (y) coordinate
	
	setTop: function (/*int/string*/top) {
		this.y = top;
		this.setupSizerFunc();
		this.onResized();
		return true;
	},
	
	// set the rules for the topleft position, both at once
	setPosition: function (left, top) {
		this.x = left;
		this.y = top;
		this.setupSizerFunc();
		this.onResized();
		return true;
	},
	
	// set the rule or position for the width
	// you should usually invoke this via the inherited method .setWidth
	
	setNativeWidth: function(/*int/string*/width){
		// summary: stub function. SUBCLASSES MUST IMPLEMENT
		this.w = width;
		this.setupSizerFunc();
		this.onResized();
		return true;
	},
	
	// set the rule or position for the width
	// you should usually invoke this via the inherited method .setHeight
	
	setNativeHeight: function(/*int*/height){
		// summary: stub function. SUBCLASSES MUST IMPLEMENT
		this.h = height;
		this.setupSizerFunc();
		this.onResized();
		return true;
	},
	
	resize: function(/*String or int*/width, /*String or int*/height){
		// summary:
		// 		width and height may only be set as numbers or expressions.
		// width:
		//		the width, either a number, or an expression using parent's w,h
		// height:
		//  the height, either a number, or an expression using parent's w,h 
		this.w = width;
		this.h = height;
		this.setupSizerFunc();
		this.onResized();
		return true;
	},
	
	setPositionAndSize: function(x, y, w, h) {
	
		this.x = x;
		this.y = y;
		this.w = width;
		this.h = height;
		this.setupSizerFunc();
		this.onResized();
		return true;
	
	},
	
	// set up an animated transition to a new set of xywh rules
	
	move: function (x, y, w, h, ms, nframes) {
	
		// default duration
		if (!ms) { var ms = 1000; }
	
		// default frames
		if (!nframes) { var nframes = 10; }
	
		// time interval between frames
		this.msPerFrame = ms / nframes;
		this.msTotal = ms;
	
		// set frame counter
		this.framesLeft = nframes;
		this.nframes = nframes;
	
		// default to existing
		if (x == '') { x = this.x};
		if (y == '') { y = this.y};
		if (w == '') { w = this.w};
		if (h == '') { h = this.h};
	
		// get old handlers
		xOld = this.x;
		yOld = this.y;
		wOld = this.w;
		hOld = this.h;
		
		// save new handlers
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
	
		// get/save parent dimensions
		if (this.parent) {
			// get parent size
			this.wPar = this.parent.domNode.offsetWidth;
			this.hPar = this.parent.domNode.offsetHeight;
			//dojo.debug("doResize: from parent: w="+w+" h="+h);
		} else {
			// get window size
			if (dojo.isIE) {
				this.wPar = document.body.clientWidth;
				this.hPar = document.body.clientHeight;
			} else {
				this.wPar = window.innerWidth;
				this.hPar = window.innerHeight;
			}
			//dojo.debug("doResize: from window: w="+w+" h="+h);
		}
	
		// create transition function
		var code = "function moveFunc() {\n" +
				   "  var s=this.domNode.style;\n" +
				   "  var t0 = this.framesLeft / this.nframes;\n" +
				   "  var t1 = 1 - t0;\n" +
				   "  var w = this.w;\n" +
				   "  var h = this.h;\n" +
				   "  s.left = ''+(("+xOld+")*t0+("+x+")*t1)+'px'\n" +
				   "  s.top = ''+(("+yOld+")*t0+("+y+")*t1)+'px'\n" +
				   "  s.width = ''+(("+wOld+")*t0+("+w+")*t1)+'px'\n" +
				   "  s.height = ''+(("+hOld+")*t0+("+h+")*t1)+'px'\n" +
				   "}\n";
	
		//dojo.debug("moveFunc="+code);
	
		//var func = eval(code); <-- phooey - IE can't handle this
		eval(code);           // <-- but IE *can* cope with this
	
		// last step - plug the newly compiled resizer function
		// into this widget instance
		this.moveFunc = moveFunc;
	
		// lastly, get the ball rolling
		this.onMoveTimer();
	
		//dojo.debug("ms="+ms+" nframes="+nframes+" ms/frame="+this.msPerFrame);
		
	},
	
	// executes once for every movement frame
	onMoveTimer: function() {
	
		// first, decrement (so the first frame is different to start point
		this.framesLeft--;
	
		//dojo.debug("onMoveTimer: framesLeft="+this.framesLeft);
	
		// now, invoke the movement func
		this.moveFunc();
		
		// and nudge the kids
		//this.notifyChildrenOfResize();
		
		// finished?
		if (this.framesLeft <= 0) {
			// yes, now set new sizer funcs and clean up
			this.setupSizerFunc();
	
			delete(this.msPerFrame);
			delete(this.msTotal);
			delete(this.framesLeft);
			delete(this.nframes);
			delete(this.wPar);
			delete(this.hPar);
			delete(this.moveFunc);
		} else {
			// no, set a new timer
			var this_ = this;
			setTimeout(function(){this_.onMoveTimer()}, this.msPerFrame);
		}
			
	},
	
	_lastmethod: function () {
	}	
});



