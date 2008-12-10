dojo.provide("dojox.lang.oo.mixin");

dojo.experimental("dojox.lang.oo.mixin");

dojo.require("dojox.lang.oo.Filter");
dojo.require("dojox.lang.oo.Decorator");

(function(){
	var oo = dojox.lang.oo, Filter = oo.Filter, Decorator = oo.Decorator, empty = {},
		defaultFilter = function(name){ return name; },
		defaultDecorator = function(name, newValue, oldValue){ return newValue; },
		defaultMixer = function(target, name, newValue, oldValue){ target[name] = newValue; },
		defaults = {},	// for the internal use in the mixin()

		applyDecorator = oo.applyDecorator = function(decorator, name, newValue, oldValue){
			//	summary:
			//		applies a decorator unraveling all embedded decorators
			//	decorator: Function:
			//		top-level decorator to apply
			//	name: String:
			//		name of the property
			//	newValue: Object:
			//		new value of the property
			//	oldValue: Object:
			//		old value of the property
			//	returns: Object:
			//		returns the final value of the property
			if(newValue instanceof Decorator){
				var d = newValue.decorator;
				newValue = applyDecorator(decorator, name, newValue.value, oldValue);
				return d(name, newValue, oldValue);
			}
			return decorator(name, newValue, oldValue);
		};

	/*=====
	dojox.lang.oo.__MixinDefaults = function(){
		//	summary:
		//		a dict of default parameters for dojox.lang.oo._mixin
		//	decorator: Function:
		//		a decorator function to be used in absence of other decorators
		//	filter: Function:
		//		a filter function to be used in absence of other filters
		//	mixer: Function:
		//		a mixer function to be used to mix in new properties
		this.decorator = decorator;
		this.filter = filter;
		this.mixer = mixer;
	};
	=====*/

	oo._mixin = function(target, source, defaults){
		//	summary:
		//		mixes in two objects processing decorators and filters
		//	target: Object:
		//		target to receive new/updated properties
		//	source: Object:
		//		source of properties
		//	defaults: dojox.lang.oo.__MixinDefaults?:
		//		default functions for various aspects of mixing
		//	returns: Object:
		//		target

		var name, targetName, prop, newValue, oldValue, 
			decorator = defaultDecorator, filter = defaultFilter, mixer = defaultMixer;
			
		// change defaults conditionally
		if(defaults){
			decorator = defaults.decorator || decorator,
			filter = defaults.filter || filter,
			mixer = defaults.mixer || mixer;
		}
		
		// start mixing in properties
		for(name in source){
			if(!(name in empty)){
				prop = source[name];
				targetName = filter(name);
				if(targetName){
					// name is accepted
					oldValue = target[targetName];
					newValue = applyDecorator(decorator, targetName, prop, oldValue);
					if(oldValue !== newValue){
						mixer(target, targetName, newValue, oldValue);
					}
				}
			}
		}
		
		return target;	// Object
	};

	oo.mixin = function(target, source){
		// summary:
		//		mixes in two or more objects processing decorators and filters
		//		using defaults as a fallback
		// target: Object:
		//		target to receive new/updated properties
		// source: Object...:
		//		source of properties, more than one source is allowed
		// returns: Object:
		//		target
		
		for(var i = 1, l = arguments.length; i < l; ++i){
			source = arguments[i];
			if(source instanceof Filter){
				defaults.filter = source.filter;
				source = source.bag;
			}else{
				defaults.filter = defaultFilter;
			}
			if(source instanceof Decorator){
				defaults.decorator = source.decorator;
				source = source.value;
			}else{
				defaults.decorator = defaultDecorator;
			}
			oo._mixin(target, source, defaults);
		}
		return target;	// Object
	};
})();
