dojo.provide("dojox.editor.plugins.CollapsibleToolbar");

dojo.require("dijit._editor._Plugin");

dojo.requireLocalization("dojox.editor.plugins", "CollapsibleToolbar");

dojo.declare("dojox.editor.plugins.CollapsibleToolbar",dijit._editor._Plugin,{
	// summary:
	//		This plugin provides a weappable toolbar container to allow expand/collapse
	//		of the editor toolbars.  This plugin should be registered first in most cases to
	//		avoid conflicts in toolbar construction.
	
	setEditor: function(editor){
		// summary:
		//		Over-ride for the setting of the editor.
		// editor: Object
		//		The editor to configure for this plugin to use.
		this.editor = editor;
		this._constructContainer();
	},

	_constructContainer: function(){
		// summary:
		//		Internal function to construct a wrapper for the toolbar/header that allows
		//		it to expand and collapse.  It effectively builds a containing table, 
		//		which handles the layout nicely and gets BIDI support by default.
		// tags:
		//		private
		var strings = dojo.i18n.getLocalization("dojox.editor.plugins", "CollapsibleToolbar");
		
		// Build the containers.
		var container = dojo.create("table", {style: { width: "100%" }, tabindex: -1, "class": "dojoxCollapsibleToolbarContainer"});
		var tbody = dojo.create("tbody", {tabindex: -1}, container);
		var row = dojo.create("tr", {tabindex: -1}, tbody);
		var openTd = dojo.create("td", {"class": "dojoxCollapsibleToolbarControl", tabindex: -1}, row);
		var closeTd = dojo.create("td", {"class": "dojoxCollapsibleToolbarControl",  tabindex: -1}, row);
		var menuTd = dojo.create("td", {style: { width: "100%" }, tabindex: -1}, row);
		var m = dojo.create("span", {style: { width: "100%" }, tabindex: -1}, menuTd);

		// Put in actual clickable containers in the open/close holders.
		openTd.appendChild(dojo.create("div", {
			"class": "dojoxCollapsibleToolbarCollapse", 
			tabindex: "0", 
			role: "button", 
			title: strings.collapse}));
		closeTd.appendChild(dojo.create("div", {
			"class": "dojoxCollapsibleToolbarExpand", 
			tabindex: "0", 
			role: "button", 
			title: strings.expand}));

		// Attach everything in now.
		dojo.style(closeTd, "display", "none");
		dojo.place(container, this.editor.toolbar.domNode, "after");
		dojo.place(this.editor.toolbar.domNode, m);

		this.openTd = openTd;
		this.closeTd = closeTd;
		this.menu = m;

		// Establish the events to handle open/close.
		this.connect(openTd.firstChild, "onclick", "_onClose");
		this.connect(closeTd.firstChild, "onclick", "_onOpen");
		this.connect(openTd.firstChild, "onkeydown", "_keyClose");
		this.connect(closeTd.firstChild, "onkeydown", "_keyOpen");

		// Set up some focus handlers so hilighting appears on IE.  Focus box needed 
		// to be A11Y compliant.
		if(dojo.isIE){
			this.connect(openTd.firstChild, "onfocus", function(){
				dojo.addClass(openTd.firstChild, "dojoxCollapsibleToolbarButtonFocus");
			});
			this.connect(openTd.firstChild, "onblur", function(){
				dojo.removeClass(openTd.firstChild, "dojoxCollapsibleToolbarButtonFocus");
			});
			this.connect(closeTd.firstChild, "onfocus", function(){
				dojo.addClass(closeTd.firstChild, "dojoxCollapsibleToolbarButtonFocus");
			});
			this.connect(closeTd.firstChild, "onblur", function(){
				dojo.removeClass(closeTd.firstChild, "dojoxCollapsibleToolbarButtonFocus");
			});
		}
	},

	_keyOpen: function(e){
		// summary:
		//		Internal function for handling a key event that will open the toolbar.
		// e:
		//		The key event.
		// tags:
		//		private
		if(e.keyCode == dojo.keys.SPACE || e.keyCode == dojo.keys.ENTER){
			dojo.stopEvent(e);
			this._onOpen();
			// To be IE safe, focus outside of event handler.
			setTimeout(dojo.hitch(this, function(){
				dijit.focus(this.openTd.firstChild);
			}), 0);
		}
	},

	_keyClose: function(e){
		// summary:
		//		Internal function for handling a key event that will close the toolbar.
		// e:
		//		The key event.
		// tags:
		//		private
		if(e.keyCode == dojo.keys.SPACE || e.keyCode == dojo.keys.ENTER){
			dojo.stopEvent(e);
			this._onClose();
			// To be IE safe, focus outside of event handler.
			setTimeout(dojo.hitch(this, function(){
				dijit.focus(this.closeTd.firstChild);
			}), 0);
		}
	},

	_onClose: function(e){
		 // summary:
		 //		Internal function for handling a click event that will close the toolbar.
		 // e:
		 //		The click event.
		 // tags:
		 //		private
		 if(e){ dojo.stopEvent(e); }
		 var size = dojo.marginBox(this.editor.domNode);
		 dojo.style(this.openTd, "display", "none");
		 dojo.style(this.closeTd, "display", "");
		 dojo.style(this.menu, "display", "none");
		 this.editor.resize({h: size.h});
	},

	_onOpen: function(e) {
		 // summary:
		 //		Internal function for handling a click event that will open the toolbar.
		 // e:
		 //		The click event.
		 // tags:
		 //		private
		 if(e){ dojo.stopEvent(e); }
		 var size = dojo.marginBox(this.editor.domNode);
		 dojo.style(this.closeTd, "display", "none");
		 dojo.style(this.openTd, "display", "");
		 dojo.style(this.menu, "display", "");
		 this.editor.resize({h: size.h});
	}
});

// Register this plugin.
dojo.subscribe(dijit._scopeName + ".Editor.getPlugin",null,function(o){
	if(o.plugin){ return; }
	var name = o.args.name.toLowerCase();
	if(name === "collapsibletoolbar"){
		o.plugin = new dojox.editor.plugins.CollapsibleToolbar({});
	}
});
