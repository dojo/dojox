dojo.provide("dojox.layout.ResizeHandle");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated"); 

dojo.declare("dojox.layout.ResizeHandle",
	[dijit._Widget, dijit._Templated],
	null,{

	// summary
	//	The handle on the bottom-right corner of FloatingPane or other widgets that allows
	//	the widget to be resized.
	//	Typically not used directly.

	// targetId: String
	//	id of the Widget OR DomNode that I will size
	targetId: '',

	// resizeAxis: String
	//	one of: x|y|xy limit resizing to a single axis, default to xy ... 
	resizeAxis: "xy",

	templateString: '<div class="dojoxResizeHandle"><div></div></div>',

	// defaults to match default resizeAxis
	_resizeX: true,
	_resizeY: true,

	_connects: [],

	postCreate: function(){
		// summary: setup our one major listener
		dojo.connect(this.domNode, "onmousedown", this, "_beginSizing");
		// should we modify the css for the cursor hover to n-resize nw-resize and w-resize?
		this._resizeX = (this.resizeAxis == "x" || this.resizeAxis == "xy");
		this._resizeY = (this.resizeAxis == "y" || this.resizeAxis == "xy"); 
	},

	_beginSizing: function(/*Event*/ e){
		// summary: 
		if (this._isSizing){ return false; }

		// get the target dom node to adjust.  targetElmId can refer to either a widget or a simple node
		this.targetWidget = dijit.byId(this.targetId);
		this.targetDomNode = this.targetWidget ? this.targetWidget.domNode : dojo.byId(this.targetId);

		if (this.targetContainer) { this.targetDomNode = this.targetContainer; } 

		if (!this.targetDomNode){ return; }

		this._isSizing = true;
		this.startPoint  = {'x':e.clientX, 'y':e.clientY};
		var mb = dojo.marginBox(this.targetDomNode);
		this.startSize  = {'w':mb.w, 'h':mb.h};

		this._connects = []; 
		this._connects.push(dojo.connect(window,"onmousemove",this,"_changeSizing")); 
		this._connects.push(dojo.connect(window, "onmouseup", this, "_endSizing"));
		e.preventDefault();
	},

	_changeSizing: function(/*Event*/ e){

		// On IE, if you move the mouse above/to the left of the object being resized,
		// sometimes clientX/Y aren't set, apparently.  Just ignore the event.
		try{
			if(!e.clientX  || !e.clientY){ return; }
		}catch(e){
			// sometimes you get an exception accessing above fields...
			return;
		}

		var dx = this.startPoint.x - e.clientX;
		var dy = this.startPoint.y - e.clientY;
		
		var newW = this.startSize.w - dx;
		var newH = this.startSize.h - dy;

		// minimum size check
		if (this.minSize) {
			var mb = dojo.marginBox(this.targetDomNode);
			if (newW < this.minSize.w) {
				newW = mb.w;
			}
			if (newH < this.minSize.h) {
				newH = mb.h;
			}
		}
		
		if (this._resizeX) { dojo.style(this.targetDomNode,"width",newW+"px"); }
		if (this._resizeY) { dojo.style(this.targetDomNode,"height",newH+"px"); }
			
		e.preventDefault();
	},

	_endSizing: function(/*Event*/ e){
		dojo.forEach(this._connects,function(c){
			dojo.disconnect(c); 
		});
		this._isSizing = false;
	}

});
