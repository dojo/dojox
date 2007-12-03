dojo.provide("dojox.layout.ScrollPane");
dojo.experimental("dojox.layout.ScrollPane");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.declare("dojox.layout.ScrollPane",[dijit._Widget,dijit._Templated],{
    // summary: A pane that "scrolls" its content based on the mouse poisition inside
    //
    // description:
    //		A sizable container that takes it's content's natural size and creates
    //		a scroll effect based on the relative mouse position. It is an interesting
    //		way to display lists of data, or blocks of content, within a confined
    //		space.
    //
    // 		Horizontal scrolling is supported. Combination scrolling is not.
    //
    //		FIXME: need to adust the _line somehow, it stops scrolling
    //		
    // example:
    // |	<div dojoType="dojox.layout.ScrollPane" style="width:150px height:300px;">
    // |		<!-- any height content -->
    // |	</div>
    //
    // _line: dojo._Line
    // 		storage for our top and bottom most scrollpoints
    _line: null,

    // _lo: the height of the visible pane
    _lo: null,

    // orientation: String
    //		either "horizontal" or "vertical" for scroll orientation. 
    orientation: "vertical",

    // our simple template
    templatePath: dojo.moduleUrl("dojox.layout","resources/ScrollPane.html"),

    init: function(){
	// summary: calculates required sizes. call this if we add/remove content manually, or reload the content.
	this._line = new dojo._Line(0,this.containerNode[(this._vertical ? "scrollHeight" : "scrollWidth" )]);
	this._lo = dojo.coords(this.wrapper,true);
    },

    postCreate: function(){
	this.inherited(arguments);
	this._vertical = (this.orientation == "vertical");
	// so it has a width
	if(!this._vertical){ dojo.addClass(this.containerNode,"dijitInline"); }
	dojo.style(this.wrapper,"overflow","hidden");	
    },	

    startup: function(){
	this.inherited(arguments);
	this.connect(this.domNode,"onmousemove","_calc");
	this.init();
    },

    _set: function(/* Int */diff){
	// summary: set the pane's scroll offset 
	this.wrapper[(this._vertical ? "scrollTop" : "scrollLeft")] = Math.floor(diff);
    },

    _calc: function(/* Event */e){
	// summary: calculate the relative offset of the cursor over the node, and call _set
	var n = (this._vertical ? 
	    ((e.pageY-(this._lo.t)-5)/this._lo.h) :
	    ((e.pageX-(this._lo.l)-15)/this._lo.w)
	);
	this._set(this._line.getValue(n))
    }
    
});
