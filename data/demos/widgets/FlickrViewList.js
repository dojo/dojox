dojo.provide("dojox.data.demos.widgets.FlickrViewList");
dojo.require("dojox.dtl._Templated");
dojo.require("dijit._Widget");

dojo.declare("dojox.data.demos.widgets.FlickrViewList", 
	[ dijit._Widget, dojox.dtl._Templated ],
	{
		store: null,
		items: null,

		templatePath: dojo.moduleUrl("dojox", "data/demos/widgets/templates/FlickrViewList.html"),

		fetch: function(request){
			request.onComplete = dojo.hitch(this, "onComplete");
			request.onError = dojo.hitch(this, "onError");
			return this.store.fetch(request);
		},

		onError: function(){
			this.items = [];
			this.render();
		},

		onComplete: function(items, request){
			console.debug(items);
			this.items = items||[];
			this.render();
		},

		clearList: function(){
			while(this.list.firstChild){
				this.list.removeChild(this.list.firstChild);
			}
			for(var i = 0; i < this.fViewWidgets.length; i++){
				this.fViewWidgets[i].destroy();
			}
			this.fViewWidgets = [];
		},

		addView: function(viewData){
			 var newView  = new dojox.data.demos.widgets.FlickrView(viewData);
			 this.fViewWidgets.push(newView);
			 this.list.appendChild(newView.domNode);
		}
	}
);
