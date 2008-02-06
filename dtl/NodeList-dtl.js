dojo.provide("dojox.dtl.NodeList-dtl");
dojo.require("dojox.dtl._base");

dojo.extend(dojo.NodeList, {
	dtl: function(template, context){
		var d = dojox.dtl;
		template = new d.Template(template);
		context = new d._Context(context);
		var content = template.render(context);
		this.forEach(function(node){
			node.innerHTML = content;
		});
		return this;
	}
});