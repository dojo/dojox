dojo.provide("dojox.layout.ExpandoPane");
dojo.experimental("dojox.layout.ExpandoPane"); // just to show it can be done?

dojo.require("dijit.layout.ContentPane");
dojo.require("dijit._Templated");

dojo.declare("dojox.layout.ExpandoPane",
	[dijit.layout.ContentPane,dijit._Templated],
	{
	// summary: An experimental expando-pane for dijit.layout.BorderContainer
	//
	// description:
	//		Works just like a ContentPane inside of a borderContainer, though
	//		only supports left and right regions. Will expand/collapse on
	//		command, and supports having Layout Children as direct descendants
	//		via a custom "attachParent" attribute

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
		this._container = dijit.byId("bc");
		this._titleHeight = dojo._getBorderBox(this.titleWrapper).h + 2;
	
		// FIXME: should be check both?
		if(typeof this.easeIn == "string"){
			this.easeOut = dojo.getObject(this.easeOut);
			this.easeIn = dojo.getObject(this.easeIn); 
		}
	
		if(this.region){
			// FIXME: add suport for alternate region types?
			switch(this.region){
				case "right" :
					dojo.addClass(this.titleWrapper,"iconLeft");
					break;
				case "left" :
					dojo.addClass(this.titleWrapper,"iconRight");
					break;
			}
		}
		this._setupAnims();
	},
	
	_setupAnims:function(){
		// summary: create the show and hide animations
		dojo.forEach(this._animConnects,dojo.disconnect);
		var _common = {
			node:this.domNode,
			duration:this.duration
		}
		this._showAnim = dojo.animateProperty(dojo.mixin(_common,{
			easing:this.easeIn,
			properties: {
				width:{ end:this.maxWidth||275, unit:"px" }
			}
		}));
		this._hideAnim = dojo.animateProperty(dojo.mixin(_common,{
			easing:this.easeOut,
			properties: {
				width:{
					end: this._titleHeight - 6, unit:"px"
				}
			}
		}));

		this._animConnects = [
			dojo.connect(this._showAnim,"onEnd",this,"_setEnd"),
			dojo.connect(this._hideAnim,"onEnd",this,"_setEnd")
		];
	},
	
	toggle:function(e){
		// summary: toggle this pane's visibility
		if(this._showing){					
			dojo.style(this.cwrapper,{ "visibility":"hidden" });
			if(this._showAnim && this._showAnim.stop()){}
			this._hideAnim.play();
		}else{
			if(this._hideAnim && this._hideAnim.stop()){}
			this._showAnim.play();
			
		}
		dojo[(this._showing ? "addClass" : "removeClass")](this.domNode,"dojoxExpandoClosed");
	},
	
	_setEnd: function(){
		// summary: common animation onEnd code
		this._showing = !this._showing;
		if(this._showing){
			dojo.style(this.cwrapper,{ "visibility":"visible" });
		}
		setTimeout(dojo.hitch(this._container,"layout"),50);
	},
	
	resize: function(){
		// summary: we aren't a layout widget, but need to act like one:
		var size = dojo.marginBox(this.domNode);
		dojo.query("[attachParent]",this.domNode).forEach(function(n){
			console.log(n);
			var dij = dijit.byNode(n);
			if(dij){
				var h = size.h - this._titleHeight;
				console.log(h);
				dojo.style(this.containerNode,"height",h+"px");
			}
		},this);
		this.inherited(arguments);
	}

});