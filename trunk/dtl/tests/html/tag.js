dojo.provide("dojox.dtl.tests.html.tag");

dojo.require("dojox.dtl.html");
dojo.require("dojox.dtl.render.html");
dojo.require("dojox.dtl.tests.html.util");

doh.register("dojox.dtl.html.tag", 
	[
		function test_errors(t){
			var dd = dojox.dtl;
			var template;

			// No root node after rendering
			var found = false;
			try {
				template = new dd.HtmlTemplate('No div');
				dd.tests.html.util.render(template);
			}catch(e){
				t.is("Text should not exist outside of the root node in template", e.message);
				found = true;
			}
			t.t(found);

			var context = new dojox.dtl.Context({test: "Pocket"});
			found = false;
			try {
				template = new dd.HtmlTemplate('{{ test }}');
				dd.tests.html.util.render(template, context);
			}catch(e){
				t.is("Text should not exist outside of the root node in template", e.message);
				found = true;
			}
			t.t(found);

			template = new dd.HtmlTemplate('<div></div>extra content');
			found = false;
			try {
				dd.tests.html.util.render(template);
			}catch(e){
				t.is("Content should not exist outside of the root node in template", e.message);
				found = true;
			}
			t.t(found);

			// More than one top-level node (except for blocks)
			template = new dd.HtmlTemplate('<div></div><div></div>');
			found = false;
			try {
				dd.tests.html.util.render(template);
			}catch(e){
				t.is("Content should not exist outside of the root node in template", e.message);
				found = true;
			}
			t.t(found);

			// Logic block rules out any root node
			template = new dd.HtmlTemplate('{% if missing %}<div></div>{% endif %}');
			found = false;
			try {
				dd.tests.html.util.render(template);
			}catch(e){
				t.is("Rendered template does not have a root node", e.message);
				found = true;
			}
			t.t(found);
		},
		function test_tag_extend(t){
			// Problems to look for:
			//	* Content outside of blocks
		},
		function test_tag_for(t){
			var dd = dojox.dtl;

			var context = new dd.Context({
				items: ["apple", "banana", "lemon"]
			});
			var template = new dd.HtmlTemplate('<div><ul>{% for item in items %}<li class="{{ item|length }}">{{ item }}</li>{% endfor %}</ul></div>');

			t.is('<div><ul><li class="5">apple</li><li class="6">banana</li><li class="5">lemon</li></ul></div>', dd.tests.html.util.render(template, context));
		}
	]
);