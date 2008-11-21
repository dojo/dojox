dojo.provide("dojox.form.manager._ClassMixin");

dojo.require("dojox.form.manager._Mixin");

(function(){
	var fm = dojox.form.manager,
		aa = fm.actionAdapter,
		ia = fm.inspectorAdapter;

	dojo.declare("dojox.form.manager._ClassMixin", null, {
		// summary:
		//		Form manager's mixin for testing/assigning/removing
		//		classes of controlled elements.
		// description:
		//		This mixin provides unified way to check/add/remove a class
		//		of controlled elements.
		//		It should be used together with dojox.form.manager.Mixin.

		gatherClassState: function(/* String */ className, /* Object? */ names){
			// summary:
			//		Gather the presence of a certain class in all controlled elements.
			// className:
			//		The class name to test for.
			// names:
			//		If it is an array, it is a list of names to be processed.
			//		If it is an object, dictionary keys are names to be processed.
			//		If it is omitted, all known form elements are to be processed.

			var result = this.inspect(ia(function(name, node){
				return dojo.hasClass(node, className);
			}), names);

			return result;	// Object
		},

		addClass: function(/* String */ className, /* Object? */ names){
			// summary:
			//		Add a class to nodes according to the supplied set of names
			// className:
			//		Class name to add.
			// names:
			//		If it is an array, it is a list of names to be processed.
			//		If it is an object, dictionary keys are names to be processed.
			//		If it is omitted, all known form elements are to be processed.

			this.inspect(aa(function(name, node){
				dojo.addClass(node, className);
			}), names);

			return this;	// self
		},

		removeClass: function(/* String */ className, /* Object? */ names){
			// summary:
			//		Remove a class from nodes according to the supplied set of names
			// className:
			//		Class name to remove.
			// names:
			//		If it is an array, it is a list of names to be processed.
			//		If it is an object, dictionary keys are names to be processed.
			//		If it is omitted, all known form elements are to be processed.

			this.inspect(aa(function(name, node){
				dojo.removeClass(node, className);
			}), names);

			return this;	// self
		}
	});
})();
