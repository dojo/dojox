define([
	"dojo/_base/declare",
	"dojo/_base/window",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/dom-style",
	"./Tooltip",
	"./Overlay"
], function(declare, win, domClass, domConstruct, domStyle, Tooltip, Overlay){

	/*=====
		Tooltip = dojox.mobile.Tooltip;
		Overlay = dojox.mobile.Overlay;
	=====*/
	var cls = declare("dojox.mobile.Opener", domClass.contains(win.doc.documentElement, "dj_phone") ? Overlay : Tooltip, {
		// summary:
		//		A non-templated popup widget that will use either Tooltip or Overlay depending on screen size
		//
		onShow: function(/*DomNode*/node){},
		onHide: function(/*DomNode*/node, /*Anything*/v){},
		show: function(node, positions){
			this.node = node;
			this.onShow(node);
			if(!this.cover){
				this.cover = domConstruct.create('div', {style: {position:'absolute', top:'0px', left:'0px', width:'100%', height:'100%', backgroundColor:'transparent' }}, this.domNode, 'before');
				this.connect(this.cover, "onclick", "_onBlur");
			}
			domStyle.style(this.cover, "visibility", "visible");
			return this.inherited(arguments);
		},

		hide: function(/*Anything*/ val){
			domStyle.style(this.cover, "visibility", "hidden");
			this.inherited(arguments);
			this.onHide(this.node, val);
		},

		_onBlur: function(e){
			if(this.onBlur(e) !== false){ // only exactly false prevents hide()
			        this.hide(e);
			}
		},

		destroy: function(){
			this.inherited(arguments);
			domConstruct.destroy(this.cover);
		}

	});
	cls.prototype.baseClass += " mblOpener"; // add to either mblOverlay or mblTooltip
	return cls;
});
