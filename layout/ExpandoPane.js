dojo.provide("dojox.layout.ExpandoPane");
dojo.experimental("dojox.layout.ExpandoPane"); // just to show it can be done?

dojo.require("dijit.layout.ContentPane");
dojo.require("dijit._Templated");
dojo.require("dijit._Container");

dojo.declare("dojox.layout.ExpandoPane",
	[dijit.layout.ContentPane,dijit._Templated,dijit._Contained],
	{
	// summary: An experimental expando-pane for dijit.layout.BorderContainer
	//
	// description:
	//		Works just like a ContentPane inside of a borderContainer, though
	//		only supports left and right regions. Will expand/collapse on
	//		command, and supports having Layout Children as direct descendants
	//		via a custom "attachParent" attribute

	maxHeight:"",
	maxWidth:"",

	tamplateString:null,
	templatePath:dojo.moduleUrl("dojox.layout","resources/ExpandoPane.html"),

	_showing:true,
	_titleHeight: 28, // FIXME: calculate

	// easeOut: String|Function
	//		easing function used to hide pane
	easeOut:"dojo._DefaultEasing",
	// easeIn: String|Function
	//		easing function use to show pane
	easeIn:"dojo._DefaultEasing",
	// duration: Integer
	//		duration to run show/hide animations
	duration:420,
	
	postCreate:function(){

		this.inherited(arguments);
		this._animConnects = [];

		this._isHorizontal = true;
		
		this._container = this.getParent();
		this._titleHeight = dojo.marginBox/*_getBorderBox*/(this.titleWrapper).h;
	
		if(typeof this.easeOut == "string"){
			this.easeOut = dojo.getObject(this.easeOut);
		}
		if(typeof this.easeIn == "string"){
			this.easeIn = dojo.getObject(this.easeIn); 
		}
	
		var thisClass = "";
		if(this.region){
			// FIXME: add suport for alternate region types?
			switch(this.region){
				case "right" :
					thisClass = "Right";
					break;
				case "left" :
					thisClass = "Left";
					break;
				case "top" :
					thisClass = "Top";
					break;
				case "bottom" :
					thisClass = "Bottom"; 
					break;
			}
			dojo.addClass(this.domNode,"dojoxExpando"+thisClass);
			this._isHorizontal = !/top|bottom/.test(this.region);
		}
		this._setupAnims();
		dojo.style(this.domNode,"overflow","hidden");
	},
	
	_setupAnims:function(){
		// summary: create the show and hide animations
		dojo.forEach(this._animConnects,dojo.disconnect);
		var _common = {
			node:this.domNode,
			duration:this.duration
		};

		var isHorizontal = this._isHorizontal;
		var showProps = {};
		var hideProps = {};

		var dimension = isHorizontal ? "width" : "height"; 
		showProps[dimension] = { 
			end:this[( isHorizontal ? "maxWidth" : "maxHeight")] || 275, 
			unit:"px" 
		};
		hideProps[dimension] = { 
			end: this._titleHeight, 
			unit:"px"
		};

		this._showAnim = dojo.animateProperty(dojo.mixin(_common,{
			easing:this.easeIn,
			properties: showProps 
		}));
		this._hideAnim = dojo.animateProperty(dojo.mixin(_common,{
			easing:this.easeOut,
			properties: hideProps
		}));

		this._animConnects = [
			dojo.connect(this._showAnim,"onEnd",this,"_setEnd"),
			dojo.connect(this._hideAnim,"onEnd",this,"_setEnd")
		];
	},
	
	toggle:function(e){
		// summary: toggle this pane's visibility
		if(this._showing){
			dojo.style(this.cwrapper,{
				"visibility":"hidden",
				"opacity":"0",
				"overflow":"hidden"
			});
			dojo.addClass(this.domNode,"dojoxExpandoClosed");
			if(this._showAnim && this._showAnim.stop()){}
			this._hideAnim.play();
		}else{
			if(this._hideAnim && this._hideAnim.stop()){}
			this._showAnim.play();
		}
	},
	
	_setEnd: function(){
		// summary: common animation onEnd code
		this._showing = !this._showing;
		if(this._showing){
			dojo.style(this.cwrapper,{ "opacity":"0", "visibility":"visible" });
			dojo.fadeIn({ node:this.cwrapper, duration:227 }).play(1);
			dojo.removeClass(this.domNode,"dojoxExpandoClosed");
		}
		setTimeout(dojo.hitch(this._container,"layout"),15);
	},
	
	resize: function(){
		// summary: we aren't a layout widget, but need to act like one:
		var size = dojo.marginBox(this.domNode);
		// FIXME: do i even need to do this query/forEach? why not just set the containerHeight always
		dojo.query("[attachParent]",this.domNode).forEach(function(n){
			if(dijit.byNode(n)){
				var h = size.h - this._titleHeight;
				dojo.style(this.containerNode,"height", h +"px");
			}
		},this);
		this.inherited(arguments);
	},
	
	_trap: function(e){
		dojo.stopEvent(e);
	}

});