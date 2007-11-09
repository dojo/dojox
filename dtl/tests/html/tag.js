dojo.provide("dojox.dtl.tests.html.tag");

dojo.require("dojox.dtl.html");
dojo.require("dojox.dtl.render.html");
dojo.require("dojox.dtl.tests.html.util");

doh.register("dojox.dtl.html.tag", 
	[
		function test_tag_for(t){
			var dd = dojox.dtl;

			var context = new dd.Context({
				items: ["apple", "banana", "lemon"]
			});
			var template = new dd.HtmlTemplate('<div><ul>{% for item in items %}<li class="{{ item|length }}">{{ item }}</li>{% endfor %}</ul></div>');

			t.is('<div><ul><li class="5">apple</li><li class="6">banana</li><li class="5">lemon</li></ul></div>', dojox.dtl.tests.html.util.render(template, context));
		}
	]
);