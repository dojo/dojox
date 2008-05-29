/* package: dojox.layout.dnd.Avatar
Description: 	
	 Drag And Drop Management.
*/
dojo.provide("dojox.layout.dnd.Avatar");

dojo.require("dojo.dnd.common");

/* Class: Avatar
	An object, which represents transferred OAF DnD items visually.
*/
dojox.layout.dnd.Avatar = function(manager,opacity){
	this.manager = manager;
	this.construct(opacity);
};

dojo.extend(dojox.layout.dnd.Avatar, {
	/*Function: construct
		A constructor function. it is separate so it can be (dynamically) overwritten in case of need.*/
	construct: function(/*int*/ opacity){
		var source = this.manager.source;
		var node = (source.creator)?
		// create an avatar representation of the node
		source._normalizedCreator(source.getItem(this.manager.nodes[0].id).data, "avatar").node :
		// or just clone the node and hope it works
		this.manager.nodes[0].cloneNode(true); 
		node.id = dojo.dnd.getUniqueId();	
		dojo.addClass(node,"dojoDndAvatar");
		node.style.position = "absolute";
		node.style.zIndex = 1999;
		node.style.margin = "0px";
		node.style.width = dojo.marginBox(this.manager.source.node).w+"px";
		dojo.style(node,"opacity",opacity);
		this.node = node;
	},
	/*Function: destroy
		A desctructor for the avatar, called to remove all references so it can be garbage-collected.*/
	destroy: function(){
		dojo._destroyElement(this.node);
		this.node = false;
	},
	/*Function: update
		Updates the avatar to reflect the current DnD state.*/
	update: function(){
		dojo[(this.manager.canDropFlag ? "add" : "remove") + "Class"](this.node, "dojoDndAvatarCanDrop");
	},
	/*Function: _generateText*/
	_generateText: function(){
		//Nothing to do
	}
});

/* package: dojox.layout.dnd.Avatar
Description: 	
	 Drag And Drop Management.
*/
dojo.provide("dojox.layout.dnd.Avatar");

dojo.require("dojo.dnd.common");

/* Class: Avatar
	An object, which represents transferred OAF DnD items visually.
*/
dojox.layout.dnd.Avatar = function(manager,opacity){
	this.manager = manager;
	this.construct(opacity);
};

dojo.extend(dojox.layout.dnd.Avatar, {
	/*Function: construct
		A constructor function. it is separate so it can be (dynamically) overwritten in case of need.*/
	construct: function(/*int*/ opacity){
		var source = this.manager.source;
		var node = (source.creator)?
		// create an avatar representation of the node
		source._normalizedCreator(source.getItem(this.manager.nodes[0].id).data, "avatar").node :
		// or just clone the node and hope it works
		this.manager.nodes[0].cloneNode(true); 
		node.id = dojo.dnd.getUniqueId();	
		dojo.addClass(node,"dojoDndAvatar");
		node.style.position = "absolute";
		node.style.zIndex = 1999;
		node.style.margin = "0px";
		node.style.width = dojo.marginBox(this.manager.source.node).w+"px";
		dojo.style(node,"opacity",opacity);
		this.node = node;
	},
	/*Function: destroy
		A desctructor for the avatar, called to remove all references so it can be garbage-collected.*/
	destroy: function(){
		dojo._destroyElement(this.node);
		this.node = false;
	},
	/*Function: update
		Updates the avatar to reflect the current DnD state.*/
	update: function(){
		dojo[(this.manager.canDropFlag ? "add" : "remove") + "Class"](this.node, "dojoDndAvatarCanDrop");
	},
	/*Function: _generateText*/
	_generateText: function(){
		//Nothing to do
	}
});

