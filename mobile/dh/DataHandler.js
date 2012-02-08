define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/Deferred",
	"./ContentTypeMap"
], function(declare, lang, Deferred, ContentTypeMap){

	// module:
	//		dojox/mobile/dh/DataHandler
	// summary:
	//		A component that provides an interface between data and handlers.

	return declare("dojox.mobile.dh.DataHandler", null, {
		ds: null,
		target: null,
		refNode: null,

		constructor: function(/*DataSource*/ ds, /*DomNode*/ target, /*DomNode*/ refNode){
			this.ds = ds;
			this.target = target;
			this.refNode = refNode;
		},

		processData: function(/*String*/ contentType, /*Function*/ callback){
			var ch = ContentTypeMap.getHandlerClass(contentType);
			require([ch], lang.hitch(this, function(ContentHandler){
				Deferred.when(this.ds.getData(), lang.hitch(this, function(){
					Deferred.when(new ContentHandler().parse(this.ds.text, this.target, this.refNode), function(id){
						callback(id);
					});
				}))
			}));
		}
	});
});
