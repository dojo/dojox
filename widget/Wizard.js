dojo.provide("dojox.widget.Wizard");

dojo.require("dijit.layout.StackContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dijit.form.Button");

dojo.declare(
	"dojox.widget.WizardContainer",
	[dijit.layout.StackContainer,dijit._Templated],
	{
	// summary:
	//		A set of panels that display sequentially, typically notating a step-by-step
	//		procedure like an install
	//
	
	widgetsInTemplate: true,
	templatePath: dojo.moduleUrl("dojox.widget", "Wizard/Wizard.html"),
	
	// nextButtonLabel: String
	//		Label override for the "Next" button.
	nextButtonLabel: "",

	// previousButtonLabel: String
	//		Label override for the "Previous" button.
	previousButtonLabel: "",

	// cancelButtonLabel: String
	//		Label override for the "Cancel" button.
	cancelButtonLabel: "",

	// doneButtonLabel: String
	//		Label override for the "Done" button.
	doneButtonLabel: "",

	// cancelFunction: FunctionName
	//		Name of function to call if user presses cancel button.
	//		Cancel button is not displayed if function is not specified.
	cancelFunction: "",

	// hideDisabled: Boolean
	//		If true, disabled buttons are hidden; otherwise, they are assigned the
	//		"WizardButtonDisabled" CSS class
	hideDisabled: false,

	startup: function(){
		this.inherited(arguments);
		
		this.connect(this.nextButton, "onClick","_forward");
		this.connect(this.previousButton, "onClick","back");

		if(this.cancelFunction){
			this.cancelFunction = dojo.getObject(this.cancelFunction);
			this.connect(this.cancelButton, "onClick", this.cancelFunction);
		}else{
			this.cancelButton.domNode.style.display = "none";
		}
		this.connect(this.doneButton, "onClick","done");
		
		if(this.nextButtonLabel){ this.nextButton.setLabel(this.nextButtonLabel); }
		if(this.previousButtonLabel){ this.previousButton.setLabel(this.previousButtonLabel); }
		if(this.cancelButtonLabel){ this.cancelButton.setLabel(this.cancelButtonLabel); }
		if(this.doneButtonLabel){ this.doneButton.setLabel(this.doneButtonLabel); }

		dojo.subscribe(this.id+"-selectChild",dojo.hitch(this,"_checkButtons"));
		this._checkButtons();
	},

	_checkButtons: function(){
		
		var sw = this.selectedChildWidget;
		
		var lastStep = sw.isLastChild;
		this.nextButton.setAttribute("disabled",lastStep);
		this._setButtonClass(this.nextButton);
		if(sw.doneFunction){
			this.doneButton.domNode.style.display = "";
			if(lastStep){
				this.nextButton.domNode.style.display = "none";
			}
		}else{
			// #1438 issue here.
			this.doneButton.domNode.style.display = "none";
		}
		this.previousButton.setAttribute("disabled",!this.selectedChildWidget.canGoBack);
		this._setButtonClass(this.previousButton);
	},

	_setButtonClass: function(button){
		if(this.hideDisabled){
			button.domNode.style.display = button.disabled ? "none" : "";	
		}else{
			button.domNode.style.display = "";
		} 
	},

	_forward: function(){
		// summary: callback when next button is clicked
		if(this.selectedChildWidget._checkPass()){
			this.forward();
		}
	},
	
	done: function(){
		// summary: Finish the wizard's operation
		this.selectedChildWidget.done();
	}
});

dojo.declare(
	"dojox.widget.WizardPane",
	dijit.layout.ContentPane,
	{
	// summary: a panel in a WizardContainer
	//
	// description:
	//	An extended ContentPane with additional hooks for passing named
	//	functions to prevent the pane from going either forward or
	//	backwards. 
	//
	// canGoBack: Boolean
	//		If true, then can move back to a previous panel (by clicking the "Previous" button)
	canGoBack: true,

	// passFunction: String
	//		Name of function that checks if it's OK to advance to the next panel.
	//		If it's not OK (for example, mandatory field hasn't been entered), then
	//		returns an error message (String) explaining the reason.
	passFunction: "",
	
	// doneFunction: String
	//		Name of function that is run if you press the "Done" button from this panel
	doneFunction: "",

	postMixInProperties: function(){
		if(this.passFunction){
			this.passFunction = dojo.getObject(this.passFunction);
		}
		if(this.doneFunction){
			this.doneFunction = dojo.getObject(this.doneFunction);
		}
		this.inherited(arguments);
	},
	
	startup: function(){
		this.inherited(arguments);
		if(this.isFirstChild){ this.canGoBack = false; }	
	},

	_checkPass: function(){
		// summary:
		//		Called when the user presses the "next" button.
		//		Calls passFunction to see if it's OK to advance to next panel, and
		//		if it isn't, then display error.
		//		Returns true to advance, false to not advance.
		var r = true;
		if (this.passFunction && dojo.isFunction(this.passFunction)){
			var failMessage = this.passFunction();
			switch(typeof failMessage){
				case "boolean" : r = failMessage; break;
				case "string" :
					alert(failMessage);
					r = false;
					break;
			}
		}
		return r;
	},

	done: function(){
		if(this.doneFunction && dojo.isFunction(this.doneFunction)){
			this.doneFunction();
		}
	}
});
