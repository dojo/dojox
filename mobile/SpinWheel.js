define(["dojo/_base/array","dojo/_base/html","dijit/_WidgetBase","dijit/_Container","dijit/_Contained"],function(darray,dbase,WidgetBase,Container,Contained,ScrollableMixin){
	// module:
	//		dojox/mobile/SpinWheel
	// summary:
	//		TODOC

	return dojo.declare("dojox.mobile.SpinWheel", [WidgetBase,Container,Contained],{
		slotClasses: [],
		slotProps: [],
		centerPos: 0,

		buildRendering: function(){
			this.inherited(arguments);
			dojo.addClass(this.domNode, "mblSpinWheel");
			this.centerPos = Math.round(this.domNode.offsetHeight / 2);

			this.slots = [];
			for(var i = 0; i < this.slotClasses.length; i++){
				this.slots.push(((typeof this.slotClasses[i] =='string') ? dojo.getObject(this.slotClasses[i]) : this.slotClasses[i])(this.slotProps[i]));
				this.addChild(this.slots[i]);
			}
			dojo.create("DIV", {className: "mblSpinWheelBar"}, this.domNode);
		},

		startup: function(){
			this.inherited(arguments);
			var _this = this;
			setTimeout(function(){
				_this.reset();
			}, 0);
		},

		reset: function(){
			dojo.forEach(this.getChildren(), function(w){
				if(w instanceof dojox.mobile.SpinWheelSlot){
					w.setInitialValue();
				}
			}, this);
		}
	});
});
