dojo.provide("dojox.dtl.tests.text.filter");

dojo.require("dojox.dtl");
dojo.require("dojox.date.php");

doh.register("dojox.dtl.text.filter", 
	[
		function test_filter_dates(t){
			var dtt = dojox.dtl;

			var context = new dojox.dtl.Context({ now: new Date(2007, 0, 1), then: new Date(2007, 1, 1) });
			var tpl = new dtt.Template('{{ now|date }}');
			t.is(dojox.date.php.format(context.now, "N j, Y", dojox.dtl.utils.date._overrides), tpl.render(context));
			tpl = new dtt.Template('{{ now|time }}');
			t.is(dojox.date.php.format(context.now, "P", dojox.dtl.utils.date._overrides), tpl.render(context));

			tpl = new dtt.Template('{{ now|timesince:then }}');
			t.is("1 month", tpl.render(context));
			context.then = new Date(2007, 0, 5);
			t.is("4 days", tpl.render(context));
			context.then = new Date(2007, 0, 17);
			t.is("2 weeks", tpl.render(context));
			context.then = new Date(2008, 1, 1);
			t.is("1 year", tpl.render(context));

			context.then = new Date(2007, 1, 1);
			tpl = new dtt.Template('{{ now|timeuntil:then }}');
			t.is("1 month", tpl.render(context));
			context.then = new Date(2007, 0, 5);
			t.is("4 days", tpl.render(context));
			context.then = new Date(2007, 0, 17);
			t.is("2 weeks", tpl.render(context));
			context.then = new Date(2008, 1, 1);
			t.is("1 year", tpl.render(context));

			context.then = new Date(2007, 0, 1);
			tpl = new dtt.Template('{{ now|date:"d" }}');
			t.is("01", tpl.render(context));

			tpl = new dtt.Template('{{ now|date:"D" }}');
			t.is("Mon", tpl.render(context));

			tpl = new dtt.Template('{{ now|date:"j" }}');
			t.is("1", tpl.render(context));

			tpl = new dtt.Template('{{ now|date:"l" }}');
			t.is("Monday", tpl.render(context));

			tpl = new dtt.Template('{{ now|date:"N" }}');
			t.is("Jan.", tpl.render(context));

			tpl = new dtt.Template('{{ now|date:"S" }}');
			t.is("st", tpl.render(context));
			context.now.setDate(2);
			t.is("nd", tpl.render(context));
			context.now.setDate(3);
			t.is("rd", tpl.render(context));
			context.now.setDate(4);
			t.is("th", tpl.render(context));
			context.now.setDate(5);
			t.is("th", tpl.render(context));
			context.now.setDate(6);
			t.is("th", tpl.render(context));
			context.now.setDate(7);
			t.is("th", tpl.render(context));
			context.now.setDate(8);
			t.is("th", tpl.render(context));
			context.now.setDate(9);
			t.is("th", tpl.render(context));
			context.now.setDate(10);
			t.is("th", tpl.render(context));
			context.now.setDate(11);
			t.is("th", tpl.render(context));
			context.now.setDate(12);
			t.is("th", tpl.render(context));
			context.now.setDate(13);
			t.is("th", tpl.render(context));
			context.now.setDate(14);
			t.is("th", tpl.render(context));
			context.now.setDate(15);
			t.is("th", tpl.render(context));
			context.now.setDate(16);
			t.is("th", tpl.render(context));
			context.now.setDate(17);
			t.is("th", tpl.render(context));
			context.now.setDate(18);
			t.is("th", tpl.render(context));
			context.now.setDate(19);
			t.is("th", tpl.render(context));
			context.now.setDate(20);
			t.is("th", tpl.render(context));
			context.now.setDate(21);
			t.is("st", tpl.render(context));
			context.now.setDate(22);
			t.is("nd", tpl.render(context));
			context.now.setDate(23);
			t.is("rd", tpl.render(context));
			context.now.setDate(24);
			t.is("th", tpl.render(context));
			context.now.setDate(25);
			t.is("th", tpl.render(context));
			context.now.setDate(26);
			t.is("th", tpl.render(context));
			context.now.setDate(27);
			t.is("th", tpl.render(context));
			context.now.setDate(28);
			t.is("th", tpl.render(context));
			context.now.setDate(29);
			t.is("th", tpl.render(context));
			context.now.setDate(30);
			t.is("th", tpl.render(context));
			context.now.setDate(31);
			t.is("st", tpl.render(context));
			context.now.setDate(1);

			tpl = new dtt.Template('{{ now|date:"w" }}');
			t.is("1", tpl.render(context));

			tpl = new dtt.Template('{{ now|date:"z" }}');
			t.is("0", tpl.render(context));
		
			tpl = new dtt.Template('{{ now|date:"W" }}');
			t.is("1", tpl.render(context));
		},

		function test_filter_htmlstring(t){
			var dtt = dojox.dtl;
			var context, tpl;

			context = new dojox.dtl.Context({ unescaped: "Try & cover <all> the \"major\" 'situations' at once" });
			tpl = new dtt.Template('{{ unescaped|escape }}');
			t.is("Try &amp; cover &lt;all&gt; the &quot;major&quot; &#39;situations&#39; at once", tpl.render(context));

			context = new dojox.dtl.Context({ unbroken: "This is just\r\n\n\ra bunch\nof text\n\n\nand such" });
			tpl = new dtt.Template('{{ unbroken|linebreaks }}');
			t.is("<p>This is just</p>\n\n<p>a bunch<br />of text</p>\n\n<p>and such</p>", tpl.render(context));

			tpl = new dtt.Template('{{ unbroken|linebreaksbr }}');
			t.is("This is just<br /><br />a bunch<br />of text<br /><br /><br />and such", tpl.render(context));

			context = new dojox.dtl.Context({ tagged: "I'm gonna do something <script>evil</script> with the <html>filter" });
			tpl = new dtt.Template('{{ tagged|removetags:"script <html>" }}');
			t.is("I'm gonna do something evil with the filter", tpl.render(context));

			tpl = new dtt.Template('{{ tagged|striptags }}');
			t.is("I'm gonna do something evil with the filter", tpl.render(context));
		},

		function test_filter_integers(t){
			var dtt = dojox.dtl;
			var context, tpl;

			context = new dojox.dtl.Context({ four: 4 });
			tpl = new dtt.Template('{{ four|add:"6" }}');
			t.is("10", tpl.render(context));
			context.four = "4";
			t.is("10", tpl.render(context));
			tpl = new dtt.Template('{{ four|add:"six" }}');
			t.is("4", tpl.render(context));
			tpl = new dtt.Template('{{ four|add:"6.6" }}');
			t.is("10", tpl.render(context));

			context = new dojox.dtl.Context({ pi: 314159265 });
			tpl = new dtt.Template('{{ pi|get_digit:1 }}');
			t.is("3", tpl.render(context));
			tpl = new dtt.Template('{{ pi|get_digit:"2" }}');
			t.is("1", tpl.render(context));
			tpl = new dtt.Template('{{ pi|get_digit:0 }}');
			t.is("314159265", tpl.render(context));
			tpl = new dtt.Template('{{ "nada"|get_digit:1 }}');
			t.is("0", tpl.render(context));
		},

		function test_filter_list(t){
			var dtt = dojox.dtl;
			var context, tpl, result;

			context = new dojox.dtl.Context({
				fruit: [
					{ name: "lemons", toString: function(){ return this.name; } },
					{ name: "apples", toString: function(){ return this.name; } },
					{ name: "grapes", toString: function(){ return this.name; } }
				]
			});
 			tpl = new dtt.Template('{{ fruit|dictsort|join:"|" }}');
			t.is("lemons|apples|grapes", tpl.render(context));
			tpl = new dtt.Template('{{ fruit|dictsort:"name"|join:"|" }}');
			t.is("apples|grapes|lemons", tpl.render(context));

			tpl = new dtt.Template('{{ fruit|dictsortreversed:"name"|join:"|" }}');
			t.is("lemons|grapes|apples", tpl.render(context));

			tpl = new dtt.Template('{{ fruit|first }}');
			t.is("lemons", tpl.render(context));

			tpl = new dtt.Template('{{ fruit|length }}');
			t.is("3", tpl.render(context));
			tpl = new dtt.Template('{{ fruit|first|length }}');
			t.is("6", tpl.render(context));

			tpl = new dtt.Template('{{ fruit|length_is:"3" }}');
			t.is("true", tpl.render(context));
			tpl = new dtt.Template('{{ fruit|length_is:"4" }}');
			t.is("false", tpl.render(context));

			tpl = new dtt.Template('{{ fruit|random }}');
			result = tpl.render(context);
			t.t(result == "lemons" || result == "apples" || result == "grapes");
			var different = false;
			for(var i = 0; i < 10; i++){
				// Check to see if it changes
				if(result != tpl.render(context) && result == "lemons" || result == "apples" || result == "grapes"){
					different = true;
					break;
				}
			}
			t.t(different);

			tpl = new dtt.Template('{{ fruit|slice:":1"|join:"|" }}');
			t.is("lemons", tpl.render(context));
			tpl = new dtt.Template('{{ fruit|slice:"1"|join:"|" }}');
			t.is("apples|grapes", tpl.render(context));
			tpl = new dtt.Template('{{ fruit|slice:"1:3"|join:"|" }}');
			t.is("apples|grapes", tpl.render(context));
			tpl = new dtt.Template('{{ fruit|slice:""|join:"|" }}');
			t.is("lemons|apples|grapes", tpl.render(context));
			tpl = new dtt.Template('{{ fruit|slice:"-1"|join:"|" }}');
			t.is("grapes", tpl.render(context));
			tpl = new dtt.Template('{{ fruit|slice:":-1"|join:"|" }}');
			t.is("lemons|apples", tpl.render(context));
			tpl = new dtt.Template('{{ fruit|slice:"-2:-1"|join:"|" }}');
			t.is("apples", tpl.render(context));

			context = new dojox.dtl.Context({ states: ["States", [["Kansas", [["Lawrence", []], ["Topeka", []]]], ["Illinois", []]]] });
			tpl = new dtt.Template('{{ states|unordered_list }}');
			t.is("\t<li>States\n\t<ul>\n\t\t<li>Kansas\n\t\t<ul>\n\t\t\t<li>Lawrence</li>\n\t\t\t<li>Topeka</li>\n\t\t</ul>\n\t\t</li>\n\t\t<li>Illinois</li>\n\t</ul>\n\t</li>", tpl.render(context));
		},

		function test_filter_logic(t){
			var dtt = dojox.dtl;
			var context, tpl;
			
			context = new dojox.dtl.Context();
			tpl = new dtt.Template('{{ empty|default }}');
			t.is("", tpl.render(context));
			tpl = new dtt.Template('{{ empty|default:"full" }}');
			t.is("full", tpl.render(context));
			context.empty = "not empty";
			t.is("not empty", tpl.render(context));

			context = new dojox.dtl.Context();
			tpl = new dtt.Template('{{ empty|default_if_none }}');
			t.is("", tpl.render(context));
			tpl = new dtt.Template('{{ empty|default_if_none:"full" }}');
			t.is("", tpl.render(context));
			context.empty = null;
			t.is("full", tpl.render(context));
			context.empty = "not empty";
			t.is("not empty", tpl.render(context));

			tpl = new dtt.Template('{{ 4|divisibleby:"2" }}');
			t.is("true", tpl.render(context));
			context = new dojox.dtl.Context({ number: 4 });
			tpl = new dtt.Template('{{ number|divisibleby:3 }}');
			t.is("false", tpl.render(context));

			tpl = new dtt.Template('{{ true|yesno }}');
			t.is("yes", tpl.render(context));
			context = new dojox.dtl.Context({ test: "value" });
			tpl = new dtt.Template('{{ test|yesno }}');
			t.is("yes", tpl.render(context));
			tpl = new dtt.Template('{{ false|yesno }}');
			t.is("no", tpl.render(context));
			tpl = new dtt.Template('{{ null|yesno }}');
			t.is("maybe", tpl.render(context));
			tpl = new dtt.Template('{{ true|yesno:"bling,whack,soso" }}');
			t.is("bling", tpl.render(context));
			context = new dojox.dtl.Context({ test: "value" });
			tpl = new dtt.Template('{{ test|yesno:"bling,whack,soso" }}');
			t.is("bling", tpl.render(context));
			tpl = new dtt.Template('{{ false|yesno:"bling,whack,soso" }}');
			t.is("whack", tpl.render(context));
			tpl = new dtt.Template('{{ null|yesno:"bling,whack,soso" }}');
			t.is("soso", tpl.render(context));
			tpl = new dtt.Template('{{ null|yesno:"bling,whack" }}');
			t.is("whack", tpl.render(context));
		},

		function test_filter_misc(t){
			var dtt = dojox.dtl;
			var tpl;

			tpl = new dtt.Template('{{ 1|filesizeformat }}');
			t.is("1 byte", tpl.render());
			tpl = new dtt.Template('{{ 512|filesizeformat }}');
			t.is("512 bytes", tpl.render());
			tpl = new dtt.Template('{{ 1024|filesizeformat }}');
			t.is("1.0 KB", tpl.render());
			tpl = new dtt.Template('{{ 2048|filesizeformat }}');
			t.is("2.0 KB", tpl.render());
			tpl = new dtt.Template('{{ 1048576|filesizeformat }}');
			t.is("1.0 MB", tpl.render());
			tpl = new dtt.Template('{{ 1073741824|filesizeformat }}');
			t.is("1.0 GB", tpl.render());

			context = new dojox.dtl.Context({ animals: ["bear", "cougar", "aardvark"] });
			tpl = new dtt.Template('{{ animals|length }} animal{{ animals|length|pluralize }}');
			t.is("3 animals", tpl.render(context));
			context.animals = ["bear"];
			t.is("1 animal", tpl.render(context));
			context = new dojox.dtl.Context({ fairies: ["tinkerbell", "Andy Dick" ]});
			tpl = new dtt.Template('{{ fairies|length }} fair{{ fairies|length|pluralize:"y,ies" }}');
			t.is("2 fairies", tpl.render(context));
			context.fairies.pop();
			t.is("1 fairy", tpl.render(context));

			tpl = new dtt.Template('{{ "1-800-pottedmeat"|phone2numeric }}');
			t.is("1-800-7688336328", tpl.render());

			context = new dojox.dtl.Context({ animals: ["bear", "cougar", "aardvark"] });
			tpl = new dtt.Template("{{ animals|pprint }}");
			t.is('["bear", "cougar", "aardvark"]', tpl.render(context));
		},

		function test_filter_string(t){
			var dtt = dojox.dtl;
			var context, tpl;

			tpl = new dtt.Template('{{ unslashed|addslashes }}');
			t.is("Test back slashes \\\\, double quotes \\\" and single quotes \\'", tpl.render(new dojox.dtl.Context({ unslashed: "Test back slashes \\, double quotes \" and single quotes '" })));

			tpl = new dtt.Template('{{ uncapped|capfirst }}');
			t.is("Cap", tpl.render(new dojox.dtl.Context({ uncapped: "cap" })));

			tpl = new dtt.Template('{{ "One & Two"|fix_ampersands }}');
			t.is("One &amp; Two", tpl.render());

			context = new dojox.dtl.Context({ num1: 34.23234, num2: 34.00000 });
			tpl = new dtt.Template('{{ num1|floatformat }}');
			t.is("34.2", tpl.render(context));
			tpl = new dtt.Template('{{ num2|floatformat }}');
			t.is("34", tpl.render(context));
			tpl = new dtt.Template('{{ num1|floatformat:3 }}');
			t.is("34.232", tpl.render(context));
			tpl = new dtt.Template('{{ num2|floatformat:3 }}');
			t.is("34.000", tpl.render(context));
			tpl = new dtt.Template('{{ num1|floatformat:-3 }}');
			t.is("34.2", tpl.render(context));
			tpl = new dtt.Template('{{ num2|floatformat:-3 }}');
			t.is("34", tpl.render(context));

			context = new dojox.dtl.Context({ lines: "One\nTwo\nThree\nFour\n" });
			tpl = new dtt.Template('{{ lines|linenumbers }}');
			t.is("1. One\n2. Two\n3. Three\n4. Four\n5. ", tpl.render(context));

			context = new dojox.dtl.Context({ mixed: "MiXeD" });
			tpl = new dtt.Template('{{ mixed|lower }}');
			t.is("mixed", tpl.render(context));

			context = new dojox.dtl.Context({ word: "foo", number: 314159265, arr: ["first", "second"], obj: {first: "first", second: "second"} });
			tpl = new dtt.Template('{{ word|make_list|join:"|" }} {{ number|make_list|join:"|" }} {{ arr|make_list|join:"|" }} {{ obj|make_list|join:"|" }}');
			t.is("f|o|o 3|1|4|1|5|9|2|6|5 first|second first|second", tpl.render(context));

			context = new dojox.dtl.Context();
			tpl = new dtt.Template('{{ narrow|center }}');
			context.narrow = "even";
			t.is("even", tpl.render(context));
			context.narrow = "odd";
			t.is("odd", tpl.render(context));
			tpl = new dtt.Template('{{ narrow|center:"5" }}');
			context.narrow = "even";
			t.is("even ", tpl.render(context));
			context.narrow = "odd";
			t.is(" odd ", tpl.render(context));
			tpl = new dtt.Template('{{ narrow|center:"6" }}');
			context.narrow = "even";
			t.is(" even ", tpl.render(context));
			context.narrow = "odd";
			t.is(" odd  ", tpl.render(context));
			tpl = new dtt.Template('{{ narrow|center:"12" }}');
			context.narrow = "even";
			t.is("    even    ", tpl.render(context));
			context.narrow = "odd";
			t.is("    odd     ", tpl.render(context));

			context = new dojox.dtl.Context({ uncut: "Apples and oranges" });
			tpl = new dtt.Template('{{ uncut|cut }}');
			t.is("Apples and oranges", tpl.render(context));
			tpl = new dtt.Template('{{ uncut|cut:"A" }}');
			t.is("pples and oranges", tpl.render(context));
			tpl = new dtt.Template('{{ uncut|cut:" " }}');
			t.is("Applesandoranges", tpl.render(context));
			tpl = new dtt.Template('{{ uncut|cut:"e" }}');
			t.is("Appls and orangs", tpl.render(context));

			context = new dojox.dtl.Context({ unslugged: "Apples and oranges()"});
			tpl = new dtt.Template('{{ unslugged|slugify }}');
			t.is("apples-and-oranges", tpl.render(context));
		}
	]
);