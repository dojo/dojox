define([
	"dojo/_base/kernel",
	"dojo/_base/lang",
	"dojo/_base/NodeList",
	"../_base"
], function(dojo,lang,Nodelist,dd){
	/*=====
		Nodelist = dojo.Nodelist;
		dd = dojox.dtl;
	=====*/
	
	lang.getObject("dtl.ext-dojo.NodeList", true, dojox);

	lang.extend(Nodelist, {
		dtl: function(template, context){
			// template: dojox.dtl.__StringArgs|String
			//		The template string or location
			// context: dojox.dtl.__ObjectArgs|Object
			//		The context object or location
			var d = dd;

			var self = this;
			var render = function(template, context){
				var content = template.render(new d._Context(context));
				self.forEach(function(node){
					node.innerHTML = content;
				});
			}

			d.text._resolveTemplateArg(template).addCallback(function(templateString){
				template = new d.Template(templateString);
				d.text._resolveContextArg(context).addCallback(function(context){
					render(template, context);
				});
			});

			return this;
		}
	});
	return dojox.dtl.ext-dojo.NodeList;
});