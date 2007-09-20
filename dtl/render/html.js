dojo.provide("dojox.dtl.render.html");

dojox.dtl.render.html.sensitivity = {
	// summary:
	//		Set conditions under which to buffer changes
	// description:
	//		Necessary if you make a lot of changes to your template.
	//		What happens is that the entire node, from the attached DOM Node
	//		down gets swapped with a clone, and until the entire rendering
	//		is complete, we don't replace the clone again. In this way, renders are
	//		"batched".
	//
	//		But, if we're only changing a small number of nodes, we might no want to buffer at all.
	//		The higher numbers mean that even small changes will result in buffering.
	//		Each higher level includes the lower levels.
	NODE: 1, // If a node changes, implement buffering
	ATTRIBUTE: 2, // If an attribute or node changes, implement buffering
	TEXT: 3 // If any text at all changes, implement buffering
}
dojox.dtl.render.html.Render = function(/*dojox.dtl.HtmlTemplate*/ tpl){
	this._tpl = tpl;
	this.swap = dojo.hitch(this, function(){
		// summary: Swaps the node out the first time the DOM is changed
		// description: Gets swapped back it at end of render
		if(this.domNode === this._tpl.getRootNode()){
			var frag = this.domNode;
			this.domNode = this.domNode.cloneNode(true);
			frag.parentNode.replaceChild(this.domNode, frag);
		}
	});
}
dojo.mixin(dojox.dtl.render.html.Render.prototype, {
	setTemplate: function(/*dojox.dtl.HtmlTemplate*/ tpl, /*Object?*/ context){
		this.context = context || this.context;
		if(this._tpl && this.context){
			this._tpl.unrender(this.context, this._tpl.getBuffer());
		}
		this._tpl = tpl;
	},
	attach: function(/*Node*/ node){
		this.domNode = node;
	},
	render: function(/*Object*/ context, /*dojox.dtl.html.Buffer?*/ buffer){
		this.context = context;
		buffer = buffer || this._tpl.getBuffer();
		if(context.getThis() && context.getThis().buffer == 1){
			buffer.onAddNode = this.swap;
			buffer.onRemoveNode = this.swap;
		}
		var frag = this._tpl.render(context, buffer).getParent();
		if(this.domNode !== frag){
			this.domNode.parentNode.replaceChild(frag, this.domNode);
			this.domNode = frag;
		}
	}
});