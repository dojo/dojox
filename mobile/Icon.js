define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dojo/dom-construct",
	"./iconUtils"
], function(declare, lang, domClass, domConstruct, iconUtils){

	// module:
	//		dojox/mobile/Icon
	// summary:
	//		A wrapper for image icon, css sprite icon, or DOM Button.

	return declare("dojox.mobile.Icon", null,{
		// summary:
		//		A DOM Button wrapper.
		// description:
		//		This widget creates a specified DOM Button.
		// example:
		//		Image icon:
		//	|	<div data-dojo-type="dojox.mobile.Icon"
		//	|		data-dojo-props='icon:"images/tab-icon-12h.png"'></div>
		//
		//		CSS sprite icon:
		//	|	<div data-dojo-type="dojox.mobile.Icon"
		//	|		data-dojo-props='icon:"images/tab-icons.png",iconPos:"29,116,29,29"'></div>
		//
		//		DOM Button:
		//	|	<div data-dojo-type="dojox.mobile.Icon"
		//	|		data-dojo-props='icon:"mblDomButtonBlueCircleArrow"'></div>

		icon: "",
		iconPos: "",
		alt: "",
		tag: "div",

		constructor: function(args, node){
			if(args){
				lang.mixin(this, args);
			}
			this.domNode = node || domConstruct.create(this.tag);
			iconUtils.createIcon(this.icon, this.iconPos, null, this.alt, this.domNode);
		}
	});
});
