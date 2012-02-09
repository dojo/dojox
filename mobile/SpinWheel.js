define([
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/kernel",
	"dojo/_base/lang",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dijit/_Contained",
	"dijit/_Container",
	"dijit/_WidgetBase",
	"./SpinWheelSlot"
], function(array, declare, kernel, lang, domClass, domConstruct, Contained, Container, WidgetBase, SpinWheelSlot){

/*=====
	var Contained = dijit._Contained;
	var Container = dijit._Container;
	var WidgetBase = dijit._WidgetBase;
=====*/

	// module:
	//		dojox/mobile/SpinWheel
	// summary:
	//		A value picker widget that has spin wheels.

	return declare("dojox.mobile.SpinWheel", [WidgetBase, Container, Contained],{
		// summary:
		//		A value picker widget that has spin wheels.
		// description:
		//		SpinWheel is a value picker component. It is a sectioned wheel
		//		that can be used to pick up some values from the wheel slots by
		//		spinning them.

		// slotClasses: Array
		//		An array of slot classes to be this SpinWheel's slots.
		slotClasses: [],

		// slotProps: Array
		//		An array of property objects for each slot class specified in
		//		slotClasses.
		slotProps: [],

		/* internal properties */	
		centerPos: 0,

		buildRendering: function(){
			this.inherited(arguments);
			domClass.add(this.domNode, "mblSpinWheel");

			this.slots = [];
			for(var i = 0; i < this.slotClasses.length; i++){
				this.slots.push(((typeof this.slotClasses[i] =='string') ? lang.getObject(this.slotClasses[i]) : this.slotClasses[i])(this.slotProps[i]));
				this.addChild(this.slots[i]);
			}
			domConstruct.create("div", {className: "mblSpinWheelBar"}, this.domNode);
		},

		startup: function(){
			this.centerPos = Math.round(this.domNode.offsetHeight / 2);
			this.inherited(arguments);
			this.reset();
		},

		getValue: function(){
			kernel.deprecated(this.declaredClass+"::getValue() is deprecated. Use get('value') instead.", "", "2.0");
			return this.get("value");
		},
		_getValueAttr: function(){
			// summary:
			//		Returns an array of slot values.
			var a = [];
			array.forEach(this.getChildren(), function(w){
				if(w instanceof SpinWheelSlot){
					a.push(w.get("value"));
				}
			}, this);
			return a;
		},

		setValue: function(/*Array*/a){
			kernel.deprecated(this.declaredClass+"::setValue() is deprecated. Use set('value', a) instead.", "", "2.0");
			return this.set("value", a);
		},
		_setValueAttr: function(/*Array*/a){
			// summary:
			//		Sets the slot values.
			var i = 0;
			array.forEach(this.getChildren(), function(w){
				if(w instanceof SpinWheelSlot){
					w.set("value", a[i]);
					w.setColor(a[i]);
					i++;
				}
			}, this);
		},

		reset: function(){
			// summary:
			//		Resets the SpinWheel to show the initial values.
			array.forEach(this.getChildren(), function(w){
				if(w instanceof SpinWheelSlot){
					w.setInitialValue();
				}
			}, this);
		}
	});
});
