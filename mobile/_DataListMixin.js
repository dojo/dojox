dojo.provide("dojox.mobile._DataListMixin");

// summary:
//		Mixin for widgets to generate the list items corresponding to the data
//		provider object.
// description:
//		By mixing this class into the widgets, the list item nodes are generated
//		as the child nodes of the widget and automatically re-generated
//		whenever the corresponding data items are modified.

dojo.declare(
	"dojox.mobile._DataListMixin",
	null,
{
	// store: Object
	//		Reference to data provider object
	store: null,

	// query: Object
	//		A query that can be passed to 'store' to initially filter the items.
	query: null,

	queryOptions: null,

	buildRendering: function(){
		this.inherited(arguments);
		if(!this.store){ return; }
		this.setStore(this.store, this.query, this.queryOptions);
	},

	setStore: function(store, query, queryOptions){
		this.store = store;
		this.query = query;
		this.queryOptions = queryOptions;
		if(this.store.onNew){
			this.connect(this.store, "onNew", "onNew");
		}
		if(this.store.onDelete){
			this.connect(this.store, "onDelete", "onDelete");
		}
		this.refresh();
	},

	refresh: function() {
		// summary:
		//		Generate the list items.
		if(!this.store){ return; }
		this.store.fetch({
			query: this.query,
			queryOptions: this.queryOptions,
			onComplete: dojo.hitch(this, "generateList"),
			onError: dojo.hitch(this, "onError")
		});
	},

	createListItem: function(item) {
		var attr = {};
		dojo.forEach(this.store.getAttributes(item), function(name){
			attr[name] = this.store.getValue(item, name);
		}, this);
		var w = new dojox.mobile.ListItem(attr);
		item._widgetId = w.id;
		return w;
	},

	generateList: function(/*Array*/items, /*Object*/ dataObject) {
		dojo.forEach(this.getChildren(), function(child){
			child.destroyRecursive();
		});
		dojo.forEach(items, function(item, index){
			this.addChild(this.createListItem(item));
		}, this);
	}, 

	onError: function(errText){
		console.error(this.declaredClass + ": " + errText);
	},

	onNew: function(/* item */ newItem, /*object?*/ parentInfo){
		this.addChild(this.createListItem(newItem));
	},

	onDelete: function(/* item */ deletedItem){
		dijit.byId(deletedItem._widgetId).destroyRecursive();
	}
});
