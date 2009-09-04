dojo.provide("dojox.editor.plugins.ShowBlockNodes");

dojo.require("dijit._editor._Plugin");
dojo.require("dojo.i18n");

dojo.requireLocalization("dojox.editor.plugins", "ShowBlockNodes");

dojo.declare("dojox.editor.plugins.ShowBlockNodes",dijit._editor._Plugin,{
	// summary:
	//		This plugin provides ShowBlockNodes cabability to the editor.  When 
	//		clicked, the document in the editor will apply a class to specific
	//		block nodes to make them visible in the layout.  This info is not
	//		exposed/extracted when the editor value is obtained, it is purely for help
	//		while working on the page.

	// buttonClass [protected]
	//		Over-ride indicating the class of button to use, in this case a toggle.
	buttonClass: dijit.form.ToggleButton,

	// useDefaultCommand [protected]
	//		Over-ride indicating that the command processing is done all by this plugin.
	useDefaultCommand: false,

	// iconClassPrefix: [const] String
	//		The CSS class name for the button node is formed from `iconClassPrefix` and `command`
	iconClassPrefix: "dijitAdditionalEditorIcon",

	// _styled [private]
	//		Flag indicating the document has had the style updates applied.
	_styled: false,

	_initButton: function(){
		//	summary:
		//		Over-ride for creation of the resize button.
		var strings = dojo.i18n.getLocalization("dojox.editor.plugins", "ShowBlockNodes");
		this.command = "showBlockNodes";
		this.editor.commands[this.command] = strings["showBlockNodes"];
		this.inherited(arguments);
		delete this.command; // kludge so setEditor doesn't make the button invisible

		this.connect(this.button, "onChange", 
			dojo.hitch(this, this._showBlocks));

		this.editor.addKeyHandler(dojo.keys.F9, true, true, dojo.hitch(this, function(){
			// Enable the CTRL-SHIFT-F9 hotkey for ViewBlockNodes
			this.toggle();
		}));
	},

	toggle: function(){
		// summary:
		//		Function to allow programmatic toggling of the view.
		this.button.attr("checked", !this.button.attr("checked"));
	},

	_showBlocks: function(show){
		// summary:
		//		Function to trigger printing of the editor document
		// tags:
		//		private
		var doc = this.editor.iframe.contentWindow.document;
		if(!this._styled){
			try{
				//Attempt to inject our specialized style rules for doing this.
				this._styled = true;

				var style = "";
				var blocks = ["div", "p", "ul", "ol", "table", "h1", 
					"h2", "h3", "h4", "h5", "h6", "pre", "dir", "center", 
					"blockquote", "form", "fieldset", "address", "object",
					"pre", "hr", "ins", "noscript", "li", "map", "button", 
					"dd", "dt"];

				var template = ".editorShowBlocks {TAG} {\n" +
					"\tbackground-image: url({MODURL}/images/blockelems/{TAG}.gif);\n" +
					"\tbackground-repeat: no-repeat;\n"	+
					"\tbackground-position: top left;\n" +
					"\tborder-width: 1px;\n" +
					"\tborder-style: dashed;\n" +
					"\tborder-color: #D0D0D0;\n" +
					"\tpadding-top: 15px;\n" +
					"\tpadding-left: 15px;\n" +
				"}\n";

				dojo.forEach(blocks, function(tag){
					style += template.replace(/\{TAG\}/gi, tag); 
				});

				//Finally associate in the image locations based off the module url.
				var modurl = dojo.moduleUrl(dojox._scopeName, "editor/plugins/resources").toString();
				if(!(modurl.match(/^https?:\/\//i)) &&
				   !(modurl.match(/^file:\/\//i))){
					// We have to root it to the page location on webkit for some nutball reason. 
					// Probably has to do with how iframe was loaded.
					var bUrl = this._calcBaseUrl(dojo.doc.location.href);
					if(bUrl[bUrl.length - 1] !== "/"){
						bUrl += "/";
					}
					modurl = bUrl + modurl;
				}
				// Update all the urls.
				style = style.replace(/\{MODURL\}/gi, modurl);

				if(!dojo.isIE){
					var sNode = doc.createElement("style");
					sNode.appendChild(doc.createTextNode(style));
					doc.getElementsByTagName("head")[0].appendChild(sNode);
				}else{
					var ss = doc.createStyleSheet("");
					ss.cssText = style;
				}
			}catch(e){
				console.warn(e);
			}
		}

		// Apply/remove the classes based on state.
		if(show){
			dojo.withDoc(doc, function(){
				dojo.addClass(dojo.body(), "editorShowBlocks");
			});
		}else{
			dojo.withDoc(doc, function(){
				dojo.removeClass(dojo.body(), "editorShowBlocks");
			});
		}
	},

	_calcBaseUrl: function(fullUrl) {
		// summary:
		//		Internal function used to figure out the full root url (no relatives)
		//		for loading images in the styles in the iframe.
		// fullUrl:
		//		The full url to tear down to the base.
		// tags:
		//		private
		var baseUrl = null;
		if (fullUrl !== null) {
			// Check to see if we need to strip off any query parameters from the Url.
			var index = fullUrl.indexOf("?");
			if (index != -1) {
				fullUrl = fullUrl.substring(0,index);
			}

			// Now we need to trim if necessary.  If it ends in /, then we don't 
			// have a filename to trim off so we can return.
			index = fullUrl.lastIndexOf("/");
			if (index > 0 && index < fullUrl.length) {
				baseUrl = fullUrl.substring(0,index);
			}else{
				baseUrl = fullUrl;
			}
		}
		return baseUrl; //String
	}
});

// Register this plugin.
dojo.subscribe(dijit._scopeName + ".Editor.getPlugin",null,function(o){
	if(o.plugin){ return; }
	var name = o.args.name.toLowerCase();
	if(name ===  "showblocknodes"){
		o.plugin = new dojox.editor.plugins.ShowBlockNodes();
	}
});
