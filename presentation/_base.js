dojo.provide("dojox.presentation._base");

dojo.require("dijit._Widget");
dojo.require("dijit._Container"); 
dojo.require("dijit._Templated");
dojo.require("dijit.layout.StackContainer"); 
dojo.require("dijit.layout.ContentPane"); 
dojo.require("dijit.util.place"); 
dojo.require("dojo.fx"); 

dojo.declare(
	"dojox.presentation",
	[dijit.layout.StackContainer,dijit._Templated],
	null,
	{

	// TODOC: TODO: make this make sense
	// TODO: hash marks jump to slide
	fullScreen: true,
	useNav: true,
	noClick: false,
	setHash: true,

	// just to over-ride:
	templateString: null,
	templatePath: dojo.moduleUrl('dojox.presentation','resources/Show.html'),
	nextIcon:dojo.moduleUrl('dojox.presentation','resources/icons/next.png'),
	prevIcon:dojo.moduleUrl('dojox.presentation','resources/icons/prev.png'),

	// Private:
	_slides: [], 
	_connects: [],
	_navShowing: true,
	_inNav: false,
	
	startup: function() {
		
		dojox.presentation.superclass.startup.call(this);
		this._connects.push(dojo.connect(document,'onclick',this,'gotoSlideByEvent'));
		var tmp = (dojo.isIE) 	? dojo.connect(document,'onkeydown',this,'gotoSlideByEvent') 
					: dojo.connect(document,'onkeypress', this, 'gotoSlideByEvent');
		this._connects.push(tmp);
		// only if fs == true?
		this._connects.push(dojo.connect(window,'onresize', this, '_resizeWindow'));
		this._resizeWindow();
		
		this._updateSlides(); 
	},


	_hideNav: function(evt) {
		if (this._navAnim) { this._navAnim.stop(); }
		this._navAnim = dojo.animateProperty({
			node:this.showNav, 
			duration:620, 
			properties: {
				opacity: { end:0.1 } 
			}
		}).play();
	
	},

	_showNav: function(evt) {
		if (this._navAnim) { this._navAnim.stop(); }
		this._navAnim = dojo.animateProperty({
			node:this.showNav, 
			duration:350, 
			properties: { 
				opacity: { end:0.9 }
			}
		}).play();
		
	},

	_handleNav: function(evt) {
		evt.stopPropagation(); 
	},

	_updateSlides: function() {
		this._slides = this.getChildren(); 
		if (this.useNav) {
			// populate the select box with top-level slides
			var i=0;
			dojo.forEach(this._slides,dojo.hitch(this,function(slide){
				i++;
				var tmp = this._option.cloneNode(true);
				tmp.text = slide.title+" ("+i+") ";
				this._option.parentNode.insertBefore(tmp,this._option);
			}));
			this._option.parentNode.removeChild(this._option);
		}
	},

	gotoSlideByEvent: function(evt) {

		var _node = evt.target;
		var _type = evt.type;
		
		if (_type == "click" || _type == "change") {
			if(_node.index && _node.parentNode == this.select) { 
				this.selectChild(this._slides[_node.index]); 
			}else if(_node == this.select) {
				this.selectChild(this._slides[_node.selectedIndex]);
			}else{
				if (this.noClick || this.selectedChildWidget.noClick) return; 
				this.selectedChildWidget._nextAction(evt);
			}
		} else if(_type=="keydown" || _type == "keypress") {
			var key = evt.keyCode;
			var ch = evt.charCode;
			if (key == 63234 || key == 37) {
				this.previousSlide(evt);
			} else if(key == 63235 || key == 39 || ch == 32) {
				this.selectedChildWidget._nextAction(evt); 
			}
		}
		evt.stopPropagation(); 
	},

	nextSlide: function(evt) {
		if (!this.selectedChildWidget.isLastChild) {
			this.forward();
			this.select.selectedIndex += 1; 
		}
		if (evt) { evt.stopPropagation(); }
	},

	previousSlide: function(evt) {
		if (!this.selectedChildWidget.isFirstChild) {
			this.back();
			this.select.selectedIndex -= 1; 
		}
		if (evt) { evt.stopPropagation();}
	},

	_resizeWindow: function(/*Event*/ ev){
		// only if fs?
		dojo.body().style.height = "auto";
		var wh = dijit.util.getViewport(); 
		var h = Math.max(
			document.documentElement.scrollHeight || dojo.body().scrollHeight,
			wh.h);
		var w = wh.w; 
		this.selectedChildWidget.domNode.style.height = h +'px';
		this.selectedChildWidget.domNode.style.width = w +'px';
	},


	_transition: function(newWidget,oldWidget) { 
		var anims = [];
		if(oldWidget){
			anims.push(dojo.fadeOut({ node: oldWidget.domNode, 
				duration:250, 
				onEnd: dojo.hitch(this,function(){
					this._hideChild(oldWidget);
				})
			}));
                }
		anims.push(dojo.fadeIn({ node:newWidget.domNode, start:0, end:1, duration:300, 
			onEnd: dojo.hitch(this,function(){
				this._showChild(newWidget);
				newWidget._resetActions();
				}) 
		})); 
		dojo.fx.combine(anims).play();
	}

});

dojo.declare(
	"dojox.presentation.Slide",
	[dijit.layout.ContentPane,dijit._Contained,dijit._Templated],
	null,
	{
	
	templateString: '<div dojoAttachPoint="showSlide" class="dojoShowPrint"><h1 class="showTitle" dojoAttachPoint="slideTitle"></h1><div class="dojoShowBody" dojoAttachPoint="containerNode"></div></div>',
	refreshOnShow: true, 
	preLoad: false,
	doLayout: true,
	noClick: false,

	_nextAction: function(evt){
		// do this if no more actions [currentChild isLastChild
		this.getParent().nextSlide(evt);
	},

	startup: function(){
		this.slideTitle.innerHTML = this.title; 
		
	},	

	_resetActions: function() {
	// summary: set action chain back to 0
	}
});

dojo.declare("dojox.presentation.Part",
	[dijit._Widget,dijit._Contained],
	null,
	{

	
});

dojo.declare(
	"dojox.presentation.Action",
	[dijit._Widget,dijit._Contained],
	null,
	{

	

});
