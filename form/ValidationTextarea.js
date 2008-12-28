dojo.provide("dojox.form.ValidationTextarea");
dojo.require("dijit.form.Textarea");
dojo.require("dijit.Tooltip");
dojo.requireLocalization("dojox.form", "ValidationTextarea");

dojo.declare("dojox.form.ValidationTextarea", [dijit.form.Textarea],{
	// summary:
	//		A Textarea subclass with the ability to validate content of various types and provide user feedback.
	
	//	maxLength: Number
	//		The maximum amount of characters allowed in the textarea.
	//		The value of '0' disables the check.
	maxLength:0,
	
	// required: Boolean
	//		If true, an empty field will be invalid.
	required: false,
	
	// requiredMessage: String
	//		Message to display to user when textarea is empty.
	//		If blank, no message is displayed.
	requiredMessage: "$_unset_$",
	
	// promptMessage: String
	//		Message to display to user when textarea is empty.
	//		If blank, no message is displayed.
	promptMessage: "",

	// tooLongMessage: String
	// 		The message to display if value is exceeds maxLength.
	tooLongMessage: "$_unset_$", // read from the message file if not overridden
	
	// showLengthOnError Boolean
	//	If true, shows the max character amount in parentheses
	showLengthOnError: true,
	
	//	tooltipPosition: String[]
	//		See description of dijit.Tooltip.defaultPosition for details on this parameter.
	tooltipPosition: [],
	
	postMixInProperties: function(){
		// 	HTML line breaks get converted into <br />'s. More of an issue
		//	is that Safari adds more than FF and IE.
		//	Remove them.
		this.srcNodeRef.innerHTML = dojo.trim(this.srcNodeRef.innerHTML);
		
		this.messages = dojo.i18n.getLocalization("dojox.form", "ValidationTextarea", this.lang);
		if(this.tooLongMessage == "$_unset_$"){ this.tooLongMessage = this.messages.tooLongMessage; }
		if(this.requiredMessage == "$_unset_$"){ this.requiredMessage = this.messages.requiredMessage; }
			
		this.inherited(arguments);
	},
	
	postCreate: function(){
		if (this.eventNode) {
			this.connect(this.eventNode, "paste", this.onPaste);
		}
		this.connect(this.editNode, "focus", this.onFocus);
		this.inherited(arguments);
	},
	
	getTooLongMessage: function(){
		//	summary:
		//		Return message for invalid text length
		return this.tooLongMessage + (this.showLengthOnError ? " (" + this.maxLength + ")" : ""); // String
	},
	
	getRequiredMessage: function(){
		//	summary:
		//		Return message for invalid empty field
		return this.requiredMessage;  // String
	},
	
	getPromptMessage: function(){
		//	summary:
		//		Return message for user hint on focus
		return this.promptMessage;  // String
	},
	
	displayMessage: function(/*String*/ message){
		// summary:
		//		User overridable method to display validation errors/hints.
		//		By default uses a tooltip.
		if(this._message == message){ return; }
		this._message = message;
		dijit.hideTooltip(this.domNode);
		if(message){
			dijit.showTooltip(message, this.domNode, this.tooltipPosition);
		}
	},
	
	_onKeyPress: function(/*Event*/evt){
		this.validate(evt);
		this.inherited(arguments);
	},
	
	undoEdit: function(){
		// 	summary:
		//		If the edit made by pasting text was too long, we simply
		//		undo, which restores the text and the selection.
		//		IE does not have an undo, but we are able to block
		//		the paste event in onPaste.
		if(!dojo.isIE){
			document.execCommand("undo", false, null);
		}
	},
	
	onPaste: function(/*Event*/evt){
		// summary:
		//		Capture the onPaste event and check that the result
		//		will not invalidate the maxLength
		if (dojo.isIE) {
			// Get the current text length, subtract
			//	the selection length, and add the clipboard
			//	length. Validate. If invalid, the paste gets
			//	blocked. The selection is not restored, but the 
			//	caret position is correct. Good enough, considering the
			//	code required to restore the selection is quite large.
			var textLength = this.attr("value").length - dojo.doc.selection.createRange().text.length + window.clipboardData.getData("Text").length;
			this.validate(evt, textLength);
			
		} else {
			// 	The onpaste event is inaccessible in FF.
			//	We have to let the paste happen, and if it
			//	goes over maxLength, we will undo.
			//
			//	Safari does have an accesible clipboard
			//	object, but instead of attempting to get the
			//	selection length, which is much harder in
			//	Safari (and FF) than in IE, we'll just use the 
			//	undo. 
			setTimeout(dojo.hitch(this, function(){
				if (!this.validate(evt)) {
					this.undoEdit();
				}
			}), 50);
		}
	},
	
	validate: function(/*Event*/evt, /*Number ? */textLength){
		// 	summary:
		//		Checks if input is too long, or required but blank.
		var valid, msg;
		if(this.validateLength(evt, textLength)){
			if (this._isEmpty() && this.required) {
				this.state = "Error";
				valid = false;
				msg = this.getRequiredMessage();
			}else{
				this.state = "";
				valid = true;
				msg = false;
			}
			
		}else{
			// If the message is too long, we are not in an error state
			//	because we are undoing the edit. However, we need to 
			//	notify the user of why the edit did not happen.
			this.state = "";
			valid = false;
			msg = this.getTooLongMessage();
			if(evt && !this._checkControlKey(evt.keyCode)){
				dojo.stopEvent(evt);	
			}	
		}
		this._setStateClass();
		this.displayMessage(msg);
		return valid; // Boolean
	
	},
	
	validateLength: function(/*Event*/evt, /*Number ? */textLength){
		//	summary:
		//		checks if input is too long
		if (this.maxLength) {
			var length = textLength || this.attr("value").length || 0;
			if (length > this.maxLength) { 
 				return false;  // Boolean
 			}
		}	
		return true; // Boolean
	},
	
	onFocus: function(/*Event*/evt){
		//	summary:
		//		Focus event. Checks if user gets a hint on an 
		//		empty field.
		if(this._isEmpty() && this.getPromptMessage()){
			this.displayMessage(this.getPromptMessage());
		}
	},
	
	onBlur: function(/*Event*/evt){
		// summary:
		//	stub to connect to
	},
	
	_isEmpty: function(){
		// summary:
		//		Checks for a blank field.
		return this.attr("value").length ? false : true; // Boolean
	},
	
	_checkControlKey: function(/*Number*/key){
		// 	summary:
		//		When the input is too long, the key entry is blocked.
		//		However, this would also disable the user's ability
		//		to delete text and make it valid. Allow the keys that do 
		//		not add to the input, such as arrow keys, delete key, etc.
		for(var nm in this.controlKeys){
			if(this.controlKeys[nm]==key){
				return true; // Boolean
			}
		}
		return this.controlKeys[key]; // Number
	},
	controlKeys: {
		// 	summary: 
		// 		A partial of the dojo.event definitions for common key values
		//		rearranged for common keys first for speed, and keys that add to the
		//		display (enter, keypad numbers, space) are removed
		//
		// 	NOTE: 
		//		Had to remove F-keys because for some reason, they map the same as char keys
		BACKSPACE: 8,
		LEFT_ARROW: 37,
		UP_ARROW: 38,
		RIGHT_ARROW: 39,
		DOWN_ARROW: 40,
		DELETE: 46,
		TAB: 9,
		SHIFT: 16,
		CTRL: 17,
		ALT: 18,
		CAPS_LOCK: 20,
		ESCAPE: 27,
		PAGE_UP: 33,
		PAGE_DOWN: 34,
		END: 35,
		HOME: 36,
		CLEAR: 12,
		NUM_LOCK: 144,
		SCROLL_LOCK: 145
	}

});
