dojo.provide("dojox.dtl.contrib.event");

dojo.require("dojox.dtl.html");

dojox.dtl.contrib.event.EventNode = dojo.extend(function(type, fn){
	this._type = type;
	this.contents = fn;
},
{
	render: function(context, buffer){
		if(!this._clear){
			buffer.getParent()[this._type] = null;
			this._clear = true;
		}
		if(this.contents && !this._rendered){
			if(!context.getThis()) throw new Error("You must use Context.setObject(instance)");
			buffer.onAddEvent(buffer.getParent(), this._type, this.contents);
			this._rendered = dojo.connect(buffer.getParent(), this._type, context.getThis(), this.contents);
		}
		return buffer;
	},
	unrender: function(context, buffer){
		if(this._rendered){
			dojo.disconnect(this._rendered);
			this._rendered = false;
		}
		return buffer;
	},
	clone: function(){
		return new this.constructor(this._type, this.contents);
	}
});

dojox.dtl.contrib.event.on = function(parser, text){
	// summary: Associates an event type to a function (on the current widget) by name
	var parts = text.split(" ");
	return new dojox.dtl.contrib.event.EventNode(parts[0], parts[1]);
}

dd.register.tags("dojox.dtl.contrib", {
	"event": [[/(attr:)?on(click|key(up))/i, "on"]]
});