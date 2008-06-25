dojo.provide("dojox.widget.FilePicker");
dojo.experimental("dojox.widget.FilePicker");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit._Container");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.Menu");
dojo.require("dojox.html.metrics");

dojo.require("dojo.i18n"); 
dojo.requireLocalization("dojox.widget", "FilePicker"); 

dojo.declare("dojox.widget._FilePickerItemMixin", null, {
	// summary: a mixin to provide shared functionality between different types
	//	of pickers
	
	// store: dojo.data.api.Read
	//	a read store
	store: null,
	
	// item: item
	//	a dojo.data item from teh above store
	item: null,
	
	postMixInProperties: function(){
		this.label = this.store.getLabel(this.item);
		this.inherited(arguments);
	},
	
	blur: function(){
		// summary: blurs this item
		dojo.removeClass(this.domNode, "dijitMenuItemHover");
	},
	
	postCreate: function(){
		dojo.addClass(this.domNode, "dojoxPickerItem");
		if(this.type){
			dojo.addClass(this.domNode, "dojox" + this.type + "PickerItem");
		}
		this.connect(this.focusNode, "blur", "blur");
		this.inherited(arguments);
	}
});

dojo.declare("dojox.widget._FilePickerFileItem",
	[dijit.MenuItem, dojox.widget._FilePickerItemMixin], {
	// summary: an item that represents a file
	
	// type: String
	//  The type of this item
	type: "File"
});

dojo.declare("dojox.widget._FilePickerDirectoryItem",
	[dijit.MenuItem, dojox.widget._FilePickerItemMixin], {
	// summary: an item that represents a directory
	
	// type: String
	//  The type of this item
	type: "Directory",
	
	startup: function(){
		dojo.style(this.arrowWrapper, "display", "");
	}
});

dojo.declare("dojox.widget._FileInfoPane",
	[dijit._Widget, dijit._Templated, dijit._Contained], {
	// summary: a pane to display the information for the currently-selected
	//  file
	
	// templatePath: string
	//  Our template path
	templatePath: dojo.moduleUrl("dojox.widget", "FilePicker/_FileInfoPane.html"),
	
	// store: dojo.data.api.Read
	//  the read store we must use
	store: null,
	
	// item: item
	//  the item from the above store for this pane to display
	item: null,
	
	postMixInProperties: function(){
		this._messages = dojo.i18n.getLocalization("dojox.widget", "FilePicker", this.lang);
	},
	
	postCreate: function(){
		var store = this.store, item = this.item;
		this.inherited(arguments);
		// Set the values of the info for this item
		this.nameNode.innerHTML = store.getLabel(item);
		this.pathNode.innerHTML = store.getIdentity(item);
		this.sizeNode.innerHTML = store.getValue(item, "size");
		this.parentWidget.scrollIntoView(this);
	}
});

dojo.declare("dojox.widget._FilePickerPane", 
	[dijit.layout.ContentPane, dijit._Templated, dijit._Contained], {
	// summary: a pane that represents a directory - provides options for
	//  selecting sub-items.
	
	// templateString: string
	//	our template
	templateString: '<div class="dojoxPickerPane"><div dojoAttachPoint="containerNode"></div><div dojoAttachPoint="menuContainer"><div dojoAttachPoint="menuNode"></div></div></div>',
	
	// store: dojo.data.api.Read
	//  the read store we must use
	store: null,
	
	// query: object
	//  a query to pass to the datastore.  This is only used if items are null
	query: null,
	
	// queryOptions: object
	//  query options to be passed to the datastore
	queryOptions: null,
	
	// items: item[]
	//  an array of (possibly not-yet-loaded) items to display in this.
	//  If this array is null, then the query and query options are used to
	//  get the top-level items to use.
	items: null,
	
	// parentWidget: dojox.widget.FilePicker
	//  Our parent widget
	parentWidget: null,
	
	// class: string
	//  We override this to dijitInline so things display correctly
	"class": "dijitInline",
	
	_loadCheck: function(/* Boolean? */ forceLoad){
		// summary: checks that the store is loaded
		var displayState = this._isShown();
		if((this.store || this.items) && (forceLoad || (this.refreshOnShow && displayState) || (!this.isLoaded && displayState))){
			this._doQuery();
		}
	},
	
	_doQuery: function(){
		// summary: either runs the query or loads potentially not-yet-loaded items.
		this.isLoaded = false;
		this._setContent(this.loadingMessage);
		this.parentWidget.scrollIntoView(this);
		if(this.items){
			var _waitCount = 0, store = this.store, items = this.items;
			dojo.forEach(items, function(item){ if(!store.isItemLoaded(item)){ _waitCount++; }});
			if(_waitCount === 0){
				this._createItems();
			}else{
				var onItem = dojo.hitch(this, function(item){
					_waitCount--;
					if((_waitCount) === 0){
						this._createItems();
					}
				});
				dojo.forEach(items, function(item){
					if(!store.isItemLoaded(item)){
						store.loadItem({item: item, onItem: onItem});
					}
				});
			}
		}else{
			this.store.fetch({query: this.query, onComplete: function(items){
				this.items = items;
				this._createItems();
			}, scope: this});
		}
	},
	
	onItemClick: function(/* dijit.MenuItem */ item, /* Event */ evt){
		// summary: Called when a menu item has been clicked.  Updates the 
		//  panes correctly
		var store = this.store;
		if(item.type == "Directory" && !item._paneWidget){
			item._paneWidget = new dojox.widget._FilePickerPane({store: store,
																items: store.getValues(item.item, "children"),
																parentWidget: this.parentWidget});
		}else if(item.type == "File" && !item._paneWidget){
			item._paneWidget = new dojox.widget._FileInfoPane({store: store, item: item.item, parentWidget: this.parentWidget});
		}
		if(item._paneWidget){
			this.parentWidget.pushChild(item._paneWidget, this, true);
			this.parentWidget.onItemClick(item.item);
		}
		dojo.forEach(this.menu.getChildren(), function(i){
			dojo.toggleClass(i.domNode, "dojoxPickerItemSelected", i == item);
		});
	},
	
	focus: function(){
		// summary: focuses this widget (or its menu)
		if(this.menu){
			this.menu.focus();
		}else{
			var conn = this.connect(this, "_createItems", function(){
				this.disconnect(conn);
				this.menu.focus();
			});
		}
	},
	
	blurAll: function(){
		if(this.menu){
			dojo.forEach(this.menu.getChildren(), function(i){
				if(i.blur){
					i.blur();
				}
				dojo.removeClass(i.domNode, "dojoxPickerItemSelected");
			}, this);
		}
	},
	
	_createItems: function(){
		// summary: Creates the menu widget and the items to place within it.
		var self = this;
		var menu = this.menu = new dijit.Menu({
			onItemUnhover: function(/*MenuItem*/ item){item.blur();}
		}, this.menuNode);
		var store = this.store;
		if(this.items.length){
			dojo.forEach(this.items, function(item){
				var id = store.getIdentity(item);
				var w;
				if(store.getValue(item, "directory")){
					w = new dojox.widget._FilePickerDirectoryItem({store: store, item: item});
				}else{
					w = new dojox.widget._FilePickerFileItem({store: store, item: item});
				}
				menu.addChild(w);
			});
		}else{
			var c = new dijit.MenuItem({
				label: dojo.i18n.getLocalization("dojox.widget", "FilePicker", this.lang).empty,
				disabled: true
			});
			dojo.addClass(c.domNode, "dojoxPickerItem");
			menu.addChild(c);
		}
		this.connect(menu, "onItemClick", "onItemClick");
		if(!menu.started){
			menu.startup();
		}
		this.containerNode.innerHTML = "";
		this.containerNode.appendChild(menu.domNode);
		this.parentWidget.scrollIntoView(this);
		this._onLoadHandler();
	}
});

dojo.declare("dojox.widget.FilePicker",
	[dijit._Widget, dijit._Templated, dijit._Container], {
	// summary: a file picking widget that can be tied with a data store (such
	//  as dojox.data.FileStore)
	
	// templateString: string
	//  our template string to use
	templateString: '<div class="dojoxFilePicker" dojoAttachPoint="containerNode"></div>',
	
	// store: dojo.data.api.Read
	//  the read store we must use
	store: null,
	
	// query: object
	//  a query to pass to the datastore.  This is only used if items are null
	query: null,
	
	// queryOptions: object
	//  query options to be passed to the datastore
	queryOptions: null,
	
	// scrollDuration: integer
	//  time (in millis) to animate the smooth scroll across
	scrollDuration: 150,

	pushChild: function(/* dijit._Container */ child, /* dijit._Container? */ popUntil, /* Boolean? */ doFocus){
		// summary: pushes the given child to the end of the container.  It pops
		//  off any children from the end until the given popUntil is encountered.
		//  If popUntil is null, then nothing is popped off the end.
		var children, last;
		while(popUntil && (children = this.getChildren()) !== null && 
				children.length && (last = children[children.length - 1]) != popUntil){
			if(last.blurAll){
				last.blurAll();
			}
			this.removeChild(last);
		}
		this.addChild(child);
		if(!child._started){
			child.startup();
		}
		this.layout();
		this.scrollIntoView(child, doFocus||false);
	},
	
	onItemClick: function(/* item */ item){
		// summary: called when an item is clicked - it receives the store item
	},
	
	scrollIntoView: function(/* Widget */ childWidget, /* Boolean? */ doFocus){
		// summary: smoothly scrolls the given widget into view, and (optionally)
		//  focuses it.
		window.setTimeout(dojo.hitch(this, function(){
			var node = this.domNode;
			if(this._currentAnim && this._currentAnim.status() == "playing"){
				this._currentAnim.stop();
			}
			delete this._currentAnim;
			var tgt = node.scrollWidth - node.clientWidth;
			var _doFocus = function(){
				if(doFocus && childWidget.focus){
					childWidget.focus();
				}
			};
			if(node.scrollLeft != tgt){
				this._currentAnim = new dojo._Animation({
					curve: new dojo._Line(node.scrollLeft, tgt),
					onAnimate: function(val){
						node.scrollLeft = val;
					},
					duration: this.scrollDuration,
					onEnd: _doFocus
				}).play();
			}else{
				_doFocus();
			}
		}), 1);
	},
	
	resize: function(args){
		dijit.layout._LayoutWidget.prototype.resize.call(this, args);
	},
	
	layout: function(){
		if(this._contentBox){
			var height = this._contentBox.h - dojox.html.metrics.getScrollbar().h;
			dojo.forEach(this.getChildren(), function(c){
				dojo.marginBox(c.domNode, {h: height});
			});
		}
	},

	setStore: function(/* dojo.data.api.Read */ store){
		// summary: sets the store for this widget */
		if(store === this.store && this._started){ return; }
		this.store = store;
		this.pushChild(new dojox.widget._FilePickerPane({store: this.store, 
											query: this.query, 
											queryOptions: this.queryOptions,
											parentWidget: this}), null, false);
	},
	
	startup: function(){
		if(this._started){ return; }
		if(!this.getParent || !this.getParent()){
			this.resize();
			this.connect(dojo.global, "onresize", "resize");
		}
		this.setStore(this.store);
		this.inherited(arguments);
	}
});