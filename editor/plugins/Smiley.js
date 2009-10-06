dojo.provide("dojox.editor.plugins.Smiley");
dojo.experimental("dojox.editor.plugins.Smiley");

dojo.require("dojo.i18n");
dojo.require("dijit._editor._Plugin");
dojo.require("dijit.form.ToggleButton");
dojo.require("dijit.form.DropDownButton");
dojo.require("dojox.editor.plugins._SmileyPalette");

dojo.requireLocalization("dojox.editor.plugins", "Smiley");

dojo.declare("dojox.editor.plugins.Smiley", dijit._editor._Plugin, {
	// summary:
	//		This plugin allows the user to select from emoticons or "smileys" 
	//		to insert at the current cursor position.
	//
	// description:
	//		The commands provided by this plugin are:
	//		* smiley - inserts the selected emoticon

	// iconClassPrefix: [const] String
	//		The CSS class name for the button node is formed from `iconClassPrefix` and `command`
	iconClassPrefix: "dijitAdditionalEditorIcon",

	_initButton: function(){
		// summary:
		//		Over-ride for creation of the save button.
		this.dropDown = new dojox.editor.plugins._SmileyPalette();
		this.connect(this.dropDown, "onChange", function(emoticon){
			this.button.closeDropDown();
			this.editor.focus();
			this.editor.execCommand("inserthtml", emoticon);
		});
		var strings = dojo.i18n.getLocalization("dojox.editor.plugins", "Smiley");
		this.button = new dijit.form.DropDownButton({
			label: strings.smiley,
			showLabel: false,
			iconClass: this.iconClassPrefix + " " + this.iconClassPrefix + "Smiley",
			tabIndex: "-1",
			dropDown: this.dropDown
		});
	},

	setEditor: function(editor){
		// summary:
		//		Over-ride for the setting of the editor.
		// editor: Object
		//		The editor to configure for this plugin to use.
		this.editor = editor;
		this._initButton();

/*
		this.editor.addKeyHandler("s", true, true, dojo.hitch(this, function() {
			this.button.openDropDown();
			this.dropDown.focus();
		}));
*/

//		editor.contentPreFilters.push(this._preFilterEntities);
//		editor.contentPostFilters.push(this._postFilterEntities);
	},

	_preFilterEntities: function(s/*String content passed in*/){
		// summary:
		//		A function to filter out emoticons into their UTF-8 character form
		//		displayed in the editor.  It gets registered with the preFilters
		//		of the editor.
		// tags:
		//		private.
//TODO
	},

	_postFilterEntities: function(s/*String content passed in*/){
		// summary:
		//		A function to filter out emoticons into encoded form so they 
		//		are properly displayed in the editor.  It gets registered with the 
		//		postFilters of the editor.
		// tags:
		//		private.
//TODO
	}
});

// Register this plugin.
dojo.subscribe(dijit._scopeName + ".Editor.getPlugin",null,function(o){
	if(o.plugin){ return; }
	if(o.args.name === "smiley"){
		o.plugin = new dojox.editor.plugins.Smiley();
	}
});
