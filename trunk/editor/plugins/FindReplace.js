dojo.provide("dojox.editor.plugins.FindReplace");

dojo.require("dijit._editor._Plugin");
dojo.require("dijit.Toolbar");
dojo.require("dijit.form.TextBox");
dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.Button");
dojo.require("dijit.TooltipDialog");
dojo.require("dijit.Menu");
dojo.require("dijit.CheckedMenuItem");
dojo.require("dojox.editor.plugins.ToolbarLineBreak");
dojo.require("dojo.i18n");
dojo.require("dojo.string");

dojo.requireLocalization("dojox.editor.plugins", "FindReplace");

dojo.experimental("dojox.editor.plugins.FindReplace");


dojo.declare("dojox.editor.plugins._FindReplaceTextBox",
	[dijit._Widget, dijit._Templated],{
	// summary:
	//		Base class for widgets that contains a label (like "Font:")
	//		and a TextBox to pick a value.
	//		Used as Toolbar entry.

	textId: "", 
	label: "",
	widget: null,
	widgetsInTemplate: true,

	templateString:
		"<span style='white-space: nowrap' class='dijit dijitReset dijitInline findReplaceTextBox'>" +
			"<label class='dijitLeft dijitInline' for='${textId}'>${label}</label>" +
			"<input dojoType='dijit.form.TextBox' required=false intermediateChanges='true'" +
					"tabIndex='-1' id='${textId}' dojoAttachPoint='textBox' value='' style='width: 20em;'/>" +
		"</span>",

	postMixInProperties: function(){
		this.inherited(arguments);
		// Set some substitution variables used in the template
		this.id = dijit.getUniqueId(this.declaredClass.replace(/\./g,"_"));		
		this.textId = this.id + "_text";
		
		this.inherited(arguments);
	},

	postCreate: function(){
		this.textBox.attr("value", "");
		this.disabled =  this.textBox.attr("disabled");
		this.connect(this.textBox, "onChange", "onChange");
	},

	_setValueAttr: function(value){
		//if the value is not a permitted value, just set empty string to prevent showing the warning icon
		this.value = value;
		this.textBox.attr('value', value);
	},

	focus: function(){
		this.textBox.focus();
	},

	_setDisabledAttr: function(value){
		// summary:
		//		Over-ride for the button's 'disabled' attribute so that it can be 
		//		disabled programmatically.
		this.disabled = value;
		this.textBox.attr("disabled", value);
	},

	onChange: function(val){
		// summary:
		//		Stub function for change events on the box.
		this.value= val;
	}
});


dojo.declare("dojox.editor.plugins._FindReplaceCheckBox",
	[dijit._Widget, dijit._Templated],{
	// summary:
	//		Base class for widgets that contains a label (like "Match case: ")
	//		and a checkbox to indicate if it is checked or not.
	//		Used as Toolbar entry.

	checkId: "", 
	label: "",
	widget: null,
	widgetsInTemplate: true,

	templateString:
		"<span style='white-space: nowrap' class='dijit dijitReset dijitInline findReplaceCheckBox'>" +
			"<input dojoType='dijit.form.CheckBox' required=false " +
					"tabIndex='-1' id='${checkId}' dojoAttachPoint='checkBox' value=''/>" +
			"<label class='dijitLeft dijitInline' for='${checkId}'>${label}</label>" +
		"</span>",

	postMixInProperties: function(){
		this.inherited(arguments);
		// Set some substitution variables used in the template
		this.id = dijit.getUniqueId(this.declaredClass.replace(/\./g,"_"));		
		this.checkId = this.id + "_check";
		this.inherited(arguments);
	},

	postCreate: function(){
		this.checkBox.attr("checked", false);
		this.disabled =  this.checkBox.attr("disabled");
		this.checkBox.isFocusable = function() {return false;};
	},

	_setValueAttr: function(value){
		// summary:
		//		Passthrough for checkbox.
		// tags:
		//		private
		this.checkBox.attr('value', value);
	},

	_getValueAttr: function(){
		// summary:
		//		Passthrough for checkbox.
		// tags:
		//		private
		return this.checkBox.attr('value');
	},

	focus: function(){
		this.checkBox.focus();
	},

	_setDisabledAttr: function(value){
		// summary:
		//		Over-ride for the button's 'disabled' attribute so that it can be 
		//		disabled programmatically.
		this.disabled = value;
		this.checkBox.attr("disabled", value);
	}
});


dojo.declare("dojox.editor.plugins.FindReplace",[dijit._editor._Plugin],{
	//	summary:
	//		This plugin provides a Find/Replace cabability for the editor.
	//		Note that this plugin is NOT supported on Opera currently, as opera
	//		does not implement a window.find or equiv function.

	//	buttonClass: [protected]
	//		Define the class of button the editor uses.
	buttonClass: dijit.form.ToggleButton,

	// iconClassPrefix: [const] String
	//		The CSS class name for the button node is formed from `iconClassPrefix` and `command`
	iconClassPrefix: "dijitAdditionalEditorIcon",

	_initButton: function(){
		//	summary:
		//		Over-ride for creation of the resize button.
		var strings = dojo.i18n.getLocalization("dojox.editor.plugins", "FindReplace");
		this.button = new dijit.form.ToggleButton({
			label: strings["findReplace"],
			showLabel: false,
			iconClass: this.iconClassPrefix + " " + this.iconClassPrefix + "FindReplace",
			tabIndex: "-1",
			onChange: dojo.hitch(this, "_toggleFindReplace")
		});
		if(dojo.isOpera){
			// Not currently supported on Opera!
			this.button.attr("disabled", true);
		}
		//Link up so that if the toggle is disabled, then the view of Find/Replace is closed.
		this.connect(this.button, "attr", dojo.hitch(this, function(attr, val){
			if(attr === "disabled"){
	            this._toggleFindReplace((!val && this._displayed), true);
			}
		}));
	},

	setEditor: function(editor){
		this.editor = editor;
		this._initButton();
	},

	toggle: function(){
		// summary:
		//		Function to allow programmatic toggling of the find toolbar.
		this.button.attr("checked", !this.button.attr("checked"));
	},

	_toggleFindReplace: function(show, ignoreState){
		//	summary:
		//		Function to toggle whether or not find/replace is displayed.
		//	tags:
		//		private
		if(show && !dojo.isOpera){
			dojo.style(this._frToolbar.domNode, "display", "block");
			if(!ignoreState){
				this._displayed = true;
			}
		}else{
			dojo.style(this._frToolbar.domNode, "display", "none");
			if(!ignoreState){
				this._displayed = false;
			}
		}
		this.editor.resize();
	},

	setToolbar: function(toolbar){
		// summary:
		//		Over-ride so that find/replace toolbar is appended after the current toolbar.
		this.inherited(arguments);
		if(!dojo.isOpera){
			var strings = dojo.i18n.getLocalization("dojox.editor.plugins", "FindReplace");
			this._frToolbar = new dijit.Toolbar();
			dojo.style(this._frToolbar.domNode, "display", "none");
			dojo.place(this._frToolbar.domNode, toolbar.domNode, "after");
			this._frToolbar.startup();

			// Build options.
			this._caseSensitive = new dojox.editor.plugins._FindReplaceCheckBox({label: strings["matchCase"]});
			this._backwards = new dojox.editor.plugins._FindReplaceCheckBox({label: strings["backwards"]});
			this._replaceAll = new dojox.editor.plugins._FindReplaceCheckBox({label: strings["replaceAll"]});

			//Define the search/replace fields.
			this._findField = new dojox.editor.plugins._FindReplaceTextBox({label: strings.findLabel});
			this._frToolbar.addChild(this._findField);
			this._findButton = new dijit.form.Button({label: strings["findButton"], showLabel: true, 
				iconClass: this.iconClassPrefix + " " + this.iconClassPrefix + "FindRun"});
			this._frToolbar.addChild(this._findButton);
			this._frToolbar.addChild(this._caseSensitive);
			this._frToolbar.addChild(this._backwards);

			this._frToolbar.addChild(new dojox.editor.plugins._ToolbarLineBreak());

			this._replaceField = new dojox.editor.plugins._FindReplaceTextBox({label: strings.replaceLabel});
			this._frToolbar.addChild(this._replaceField);
			this._replaceButton = new dijit.form.Button({label: strings["replaceButton"], showLabel: true,
				iconClass: this.iconClassPrefix + " " + this.iconClassPrefix + "ReplaceRun"});
			this._frToolbar.addChild(this._replaceButton);
			this._frToolbar.addChild(this._replaceAll);

			//Set initial states, buttons should be disabled unless content is 
			//present in the fields.
			this._findButton.attr("disabled", true);
			this._replaceButton.attr("disabled", true);

			this.connect(this._findField, "onChange", "_checkButtons");
			this.connect(this._replaceField, "onChange", "_checkButtons");

			//Connect up the actual search events.
			this.connect(this._findButton, "onClick", "_find");
			this.connect(this._replaceButton, "onClick", "_replace");
			
			this._replDialog = new dijit.TooltipDialog();
			this._replDialog.startup();
			this._replDialog.attr("content", "");
			this._dialogTemplate = strings.replaceDialogText;
		}
	},

	_checkButtons: function(){
		 var fText = this._findField.attr("value");
		 var rText = this._replaceField.attr("value");
		 if(fText){
			 //Only enable if find text is not empty or just blank/spaces.
			 this._findButton.attr("disabled", false);
		 }else{
			 this._findButton.attr("disabled", true);
		 }
		 if(fText && rText && fText !== rText){
			 this._replaceButton.attr("disabled", false);
		 }else{
			 this._replaceButton.attr("disabled", true);
		 }
	},

	_find: function(){
		// summary:
		//		This function invokes a find on the editor document with the noted options for
		//		find.
		// tags:
		//		private.
		// returns:
		//		Boolean indicating if the content was found or not.
		var txt = this._findField.attr("value"); 
		if(txt){
			var caseSensitive = this._caseSensitive.attr("value");
			var backwards = this._backwards.attr("value");
			return this._findText(txt, caseSensitive, backwards);
		}
		return false;
	},

	_replace: function(){
		 var ed = this.editor;
		 ed.focus();
		 var txt = this._findField.attr("value"); 
		 var repTxt = this._replaceField.attr("value"); 

		 var replaced = 0;

		 if(txt){
			if(this._replaceDialogTimeout){
				clearTimeout(this._replaceDialogTimeout);
				this._replaceDialogTimeout = null;
				dijit.popup.close(this._replDialog);	
			}

			var replaceAll = this._replaceAll.attr("value");
			var caseSensitive = this._caseSensitive.attr("value");
			var backwards = this._backwards.attr("value");

			var selected = dojo.withGlobal(ed.window, 
				"getSelectedText", dijit._editor.selection, [null]);
			
			// Handle checking/replacing current selection.  For some reason on Moz
			// leading whitespace is trimmed, so we have to trim it down on this check
			// or we don't always replace.  Moz bug!
			if(dojo.isMoz){
				txt = dojo.trim(txt);
				selected = dojo.trim(selected);
			}
			var regExp = this._filterRegexp(txt, !caseSensitive);
			if(selected && regExp.test(selected)){
				ed.execCommand("inserthtml", repTxt);
				replaced++;
			}
			 
			// If replaceAll was set, we have to keep find/replacing till all are replaced.
			if(replaceAll){
				// Do the replace via timeouts to avoid locking the browser up for a lot of
				// replaces.
				var found = this._findText(txt, caseSensitive, backwards);
				var loopFind = function(){
					ed.execCommand("inserthtml", repTxt);
					replaced++;
					found = this._findText(txt, caseSensitive, backwards);
					if(found){
						setTimeout(dojo.hitch(this, loopFind), 10);
					}else{
						this._replDialog.attr("content", 
							dojo.string.substitute(this._dialogTemplate, {"0": "" + replaced})
						);
						dijit.popup.open({popup: this._replDialog, around: this._replaceButton.domNode});
						this._replaceDialogTimeout = setTimeout(dojo.hitch(this, function(){
							clearTimeout(this._replaceDialogTimeout);
							this._replaceDialogTimeout = null;
							dijit.popup.close(this._replDialog);	
						}), 5000);
					}
				};
				if(found){
					var newF = dojo.hitch(this, loopFind);
					newF();
				}
			}
		}
	},

	_findText: function(txt, caseSensitive, backwards){
		// summary:
		//		This function invokes a find with specific options
		// txt: String
		//		The text to locate in the document.
		// caseSensitive: boolean
		//		Whether or ot to search case-sensitively.
		// backwards: boolean
		//		Whether or not to search backwards in the document.
		// tags:
		//		private.
		// returns:
		//		Boolean indicating if the content was found or not.
		var ed = this.editor;
		var win = ed.window;
		var found = false;
		if(txt){
			if(win.find){
				found = win.find(txt, caseSensitive, backwards, false, false, false, false);
			}else{
				var doc = ed.document;
				if(doc.selection){
					/* IE */
					// Focus to restore position/selection, 
					// then shift to search from current position.
					this.editor.focus();
					var txtRg = doc.body.createTextRange();
					var curPos = doc.selection?doc.selection.createRange():null;
					if(curPos){
						if(backwards){
							txtRg.setEndPoint("EndToStart", curPos);
						}else{
							txtRg.setEndPoint("StartToEnd", curPos);
						}
					}
					var flags = caseSensitive?4:0;
					if(backwards){
						flags = flags | 1;
					}
					//flags = flags |
					found = txtRg.findText(txt,null,flags);
					if(found){
						txtRg.select();
					}
				}
			}
		}
		return found;
	},

	_filterRegexp: function(/*String*/pattern, /*boolean?*/ ignoreCase){
		// summary:  
		//		Helper function to convert a simple pattern to a regular expression for matching.
		// description:
		//		Returns a regular expression object that conforms to the defined conversion rules.
		//		For example:  
		//			ca*   -> /^ca.*$/
		//			*ca*  -> /^.*ca.*$/
		//			*c\*a*  -> /^.*c\*a.*$/
		//			*c\*a?*  -> /^.*c\*a..*$/
		//			and so on.
		//
		// pattern: string
		//		A simple matching pattern to convert that follows basic rules:
		//			* Means match anything, so ca* means match anything starting with ca
		//			? Means match single character.  So, b?b will match to bob and bab, and so on.
		//			\ is an escape character.  So for example, \* means do not treat * as a match, but literal character *.
		//				To use a \ as a character in the string, it must be escaped.  So in the pattern it should be 
		//				represented by \\ to be treated as an ordinary \ character instead of an escape.
		//
		//	ignoreCase:
		//		An optional flag to indicate if the pattern matching should be treated as case-sensitive or not when comparing
		//		By default, it is assumed case sensitive.
		var rxp = "";
		var c = null;
		for(var i = 0; i < pattern.length; i++){
			c = pattern.charAt(i);
			switch(c){
				case '\\':
					rxp += c;
					i++;
					rxp += pattern.charAt(i);
					break;
				case '$':
				case '^':
				case '/':
				case '+':
				case '.':
				case '|':
				case '(':
				case ')':
				case '{':
				case '}':
				case '[':
				case ']':
					rxp += "\\"; //fallthrough
				default:
					rxp += c;
			}
		}
		rxp = "^" + rxp + "$";
		if(ignoreCase){
			return new RegExp(rxp,"mi"); //RegExp
		}else{
			return new RegExp(rxp,"m"); //RegExp
		}
		
	},

	destroy: function(){
		// summary:
		//		Cleanup of our custom toolbar.
		this.inherited(arguments);
		if(this._replaceDialogTimeout){
			clearTimeout(this._replaceDialogTimeout);
			this._replaceDialogTimeout = null;
			dijit.popup.close(this._replDialog);	
		}
		if(this._frToolbar){
			this._frToolbar.destroyRecursive();
			this._frToolbar = null;
		}
		if(this._replDialog){
			this._replDialog.destroyRecursive();
			this._replDialog = null;
		}
	}
});


// Register this plugin.
dojo.subscribe(dijit._scopeName + ".Editor.getPlugin",null,function(o){
	if(o.plugin){ return; }
	var name = o.args.name.toLowerCase();
	if(name ===  "findreplace"){
		o.plugin = new dojox.editor.plugins.FindReplace({});
	}
});

