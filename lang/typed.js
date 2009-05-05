dojo.provide("dojox.lang.typed");
dojo.require("dojox.json.schema");
(function(){
	var jsonSchema = dojox.json.schema;
	var hasGetters = jsonSchema.__defineGetter__;
	dojox.lang.typed = function(Class){
		// summary:
		//		Adds type checking to a class, returning a new class with typing enabled
		var Wrapper = function(){
			var i, value, properties = Wrapper.properties;
			var methods = Wrapper.methods;	
			Class.apply(this,arguments);
			this.__props__ = {};
			for(i in methods){
				value = this[i];
				if(!value.__typedMethod__){
					// add typing checking to the method, going up the proto chain to find the right one
					var proto = this;
					while(!proto.hasOwnProperty(i) && proto.__proto__){
						proto = proto.__proto__;					}
					(function(i){
						var func = value;
						(proto[i] = function(){
							var methodDef = methods[i];
							if(methodDef && methodDef.parameters){
								var params = methodDef.parameters;
								for(var j = 0; j < params.length; j++){
									jsonSchema.mustBeValid(jsonSchema.validate(arguments[j], params[j]));					
								}
								if(methodDef.additionalParameters){
									for(;j < arguments.length; j++){
										jsonSchema.mustBeValid(jsonSchema.validate(arguments[j], methodDef.additionalParameters));
									}
								}
							}
							var returns = func.apply(this, arguments);
							if(methodDef.returns){
								jsonSchema.mustBeValid(jsonSchema.validate(returns, methodDef.returns));
							}
							return returns;
						}).__typedMethod__ = true;
					})(i);
				}
			}
			if(hasGetters){
				var self = this;
				for(i in properties){
					// add type checking to each property
					value = this[i];
					if(this.hasOwnProperty(i)){
						this.__props__[i] = value;
					}
					(function(i){
						self.__defineGetter__(i, function(){
							return i in this.__props__ ? this.__props__[i] : this.__proto__[i];
						});
						self.__defineSetter__(i, function(value){
							jsonSchema.mustBeValid(jsonSchema.checkPropertyChange(value, properties[i]));
							this.__props__[i] = value;
						});
					})(i);
				}
			}
			jsonSchema.mustBeValid(jsonSchema.validate(this, Wrapper));
		};
		Wrapper.prototype = Class.prototype;
		return dojo.mixin(Wrapper, Class);
	};
	dojox.lang.typed.typeCheckAllClasses = function(){
		// summary:
		//		This will add type checking to all classes that will be declared via dojo.declare
		//		(only ones to be declared in the future)
		
		// hook into all declared classes
		var defaultDeclare = dojo.declare;
		dojo.declare = function(name){
			var clazz = defaultDeclare.apply(this, arguments);
			clazz = dojox.lang.typed(clazz);
			dojo.setObject(name, clazz);
			return clazz;
		};
		dojo.mixin(dojo.declare, defaultDeclare);
	};
})();
