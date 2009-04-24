dojo.provide("dojox.lang.docs");

// Extracts information from the API docs to apply a schema representation to dojo classes.
// This can be utilized for runtime metadata retrieval and type checking
(function(){
	function error(error){
		console.log("Warning, the API docs must be available at ../util/docscripts/api.json "+ 
		"or ../util/docscripts/api/*.json "+
		"in order for dojox.lang.docs to supply schema information, but it could not be loaded: " + error);
	}

	var declaredClasses = {};
	var requiredModules = [];
	var _docs = dojox.lang.docs._loadedDocs = {};

	var schemifyClass = function(clazz, name){
		// initial implementation records classes until they are ready
		declaredClasses[name] = clazz;
	};
	var getType = function(type, propDef){
		var typeDef = type || '';
		typeDef = typeDef.toLowerCase();
		typeDef = typeDef.replace(/\?/, function(){
			propDef.optional = true;
			return '';
		});
		if(typeDef.match(/ string/)){
			// HTML String and other "types" of strings are really just strings
			typeDef = "string";
		}
		return (typeDef == 'string' || typeDef == 'number' ||
				typeDef == 'boolean' || typeDef == 'object' ||
				typeDef == 'array' || typeDef == 'integer')
			&& typeDef;
	};
	var actualSchemifyClass = function(clazz, name){
		var docForClass = _docs[name];
		if(docForClass){
			clazz.description = docForClass.description;
			clazz.properties = {};
			clazz.methods = {};

			if(docForClass.properties){
				var props = docForClass.properties;
				for(var i=0, l=props.length; i<l; i++){
					var propDef = clazz.properties[props[i].name] = {};
					var typeDef = getType(props[i].type, propDef);
					if(typeDef){
						propDef.type = typeDef;
					}
					propDef.description = props[i].summary;
				}
			}

			// translate the methods to JSON Schema
			if(docForClass.methods){
				var methods = docForClass.methods;
				for(i=0, l=methods.length; i<l; i++){
					var name = methods[i].name;
					if(name){
						var methodDef = clazz.methods[name] = {};
						methodDef.description = methods[i].summary;
						var parameters = methods[i].parameters;
						if(parameters){
							methodDef.parameters = [];
							for(var j=0, k=parameters.length; j<k; j++){
								var param = parameters[j];
								methodDef.parameters[j] = {
									name: param.name,
									type: getType(param.type, methodDef),
									optional: "optional" == param.usage
								};
							}
						}
						var ret = methods[i]['return-types'];
						if(ret){
							methodDef.returns = {
								type: getType(ret[0].type, methodDef)
							};
						}
					}
				}
			}

			var superclass = docForClass.superclass;
			if(superclass){
				clazz["extends"] = dojo.getObject(superclass);
			}
		}
	};
	var requireDocs = function(moduleName){
		requiredModules.push(moduleName);
	};

	// hook into all declared classes
	var defaultDeclare = dojo.declare;
	dojo.declare = function(name){
		var clazz = defaultDeclare.apply(this, arguments);
		schemifyClass(clazz, name);
		return clazz;
	};
	dojo.mixin(dojo.declare, defaultDeclare);
	var initialized;

	// hook into dojo.require
	var defaultRequire = dojo.require;
	dojo.require = function(moduleName){
		requireDocs(moduleName);
		var module = defaultRequire.apply(this, arguments);
		return module;
	};

	dojox.lang.docs.init = function(/*Boolean*/async){
		// summary:
		//		Loads the documentation and applies it to the previously defined classes 
		// 		and any future defined classes
		// 
		// async:
		// 		 If true, the documentation will be loaded asynchronously
		
		if(initialized){
			return null;
		}
		initialized = true;

		var getSplitDocs = function(moduleName, sync){
			dojo.xhrGet({
				sync: sync||!async,
				url: dojo.baseUrl + '../util/docscripts/api/' + moduleName + '.json',
				handleAs: 'json'
			}).addCallback(function(obj){
				for(var clazz in obj){
					if(!_docs[clazz]){
						_docs[clazz] = obj[clazz];
					}
				}
			});
		};
		var firstMod = requiredModules.shift();
		try{
			getSplitDocs(firstMod, true);

			requireDocs = function(moduleName){
				if(!_docs[moduleName]){
					try{
						getSplitDocs(moduleName);
					}catch(e){
						_docs[moduleName] = {};
					}
				}
			};
			//console.log(requiredModules);
			dojo.forEach(requiredModules, function(mod){
				requireDocs(mod);
			});
			requiredModules = null;

			schemifyClass = actualSchemifyClass;

			for(i in declaredClasses){
				schemifyClass(declaredClasses[i], i);
			}
			declaredClasses = null;
		}catch(e){
			dojo.require = defaultRequire;
			requiredModules = null;
			try{
				dojo.xhrGet({
					sync:!async,
					url: dojo.baseUrl + '../util/docscripts/api.json',
					handleAs: 'json'
				}).addCallbacks(function(obj){
					_docs = obj;
					schemifyClass = actualSchemifyClass;

					for(var i in declaredClasses){
						schemifyClass(declaredClasses[i], i);
					}
					declaredClasses = null;
				}, error);
			}catch(e){
				error(e);
			}
		}
		return null;
	}
})();
