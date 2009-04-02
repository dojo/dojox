dojo.provide("dojox.lang.docs");

// Extracts information from the API docs to apply a schema representation to dojo classes.
// This can be utilized for runtime metadata retrieval and type checking
(function(){
	var api;
	dojo.xhrGet({
		sync:true,
		url: dojo.baseUrl + '../util/docscripts/api.xml',
		handleAs: 'xml'
	}).addCallback(function(result){
		api = result;	
	});
	// TODO: find the existing classes and patch them as well
	var defaultDeclare = dojo.declare;
	dojo.declare = function(name){
		var clazz = defaultDeclare.apply(this, arguments);
		var docForClass = dojo.query("object[location='" + name + "']", api)[0];
		if(docForClass){
			var descriptionNode = docForClass.getElementsByTagName("description")[0];
			clazz.description = descriptionNode && descriptionNode.firstChild.nodeValue;
			clazz.properties = {};
			var properties = docForClass.getElementsByTagName("property");
			for(var i = 0; i < properties.length; i++){
				var propertyDef = clazz.properties[properties[i].getAttribute("name")] = {};
				var typeDef = properties[i].getAttribute("type").toLowerCase();
				typeDef = typeDef.replace(/\?/, function(){
					propertyDef.optional = true;
					return '';
				});
				if(typeDef == 'string' || typeDef == 'number' || typeDef == 'boolean' || typeDef == 'object' ||typeDef == 'array' || typeDef == 'integer'){ 
					propertyDef.type = typeDef;
				}
				var description = properties[i].getElementsByTagName("description")[0];
				if(description){
					propertyDef.description = description.firstChild.nodeValue;
				}
			}
			//TODO: add methods
		}
		return clazz;
	};
	dojo.mixin(dojo.declare, defaultDeclare);
})();