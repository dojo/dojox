dojo.provide("dojox.dtl.tests.text.tag");

dojo.require("dojox.dtl");

doh.register("dojox.dtl.text.tag", 
	[
		function test_tag_block_and_extends(t){
			var dd = dojox.dtl;

			// Simple (messy) string-based extension
			var template = new dd.Template('{% extends "../../dojox/dtl/tests/text/templates/pocket.html" %}{% block pocket %}Simple{% endblock %}');
			t.is("Simple Pocket", template.render());

			// Variable replacement
			var context = new dd.Context({
				parent: "../../dojox/dtl/tests/text/templates/pocket.html"
			})
			template = new dd.Template('{% extends parent %}{% block pocket %}Variabled{% endblock %}');
			t.is("Variabled Pocket", template.render(context));

			// Nicer dojo.moduleUrl and variable based extension
			context.parent = dojo.moduleUrl("dojox.dtl.tests.text.templates", "pocket.html");
			template = new dd.Template('{% extends parent %}{% block pocket %}Slightly More Advanced{% endblock %}');
			t.is("Slightly More Advanced Pocket", template.render(context));

			// dojo.moduleUrl with support for more variables.
			// This is important for HTML templates where the "shared" flag will be important.
			context.parent = {
				url: dojo.moduleUrl("dojox.dtl.tests.text.templates", "pocket.html")
			}
			template = new dd.Template('{% extends parent %}{% block pocket %}Super{% endblock %}');
			t.is("Super Pocket", template.render(context));
		},
		function test_tag_comment(t){
			var dd = dojox.dtl;

			var template = new dd.Template('Hot{% comment %}<strong>Make me disappear</strong>{% endcomment %} Pocket');
			t.is("Hot Pocket", template.render());

			var found = false;
			try {
				template = new dd.Template('Hot{% comment %}<strong>Make me disappear</strong> Pocket');
			}catch(e){
				t.is("Unclosed tag found when looking for endcomment", e.message);
				found = true;
			}
			t.t(found);
		}
	]
);