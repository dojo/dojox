define([
	"dojo/dom-construct",
	"dojo/dom-class",
	"dojo/_base/lang",
	"dojo/_base/declare",
	"dojo/_base/array",
	"dijit/_WidgetBase",
	"dijit/_Container",
	"dijit/_Contained",
	"./SpinWheelSlot"
],
	function(domConstruct, domClass, lang, declare, array, WidgetBase, Container, Contained, SpinWheelSlot){
	// module:
	//		dojox/mobile/SpinWheel
	// summary:
	//		TODOC

	/*=====
		WidgetBase = dijit._WidgetBase;
		Container = dijit._Container;
		Contained = dijit._Contained;
	=====*/
	return declare("dojox.mobile.SpinWheel", [WidgetBase, Container, Contained],{
		slotClasses: [],
		slotProps: [],
		centerPos: 0,

		buildRendering: function(){
			this.inherited(arguments);
			domClass.add(this.domNode, "mblSpinWheel");
			this.centerPos = Math.round(this.domNode.offsetHeight / 2);

			this.slots = [];
			for(var i = 0; i < this.slotClasses.length; i++){
				this.slots.push(((typeof this.slotClasses[i] =='string') ? lang.getObject(this.slotClasses[i]) : this.slotClasses[i])(this.slotProps[i]));
				this.addChild(this.slots[i]);
			}
			domConstruct.create("DIV", {className: "mblSpinWheelBar"}, this.domNode);
		},

		startup: function(){
			this.inherited(arguments);
			var _this = this;
			setTimeout(function(){
				_this.reset();
			}, 0);
		},

		getValue: function(){
			// return array of slot values
			var a = [];
			array.forEach(this.getChildren(), function(w){
				if(w instanceof SpinWheelSlot){
					a.push(w.getValue());
				}
			}, this);
			return a;
		},

		setValue: function(a){
			// set slot values from array
			var i = 0;
			array.forEach(this.getChildren(), function(w){
				if(w instanceof SpinWheelSlot){
					w.setValue(a[i]);
					w.setColor(a[i]);
					i++;
				}
			}, this);
		},

		reset: function(){
			array.forEach(this.getChildren(), function(w){
				if(w instanceof SpinWheelSlot){
					w.setInitialValue();
				}
			}, this);
		}
	});
});
