dojo.provide("dojox.form.manager._ValueMixin");

dojo.declare("dojox.form.manager._ValueMixin", null, {
	// summary:
	//		Form manager's mixin for getting/setting form values in the unified manner.
	// description:
	//		This mixin adds unified access to form widgets and form elements
	//		in terms of name-value regardless of the underlying type of
	//		an element. It should be used together with dojox.form.manager.Mixin. 

	elementValue: function(/* String */ name, /* Object? */ value){
		// summary:
		//		Set or get a form widget/element or an attached point node by name.
		// name:
		//		The name.
		// value:
		//		Optional. The value to set.

		if(name in this._widgets){
			return this.formWidgetValue(name, value);	// Object
		}

		if(name in this._nodes){
			return this.formElementValue(name, value);	// Object
		}

		return this.formPointValue(name, value);	// Object
	},

	gatherFormValues: function(/* Object? */ names){
		// summary:
		//		Collect form values.
		// names:
		//		If it is an array, it is a list of names of form elements to be collected.
		//		If it is an object, dictionary keys are names to be collected.
		//		If it is omitted, all known form elements are to be collected.

		var result = this.inspectFormWidgets(function(name){
			return this.formWidgetValue(name);
		}, names);

		dojo.mixin(result, this.inspectFormElements(function(name){
			return this.formElementValue(name);
		}, names));

		dojo.mixin(result, this.inspectAttachedPoints(function(name){
			return this.formPointValue(name);
		}, names));

		return result;	// Object
	},

	setFormValues: function(/* Object */ values){
		// summary:
		//		Set values to form elements
		if(values){
			this.inspectFormWidgets(function(name, widget, value){
				this.formWidgetValue(name, value);
			}, values);

			this.inspectFormElements(function(name, node, value){
				this.formElementValue(name, value);
			}, values);

			this.inspectAttachedPoints(function(name, node, value){
				this.formPointValue(name, value);
			}, values);
		}
		return this;
	}
});
