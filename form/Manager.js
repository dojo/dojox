dojo.provide("dojox.form.Manager");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.require("dojox.form.manager.Mixin");
dojo.require("dojox.form.manager.FormMixin");
dojo.require("dojox.form.manager.ValueMixin");
dojo.require("dojox.form.manager.EnableMixin");
dojo.require("dojox.form.manager.DisplayMixin");
dojo.require("dojox.form.manager.ClassMixin");

dojo.declare("dojox.form.Manager", [
		dijit._Widget, dijit._Templated,
		dojox.form.manager.Mixin,
		dojox.form.manager.FormMixin,
		dojox.form.manager.ValueMixin,
		dojox.form.manager.EnableMixin,
		dojox.form.manager.DisplayMixin,
		dojox.form.manager.ClassMixin
], {
	// summary:
	//		The widget to orchestrate dynamic forms.
	// description:
	//		This widget hosts dojox.form.manager mixins.
	//		See dojox.form.manager.Mixin for more info.
	
	widgetsInTemplate: true,

	buildRendering: function(){
		var node = this.domNode = this.srcNodeRef;
		if(!this.containerNode){
			// all widgets with descendants must set containerNode
				this.containerNode = node;
		}
		this._attachTemplateNodes(node);
	},
	
	startup: function(){
		if(this._started){ return; }
		this._attachTemplateNodes(this.getDescendants(), function(n,p){ return n[p]; });
		this.inherited(arguments);
	}
});
