dojo.provide("dojox.date.hebrew.numerals");

//Conversion from "Hindi" numerals to Hebrew numerals and vice versa

(function(){

	var DIG="אבגדהוזחט";
	var	TEN="יכלמנסעפצ";
	var	HUN="קרשת";

	var transformChars = function(str, nogrsh){
		str = str.replace("יה", "טו").replace("יו", "טז");

		if(!nogrsh){
			var len = str.length;
			if(len > 1){
				str = str.substr(0, len - 1) + '"' + str.charAt(len - 1);
			}else{
				str += "\u05F3"; // 05F3:geresh
			}
		}
		return str; // String
	};
	 
	var parseStrToNumber = function(str){
		var num = 0;
		dojo.forEach(str, function(ch){
			var i;
			if((i = DIG.indexOf(ch)) != -1){
				num += ++i;
			}else if((i = TEN.indexOf(ch)) != -1){
				num += 10 * ++i;
			}else if((i = HUN.indexOf(ch)) != -1){
				num += 100 * ++i;
			}
		});
		return num; //Number
	};
	 
	var convertNumberToStr = function(num){
		var str  = "", n = 4, j = 9;
  		while(num){ 
			if(num >= n*100){
				str += HUN.charAt(n-1);
				num -= n*100;
				continue;
			}else if(n > 1){
				n--;
				continue;
			}else if(num >= j*10){
				str += TEN.charAt(j-1);
				num -= j*10;
			}else if(j > 1){
				j--;
				continue;
			}else if(num > 0){
				str += DIG.charAt(num-1);
				num = 0;
			}		
		}
		return str; //String	
	};

	dojox.date.hebrew.numerals.getYearHebrewLetters = function(/*Number */ year){
		// summary: This function return year written in Hebrew numbers-letters, 
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |
		// |		document.writeln(dojox.date.hebrew.numerals.getYearHebrewLetters(date1.getFullYear());	
		
		var y = year % 1000;
		if(!y){ throw new Error("Hebrew year "+year+" is not in range 5001-5999");} // FIXME: wrong test
		return transformChars(convertNumberToStr(y)); // String
	};
	
	dojox.date.hebrew.numerals.parseYearHebrewLetters  = function(/*String hebrew year*/ year){
		// summary: This function return year in format number from  the year written in Hebrew numbers-letters
		//                   
		// example:
		// |		var date = new dojox.date.hebrew.Date();
		// |        	date.setFullYear(dojox.date.hebrew.numerals.parseYearHebrewLetters('תשס"ח'));

		return parseStrToNumber(year) + 5000; // int
	};
	
	dojox.date.hebrew.numerals.getDayHebrewLetters =  function(day, /*boolean?*/ nogrsh){
		// summary: This function return date written in Hebrew numbers-letter,  can be in format א or א' (with geresh)
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |
		// |		document.writeln(dojox.date.hebrew.numerals.getDayHebrewLetters(date1.getDay());

		return transformChars(convertNumberToStr(day), nogrsh); // String
	};
	
	dojox.date.hebrew.numerals.parseDayHebrewLetters =  function(/*String hebrew*/ day){
		// summary: This function return date in format number from  the date written in Hebrew numbers-letter
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |
		// |		date1.setDate(dojox.date.hebrew.numerals.parseDayHebrewLetters('א'));
		return parseStrToNumber(day); // int
	};

	dojox.date.hebrew.numerals.getMonthHebrewLetters =  function(/*int*/month){
		// summary: This function return month written in Hebrew numerals
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |
		// |		document.writeln(dojox.date.hebrew.numerals.getMonthHebrewLetters(date1.getMonth());

		return transformChars(convertNumberToStr(month+1)); // String
	};	

	dojox.date.hebrew.numerals.parseMonthHebrewLetters = function(/*String*/monthStr){
		// summary: This function return month in format number from  the month written in Hebrew  word  or numbers-letters
		//                   the return number is index in month name array, to use it for setMont, do correction for leap year
		// example:
		// |		var date = new dojox.date.hebrew.Date();
		// |            var number = dojox.date.hebrew.numerals.parseMonthHebrewLetters("תמוז");
		// |		date.setMonth(number);
			
		//month number from 0 to 12
		var monnum = dojox.date.hebrew.numerals.parseDayHebrewLetters(monthStr) - 1;

		if(monnum == -1 || monnum > 12){
			throw new Error("The month name is incorrect , month = " + monnum); 
		}
		return monnum;
	};
})();
