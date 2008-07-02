dojo.provide("dojox.widget.FilePicker");

dojo.require("dojox.widget.RollingList");

dojo.require("dojo.i18n"); 
dojo.requireLocalization("dojox.widget", "FilePicker"); 

dojo.declare("dojox.widget._FileInfoPane", 
	[dojox.widget._RollingListPane], {
	// summary: a pane to display the information for the currently-selected
	//	file
	
	// templateString: string
	//	delete our template string
	templateString: "",
	
	// templatePath: string
	//	Our template path
	templatePath: dojo.moduleUrl("dojox.widget", "FilePicker/_FileInfoPane.html"),
	
	postMixInProperties: function(){
		this._messages = dojo.i18n.getLocalization("dojox.widget", "FilePicker", this.lang);
		this.inherited(arguments);
	},

	onItems: function(){
		// summary:
		//	called after a fetch or load - at this point, this.items should be
		//  set and loaded.
		var store = this.store, item = this.items[0];
		if(!item){
			this._onError("Load", new Error("No item defined"));
		}else{
			this.nameNode.innerHTML = store.getLabel(item);
			this.pathNode.innerHTML = store.getIdentity(item);
			this.sizeNode.innerHTML = store.getValue(item, "size");
			this.parentWidget.scrollIntoView(this);
			this.inherited(arguments);
		}
	}
});

dojo.declare("dojox.widget.FilePicker", dojox.widget.RollingList, {
	// summary: a specialized version of RollingList that handles file information
	//  in a store
	
	className: "dojoxFilePicker",
	
	// fileSeparator: string
	//  Our file separator - it will be guessed if not set
	fileSeparator: "",
	
	// topDir: string
	//	The top directory string - it will be guessed if not set
	topDir: "",
		
	// parentAttr: string
	//	the attribute to read for finding our parent directory
	parentAttr: "parentDir",
	
	// pathAttr: string
	//  the attribute to read for getting the full path of our file
	pathAttr: "path",
	
	startup: function(){
		if(this._started){ return; }
		this.inherited(arguments);
		// Figure out our file separator if we don't have it yet
		var conn, child = this.getChildren()[0];
		var setSeparator = dojo.hitch(this, function(){
			if(conn){
				this.disconnect(conn);
			}
			delete conn;
			var item = child.items[0];
			if(item){
				var store = this.store;
				var parent = store.getValue(item, this.parentAttr);
				var path = store.getValue(item, this.pathAttr);
				if(!this.fileSeparator){
					this.fileSeparator = path.substring(parent.length, parent.length + 1);
				}
				if(!this.topDir){
					this.topDir = parent + this.fileSeparator;
				}
			}
		});
		if(!this.fileSeparator || !this.topDir){
			if(!child.items){
				conn = this.connect(child, "onItems", setSeparator);
			}else{
				setSeparator();
			}
		}
	},
	
	getChildItems: function(item){
		var ret = this.inherited(arguments);
		if(!ret && this.store.getValue(item, "directory")){
			// It's an empty directory - so pass through an empty array
			ret = [];
		}
		return ret;
	},
	
	_onChange: function(/*item*/val){
		this.onChange();
		this.onPathChange(this.getPathValue(val));
	},
	
	getMenuItemForItem: function(/*item*/ item, /* dijit._Contained */ parentPane, /* item[]? */ children){
		var iconClass = "dojoxDirectoryItemIcon";
		if(!this.store.getValue(item, "directory")){
			iconClass = "dojoxFileItemIcon";
			var l = this.store.getLabel(item), idx = l.lastIndexOf(".");
			if(idx >= 0){
				iconClass += " dojoxFileItemIcon_" + l.substring(idx + 1);
			}
		}
		var ret = new dijit.MenuItem({
			iconClass: iconClass
		});
		return ret;
	},
	
	getPaneForItem: function(/*item*/ item, /* dijit._Contained */ parentPane, /* item[]? */ children){
		var ret = null;
		if(!item || (this.store.isItem(item) && this.store.getValue(item, "directory"))){
			ret = new dojox.widget._RollingListGroupPane({});
		}else if(this.store.isItem(item) && !this.store.getValue(item, "directory")){
			ret = new dojox.widget._FileInfoPane({});
		}
		return ret;
	},
	
	onPathChange: function(/*string*/ newPath){
		// Summary: called with the new path whenever a path has been changed
	},
	
	setValueFromString: function(/*string*/ path){
		// Summary: sets the value of this widget based off the given path
		this.store.fetchItemByIdentity({identity: path,
										onItem: this.setValue,
										scope: this});
	},
	
	getPathValue: function(/*item?*/val){
		// summary: returns the path value of the given value (or current value
		//  if not passed a value)
		if(!val){
			val = this.value;
		}
		if(val && this.store.isItem(val)){
			return this.store.getValue(val, this.pathAttr);
		}else{
			return "";
		}
	}
});