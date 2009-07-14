dojo.provide("dojox.date.hebrew.numerals");
dojo.experimental("dojox.date.hebrew.numerals");

//Conversion from "Hindi" numerals to Hebrew numerals and vice versa

(function(){

	var DIG=["א","ב","ג","ד","ה","ו","ז","ח","ט"];
	var	TEN=["י","כ","ל","מ","נ","ס","ע","פ","צ"];
	var	HUN=["ק","ר","ש","ת"];
	var MONTHS =["א'","ב'","ג'","ד'","ה'","ו'","ז'","ח'","ט'","י'","י\"א","י\"ב","י\"ג"];		

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

	dojox.date.hebrew.numerals.getYearHebrewLetters = function(/*Number */ year){
		// summary: This function return year written in Hebrew numbers-letters, 
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |
		// |		document.writeln(dojox.date.hebrew.numerals.getYearHebrewLetters(date1.getFullYear());	
		var str  = "", i = 0, n = 4, j = 9;

		year = year % 1000;

		while(year){ 
			if(year >= n*100){
				str += HUN[n-1];
				year -= n*100;
				continue;
			}else if(n > 1){
				n--;
				continue;
			}else if(year >= j*10){
				str += TEN[j-1];
				year -= j*10;
			}else if (j > 1){
				j--;
				continue;
			}else if(year > 0){
				str += DIG[year-1];
				year = 0;
			}		
		}
		
		return transformChars(str); // String
	};
	
	dojox.date.hebrew.numerals.parseYearHebrewLetters  = function(/*String hebrew year*/ year){
		// summary: This function return year in format number from  the year written in Hebrew numbers-letters
		//                   
		// example:
		// |		var date = new dojox.date.hebrew.Date();
		// |        	date.setFullYear(dojox.date.hebrew.numerals.parseYearHebrewLetters('תשס"ח'));	
		// |		
	
		var nYear = 0;
		for(var j=0; j < year.length; j++){
			for(var i=1; i <= 5; i++){
				if(year.charAt(j) == HUN[i-1]){
					nYear += 100*i;
					continue;
				}
			}
			for(i=1; i <= 9; i++){
				if(year.charAt(j) == TEN[i-1]){
					nYear += 10*i;
					continue;
				}
			}
			for(i=1; i <= 9; i++){
				if(year.charAt(j) == DIG[i-1]){
					nYear += i;
				}
			}						
		} 
		return nYear + 5000; // int
	};
	
	dojox.date.hebrew.numerals.getDayHebrewLetters =  function(day, /*boolean?*/ nogrsh){
		// summary: This function return date written in Hebrew numbers-letter,  can be in format א or א' (with geresh)
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |
		// |		document.writeln(dojox.date.hebrew.numerals.getDayHebrewLetters(date1.getDay());
		var str = "", j = 3;
		while(day){
			if(day >= j*10){
				str += TEN[j-1];
				day -= j*10;
			}else if (j > 1){
				j--;
				continue;
			}else if(day > 0){
				str += DIG[day-1];
				day = 0;
			}		
		}

		return transformChars(str, nogrsh); // String
	};
	
	dojox.date.hebrew.numerals.parseDayHebrewLetters =  function(/*String hebrew*/ day){
		// summary: This function return date in format number from  the date written in Hebrew numbers-letter
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |
		// |		date1.setDate(dojox.date.hebrew.numerals.parseDayHebrewLetters('א'));
		
		//remove special chars
		day =  day.replace(/[\u200E\u200F\u202A-\u202E]/g, "");	

		var nDay = 0;
		for (var j=0; j < day.length; j++){
			for(var i=1; i <= 9; i++){
				if(day.charAt(j) == TEN[i-1]){
					nDay += 10*i;
					continue;
				}
			}
			for(i=1; i <= 9; i++){
				if(day.charAt(j) == DIG[i - 1]){
					nDay += i;
				}
			}						
		} 
		//if (nDay > this.getDaysInHebrewMonth(_month, this._year)){
		//	nDay = this.getDaysInHebrewMonth(this._month, this._year);
		//}
		return nDay;		
	};

//TODO: what are the second and third args for?
	dojox.date.hebrew.numerals.getMonthHebrewLetters =  function(/*int*/monthNum, /* bool hebrew numbers ?*/ isNum, /*Number ?*/ year){
		// summary: This function return month written in Hebrew numerals
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |
		// |		document.writeln(dojox.date.hebrew.numerals.getMonthHebrewLetters(date1.getMonth());
		return MONTHS[monthNum]; // String
	};	

	dojox.date.hebrew.numerals.parseMonthHebrewLetters = function(/*String*/monthStr){
		// summary: This function return month in format number from  the month written in Hebrew  word  or numbers-letters
		//                   the return number is index in month name array, to use it for setMont, do correction for leap year
		// example:
		// |		var date = new dojox.date.hebrew.Date();
		// |            var number = dojox.date.hebrew.numerals.parseMonthHebrewLetters("תמוז");
		// |		if ( !date.isLeapYear(date.getFullYear())  &&  number >5) {number--;}
		// |		date.setMonth(number);	
		// |		
			
		//month number from 0 to 12
		var monnum = dojox.date.hebrew.numerals.parseDayHebrewLetters(monthStr) - 1;

		if(monnum == -1){
			console.warn("The month name is incorrect , set 0"); // TODO: perhaps throw instead?
			monnum = 0;
		}
		return monnum;
	};
})();
