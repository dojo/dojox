define(["./RoundRectCategory"],function(RoundRectCategory){
	return dojo.declare("dojox.mobile.EdgeToEdgeCategory", RoundRectCategory, {
		buildRendering: function(){
			this.inherited(arguments);
			this.domNode.className = "mblEdgeToEdgeCategory";
		}
	});
});
