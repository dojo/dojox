dojo.provide("dojox.date.hebrew.numerals");
dojo.experimental("dojox.date.hebrew.numerals");

//Conversion from "Hindi" numerals to Hebrew numerals and vice versa

(function(){

	var DIG=["א","ב","ג","ד","ה","ו","ז","ח","ט"];
	var	TEN=["י","כ","ל","מ","נ","ס","ע","פ","צ"];
	var	HUN=["ק","ר","ש","ת"];
	var	REP=["יה","יו", "טו", "טז"];
	var MONTHS =["א'","ב'","ג'","ד'","ה'","ו'","ז'","ח'","ט'","י'","י\"א","י\"ב","י\"ג"];		

	var	GERESH=["'"]; //TODO: array unnecessary?  inline?

	dojox.date.hebrew.numerals.getYearHebrewLetters = function(/*Number */ year){
		// summary: This function return year written in Hebrew numbers-letters, 
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |
		// |		document.writeln(dojox.date.hebrew.numerals.getYearHebrewLetters(date1.getFullYear());	
		var str  = "", str2 = "";

		year = year%1000;

		var i = 0, n = 4, j = 9;
		while(year){ 
			if(year >= n*100){
				str=str.concat(HUN[n-1]);
				year -= n*100;
				continue;
			}else if(n > 1){
				n--;
				continue;
			}else if(year >= j*10){
				str=str.concat(TEN[j-1]);
				year -= j*10;
			}else if (j >1){
				j--;
				continue;
			}else if(year > 0){
				str=str.concat(DIG[year-1]);
				year=0;
			}		
		}
		
		
		var str1 = "", ind = str.indexOf(REP[0]);
	
		if(ind > -1){
			str = str1.concat(str.substr(str[0], ind), REP[2], str.substr(str[ind+2], str.length-ind-2));
		}else if( ( ind=str.indexOf(REP[1]) ) > -1){
			str = str1.concat(str.substr(str[0], ind), REP[3], str.substr(str[ind+2], str.length-ind-2));
		}
	
		if(str.length > 1){
			var last = str.charAt(str.length - 1);
			str = str2.concat(str.substr(0, str.length-1), '"', last);
		}else{
			str = str.concat(GERESH[0]);
		} 
		return str;	 
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
		return nYear + 5000;
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
				str=str.concat(TEN[j-1]);
				day -= j*10;
			}else if (j >1){
				j--;
				continue;
			}else if(day > 0){
				str=str.concat(DIG[day-1]);
				day=0;
			}		
		}
		var str1 = "", ind = str.indexOf(REP[0]);
	
		if(ind > -1){
			str = str1.concat(str.substr(str[0], ind), REP[2], str.substr(str[ind+2], str.length-ind-2));
		}else if( ( ind=str.indexOf(REP[1]) ) > -1){
			str = str1.concat(str.substr(str[0], ind), REP[3], str.substr(str[ind+2], str.length-ind-2));
		}
		if(!nogrsh){
			var str2 = ""; //TODO
			if(str.length > 1){
				var last = str.charAt(str.length - 1);
				str = str2.concat(str.substr(0, str.length-1), '"', last);
			}else{
				str = str.concat(GERESH[0]);
			}
		}

		//str = "\u202B" /*RLE*/  + str; //for _calendar
		return str;	 		
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
	
	dojox.date.hebrew.numerals.getMonthHebrewLetters =  function(monthNum, /* bool hebrew numbers ?*/ isNum, /*Number ?*/ year){
		// summary: This function return month written in Hebrew numerals
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |
		// |		document.writeln(dojox.date.hebrew.numerals.getMonthHebrewLetters(date1.getMonth());
		return MONTHS[monthNum];
	};	
	
	dojox.date.hebrew.numerals.parseMonthHebrewLetters = function(monthStr){
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
