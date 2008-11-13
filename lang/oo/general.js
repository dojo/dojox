dojo.provide("dojox.lang.oo.general");

dojo.require("dojox.lang.oo.Decorator");

(function(){
	var oo = dojox.lang.oo, md = oo.makeDecorator, oog = oo.general;

	// generally useful decorators

	oog.augment = md(function(name, newValue, oldValue){
		// summary: add property, if it was not defined before
		return typeof oldValue == "undefined" ? newValue : oldValue;
	});

	oog.override = md(function(name, newValue, oldValue){
		// summary: override property only if it was already present
		return typeof oldValue != "undefined" ? newValue : oldValue;
	});

	oog.shuffle = md(function(name, newValue, oldValue){
		// summary: replaces arguments for an old method
		return typeof oldValue == "function" ?
			function(){
				return oldValue.apply(this, newValue.apply(this, arguments));
			} : oldValue;
	});

	oog.wrap = md(function(name, newValue, oldValue){
		// summary: wraps the old values with a supplied function
		return function(){ return newValue.call(this, oldValue, arguments); };
	});
})();
