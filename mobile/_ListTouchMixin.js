define([
	"dojo/_base/declare",
	"dojo/_base/event",
	"dijit/form/_ListBase"
], function(declare, event, ListBase){

	return declare( "dojox.mobile._ListTouchMixin", ListBase, {
		// summary:
		//		Focus-less menu to handle touch events consistently.
		// description:
		//		Focus-less menu to handle touch events consistently. Abstract 
		//		method that must be defined externally:
		//			onClick: item was chosen (mousedown somewhere on the menu and mouseup somewhere on the menu)
	
		postCreate: function(){
			this.inherited(arguments);
			this.connect(this.domNode, "onclick", "_onClick");
		},
	
		_onClick: function(/*Event*/ evt){
			event.stop(evt);
			var target = this._getTarget(evt);
			if(target){
				this._setSelectedAttr(target);
				this.onClick(target);
			}
		}
	});
});
