dojo.provide("dojox.grid.enhanced.dnd._DndMover");

dojo.require("dojo.dnd.Mover");

dojo.declare("dojox.grid.enhanced.dnd._DndMover", dojo.dnd.Mover, {
	
	onMouseMove: function(e){
		// summary:
		//		Overwritten, see dojo.dnd.Mover.onMouseMove()
		dojo.dnd.autoScroll(e);
		var m = this.marginBox;
		this.host.onMove(this, {l: m.l + e.pageX, t: m.t + e.pageY}, {x:e.pageX, y:e.pageY});
		dojo.stopEvent(e);
	}
});
