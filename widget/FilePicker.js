dojo.provide("dojox.widget.FilePicker");

dojo.require("dojox.widget.RollingList");

dojo.require("dojo.i18n"); 
dojo.requireLocalization("dojox.widget", "FilePicker"); 

dojo.declare("dojox.widget._FileInfoPane", 
	[dojox.widget._RollingListPane, dijit._Templated], {
	// summary: a pane to display the information for the currently-selected
	//	file
	
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
	
	// parentAttr: string
	//	the attribute to read for finding our parent directory
	parentAttr: "parentDir",
	
	getChildItems: function(item){
		var ret = this.inherited(arguments);
		if(!ret && this.store.getValue(item, "directory")){
			// It's an empty directory - so pass through an empty array
			ret = [];
		}
		return ret;
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
	
	setValueFromString: function(/*string*/ path){
		// Summary: sets the value of this widget based off the given path
		this.store.fetchItemByIdentity({identity: path,
										onItem: this.setValue,
										scope: this});
	}
});