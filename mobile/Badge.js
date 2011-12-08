define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dojo/dom-construct",
	"./iconUtils"
], function(declare, lang, domClass, domConstruct, iconUtils){
	// module:
	//		dojox/mobile/Badge
	// summary:
	//		A utility to create/update a badge node.

	return declare("dojox.mobile.Badge", null, {
		value: "0",
		className: "mblDomButtonRedBadge",
		fontSize: 16, // [px]

		constructor: function(params, node){
			if (params){
				lang.mixin(this, params);
			}
			this.domNode = node ? node : domConstruct.create("div");
			domClass.add(this.domNode, "mblBadge");
			if(this.domNode.className.indexOf("mblDomButton") === -1){
				domClass.add(this.domNode, this.className);
			}
			if(this.fontSize !== 16){
				this.domNode.style.fontSize = this.fontSize + "px";
			}
			iconUtils.createDomButton(this.domNode);
			this.setValue(this.value);
		},

		getValue: function(){
			return this.domNode.firstChild.innerHTML;
		},

		setValue: function(/*String*/value){
			this.domNode.firstChild.innerHTML = value;
		}
	});
});
