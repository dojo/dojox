dojo.provide("dojox.layout.ToggleSplitter");
dojo.experimental("dojox.layout.ToggleSplitter"); 

dojo.require("dijit.layout.BorderContainer");

dojo.declare("dojox.layout.ToggleSplitter", [ dijit.layout._Splitter ],
{
	// summary: 
	//		A draggable and toggle-to-close/open spacer between two items in a BorderContainer
	//
	// description:
	// 		Extends the dijit.layout._Splitter to add a toggling behavior
	// 		on double-click
	//

/*=====
	container: null,
	child: null,
	region: null,
=====*/

	// open: Boolean
	//	the initial and current state of the splitter (and its attached pane)
	open: true, 

	// closedThreshold: Integer
	//	how small the attached pane can be before its considered closed
	closedThreshold: 5,

	// openSize: String
	//	the css height/width value to apply by default when the attached pane is open
	openSize: "",

	// _closedSize: String
	//	the css height/width value to apply by default when the attached pane is closed
	_closedSize: "0",
	
	templateString: '<div class="dijitSplitter dojoxToggleSplitter" dojoAttachEvent="onkeypress:_onKeyPress,onmousedown:_onMouseDown" tabIndex="0" waiRole="separator"><div dojoAttachPoint="toggleNode" class="dijitSplitterThumb dojoxToggleSplitterIcon"></div></div>',

	postCreate: function(){
		this.inherited(arguments);
		
		// add a region css hook
		var region = this.region; 
		dojo.addClass(this.domNode, "dojoxToggleSplitter"+region.charAt(0).toUpperCase() + region.substring(1));

		// hook up double-clicks to toggle the splitter - 
		this.connect(this, "onDblClick", "_toggleMe");

	}, 
	startup: function() {
		this.inherited(arguments);

		// we have to wait until startup to be sure the child exists in the dom
		// and has non-zero size (if its supposed to be showing)
		var paneNode = this.child.domNode, 
			intPaneSize = dojo.style(paneNode, (this.horizontal ? "height" : "width"));
		
		// creation of splitters is an opaque process in BorderContainer, 
		// so if we want to get init params, we have to retrieve them from the attached BC child
		// NOTE: for this to work we have to extend the prototype of dijit._Widget (some more)
		dojo.forEach(["toggleSplitterOpen", "toggleSplitterClosedThreshold", "toggleSplitterOpenSize"], function(name) {
			var pname = name.substring("toggleSplitter".length);
			pname = pname.charAt(0).toLowerCase() + pname.substring(1);
			if(name in this.child) {
				this[pname] = this.child[name];
			}
		}, this);

		if(!this.openSize) {
			// store the current size as the openSize if none was provided

			// dojo.style always returns a integer (pixel) value for height/width
			// use an arbirary default if a pane was initalized closed and no openSize provided
			this.openSize = (this.open) ? intPaneSize + "px" : "75px";
		}
		// console.log("openSize is: ", this.openSize);
		this._openStyleProps = this._getStyleProps(paneNode, true);

		this._setOpenAttr(this.open, true);
		return;
	},
	_onMouseDown: function(evt) {
		// summary: 
		// 	handle mousedown events from the domNode
		if(!this.open) {
			// ignore mousedown while closed 
			// - this has the effect of preventing dragging while closed, which is the prefered behavior (for now)
			return; 
		}
		var startPosn = this.horizontal ? evt.clientY : evt.clientX; 

		// allow a little fudging in a click before we consider a drag started
		var dragThreshold = 3; 

		var onUpHandle = dojo.connect(dojo.body(), "onmouseup", this, function(evt) {
			dojo.disconnect(onDownHandle);
			dojo.disconnect(onUpHandle);
		});

		// start listening for mousemove
		var onDownHandle = dojo.connect(dojo.body(), "onmousemove", this, function(evt) {
			// only start dragging when a mouse down AND a significant mousemove occurs
			var offset = Math.abs( startPosn - (this.horizontal ? evt.clientY : evt.clientX) );
			if(offset >= dragThreshold) {
				// treat as a drag and dismantle these preliminary handlers
				dojo.disconnect(onDownHandle);
				dojo.disconnect(onUpHandle);
				this._startDrag(evt);
			}
		});
	}, 
	_handleOnChange: function() {
		// summary
		// 	effect the state change with the new value of this.open

		// TODO: animate the open/close
		
		var paneNode = this.child.domNode, 
			openProps,
			dim = this.horizontal ? "height" : "width"; 

		if(this.open) {
			// console.log("#"+this.id + " " + this.region + " changing to open state");
			// change to open state
			var styleProps = dojo.mixin({
				display: "block", 
				overflow: "auto",
				visibility: "visible"
			}, this._openStyleProps);

			styleProps[dim] = this._openStyleProps[dim] || this.openSize;
			dojo.style(paneNode, styleProps);
			
			// and re-hook up the mouse event handler
			this.connect(this.domNode, "onmousedown", "_onMouseDown");

		} else {
			//console.log("#"+this.id + " " + this.region + " changing to closed state");
			// change to closed state
			// FIXME: this wont work in a drag-to-closed scenario
			var paneStyle  = dojo.getComputedStyle(paneNode); 
			
			openProps = this._getStyleProps(paneNode, true, paneStyle);
			var closedProps = this._getStyleProps(paneNode, false, paneStyle);

			this._openStyleProps = openProps;
			dojo.style(paneNode, closedProps);
		}
		
		this._setStateClass();
		if(this.container._started) {
			this.container._layoutChildren(this.region);
		}
	},
	
	_getStyleProps: function(paneNode, open, paneStyle) {
		// summary: 
		//	create an object with the style property name: values 
		// 	that will need to be applied to the child pane render the given state
		if(!paneStyle) {
			paneStyle  = dojo.getComputedStyle(paneNode);
		}
		var styleProps = {}, 
			dim = this.horizontal ? "height" : "width";
			
		styleProps["overflow"] = (open) ? paneStyle["overflow"] : "hidden";
		styleProps["visibility"] = (open) ? paneStyle["visibility"] : "hidden";

		// use the inline width/height style value, in preference to the computedStyle
		// for the open width/height
		styleProps[dim] = (open) ? paneNode.style[dim] || paneStyle[dim] : this._closedSize;

		// We include the padding,border,margin width values for restoring on open
		var edgeNames = ["Top", "Right", "Bottom", "Left"];
		dojo.forEach(["padding","margin","border"], function(pname) {
			for(var i=0; i<edgeNames.length; i++){
				var fullname = pname+edgeNames[i]; 
				if(pname=="border") {
					pname+="Width";
				}
				if(undefined !== paneStyle[fullname]) {
					styleProps[fullname] = (open) ? 
						paneStyle[fullname] : 0;
				}
			}
		});
		return styleProps;
	},
	
	_setStateClass: function() {
		// sumamry: 
		//	apply the appropriate classes for the current open state
		if(this.open) {
			dojo.removeClass(this.domNode, "dojoxToggleSplitterClosed");
			dojo.addClass(this.domNode, "dojoxToggleSplitterOpen");
			dojo.removeClass(this.toggleNode, "dojoxToggleSplitterIconClosed");
			dojo.addClass(this.toggleNode, "dojoxToggleSplitterIconOpen");
		} else {
			dojo.addClass(this.domNode, "dojoxToggleSplitterClosed");
			dojo.removeClass(this.domNode, "dojoxToggleSplitterOpen");
			dojo.addClass(this.toggleNode, "dojoxToggleSplitterIconClosed");
			dojo.removeClass(this.toggleNode, "dojoxToggleSplitterIconOpen");
		}
	},
	_setOpenAttr: function(/*Boolean*/ value, /* Boolean */ force){
		// summary: 
		// 	setter for the open property
		if(force || value != this.open) {
			this.open = value;
			this._handleOnChange(value, true);
		}
	},

	_toggleMe: function(evt) {
		// summary: 
		// 	event handle, toggle the open state
		if(evt) {
			dojo.stopEvent(evt);
		}
		this.attr("open", !this.open);
	},

	_onKeyPress: function(/*Event*/ e){
		this.inherited(arguments); 
		// TODO: add support for space, enter to cause toggle
	}

});

// As BC places no constraints on what kind of widgets can be children
// we have to extend the base class to ensure the properties we need can be set (both in markup and programatically)
dojo.extend(dijit._Widget, {
	// toggleSplitterOpen: Boolean
	toggleSplitterOpen: true, 
	
	// toggleSplitterClosedThreshold: Integer
	toggleSplitterClosedThreshold: 5, 

	// toggleSplitterClosedThreshold: String
	// 		a css size value (e.g. "100px")
	toggleSplitterOpenSize: ""
});