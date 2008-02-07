dojo.provide("dojox.dtl.tag.data");

dojo.require("dojox.dtl._base");

(function(){
	var dd = dojox.dtl;
	var ddt = dd.text;

	ddt.data.DataNode = dojo.extend(
		function(item, attr, TextNode){
			this.item = new dd._Filter(item);
			this.attr = attr;
			this.textNode = new TextNode();
		},
		{
			render: function(context, buffer){
				var item = this.item.resolve(context);
				if(!context["store"]){
					console.warn("please set a store property on your DTL Context object in order to fetch data properties!");
				}
				var val = context.store.getValue(item, this.attr);
				this.textNode.set(val);
				return this.textNode.render(context, buffer);
			}
		}
	);

	ddt.data.data = function(parser, text){
		// {% data item.attr %}
		parts = ddt.pySplit(text);
		parts = parts[1].split(".");
		return new dojox.dtl.tag.data.DataNode(parts[0], parts[1], parser.getTextNode());
	}

	dd.register.tags("dojox.dtl.tag", {
		"data": ["data"]
	});
})();
