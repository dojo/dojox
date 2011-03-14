dojo.provide("dojox.string.tests.BidiEngine.BidiEngine");
dojo.require("dojox.string.BidiEngine");
dojo.addOnLoad(function(){
			
	var unilisrc = [
		// 0
		"abc def ghij",
		// 1
		"abc\u0020\u05d4\u05d5\u05d6\u05d7\u0020\u05d8\u05d9\u05da\u0020\u05da\u05db\u05dc\u05dd\u0020opq rstu",
		// 2
		"abc !\"#$%&'()*+,-./:;<=>?@[\]^_`{|}~ def",
		// 3
		"abc !\"#$%&'()*+,-./:;<=>?@[\]^_`{|}~ \u05d4\u05d5\u05d6",
		// 4
		".-= abc def /\\",
		// 5
		".-= abc \u05d4\u05d5\u05d6 /\\",
		// 6
		"abc 123",
		// 7
		"abc 123 401",
		// 8
		"abc 123 ghi",
		// 9
		"abc 123 401 ghi",
		// 10
		"abc 123 \u05d7\u05d8\u05d9",
		// 11
		"abc 123 401 \u05d7\u05d8\u05d9",
		// 12
		"abc0123",
		// 13
		"abc0123 401",
		// 14
		"abc0123ghi",
		// 15
		"abc0123 401ghi",
		// 16
		"abc0123\u05d7\u05d8\u05d9",
		// 17
		"abc0123 401\u05d7\u05d8\u05d9",
		// 18
		"abc \u05d4\u05d5\u05d6 123",
		// 19
		"abc \u05d4\u05d5\u05d6 123 401",
		// 20
		"abc \u05d4\u05d5\u05d6 123 ghi",
		// 21
		"abc \u05d4\u05d5\u05d6 123 401 ghi",
		// 22
		"abc \u05d4\u05d5\u05d6 123 \u05d7\u05d8\u05d9",
		// 23
		"abc \u05d4\u05d5\u05d6 123 401 \u05d7\u05d8\u05d9",
		// 24
		"abc \u05d4\u05d5\u05d60123",
		// 25
		"abc \u05d4\u05d5\u05d60123 401",
		// 26
		"abc \u05d4\u05d5\u05d601234ghi",
		// 27
		"abc \u05d4\u05d5\u05d60123 401ghi",
		// 28
		"abc \u05d4\u05d5\u05d601234\u05d7\u05d8\u05d9",
		// 29
		"abc \u05d4\u05d5\u05d60123 401\u05d7\u05d8\u05d9",
		// 30
		"123 401 abc def",
		// 31
		"abc(\u05d4\u05d5\u05d6)\u05d7\u05d8\u05d9",
		// 32
		"abc(\u05d4\u05d5\u05d6)ghi",
		// 33
		"abc(def)\u05d7\u05d8\u05d9",
		// 34
		"abc(def)ghi",
		// 35
		"abc\u05bbde\u05b8fg",
		// 36
		"abc\u05bb\u05d4\u05d5\u05b8fg",
		// 37
		"abc \u05d4\u05d5\u05d6\u05d7	\u05d8\u05d9\u05da klm",
		// 38
		"abc \u05d4\u05d5\u05d6\u05d7	hij klm",
		// 39
		"abc defg	\u05d8\u05d9\u05da klm",
		// 40
		"abc defg	hij klm",
		// 41
		"abc \u05d4\u05d5\u05d6\u05d7    	  \u05d8\u05d9\u05da klm",
		// 42
		"abc \u05d4\u05d5\u05d6\u05d7    	  hij klm",
		// 43
		"abc defg    	  \u05d8\u05d9\u05da klm",
		// 44
		"abc defg    	  hij klm",
		// 45
		"abc \u05d4\u05d5\u05d6\u05d7 ._-	=\u005c\u05d8\u05d9\u05da klm",
		// 46
		"abc \u05d4\u05d5\u05d6\u05d7 ._-	=\hij klm",
		// 47
		"abc defg ._-	=\u005c\u05d8\u05d9\u05da klm",
		// 48
		"abc defg ._-	=\hij klm",
		// 49
		"abc \u05d4\u05d5\u05d6\u05d7 ._-    	  =\u005c\u05d8\u05d9\u05da klm",
		// 50
		"abc \u05d4\u05d5\u05d6\u05d7 ._-    	  =\hij klm",
		// 51
		"abc defg ._-    	  =\u005c\u05d8\u05d9\u05da klm",
		// 52
		"abc defg ._-    	  =\hij klm",
		// 53
		"   abc \u05d4\u05d5\u05d6 ghi",
		// 54
		".- abc \u05d4\u05d5\u05d6 ghi",
		// 55
		"12 abc \u05d4\u05d5\u05d6 ghi",
		// 56
		"/* 012$ % 3401$ < = 12 */"
		];

	var uniliout = [
		"abc def ghij",
		//"abc �?�?כ�? �?יט חזוה opq rstu",
		"abc \u05dd\u05dc\u05db\u05da\u0020\u05da\u05d9\u05d8\u0020\u05d7\u05d6\u05d5\u05d4 opq rstu",
		"abc !\"#$%&'()*+,-./:;<=>?@[\]^_`{|}~ def",
		//"abc !\"#$%&'()*+,-./:;<=>?@[\]^_`{|}~ זוה",
		"abc !\"#$%&'()*+,-./:;<=>?@[\]^_`{|}~ \u05d6\u05d5\u05d4",
		".-= abc def /\\",
		//".-= abc זוה /\\",
		".-= abc \u05d6\u05d5\u05d4 /\\",
		"abc 123",
		"abc 123 401",
		"abc 123 ghi",
		"abc 123 401 ghi",
		//"abc 123 יטח",
		"abc 123 \u05d9\u05d8\u05d7",
		//"abc 123 401 יטח",
		"abc 123 401 \u05d9\u05d8\u05d7",
		"abc0123",
		"abc0123 401",
		"abc0123ghi",
		"abc0123 401ghi",
		//"abc0123יטח",
		"abc0123\u05d9\u05d8\u05d7",
		//"abc0123 401יטח",
		"abc0123 401\u05d9\u05d8\u05d7",
		//"abc 123 זוה",
		"abc 123 \u05d6\u05d5\u05d4",
		//"abc 401 123 זוה",
		"abc 401 123 \u05d6\u05d5\u05d4",
		//"abc 123 זוה ghi",
		"abc 123 \u05d6\u05d5\u05d4 ghi",
		//"abc 401 123 זוה ghi",
		"abc 401 123 \u05d6\u05d5\u05d4 ghi",
		//"abc יטח 123 זוה",
		"abc \u05d9\u05d8\u05d7 123 \u05d6\u05d5\u05d4",
		//"abc יטח 401 123 זוה",
		"abc \u05d9\u05d8\u05d7 401 123 \u05d6\u05d5\u05d4",
		//"abc 0123זוה",
		"abc 0123\u05d6\u05d5\u05d4",
		//"abc 401 0123זוה",
		"abc 401 0123\u05d6\u05d5\u05d4",
		//"abc 01234זוהghi",
		"abc 01234\u05d6\u05d5\u05d4ghi",
		//"abc 401 0123זוהghi",
		"abc 401 0123\u05d6\u05d5\u05d4ghi",
		//"abc יטח01234זוה",
		"abc \u05d9\u05d8\u05d701234\u05d6\u05d5\u05d4",
		//"abc יטח401 0123זוה",
		"abc \u05d9\u05d8\u05d7401 0123\u05d6\u05d5\u05d4",
		"123 401 abc def",
		//"abc(יטח(זוה",
		"abc(\u05d9\u05d8\u05d7(\u05d6\u05d5\u05d4",
		//"abc(זוה)ghi",
		"abc(\u05d6\u05d5\u05d4)ghi",
		//"abc(def)יטח",
		"abc(def)\u05d9\u05d8\u05d7",
		"abc(def)ghi",
		//"abcֻdeָfg",
		"abc\u05bbde\u05b8fg",
		//"abcָֻוהfg",
		"abc\u05bb\u05b8\u05d5\u05d4fg",
		//"abc חזוה	�?יט klm",
		"abc \u05d7\u05d6\u05d5\u05d4	\u05da\u05d9\u05d8 klm",
		//"abc חזוה	hij klm",
		"abc \u05d7\u05d6\u05d5\u05d4	hij klm",
		//"abc defg	�?יט klm",
		"abc defg	\u05da\u05d9\u05d8 klm",
		"abc defg	hij klm",
		//"abc חזוה    	�?יט   klm",
		"abc \u05d7\u05d6\u05d5\u05d4    	\u05da\u05d9\u05d8   klm",
		//"abc חזוה    	  hij klm",
		"abc \u05d7\u05d6\u05d5\u05d4    	  hij klm",
		//"abc defg    	  �?יט klm",
		"abc defg    	  \u05da\u05d9\u05d8 klm",
		"abc defg    	  hij klm",
		//"abc -_. חזוה	�?יט\= klm",
		"abc -_. \u05d7\u05d6\u05d5\u05d4	\u05da\u05d9\u05d8\u005c= klm",
		//"abc חזוה ._-	=\hij klm",
		"abc \u05d7\u05d6\u05d5\u05d4 ._-	=\hij klm",
		//"abc defg ._-	=\�?יט klm",
		"abc defg ._-	=\u005c\u05da\u05d9\u05d8 klm",
		"abc defg ._-	=\hij klm",
		//"abc -_. חזוה    	�?יט\=   klm",
		"abc -_. \u05d7\u05d6\u05d5\u05d4    	\u05da\u05d9\u05d8\u005c=   klm",
		//"abc חזוה ._-    	  =\hij klm",
		"abc \u05d7\u05d6\u05d5\u05d4 ._-    	  =\hij klm",
		//"abc defg ._-    	  =\�?יט klm",
		"abc defg ._-    	  =\u005c\u05da\u05d9\u05d8 klm",
		"abc defg ._-    	  =\hij klm",
		//"   abc זוה ghi",
		"   abc \u05d6\u05d5\u05d4 ghi",
		//".- abc זוה ghi",
		".- abc \u05d6\u05d5\u05d4 ghi",
		//"12 abc זוה ghi",
		"12 abc \u05d6\u05d5\u05d4 ghi",
		"/* 012$ % 3401$ < = 12 */"
		];
	var unirisrc = [
		//"בגד הוז חטי�?",
		"\u05d1\u05d2\u05d3\u0020\u05d4\u05d5\u05d6\u0020\u05d7\u05d8\u05d9\u05da",
		//"בגד defg hij klmn זחט י�?כ�?",
		"\u05d1\u05d2\u05d3 defg hij klmn \u05d6\u05d7\u05d8\u0020\u05d9\u05da\u05db\u05dc",
		//"בגד #123 $234 %340 +401 -012 הוז",
		"\u05d1\u05d2\u05d3 #123 $234 %340 +401 -012 \u05d4\u05d5\u05d6",
		//"בגד 123# 234$ 340% 401+ 012- הוז",
		"\u05d1\u05d2\u05d3 123# 234$ 340% 401+ 012- \u05d4\u05d5\u05d6",
		//"בגד 123#234$340%401+012-024 הוז",
		"\u05d1\u05d2\u05d3 123#234$340%401+012-024 \u05d4\u05d5\u05d6",
		//"בגד 123-",
		"\u05d1\u05d2\u05d3 123-",
		//"יז 20 + 14 = 34?",
		"\u05d9\u05d6 20 + 14 = 34?",
		//"בגד 123.",
		"\u05d1\u05d2\u05d3 123.",
		//"בגד 12,340,123.40:13:24/30/41 הוז",
		"\u05d1\u05d2\u05d3 12,340,123.40:13:24/30/41 \u05d4\u05d5\u05d6",
		//"בגד -12,340.13$ הוז",
		"\u05d1\u05d2\u05d3 -12,340.13$ \u05d4\u05d5\u05d6",
		//"י ד�?בי�?: 4.4-0.4=4.0, ok?",
		"\u05d9\u0020\u05d3\u05dc\u05d1\u05d9\u05dd: 4.4-0.4=4.0, ok?",
		//"בגד ,123 .234 :340 /401 הוז",
		"\u05d1\u05d2\u05d3 ,123 .234 :340 /401 \u05d4\u05d5\u05d6",
		//"בגד 123, 234. 340: 401/ הוז",
		"\u05d1\u05d2\u05d3 123, 234. 340: 401/ \u05d4\u05d5\u05d6",
		//"בגד 123..40 הוז",
		"\u05d1\u05d2\u05d3 123..40 \u05d4\u05d5\u05d6",
		//"בגד 123.,40 הוז",
		"\u05d1\u05d2\u05d3 123.,40 \u05d4\u05d5\u05d6",
		//"בגד 123/.40 הוז",
		"\u05d1\u05d2\u05d3 123/.40 \u05d4\u05d5\u05d6",
		//"בגד ---123$$ הוז",
		"\u05d1\u05d2\u05d3 ---123$$ \u05d4\u05d5\u05d6",
		//"בגד +-123#$% הוז",
		"\u05d1\u05d2\u05d3 +-123#$% \u05d4\u05d5\u05d6",
		//"בגד 123###234$%340%%%401+--012-++130 הוז",
		"\u05d1\u05d2\u05d3 123###234$%340%%%401+--012-++130 \u05d4\u05d5\u05d6",
		//"בגד !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ הוז",
		"\u05d1\u05d2\u05d3 !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ \u05d4\u05d5\u05d6",
		//"בגד !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ def",
		"\u05d1\u05d2\u05d3 !\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~ def",
		//".-= בגד הוז /\\",
		".-= \u05d1\u05d2\u05d3 \u05d4\u05d5\u05d6 /\\",
		//".-= בגד def /\\",
		".-= \u05d1\u05d2\u05d3 def /\\",
		//"בגד 123",
		"\u05d1\u05d2\u05d3 123",
		//"בגד 123 401",
		"\u05d1\u05d2\u05d3 123 401",
		//"בגד 123 חטי",
		"\u05d1\u05d2\u05d3 123 \u05d7\u05d8\u05d9",
		//"בגד 123 401 חטי",
		"\u05d1\u05d2\u05d3 123 401 \u05d7\u05d8\u05d9",
		//"בגד 123 ghi",
		"\u05d1\u05d2\u05d3 123 ghi",
		//"בגד 123 401 ghi",
		"\u05d1\u05d2\u05d3 123 401 ghi",
		//"בגד0123",
		"\u05d1\u05d2\u05d30123",
		//"בגד0123 401",
		"\u05d1\u05d2\u05d30123 401",
		//"בגד01234חטי",
		"\u05d1\u05d2\u05d301234\u05d7\u05d8\u05d9",
		//"בגד0123 401חטי",
		"\u05d1\u05d2\u05d30123 401\u05d7\u05d8\u05d9",
		//"בגד01234ghi",
		"\u05d1\u05d2\u05d301234ghi",
		//"בגד0123 401ghi",
		"\u05d1\u05d2\u05d30123 401ghi",
		//"בגד def 123",
		"\u05d1\u05d2\u05d3 def 123",
		//"בגד def 123 401",
		"\u05d1\u05d2\u05d3 def 123 401",
		//"בגד def 123 חטי",
		"\u05d1\u05d2\u05d3 def 123 \u05d7\u05d8\u05d9",
		//"בגד def 123 401 חטי",
		"\u05d1\u05d2\u05d3 def 123 401 \u05d7\u05d8\u05d9",
		//"בגד def 123 ghi",
		"\u05d1\u05d2\u05d3 def 123 ghi",
		//"בגד def 123 401 ghi",
		"\u05d1\u05d2\u05d3 def 123 401 ghi",
		//"בגד def123",
		"\u05d1\u05d2\u05d3 def123",
		//"בגד def0123 401",
		"\u05d1\u05d2\u05d3 def0123 401",
		//"בגד def01234חטי",
		"\u05d1\u05d2\u05d3 def01234\u05d7\u05d8\u05d9",
		//"בגד def0123 401חטי",
		"\u05d1\u05d2\u05d3 def0123 401\u05d7\u05d8\u05d9",
		//"בגד def01234ghi",
		"\u05d1\u05d2\u05d3 def01234ghi",
		//"בגד def0123 401ghi",
		"\u05d1\u05d2\u05d3 def0123 401ghi",
		//"123 401 בגד הוז",
		"123 401 \u05d1\u05d2\u05d3 \u05d4\u05d5\u05d6",
		//"בגד(הוז)חטי",
		"\u05d1\u05d2\u05d3(\u05d4\u05d5\u05d6)\u05d7\u05d8\u05d9",
		//"בגד(הוז)ghi",
		"\u05d1\u05d2\u05d3(\u05d4\u05d5\u05d6)ghi",
		//"בגד(def)חטי",
		"\u05d1\u05d2\u05d3(def)\u05d7\u05d8\u05d9",
		//"בגד(def)ghi",
		"\u05d1\u05d2\u05d3(def)ghi",
		//"בגד (הוז) [חטי] {�?כ�?} <�?ב> גדה",
		"\u05d1\u05d2\u05d3 (\u05d4\u05d5\u05d6) [\u05d7\u05d8\u05d9] {\u05da\u05db\u05dc} <\u05dd\u05d1> \u05d2\u05d3\u05d4",
		//"בגדֻהוָזח",
		"\u05d1\u05d2\u05d3\u05bb\u05d4\u05d5\u05b8\u05d6\u05d7",
		//"בגדֻdוָזח",
		"\u05d1\u05d2\u05d3\u05bb\u0064\u05d5\u05b8\u05d6\u05d7",
		//"ֻהו",
		"\u05bb\u05d4\u05d5",
		//"בגד defg	hij כ�?�?",
		"\u05d1\u05d2\u05d3 defg	hij \u05db\u05dc\u05dd",
		//"בגד defg	טי�? כ�?�?",
		"\u05d1\u05d2\u05d3 defg	\u05d8\u05d9\u05da \u05db\u05dc\u05dd",
		//"בגד הוזח	hij כ�?�?",
		"\u05d1\u05d2\u05d3 \u05d4\u05d5\u05d6\u05d7	hij \u05db\u05dc\u05dd",
		//"בגד הוזח	טי�? כ�?�?",
		"\u05d1\u05d2\u05d3 \u05d4\u05d5\u05d6\u05d7	\u05d8\u05d9\u05da \u05db\u05dc\u05dd",
		//"בגד defg    	  hij כ�?�?",
		"\u05d1\u05d2\u05d3 defg    	  hij \u05db\u05dc\u05dd",
		//"בגד defg    	  טי�? כ�?�?",
		"\u05d1\u05d2\u05d3 defg    	  \u05d8\u05d9\u05da \u05db\u05dc\u05dd",
		//"בגד הוזח    	  hij כ�?�?",
		"\u05d1\u05d2\u05d3 \u05d4\u05d5\u05d6\u05d7    	  hij \u05db\u05dc\u05dd",
		//"בגד הוזח    	  טי�? כ�?�?",
		"\u05d1\u05d2\u05d3 \u05d4\u05d5\u05d6\u05d7    	  \u05d8\u05d9\u05da \u05db\u05dc\u05dd",
		//"בגד defg ._-	=\hij כ�?�?",
		"\u05d1\u05d2\u05d3 defg ._-	=\hij \u05db\u05dc\u05dd",
		//"בגד defg ._-	=\טי�? כ�?�?",
		"\u05d1\u05d2\u05d3 defg ._-	=\u005c\u05d8\u05d9\u05da \u05db\u05dc\u05dd",
		//"בגד הוזח ._-	=\hij כ�?�?",
		"\u05d1\u05d2\u05d3 \u05d4\u05d5\u05d6\u05d7 ._-	=\hij \u05db\u05dc\u05dd",
		//"בגד הוזח ._-	=\טי�? כ�?�?",
		"\u05d1\u05d2\u05d3 \u05d4\u05d5\u05d6\u05d7 ._-	=\u005c\u05d8\u05d9\u05da \u05db\u05dc\u05dd",
		//"בגד defg ._-    	  =\hij כ�?�?",
		"\u05d1\u05d2\u05d3 defg ._-    	  =\hij \u05db\u05dc\u05dd",
		//"בגד defg ._-    	  =\טי�? כ�?�?",
		"\u05d1\u05d2\u05d3 defg ._-    	  =\u005c\u05d8\u05d9\u05da \u05db\u05dc\u05dd",
		//"בגד הוזח ._-    	  =\hij כ�?�?",
		"\u05d1\u05d2\u05d3 \u05d4\u05d5\u05d6\u05d7 ._-    	  =\hij \u05db\u05dc\u05dd",
		//"בגד הוזח ._-    	  =\טי�? כ�?�?",
		"\u05d1\u05d2\u05d3 \u05d4\u05d5\u05d6\u05d7 ._-    	  =\u005c\u05d8\u05d9\u05da \u05db\u05dc\u05dd",
		//"   בגד def חטי",
		"   \u05d1\u05d2\u05d3 def \u05d7\u05d8\u05d9",
		//".- בגד def חטי",
		".- \u05d1\u05d2\u05d3 def \u05d7\u05d8\u05d9",
		//"12 בגד def חטי",
		"12 \u05d1\u05d2\u05d3 def \u05d7\u05d8\u05d9",
		//"1. בגד def חטי",
		"1. \u05d1\u05d2\u05d3 def \u05d7\u05d8\u05d9",
		//"1) בגד def חטי",
		"1) \u05d1\u05d2\u05d3 def \u05d7\u05d8\u05d9",
		//".3 בגד def חטי"
		".3 \u05d1\u05d2\u05d3 def \u05d7\u05d8\u05d9"
	];
	var uniriout = [
		//"�?יטח זוה דגב",
		"\u05da\u05d9\u05d8\u05d7\u0020\u05d6\u05d5\u05d4\u0020\u05d3\u05d2\u05d1",
		//"�?כ�?י טחז defg hij klmn דגב",
		"\u05dc\u05db\u05da\u05d9 \u05d8\u05d7\u05d6 defg hij klmn \u05d3\u05d2\u05d1",
		//"זוה 012- 401+ %340 $234 #123 דגב",
		"\u05d6\u05d5\u05d4 012- 401+ %340 $234 #123 \u05d3\u05d2\u05d1",
		//"זוה -012 +401 340% 234$ 123# דגב",
		"\u05d6\u05d5\u05d4 -012 +401 340% 234$ 123# \u05d3\u05d2\u05d1",
		//"זוה 123#234$340%401+012-024 דגב",
		"\u05d6\u05d5\u05d4 123#234$340%401+012-024 \u05d3\u05d2\u05d1",
		//"-123 דגב",
		"-123 \u05d3\u05d2\u05d1",
		//"?34 = 14 + 20 זי",
		"?34 = 14 + 20 \u05d6\u05d9",
		//".123 דגב",
		".123 \u05d3\u05d2\u05d1",
		//"זוה 12,340,123.40:13:24/30/41 דגב",
		"\u05d6\u05d5\u05d4 12,340,123.40:13:24/30/41 \u05d3\u05d2\u05d1",
		//"זוה 12,340.13$- דגב",
		"\u05d6\u05d5\u05d4 12,340.13$- \u05d3\u05d2\u05d1",
		//"?ok ,4.0=4.4-0.4 :�?יב�?ד י",
		"?ok ,4.0=4.4-0.4 :\u05dd\u05d9\u05d1\u05dc\u05d3\u0020\u05d9",
		//"זוה 401/ 340: 234. 123, דגב",
		"\u05d6\u05d5\u05d4 401/ 340: 234. 123, \u05d3\u05d2\u05d1",
		//"זוה /401 :340 .234 ,123 דגב",
		"\u05d6\u05d5\u05d4 /401 :340 .234 ,123 \u05d3\u05d2\u05d1",
		//"זוה 40..123 דגב",
		"\u05d6\u05d5\u05d4 40..123 \u05d3\u05d2\u05d1",
		//"זוה 40,.123 דגב",
		"\u05d6\u05d5\u05d4 40,.123 \u05d3\u05d2\u05d1",
		//"זוה 40./123 דגב",
		"\u05d6\u05d5\u05d4 40./123 \u05d3\u05d2\u05d1",
		//"זוה 123$$--- דגב",
		"\u05d6\u05d5\u05d4 123$$--- \u05d3\u05d2\u05d1",
		//"זוה 123#$%-+ דגב",
		"\u05d6\u05d5\u05d4 123#$%-+ \u05d3\u05d2\u05d1",
		//"זוה 130++-012--+123###234$%340%%%401 דגב",
		"\u05d6\u05d5\u05d4 130++-012--+123###234$%340%%%401 \u05d3\u05d2\u05d1",
		//"זוה ~{|}`_^[\\]@?<=>;:/.-,+*()'&%$#\"! דגב",
		"\u05d6\u05d5\u05d4 ~{|}`_^[\\]@?<=>;:/.-,+*()'&%$#\"! \u05d3\u05d2\u05d1",
		//"def ~{|}`_^[\\]@?<=>;:/.-,+*()'&%$#\"! דגב",
		"def ~{|}`_^[\\]@?<=>;:/.-,+*()'&%$#\"! \u05d3\u05d2\u05d1",
		//"\\/ זוה דגב =-.",
		"\\/ \u05d6\u05d5\u05d4 \u05d3\u05d2\u05d1 =-.",
		//"\\/ def דגב =-.",
		"\\/ def \u05d3\u05d2\u05d1 =-.",
		//"123 דגב",
		"123 \u05d3\u05d2\u05d1",
		//"401 123 דגב",
		"401 123 \u05d3\u05d2\u05d1",
		//"יטח 123 דגב",
		"\u05d9\u05d8\u05d7 123 \u05d3\u05d2\u05d1",
		//"יטח 401 123 דגב",
		"\u05d9\u05d8\u05d7 401 123 \u05d3\u05d2\u05d1",
		//"ghi 123 דגב",
		"ghi 123 \u05d3\u05d2\u05d1",
		//"ghi 401 123 דגב",
		"ghi 401 123 \u05d3\u05d2\u05d1",
		//"0123דגב",
		"0123\u05d3\u05d2\u05d1",
		//"401 0123דגב",
		"401 0123\u05d3\u05d2\u05d1",
		//"יטח01234דגב",
		"\u05d9\u05d8\u05d701234\u05d3\u05d2\u05d1",
		//"יטח401 0123דגב",
		"\u05d9\u05d8\u05d7401 0123\u05d3\u05d2\u05d1",
		//"01234ghiדגב",
		"01234ghi\u05d3\u05d2\u05d1",
		//"401ghi 0123דגב",
		"401ghi 0123\u05d3\u05d2\u05d1",
		//"def 123 דגב",
		"def 123 \u05d3\u05d2\u05d1",
		//"def 123 401 דגב",
		"def 123 401 \u05d3\u05d2\u05d1",
		//"יטח def 123 דגב",
		"\u05d9\u05d8\u05d7 def 123 \u05d3\u05d2\u05d1",
		//"יטח def 123 401 דגב",
		"\u05d9\u05d8\u05d7 def 123 401 \u05d3\u05d2\u05d1",
		//"def 123 ghi דגב",
		"def 123 ghi \u05d3\u05d2\u05d1",
		//"def 123 401 ghi דגב",
		"def 123 401 ghi \u05d3\u05d2\u05d1",
		//"def123 דגב",
		"def123 \u05d3\u05d2\u05d1",
		//"def0123 401 דגב",
		"def0123 401 \u05d3\u05d2\u05d1",
		//"יטחdef01234 דגב",
		"\u05d9\u05d8\u05d7def01234 \u05d3\u05d2\u05d1",
		//"יטחdef0123 401 דגב",
		"\u05d9\u05d8\u05d7def0123 401 \u05d3\u05d2\u05d1",
		//"def01234ghi דגב",
		"def01234ghi \u05d3\u05d2\u05d1",
		//"def0123 401ghi דגב",
		"def0123 401ghi \u05d3\u05d2\u05d1",
		//"זוה דגב 401 123",
		"\u05d6\u05d5\u05d4 \u05d3\u05d2\u05d1 401 123",
		//"יטח(זוה)דגב",
		"\u05d9\u05d8\u05d7(\u05d6\u05d5\u05d4)\u05d3\u05d2\u05d1",
		//"ghi(זוה)דגב",
		"ghi(\u05d6\u05d5\u05d4)\u05d3\u05d2\u05d1",
		//"יטח(def)דגב",
		"\u05d9\u05d8\u05d7(def)\u05d3\u05d2\u05d1",
		//"def)ghi)דגב",
		"def)ghi)\u05d3\u05d2\u05d1",
		//"הדג <ב�?> {�?כ�?} [יטח] (זוה) דגב",
		"\u05d4\u05d3\u05d2 <\u05d1\u05dd> {\u05dc\u05db\u05da} [\u05d9\u05d8\u05d7] (\u05d6\u05d5\u05d4) \u05d3\u05d2\u05d1",
		//"חזָוהֻדגב",
		"\u05d7\u05d6\u05b8\u05d5\u05d4\u05bb\u05d3\u05d2\u05d1",
		//"חזָוdֻדגב",
		"\u05d7\u05d6\u05b8\u05d5\u0064\u05bb\u05d3\u05d2\u05d1",
		//"והֻ",
		"\u05d5\u05d4\u05bb",
		//"�?�?כ hij	defg דגב",
		"\u05dd\u05dc\u05db hij	defg \u05d3\u05d2\u05d1",
		//"�?�?כ �?יט	defg דגב",
		"\u05dd\u05dc\u05db \u05da\u05d9\u05d8	defg \u05d3\u05d2\u05d1",
		//"�?�?כ hij	חזוה דגב",
		"\u05dd\u05dc\u05db hij	\u05d7\u05d6\u05d5\u05d4 \u05d3\u05d2\u05d1",
		//"�?�?כ �?יט	חזוה דגב",
		"\u05dd\u05dc\u05db \u05da\u05d9\u05d8	\u05d7\u05d6\u05d5\u05d4 \u05d3\u05d2\u05d1",
		//"�?�?כ   hij	    defg דגב",
		"\u05dd\u05dc\u05db   hij	    defg \u05d3\u05d2\u05d1",
		//"�?�?כ �?יט  	    defg דגב",
		"\u05dd\u05dc\u05db \u05da\u05d9\u05d8  	    defg \u05d3\u05d2\u05d1",
		//"�?�?כ hij  	    חזוה דגב",
		"\u05dd\u05dc\u05db hij  	    \u05d7\u05d6\u05d5\u05d4 \u05d3\u05d2\u05d1",
		//"�?�?כ �?יט  	    חזוה דגב",
		"\u05dd\u05dc\u05db \u05da\u05d9\u05d8  	    \u05d7\u05d6\u05d5\u05d4 \u05d3\u05d2\u05d1",
		//"�?�?כ =\hij	defg ._- דגב",
		"\u05dd\u05dc\u05db =\hij	defg ._- \u05d3\u05d2\u05d1",
		//"�?�?כ �?יט\=	-_. defg דגב",
		"\u05dd\u05dc\u05db \u05da\u05d9\u05d8\u005c=	-_. defg \u05d3\u05d2\u05d1",
		//"�?�?כ hij\=	-_. חזוה דגב",
		"\u05dd\u05dc\u05db hij\=	-_. \u05d7\u05d6\u05d5\u05d4 \u05d3\u05d2\u05d1",
		//"�?�?כ �?יט\=	-_. חזוה דגב",
		"\u05dd\u05dc\u05db \u05da\u05d9\u05d8\u005c=	-_. \u05d7\u05d6\u05d5\u05d4 \u05d3\u05d2\u05d1",
		//"�?�?כ   =\hij	    defg ._- דגב",
		"\u05dd\u05dc\u05db   =\hij	    defg ._- \u05d3\u05d2\u05d1",
		//"�?�?כ �?יט\=  	    -_. defg דגב",
		"\u05dd\u05dc\u05db \u05da\u05d9\u05d8\u005c=  	    -_. defg \u05d3\u05d2\u05d1",
		//"�?�?כ hij\=  	    -_. חזוה דגב",
		"\u05dd\u05dc\u05db hij\=  	    -_. \u05d7\u05d6\u05d5\u05d4 \u05d3\u05d2\u05d1",
		//"�?�?כ �?יט\=  	    -_. חזוה דגב",
		"\u05dd\u05dc\u05db \u05da\u05d9\u05d8\u005c=  	    -_. \u05d7\u05d6\u05d5\u05d4 \u05d3\u05d2\u05d1",
		//"יטח def דגב   ",
		"\u05d9\u05d8\u05d7 def \u05d3\u05d2\u05d1   ",
		//"יטח def דגב -.",
		"\u05d9\u05d8\u05d7 def \u05d3\u05d2\u05d1 -.",
		//"יטח def דגב 12",
		"\u05d9\u05d8\u05d7 def \u05d3\u05d2\u05d1 12",
		//"יטח def דגב .1",
		"\u05d9\u05d8\u05d7 def \u05d3\u05d2\u05d1 .1",
		//"יטח def דגב (1",
		"\u05d9\u05d8\u05d7 def \u05d3\u05d2\u05d1 (1",
		//"יטח def דגב 3."
		"\u05d9\u05d8\u05d7 def \u05d3\u05d2\u05d1 3."
	];
			
	var unilicrs = [
		"jihg fed cba",
		//"utsr qpo �?�?כ�? �?יט חזוה cba",
		"utsr qpo \u05dd\u05dc\u05db\u05da\u0020\u05da\u05d9\u05d8\u0020\u05d7\u05d6\u05d5\u05d4 cba",
		"fed ~}|{`_^]\[@?>=<;:/.-,+*)('&%$#\"! cba",
		//"זוה ~}|{`_^]\[@?>=<;:/.-,+*)('&%$#\"! cba",
		"\u05d6\u05d5\u05d4 ~}|{`_^]\[@?>=<;:/.-,+*)('&%$#\"! cba",
		"\\/ fed cba =-.",
		//"\\/ זוה cba =-.",
		"\\/ \u05d6\u05d5\u05d4 cba =-.",
		"321 cba",
		"104 321 cba",
		"ihg 321 cba",
		"ihg 104 321 cba",
		//"יטח 321 cba",
		"\u05d9\u05d8\u05d7 321 cba",
		//"יטח 104 321 cba",
		"\u05d9\u05d8\u05d7 104 321 cba",
		"3210cba",
		"104 3210cba",
		"ihg3210cba",
		"ihg104 3210cba",
		//"יטח3210cba",
		"\u05d9\u05d8\u05d73210cba",
		//"יטח104 3210cba",
		"\u05d9\u05d8\u05d7104 3210cba",
		//"321 זוה cba",
		"321 \u05d6\u05d5\u05d4 cba",
		//"104 321 זוה cba",
		"104 321 \u05d6\u05d5\u05d4 cba",
		//"ihg 321 זוה cba",
		"ihg 321 \u05d6\u05d5\u05d4 cba",
		//"ihg 104 321 זוה cba",
		"ihg 104 321 \u05d6\u05d5\u05d4 cba",
		//"יטח 321 זוה cba",
		"\u05d9\u05d8\u05d7 321 \u05d6\u05d5\u05d4 cba",
		//"יטח 104 321 זוה cba",
		"\u05d9\u05d8\u05d7 104 321 \u05d6\u05d5\u05d4 cba",
		//"3210זוה cba",
		"3210\u05d6\u05d5\u05d4 cba",
		//"104 3210זוה cba",
		"104 3210\u05d6\u05d5\u05d4 cba",
		//"ihg43210זוה cba",
		"ihg43210\u05d6\u05d5\u05d4 cba",
		//"ihg104 3210זוה cba",
		"ihg104 3210\u05d6\u05d5\u05d4 cba",
		//"יטח43210זוה cba",
		"\u05d9\u05d8\u05d743210\u05d6\u05d5\u05d4 cba",
		//"יטח104 3210זוה cba",
		"\u05d9\u05d8\u05d7104 3210\u05d6\u05d5\u05d4 cba",
		"fed cba 104 321",
		//"יטח)זוה(cba",
		"\u05d9\u05d8\u05d7)\u05d6\u05d5\u05d4(cba",
		//"ihg)זוה(cba",
		"ihg)\u05d6\u05d5\u05d4(cba",
		//"יטח)fed(cba",
		"\u05d9\u05d8\u05d7)fed(cba",
		"ihg)fed(cba",
		//"gfָedֻcba",
		"gf\u05b8ed\u05bbcba",
		//"gfָוהֻcba",
		"gf\u05b8\u05d5\u05d4\u05bbcba",
		//"mlk �?יט	חזוה cba",
		"mlk \u05da\u05d9\u05d8	\u05d7\u05d6\u05d5\u05d4 cba",
		//"mlk jih	חזוה cba",
		"mlk jih	\u05d7\u05d6\u05d5\u05d4 cba",
		//"mlk �?יט	gfed cba",
		"mlk \u05da\u05d9\u05d8	gfed cba",
		"mlk jih	gfed cba",
		//"mlk �?יט  	    חזוה cba",
		"mlk \u05da\u05d9\u05d8  	    \u05d7\u05d6\u05d5\u05d4 cba",
		//"mlk jih  	    חזוה cba",
		"mlk jih  	    \u05d7\u05d6\u05d5\u05d4 cba",
		//"mlk �?יט  	    gfed cba",
		"mlk \u05da\u05d9\u05d8  	    gfed cba",
		"mlk jih  	    gfed cba",
		//"mlk �?יט\=	-_. חזוה cba",
		"mlk \u05da\u05d9\u05d8\u005c=	-_. \u05d7\u05d6\u05d5\u05d4 cba",
		//"mlk jih\=	-_. חזוה cba",
		"mlk jih\=	-_. \u05d7\u05d6\u05d5\u05d4 cba",
		//"mlk �?יט\=	-_. gfed cba",
		"mlk \u05da\u05d9\u05d8\u005c=	-_. gfed cba",
		"mlk jih\=	-_. gfed cba",
		//"mlk �?יט\=  	    -_. חזוה cba",
		"mlk \u05da\u05d9\u05d8\u005c=  	    -_. \u05d7\u05d6\u05d5\u05d4 cba",
		//"mlk jih\=  	    -_. חזוה cba",
		"mlk jih\=  	    -_. \u05d7\u05d6\u05d5\u05d4 cba",
		//"mlk �?יט\=  	    -_. gfed cba",
		"mlk \u05da\u05d9\u05d8\u005c=  	    -_. gfed cba",
		"mlk jih\=  	    -_. gfed cba",
		//"ihg זוה cba   ",
		"ihg \u05d6\u05d5\u05d4 cba   ",
		//"ihg זוה cba -.",
		"ihg \u05d6\u05d5\u05d4 cba -.",
		//"ihg זוה cba 21",
		"ihg \u05d6\u05d5\u05d4 cba 21",
		"/* 21 = < $1043 % $210 */"
	];
	var allcases = [
		"*** .-=",
		"=-. ***",
		//"=-. ABC �?בג",
		"=-. ABC \u05d0\u05d1\u05d2",
		//"ABC DEF �?בג",
		"ABC DEF \u05d0\u05d1\u05d2",
		//"ABC �?בג DEF",
		"ABC \u05d0\u05d1\u05d2 DEF",
		//"�?(ב)ג ABC דהו",
		"\u05d0(\u05d1)\u05d2 ABC \u05d3\u05d4\u05d5",
		//"�?בג A(B)C דהו",
		"\u05d0\u05d1\u05d2 A(B)C \u05d3\u05d4\u05d5",
		//"�?בג ABC DEF",
		"\u05d0\u05d1\u05d2 ABC DEF",
		//"�?בג ABC דהו",
		"\u05d0\u05d1\u05d2 ABC \u05d3\u05d4\u05d5",
		//"בגד #123 $234 %340 +401 -012 הוז",
		"\u05d1\u05d2\u05d3 #123 $234 %340 +401 -012 \u05d4\u05d5\u05d6",
		//"�?בג ABC .-=",
		"\u05d0\u05d1\u05d2 ABC .-=",
		//"�?בג ABC ד(ה)ו",
		"\u05d0\u05d1\u05d2 ABC \u05d3(\u05d4)\u05d5",
		//"ABC 123 �?בגד",
		"ABC 123 \u05d0\u05d1\u05d2\u05d3",
		//"�?בגד 123 DEF"
		"\u05d0\u05d1\u05d2\u05d3 123 DEF"
	];
		
	var allinvrs  = [
		"=-. ***",
		"*** .-=",
		//"גב�? CBA .-=",
		"\u05d2\u05d1\u05d0 CBA .-=",
		//"גב�? FED CBA",
		"\u05d2\u05d1\u05d0 FED CBA",
		//"FED גב�? CBA",
		"FED \u05d2\u05d1\u05d0 CBA",
		//"והד CBA ג)ב(�?",
		"\u05d5\u05d4\u05d3 CBA \u05d2)\u05d1(\u05d0",
		//"והד C)B(A גב�?",
		"\u05d5\u05d4\u05d3 C)B(A \u05d2\u05d1\u05d0",
		//"FED CBA גב�?",
		"FED CBA \u05d2\u05d1\u05d0",
		//"והד CBA גב�?",
		"\u05d5\u05d4\u05d3 CBA \u05d2\u05d1\u05d0",
		//"זוה 210- 104+ 043% 432$ 321# דגב",
		"\u05d6\u05d5\u05d4 210- 104+ 043% 432$ 321# \u05d3\u05d2\u05d1",
		//"=-. CBA גב�?",
		"=-. CBA \u05d2\u05d1\u05d0",
		//"ו)ה(ד CBA גב�?",
		"\u05d5)\u05d4(\u05d3 CBA \u05d2\u05d1\u05d0",
		//"דגב�? 321 CBA",
		"\u05d3\u05d2\u05d1\u05d0 321 CBA",
		//"FED 321 דגב�?"
		"FED 321 \u05d3\u05d2\u05d1\u05d0"
	];	
	var il2vlmdl = [
		"*** .-=",
		"=-. ***",
		//"=-. ABC גב�?",
		"=-. ABC \u05d2\u05d1\u05d0",
		//"ABC DEF גב�?",
		"ABC DEF \u05d2\u05d1\u05d0",
		//"ABC גב�? DEF",
		"ABC \u05d2\u05d1\u05d0 DEF",
		//"ג(ב)�? ABC והד",
		"\u05d2(\u05d1)\u05d0 ABC \u05d5\u05d4\u05d3",
		//"גב�? A(B)C והד",
		"\u05d2\u05d1\u05d0 A(B)C \u05d5\u05d4\u05d3",
		//"גב�? ABC DEF",
		"\u05d2\u05d1\u05d0 ABC DEF",
		//"גב�? ABC והד",
		"\u05d2\u05d1\u05d0 ABC \u05d5\u05d4\u05d3",
		//"זוה 012- 401+ %340 $234 #123 דגב",
		"\u05d6\u05d5\u05d4 012- 401+ %340 $234 #123 \u05d3\u05d2\u05d1",
		//"גב�? ABC .-=",
		"\u05d2\u05d1\u05d0 ABC .-=",
		//"גב�? ABC ו(ה)ד",
		"\u05d2\u05d1\u05d0 ABC \u05d5(\u05d4)\u05d3",
		//"ABC 123 דגב�?",
		"ABC 123 \u05d3\u05d2\u05d1\u05d0",
		//"123 דגב�? DEF"
		"123 \u05d3\u05d2\u05d1\u05d0 DEF"
	];
	var ir2vlmdl = [
		"=-. ***",
		"*** .-=",
		//"גב�? ABC .-=",
		"\u05d2\u05d1\u05d0 ABC .-=",
		//"גב�? ABC DEF",
		"\u05d2\u05d1\u05d0 ABC DEF",
		//"DEF גב�? ABC",
		"DEF \u05d2\u05d1\u05d0 ABC",
		//"והד ABC ג(ב)�?",
		"\u05d5\u05d4\u05d3 ABC \u05d2(\u05d1)\u05d0",
		//"והד A(B)C גב�?",
		"\u05d5\u05d4\u05d3 A(B)C \u05d2\u05d1\u05d0",
		//"ABC DEF גב�?",
		"ABC DEF \u05d2\u05d1\u05d0",
		//"והד ABC גב�?",
		"\u05d5\u05d4\u05d3 ABC \u05d2\u05d1\u05d0",
		//"זוה 012- 401+ %340 $234 #123 דגב",
		"\u05d6\u05d5\u05d4 012- 401+ %340 $234 #123 \u05d3\u05d2\u05d1",
		//"=-. ABC גב�?",
		"=-. ABC \u05d2\u05d1\u05d0",
		//"ו(ה)ד ABC גב�?",
		"\u05d5(\u05d4)\u05d3 ABC \u05d2\u05d1\u05d0",
		//"דגב�? ABC 123",
		"\u05d3\u05d2\u05d1\u05d0 ABC 123",
		//"DEF 123 דגב�?"
		"DEF 123 \u05d3\u05d2\u05d1\u05d0"
	];
	var il2vrmdl = [
		"=-. ***",
		"*** .-=",
		//"�?בג CBA .-=",
		"\u05d0\u05d1\u05d2 CBA .-=",
		//"�?בג FED CBA",
		"\u05d0\u05d1\u05d2 FED CBA",
		//"FED �?בג CBA",
		"FED \u05d0\u05d1\u05d2 CBA",
		//"דהו CBA �?)ב(ג",
		"\u05d3\u05d4\u05d5 CBA \u05d0)\u05d1(\u05d2",
		//"דהו C)B(A �?בג",
		"\u05d3\u05d4\u05d5 C)B(A \u05d0\u05d1\u05d2",
		//"FED CBA �?בג",
		"FED CBA \u05d0\u05d1\u05d2",
		//"דהו CBA �?בג",
		"\u05d3\u05d4\u05d5 CBA \u05d0\u05d1\u05d2",
		//"בגד 321# 432$ 043% +104 -210 הוז",
		"\u05d1\u05d2\u05d3 321# 432$ 043% +104 -210 \u05d4\u05d5\u05d6",
		//"=-. CBA �?בג",
		"=-. CBA \u05d0\u05d1\u05d2",
		//"ד)ה(ו CBA �?בג",
		"\u05d3)\u05d4(\u05d5 CBA \u05d0\u05d1\u05d2",
		//"�?בגד 321 CBA",
		"\u05d0\u05d1\u05d2\u05d3 321 CBA",
		//"FED �?בגד 321"
		"FED \u05d0\u05d1\u05d2\u05d3 321"
	];
	var ir2vrmdl = [
		"*** .-=",
		"=-. ***",
		//"=-. CBA �?בג",
		"=-. CBA \u05d0\u05d1\u05d2",
		//"FED CBA �?בג",
		"FED CBA \u05d0\u05d1\u05d2",
		//"CBA �?בג FED",
		"CBA \u05d0\u05d1\u05d2 FED",
		//"�?)ב(ג CBA דהו",
		"\u05d0)\u05d1(\u05d2 CBA \u05d3\u05d4\u05d5",
		//"�?בג C)B(A דהו",
		"\u05d0\u05d1\u05d2 C)B(A \u05d3\u05d4\u05d5",
		//"�?בג FED CBA",
		"\u05d0\u05d1\u05d2 FED CBA",
		//"�?בג CBA דהו",
		"\u05d0\u05d1\u05d2 CBA \u05d3\u05d4\u05d5",
		//"בגד 321# 432$ 043% +104 -210 הוז",
		"\u05d1\u05d2\u05d3 321# 432$ 043% +104 -210 \u05d4\u05d5\u05d6",
		//"�?בג CBA .-=",
		"\u05d0\u05d1\u05d2 CBA .-=",
		//"�?בג CBA ד)ה(ו",
		"\u05d0\u05d1\u05d2 CBA \u05d3)\u05d4(\u05d5",
		//"321 CBA �?בגד",
		"321 CBA \u05d0\u05d1\u05d2\u05d3",
		//"�?בגד 321 FED"
		"\u05d0\u05d1\u05d2\u05d3 321 FED"
	];	
	var vr2ilmdl = [
		"=-. ***",
		"*** .-=",
		//"�?בג CBA .-=",
		"\u05d0\u05d1\u05d2 CBA .-=",
		//"�?בג FED CBA",
		"\u05d0\u05d1\u05d2 FED CBA",
		//"FED �?בג CBA",
		"FED \u05d0\u05d1\u05d2 CBA",
		//"דהו CBA �?)ב(ג",
		"\u05d3\u05d4\u05d5 CBA \u05d0)\u05d1(\u05d2",
		//"דהו C)B(A �?בג",
		"\u05d3\u05d4\u05d5 C)B(A \u05d0\u05d1\u05d2",
		//"FED CBA �?בג",
		"FED CBA \u05d0\u05d1\u05d2",
		//"דהו CBA �?בג",
		"\u05d3\u05d4\u05d5 CBA \u05d0\u05d1\u05d2",
		//"בגד 321# 432$ 043% +104 -210 הוז",
		"\u05d1\u05d2\u05d3 321# 432$ 043% +104 -210 \u05d4\u05d5\u05d6",
		//"=-. CBA �?בג",
		"=-. CBA \u05d0\u05d1\u05d2",
		//"ד)ה(ו CBA �?בג",
		"\u05d3)\u05d4(\u05d5 CBA \u05d0\u05d1\u05d2",
		//"321 �?בגד CBA",
		"321 \u05d0\u05d1\u05d2\u05d3 CBA",
		//"FED 321 �?בגד"
		"FED 321 \u05d0\u05d1\u05d2\u05d3"
	];
	var vl2irmdl = [
		"=-. ***",
		"*** .-=",
		//"גב�? ABC .-=",
		"\u05d2\u05d1\u05d0 ABC .-=",
		//"גב�? ABC DEF",
		"\u05d2\u05d1\u05d0 ABC DEF",
		//"DEF גב�? ABC",
		"DEF \u05d2\u05d1\u05d0 ABC",
		//"והד ABC ג(ב)�?",
		"\u05d5\u05d4\u05d3 ABC \u05d2(\u05d1)\u05d0",
		//"והד A(B)C גב�?",
		"\u05d5\u05d4\u05d3 A(B)C \u05d2\u05d1\u05d0",
		//"ABC DEF גב�?",
		"ABC DEF \u05d2\u05d1\u05d0",
		//"והד ABC גב�?",
		"\u05d5\u05d4\u05d3 ABC \u05d2\u05d1\u05d0",
		//"זוה 012- 401+ %340 $234 #123 דגב",
		"\u05d6\u05d5\u05d4 012- 401+ %340 $234 #123 \u05d3\u05d2\u05d1",
		//"=-. ABC גב�?",
		"=-. ABC \u05d2\u05d1\u05d0",
		//"ו(ה)ד ABC גב�?",
		"\u05d5(\u05d4)\u05d3 ABC \u05d2\u05d1\u05d0",
		//"דגב�? 123 ABC",
		"\u05d3\u05d2\u05d1\u05d0 123 ABC",
		//"123 DEF דגב�?"
		"123 DEF \u05d3\u05d2\u05d1\u05d0"
	];	
	
	var bdEngine;
	doh.register('dojox.string.tests.BidiEngine.BidiEngine', [
		{	
		
			// testmati - case 37
			name:'1. typeoftext=implicit:visual, orientation=ltr, swapping=yes:no',

			setUp: function(){
				bdEngine = new dojox.string.BidiEngine();
			},
			
			runTest:function() {
				dojo.forEach(unilisrc, function(el, i){	
					doh.is(uniliout[i], bdEngine.bidiTransform(el, 'ILYNN', 'VLNNN'),"bidiTransform: string num: " + i + " in: unilisrc out: uniliout");
				},this);
			}
		},
		{
			// testmati - case 38
			name:'2. typeoftext=implicit:visual, orientation=rtl:ltr, swapping=yes:no',

			runTest:function() {
				dojo.forEach(unirisrc, function(el, i){	
					doh.is(uniriout[i], bdEngine.bidiTransform(el, 'IRYNN', 'VLNNN'),"bidiTransform: string num: " + i + " in: unirisrc out: uniriout");
				},this);
			}
		},
		{
			// testmati - case 41
			name:'3. typeoftext=imsplicit:imsplicit, orientation=ltr:contextual, context=ltr, swapping=yes',

			runTest:function() {
				dojo.forEach(unilisrc, function(el, i){	
					doh.is(unilisrc[i], bdEngine.bidiTransform(el, 'ILYNN', 'ILYNN'),"bidiTransform: string num: " + i + " in: unilisrc out: unilisrc");
				},this);
			}
		},
		{
			// testmati - case 42
			name:'4. typeoftext=visual:visual, orientation=ltr:ltr, swapping=no:no',

			runTest:function() {
				dojo.forEach(unilisrc, function(el, i){	
					doh.is(unilisrc[i], bdEngine.bidiTransform(el, 'VLYNN', 'VLYNN'),"bidiTransform: string num: " + i + " in: unilisrc out: unilisrc");
				},this);
			}
		},
		{
			// testmati - case 43
			name:'5. typeoftext=visual:visual, orientation=ltr:rtl, swapping=no:no',

			runTest:function() {
				dojo.forEach(unilisrc, function(el, i){	
					doh.is(unilicrs[i], bdEngine.bidiTransform(el, 'VLYNN', 'VRYNN'),"bidiTransform: string num: " + i + " in: unilisrc out: unilicrs");
				},this);
			}
		},
		{
			// testmati - case 44
			name:'6. typeoftext=visual:visual, orientation=rtl:ltr, swapping=no:no',

			runTest:function() {
				dojo.forEach(unilisrc, function(el, i){	
					doh.is(unilicrs[i], bdEngine.bidiTransform(el, 'VRNNN', 'VLYNN'),"bidiTransform: string num: " + i + " in: unilisrc out: unilicrs");
				},this);
			}
		},
		{
			// testmati - case 1
			name:'7. typeoftext=visual:visual, orientation=ltr:ltr, swapping=no:no',

			runTest:function() {
				dojo.forEach(allcases, function(el, i){	
					doh.is(allcases[i], bdEngine.bidiTransform(el, 'VLNNN', 'VLNNN'),"bidiTransform: string num: " + i + " in: allcases out: allcases");
				},this);
			}
		},
		{
			// testmati - case 2
			name:'8. typeoftext=visual:visual, orientation=rtl:ltr, swapping=no:no',

			runTest:function() {
				dojo.forEach(allcases, function(el, i){	
					doh.is(allinvrs[i], bdEngine.bidiTransform(el, 'VRNNN', 'VLNNN'),"bidiTransform: string num: " + i + " in: allcases out: allinvrs");
				},this);
			}
		},
		{
			// testmati - case 3
			name:'9. typeoftext=visual:visual, orientation=ltr:rtl, swapping=no:no',

			runTest:function() {
				dojo.forEach(allcases, function(el, i){	
					doh.is(allinvrs[i], bdEngine.bidiTransform(el, 'VLNNN', 'VRNNN'),"bidiTransform: string num: " + i + " in: allcases out: allinvrs");
				},this);
			}
		},
		{
			// testmati - case 4
			name:'10. typeoftext=visual:visual, orientation=rtl:rtl, swapping=no:no',

			runTest:function() {
				dojo.forEach(allcases, function(el, i){	
					doh.is(allcases[i], bdEngine.bidiTransform(el, 'VRNNN', 'VRNNN'), "bidiTransform: string num: " + i + " in: allcases out: allcases");
				},this);
			}
		},
		{
			// testmati - case 5
			name:'11. typeoftext=implicit:visual, orientation=ltr:ltr, swapping=yes:no',

			runTest:function() {
				dojo.forEach(allcases, function(el, i){	
					doh.is(il2vlmdl[i], bdEngine.bidiTransform(el, 'ILYNN', 'VLNNN'), "bidiTransform: string num: " + i + " in: allcases out: il2vlmdl");
				},this);
			}
		},
		{
			// testmati - case 6
			name:'12. typeoftext=implicit:visual, orientation=rtl:ltr, swapping=yes:no',

			runTest:function() {
				dojo.forEach(allcases, function(el, i){	
					doh.is(ir2vlmdl[i], bdEngine.bidiTransform(el, 'IRYNN', 'VLNNN'), "bidiTransform: string num: " + i + " in: allcases out: ir2vlmdl");
				},this);
			}
		},
		{
			// testmati - case 7
			name:'13. typeoftext=implicit:visual, orientation=ltr:rtl, swapping=yes:no',

			runTest:function() {
				dojo.forEach(allcases, function(el, i){	
					doh.is(il2vrmdl[i], bdEngine.bidiTransform(el, 'ILYNN', 'VRNNN'), "bidiTransform: string num: " + i + " in: allcases out: il2vrmdl");
				},this);
			}
		},
		{
			// testmati - case 8
			name:'14. typeoftext=implicit:visual, orientation=rtl:rtl, swapping=yes:no',

			runTest:function() {
				dojo.forEach(allcases, function(el, i){	
					doh.is(ir2vrmdl[i], bdEngine.bidiTransform(el, 'IRYNN', 'VRNNN'), "bidiTransform: string num: " + i + " in: allcases out: ir2vrmdl");
				},this);
			}
		},
		{
			// testmati - case 9
			name:'15. typeoftext=visual:implicit, orientation=ltr:ltr, swapping=no:yes',

			runTest:function() {
				dojo.forEach(allcases, function(el, i){	
					doh.is(il2vlmdl[i], bdEngine.bidiTransform(el, 'VLNNN', 'ILYNN'), "bidiTransform: string num: " + i + " in: allcases out: il2vlmdl");
				},this);
			}
		},
		{
			// testmati - case 10
			name:'16. typeoftext=visual:implicit, orientation=rtl:ltr, swapping=no:yes',

			runTest:function() {
				dojo.forEach(allcases, function(el, i){	
					doh.is(vr2ilmdl[i], bdEngine.bidiTransform(el, 'VRNNN', 'ILYNN'), "bidiTransform: string num: " + i + " in: allcases out: vr2ilmdl");
				},this);
			}
		},
		{
			// testmati - case 11
			name:'17. typeoftext=visual:implicit, orientation=ltr:rtl, swapping=no:yes',

			runTest:function() {
				dojo.forEach(allcases, function(el, i){	
					doh.is(vl2irmdl[i], bdEngine.bidiTransform(el, 'VLNNN', 'IRYNN'), "bidiTransform: string num: " + i + " in: allcases out: vl2irmdl");
				},this);
			}
		},
		{
			// testmati - case 12
			name:'18. typeoftext=visual:implicit, orientation=rtl:rtl, swapping=no:yes',

			runTest:function() {
				dojo.forEach(allcases, function(el, i){	
					doh.is(ir2vrmdl[i], bdEngine.bidiTransform(el, 'VRNNN', 'IRYNN'), "bidiTransform: string num: " + i + " in: allcases out: ir2vrmdl");
				},this);
			}
		},
		{
			// testmati - case 13
			name:'19. typeoftext=implicit:implicit, orientation=ltr:ltr, swapping=no:no',

			runTest:function() {
				dojo.forEach(allcases, function(el, i){	
					doh.is(allcases[i], bdEngine.bidiTransform(el, 'ILNNN', 'ILNNN'), "bidiTransform: string num: " + i + " in: allcases out: allcases");
				},this);
			}
		}
	]);
	

});