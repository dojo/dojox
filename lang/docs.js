dojo.provide("dojox.lang.docs");

// Extracts information from the API docs to apply a schema representation to dojo classes.
// This can be utilized for runtime metadata retrieval and type checking
(function(){
	function error(error){
		console.log("Warning, the API docs must be available at ../util/docscripts/api.xml "+ 
		"in order for dojox.lang.docs to supply schema information, but it could not be loaded: " + error);
	}
	var declaredClasses = {};
	var schemifyClass = function(clazz, name){
		// initial implementation records classes until they are ready
		declaredClasses[name] = clazz;
	}
	// hook into all declared classes
	var defaultDeclare = dojo.declare;
	dojo.declare = function(name){
		var clazz = defaultDeclare.apply(this, arguments);
		schemifyClass(clazz, name);
		return clazz;
	};
	dojo.mixin(dojo.declare, defaultDeclare);
	dojox.lang.docs.init = function(async){
		try{
			dojo.xhrGet({
				sync:!async,
				url: dojo.baseUrl + '../util/docscripts/api.xml',
				handleAs: 'xml'
			}).addCallbacks(function(api){
				function tagValue(parent, tag){
					var element = parent.getElementsByTagName(tag)[0];
					return element && element.firstChild.nodeValue;
				}
				function getType(element, propertyDef){
					var typeDef = element.getAttribute("type").toLowerCase();
					typeDef = typeDef.replace(/\?/, function(){
						propertyDef.optional = true;
						return '';
					});
					if(typeDef.match(/ string/)){
						// HTML String and other "types" of strings are really just strings
						typeDef = "string";
					}
					return (typeDef == 'string' || typeDef == 'number' || typeDef == 'boolean' || typeDef == 'object' ||typeDef == 'array' || typeDef == 'integer') && 
						typeDef;
				}
				schemifyClass = function(clazz, name){
					var docForClass = dojo.query("object[location='" + name + "']", api)[0];
					if(docForClass){
						clazz.description = tagValue(docForClass, "description");
						// translate the properties to JSON Schema
						clazz.properties = {};
						var properties = docForClass.getElementsByTagName("property");
						for(var i = 0; i < properties.length; i++){
							var propertyDef = clazz.properties[properties[i].getAttribute("name")] = {};
							var typeDef = getType(properties[i], propertyDef);
							if(typeDef){ 
								propertyDef.type = typeDef;
							}
							propertyDef.description = tagValue(properties[i], "description");
						}
						// translate the methods to JSON Schema
						clazz.methods = {};
						var methods = docForClass.getElementsByTagName("method");
						for(i = 0; i < methods.length; i++){
							name = methods[i].getAttribute("name");
							if(name){
								var methodDef = clazz.methods[name] = {};
								methodDef.description = tagValue(methods[i], "description");
								var parameters = methods[i].getElementsByTagName("parameter");
								methodDef.parameters = [];
								for(var j = 0; j < parameters.length; j++){
									var paramElement = parameters[j];
									methodDef.parameters[j] = {
										name: paramElement.getAttribute("name"),
										type: getType(paramElement, methodDef),
										optional: "optional" == paramElement.getAttribute("usage")
									};
								}
								var returnElement = methods[i].getElementsByTagName("return-type")[0];
								if(returnElement){
									methodDef.returns = { 
										type: getType(returnElement, methodDef)
									};
								}
							}
						}
						var superclass = docForClass.getAttribute("superclass");
						if(superclass){
							clazz["extends"] = dojo.getObject(superclass);
						}
					}
				}
				for(var i in declaredClasses){
					schemifyClass(declaredClasses[i], i);
				}
				declaredClasses = null;
			}, error);
		}catch(e){
			error(e);
		}
	}
})();
