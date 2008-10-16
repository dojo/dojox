dojo.provide("dojox.layout.FlickStackContainer");
dojo.require("dijit.layout.StackContainer");

dojo.declare(
	"dojox.layout.FlickStackContainer",
	dijit.layout.StackContainer, {
	postCreate: function(){
		this.inherited(arguments);

		this.axis = (this.baseClass == "dijitAccordionContainer") ? "Y" : "X";
		dojo.forEach(
			["touchstart", "touchmove", "touchend", "touchcancel"],
			function(p){
				this.connect(this.domNode, p, this._touch);
			}, this);
	},

	threshold: 100,

	_touch: function(e){

		switch(e.type){
			case "touchmove":
				if(this.touchPosition){
					var delta = e.touches[0]["page" + this.axis] - this.touchPosition;
					if(Math.abs(delta) > this.threshold){
						delete this.touchPosition;
						if(delta > 0){
							!this.selectedChildWidget.isLastChild && this.forward();
						}else{
							!this.selectedChildWidget.isFirstChild && this.back();
						}
					}
				}
				break;
			case "touchstart":
				if(e.touches.length == 1){
					this.touchPosition = e.touches[0]["page" + this.axis];
					break;
				}
			// else fallthrough
			case "touchend":
			case "touchcancel":
				delete this.touchPosition;
		}
	}
});