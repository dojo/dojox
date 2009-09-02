dojo.provide("dojox.editor.plugins.Smiley");
dojo.experimental("dojox.editor.plugins.Smiley");

dojo.require("dijit._editor._Plugin");

(function(){
dojo.declare("dojox.editor.plugins.Smiley",
	dijit._editor._Plugin,
	{
		//	summary:
		//		This plugin provides a dropdown with a choice of emoticons

		// Override _Plugin.buttonClass to use DropDownButton (with SmileyPalette) to control this plugin
		buttonClass: dijit.form.DropDownButton,

//TODO: set initial focus/selection state?

		constructor: function(){
			this.dropDown = new dojox.editor.plugins._SmileyPalette();
			this.connect(this.dropDown, "onChange", function(color){
				this.editor.execCommand(this.command, color);
			});
		}
	}
);
})();

// Register this plugin.
dojo.subscribe(dijit._scopeName + ".Editor.getPlugin",null,function(o){
	if(o.plugin){ return; }
	switch(o.args.name){
	case "smiley":
		o.plugin = new dijit._editor.plugins.Smiley({command: o.args.name});
	}
});
