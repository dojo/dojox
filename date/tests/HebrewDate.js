dojo.provide("dojox.date.tests.HebrewDate");
dojo.require("dojox.date.HebrewDate");
dojo.require("dojox.date.HebrewLocale");

dojo.requireLocalization("dojo.cldr", "gregorian"); 
dojo.requireLocalization("dojo.cldr", "hebrew");

tests.register("dojox.date.tests.HebrewDate", 
	[
		{
			// see tests for dojo.date.locale for setup info

			name: "dojox.date.tests.posix",
			setUp: function(){
				var partLocaleList = ["he"];

				dojo.forEach(partLocaleList, function(locale){
					dojo.requireLocalization("dojo.cldr", "gregorian", locale);
					dojo.requireLocalization("dojo.cldr", "hebrew", locale);
				});
			},
			runTest: function(t){
			},
			tearDown: function(){
				//Clean up bundles that should not exist if
				//the test is re-run.
				delete dojo.cldr.nls.gregorian;
				delete dojo.cldr.nls.hebrew;
			}
		},	
		{
			name: "toGregorian",
			runTest: function(t){
				var dateHebrew = new dojox.date.HebrewDate(5769, 2, 22); //HebrewDate month 0-12
				var dateGregorian = dateHebrew.toGregorian();
				t.is(0, dojo.date.compare(new Date(2008, 11, 19), dateGregorian, "date"));//Date month 0-11
				
				dateHebrew = new dojox.date.HebrewDate(5765, 7, 9); 
				dateGregorian = dateHebrew.toGregorian();
				t.is(0, dojo.date.compare(new Date(2005, 3, 18), dateGregorian, "date"));
				
				dateHebrew = new dojox.date.HebrewDate(5767, 10, 26); 
				dateGregorian = dateHebrew.toGregorian();
				t.is(0, dojo.date.compare(new Date(2007, 7, 10), dateGregorian, "date"));
				
				dateHebrew = new dojox.date.HebrewDate(5769, 7, 26); 
				dateGregorian = dateHebrew.toGregorian();
				t.is(0, dojo.date.compare(new Date(2009, 4, 20), dateGregorian, "date"));
				
				dateHebrew = new dojox.date.HebrewDate(5770, 10, 20); 
				dateGregorian = dateHebrew.toGregorian();
				t.is(0, dojo.date.compare(new Date(2010, 6, 31), dateGregorian, "date"));
				
				dateHebrew = new dojox.date.HebrewDate(5772, 0, 3); 
				dateGregorian = dateHebrew.toGregorian();
				t.is(0, dojo.date.compare(new Date(2011, 9, 1), dateGregorian, "date"));				
			}
		},
		{
			name: "fromGregorian",
			runTest: function(t){
				var dateGregorian = new Date(2009, 3, 12);
				var dateHebrewFromGreg= dojox.date.HebrewDate.fromGregorian(dateGregorian);
				t.is(0, dojo.date.compare( dateHebrewFromGreg.toGregorian(), dateGregorian, "date"));
				t.is(0, dojo.date.compare( dateHebrewFromGreg.toGregorian(), dateGregorian));
				
				dateGregorian = new Date(2008, 11, 18);  //Date month 0-11
				dateHebrewFromGreg = dojox.date.HebrewDate.fromGregorian(dateGregorian);
				t.is(0, dojo.date.compare(new dojox.date.HebrewDate(5769, 2, 21), dateHebrewFromGreg, "date")); //HebrewDate month 0-12
	
				dateGregorian = new Date(2005, 3, 18);
				dateHebrewFromGreg = dojox.date.HebrewDate.fromGregorian(dateGregorian);
				t.is(0, dojo.date.compare(new dojox.date.HebrewDate(5765, 7, 9), dateHebrewFromGreg, "date"));
				
				dateGregorian = new Date(2007, 7, 10);
				dateHebrewFromGreg = dojox.date.HebrewDate.fromGregorian(dateGregorian);
				t.is(0, dojo.date.compare(new dojox.date.HebrewDate(5767, 10, 26), dateHebrewFromGreg, "date"));					
				
				dateGregorian = new Date(2009, 4, 20);
				dateHebrewFromGreg = dojox.date.HebrewDate.fromGregorian(dateGregorian);
				t.is(0, dojo.date.compare(new dojox.date.HebrewDate(5769, 7, 26), dateHebrewFromGreg, "date"));				
				
				dateGregorian = new Date(2010, 6, 31);
				dateHebrewFromGreg = dojox.date.HebrewDate.fromGregorian(dateGregorian);
				t.is(0, dojo.date.compare(new dojox.date.HebrewDate(5770, 10, 20), dateHebrewFromGreg, "date"));	
				
				dateGregorian = new Date(2011, 9, 1);
				dateHebrewFromGreg = dojox.date.HebrewDate.fromGregorian(dateGregorian);
				t.is(0, dojo.date.compare(new dojox.date.HebrewDate(5772, 0, 3), dateHebrewFromGreg, "date"));					
			}
		},
		{
			name: "compare",
			runTest: function(t){
				var dateHebrew = new dojox.date.HebrewDate(5769, 5, 16);
				var dateHebrew1 = new dojox.date.HebrewDate(5758,  10,  25);
				t.is(1, dojo.date.compare(dateHebrew.toGregorian(), dateHebrew1.toGregorian()));
				t.is(-1, dojo.date.compare(dateHebrew1.toGregorian(), dateHebrew.toGregorian()));
			}	
		},		
		{
			name: "add_and_difference",
			runTest: function(t){
				var dateHebrew = new dojox.date.HebrewDate(5769, 5, 16);
				var dateHebrewLeap = new dojox.date.HebrewDate(5768, 5, 16);
				
				var dateHebrewAdd = dojox.date.HebrewDate.add(dateHebrew, "month",  18);
				var dateHebrewAddLeap = dojox.date.HebrewDate.add(dateHebrewLeap, "month",  18);
				t.is(0, 18 - dojox.date.HebrewDate.difference(dateHebrewAdd, dateHebrew, "month"));
				t.is(0, 18 - dojox.date.HebrewDate.difference(dateHebrewAddLeap, dateHebrewLeap, "month"));
								
				var dateHebrewAdd1= dojox.date.HebrewDate.add(dateHebrew, "year", 2);
				t.is(0,  2 - dojox.date.HebrewDate.difference(dateHebrewAdd1, dateHebrew, "year"));
				t.is(0,  2 - dojox.date.HebrewDate.difference(dojox.date.HebrewDate.add(dateHebrewLeap, "year", 2), dateHebrewLeap, "year"));
				
				var dateHebrewAdd2= dojox.date.HebrewDate.add(dateHebrew, "week",  12);
				t.is(0, 12 - dojox.date.HebrewDate.difference(dateHebrewAdd2, dateHebrew, "week"));
				t.is(0,  12 - dojox.date.HebrewDate.difference(dojox.date.HebrewDate.add(dateHebrewLeap, "week", 12), dateHebrewLeap,"week"));
								
				var dateHebrewAdd3= dojox.date.HebrewDate.add(dateHebrew, "weekday", 20);
				 t.is(0, 20 - dojox.date.HebrewDate.difference(dateHebrewAdd3, dateHebrew, "weekday")); 
				 t.is(0,  20 - dojox.date.HebrewDate.difference(dojox.date.HebrewDate.add(dateHebrewLeap, "weekday", 20), dateHebrewLeap,"weekday"));
				
				var dateHebrewAdd4= dojox.date.HebrewDate.add(dateHebrew, "day", -50)
				t.is(0, -50 - dojox.date.HebrewDate.difference(dateHebrewAdd4, dateHebrew, "day")); 
				t.is(0, -50 - dojox.date.HebrewDate.difference(dojox.date.HebrewDate.add(dateHebrewLeap, "day", -50), dateHebrewLeap,"day"));
											
				var dateHebrewAdd5= dojox.date.HebrewDate.add(dateHebrew, "hour", 200);
				t.is(0, 200 - dojox.date.HebrewDate.difference(dateHebrewAdd5, dateHebrew, "hour"));  
				t.is(0, 200 - dojox.date.HebrewDate.difference(dojox.date.HebrewDate.add(dateHebrewLeap, "hour", 200), dateHebrewLeap,"hour"));
				
				var dateHebrewAdd6= dojox.date.HebrewDate.add(dateHebrew, "minute", -200);
				t.is(0, -200 - dojox.date.HebrewDate.difference(dateHebrewAdd6, dateHebrew, "minute")); 
				t.is(0, -200 - dojox.date.HebrewDate.difference(dojox.date.HebrewDate.add(dateHebrewLeap, "minute", -200), dateHebrewLeap,"minute")); 
				
				var dateHebrewDiff = new dojox.date.HebrewDate(5769, 5, 17);
				t.is(1, dojox.date.HebrewDate.difference(dateHebrewDiff, dateHebrew)); 
			}
		},
		{
			name: "parse_and_format",
			runTest: function(t){
				var dateHebrew = new dojox.date.HebrewDate(5769, 5, 16);
					
				var options = {formatLength:'short'};
				str= dojox.date.HebrewLocale.format(dateHebrew, options);
				dateHebrew1 = dojox.date.HebrewLocale.parse(str, options);
				t.is(0, dojo.date.compare(dateHebrew.toGregorian(), dateHebrew1.toGregorian(), 'date'));
				
				var pat = 'dd/MM/yy h:m:s';
				 options = {datePattern:pat, selector:'date'};
				 str= dojox.date.HebrewLocale.format(dateHebrew, options);
				 dateHebrew1 = dojox.date.HebrewLocale.parse(str, options);
				 t.is(0, dojo.date.compare(dateHebrew.toGregorian(), dateHebrew1.toGregorian(), 'date'));
				 
				pat = 'dd#MM#yy HH$mm$ss';
				 options = {datePattern:pat, selector:'date'};
				 str= dojox.date.HebrewLocale.format(dateHebrew, options);
				 dateHebrew1 = dojox.date.HebrewLocale.parse(str, options);
				  t.is(0, dojo.date.compare(dateHebrew.toGregorian(), dateHebrew1.toGregorian(), 'date'));
				
				
				 pat = 'HH$mm$ss';
				 options = {timePattern:pat, selector:'time'};
				 str= dojox.date.HebrewLocale.format(dateHebrew, options);
				 dateHebrew1 = dojox.date.HebrewLocale.parse(str, options);
				gregDate = dojo.date.locale.parse(str, options);
				t.is(0, dojo.date.compare(gregDate, dateHebrew1.toGregorian(), 'time'));	
								 	
			}		
		}	
	]
);

