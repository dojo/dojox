dojo.provide("dojox.dtl.tag.misc");

dojo.require("dojox.dtl._base");

dojox.dtl.tag.misc.CommentNode = function(){}
dojo.extend(dojox.dtl.tag.misc.CommentNode, {
	render: function(context, buffer){
		return buffer;
	},
	unrender: function(context, buffer){
		return buffer;
	},
	clone: function(){
		return this;
	},
	toString: function(){ return "dojox.dtl.tag.misc.CommentNode"; }
});

dojox.dtl.tag.misc.comment = function(parser, text){
	// summary: Ignore everything between {% comment %} and {% endcomment %}
	parser.skipPast("endcomment");
	return new dojox.dtl.tag.misc.CommentNode();
}