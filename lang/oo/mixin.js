dojo.provide("dojox.lang.oo.mixin");

dojo.experimental("dojox.lang.oo.mixin");

dojo.require("dojox.lang.oo.Filter");
dojo.require("dojox.lang.oo.Decorator");
dojo.require("dojox.lang.oo.chain");

(function(){
	var oo = dojox.lang.oo, Filter = oo.Filter, Decorator = oo.Decorator,
		oc = oo.chain, cb = oc._before, ca = oc._after,

		defaultFilter = function(name){ return name; },

		useChainAfter = {init: 1}, useChainBefore = {destroy: 1},

		defaultDecorator = oo.defaultDecorator = function(name, newValue, oldValue){
			//	summary:
			//		the default decorator
			//	name: String:
			//		name of the property
			//	newValue: Object:
			//		new value of the property
			//	oldValue: Object:
			//		old value of the property
			//	returns: Object:
			//		returns the final value of the property
			if(name in useChainBefore){
				return cb(name, newValue, oldValue);
			}
			if(name in useChainAfter){
				return ca(name, newValue, oldValue);
			}
			return newValue;
		},

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

	oo.mixin = function(target, source){
		// summary:
		//		mixes in two or more objects processing decorators and filters
		// target: Object:
		//		target to receive new/updated properties
		// source: Object...:
		//		source of properties, more than one source is allowed
		// returns: Object:
		//		target

		var decorator, filter, i, l = arguments.length, name, targetName,
			prop, newValue, oldValue;

		for(i = 1; i < l; ++i){
			// set up the new mixin cycle
			source = arguments[i];
			decorator = defaultDecorator;
			filter = defaultFilter;
			// process object decorator/filter
			if(source instanceof Decorator){
				// use this decorator as a default for all attributes
				decorator = source.decorator;
				source = source.value;
			}
			if(source instanceof Filter){
				filter = source.filter;
				source = source.bag;
			}
			if(typeof source == "function"){
				// switch to prototype for functions
				source = source.prototype;
			}
			// start mixing in properties
			for(name in source){
				if(source.hasOwnProperty(name)){
					prop = source[name];
					targetName = filter(name);
					if(targetName){
						// name is accepted
						oldValue = target[targetName];
						newValue = applyDecorator(decorator, targetName, prop, oldValue);
						if(oldValue !== newValue){
							target[targetName] = newValue;
						}
					}
				}
			}
		}

		return target;	// Object
	};

	oo.extend = function(target, source){
		// summary:
		//		extends a prototype of a target by mixing in two or more objects
		//		processing decorators and filters
		// target: Object:
		//		target to receive new/updated properties
		// source: Object...:
		//		source of properties, more than one source is allowed
		// returns: Object:
		//		target
		return oo.mixin.apply(oo, typeof target == "function" ?
			[target.prototype].concat(Array.prototype.slice.call(arguments, 1)) : arguments);
	};
})();
