dojo.provide("dojox.date.hebrew.Date");
dojo.experimental("dojox.date.hebrew.Date");

dojo.require("dojox.date.hebrew.numerals");

dojo.declare("dojox.date.hebrew.Date", null, {
	// summary: The component defines the Hebrew Calendar Object
	//
	// description:
	//	This module is similar to the Date() object provided by JavaScript
	//
	// example:
	// |	dojo.require("dojox.date.hebrew.Date");
	// |		
	// |	var date = new dojox.date.hebrew.Date();
	// |	console.log(date.getFullYear()+'\'+date.getMonth()+'\'+date.getDate());

	// Hebrew date calculations are performed in terms of days, hours, and
	// "parts" (or halakim), which are 1/1080 of an hour, or 3 1/3 seconds.
	//_HOUR_PARTS: 1080,
	//_DAY_PARTS: 24*1080,
   
	// An approximate value for the length of a lunar month.
	// It is used to calculate the approximate year and month of a given
	// absolute date.
	//_MONTH_FRACT: 12*1080 + 793,
	//_MONTH_PARTS: 29*24*1080 + 12*1080 + 793,
	    
	// The time of the new moon (in parts) on 1 Tishri, year 1 (the epoch)
	// counting from noon on the day before.  BAHARAD is an abbreviation of
	// Bet (Monday), Hey (5 hours from sunset), Resh-Daled (204).
	//_BAHARAD: 11*1080 + 204,

	// The Julian day of the Gregorian epoch, that is, January 1, 1 on the
	// Gregorian calendar.
	//_JAN_1_1_JULIAN_DAY: 1721426,

	/**
	* The lengths of the Hebrew months.  This is complicated, because there
	* are three different types of years, or six if you count leap years.
	* Due to the rules for postponing the start of the year to avoid having
	* certain holidays fall on the sabbath, the year can end up being three
	* different lengths, called "deficient", "normal", and "complete".
	*/

	_MONTH_LENGTH:  [
		// Deficient  Normal     Complete
		[   30,	    30,	    30	],		 //Tishri
		[   29,	    29,	    30	],		 //Heshvan
		[   29,	    30,	    30	],		 //Kislev
		[   29,	    29,	    29	],		 //Tevet
		[   30,	    30,	    30	],		 //Shevat
		[   30,	    30,	    30	],		 //Adar I (leap years only)
		[   29,	    29,	    29	],		 //Adar
		[   30,	    30,	    30	],		 //Nisan
		[   29,	    29,	    29	],		 //Iyar
		[   30,	    30,	    30	],		 //Sivan
		[   29,	    29,	    29	],		 //Tammuz
		[   30,	    30,	    30	],		 //Av
		[   29,	    29,	    29	]		 //Elul
	],

	/**
	* The cumulative # of days to the end of each month in a non-leap year
	* Although this can be calculated from the MONTH_LENGTH table,
	* keeping it around separately makes some calculations a lot faster
	*/
	_MONTH_START:  [
		// Deficient  Normal	Complete
		[    0,		0,		0  ],		// (placeholder)
		[   30,	    30,	    30  ],		// Tishri
		[   59,	    59,	    60  ],		// Heshvan
		[   88,	    89,	    90  ],		// Kislev
		[  117,	   118,	   119  ],		// Tevet
		[  147,	   148,	   149  ],		// Shevat
		[  147,	   148,	   149  ],		// (Adar I placeholder)
		[  176,	   177,	   178  ],		// Adar
		[  206,	   207,	   208  ],		// Nisan
		[  235,	   236,	   237  ],		// Iyar
		[  265,	   266,	   267  ],		// Sivan
		[  294,	   295,	   296  ],		// Tammuz
		[  324,	   325,	   326  ],		// Av
		[  353,	   354,	   355  ]		// Elul
	],

	/**
	* The cumulative # of days to the end of each month in a leap year
	*/
	_LEAP_MONTH_START:  [
		// Deficient  Normal	Complete
		[    0,		0,		0  ],		// (placeholder)
		[   30,	    30,	    30  ],		// Tishri
		[   59,	    59,	    60  ],		// Heshvan
		[   88,	    89,	    90  ],		// Kislev
		[  117,	   118,	   119  ],		// Tevet
		[  147,	   148,	   149  ],		// Shevat
		[  177,	   178,	   179  ],		// Adar I
		[  206,	   207,	   208  ],		// Adar II
		[  236,	   237,	   238  ],		// Nisan
		[  265,	   266,	   267  ],		// Iyar
		[  295,	   296,	   297  ],		// Sivan
		[  324,	   325,	   326  ],		// Tammuz
		[  354,	   355,	   356  ],		// Av
		[  383,	   384,	   385  ]		// Elul
	],
	
	_GREGORIAN_MONTH_COUNT:  [
		//len len2   st  st2
		[  31,  31,   0,   0 ], // Jan
		[  28,  29,  31,  31 ], // Feb
		[  31,  31,  59,  60 ], // Mar
		[  30,  30,  90,  91 ], // Apr
		[  31,  31, 120, 121 ], // May
		[  30,  30, 151, 152 ], // Jun
		[  31,  31, 181, 182 ], // Jul
		[  31,  31, 212, 213 ], // Aug
		[  30,  30, 243, 244 ], // Sep
		[  31,  31, 273, 274 ], // Oct
		[  30,  30, 304, 305 ], // Nov
		[  31,  31, 334, 335 ] // Dec
		// len  length of month
		// len2 length of month in a leap year
		// st   days in year before start of month
		// st2  days in year before month in leap year
	],

    _date: 0,
	_month: 0,
	_year: 0,
	_hours: 0,
	_minutes: 0,
	_seconds: 0,
	_milliseconds: 0,
	_day: 0,

 	constructor: function(){
		// summary: This is the constructor
		// description:
		//	This fucntion initialize the date object values
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |		
		// |		var date2 = new dojox.date.hebrew.Date(date1);
		// |
		// |		var date3 = new dojox.date.hebrew.Date(5768,2,12);

		var len = arguments.length;
		if(!len){// use the current date value, added "" to the similarity to date
			this.fromGregorian(new Date());
		}else if(len == 1){
			var arg0 = arguments[0];
			if(typeof arg0 == "number"){ // this is time "valueof"
				arg0 = new Date(arg0);
			}

			if(arg0 instanceof Date){
				this.fromGregorian(arg0);
			}else if(arg0 == ""){
				// date should be invalid.  Dijit relies on this behavior.
				this._date = new Date(""); //TODO: should this be NaN?  _date is not a Date object
			}else{  // this is hebrew.Date object
				this._year = arg0._year;
				this._month =  arg0._month;  
				this._date = arg0._date;
				this._hours = arg0._hours;
				this._minutes = arg0._minutes;
				this._seconds = arg0._seconds;
				this._milliseconds = arg0._milliseconds; 
			}	
		}else if(len >=3){
			// YYYY MM DD arguments passed, month is from 0-12
			this._year += arguments[0];
			this._month += arguments[1];
			this._date += arguments[2];
			
			if(!this.isLeapYear(this._year) && this._month>=5){
				this._month++;
			}
			if(this._month >12 || (!this.isLeapYear(this._year) && this._month > 11)){
				console.warn("the month is incorrect , set 0");
				this._month = 0;			
			}
			this._hours += arguments[3] || 0;
			this._minutes += arguments[4] || 0;
			this._seconds += arguments[5] || 0;
			this._milliseconds += arguments[6] || 0;
		}
  
		var day = this._startOfYear(this._year);
		if(this._month != 0){
			day += (this.isLeapYear(this._year) ? this._LEAP_MONTH_START : this._MONTH_START)[this._month][this._yearType(this._year)];
		}
		day += this._date - 1;
		this._day = (day+1) % 7;
	},
	
	getDate: function(){
		// summary: This function returns the date value (1 - 30)
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |
		// |		console.log(date1.getDate());

		return this._date; // int
	},

	getDateLocalized: function(/*String?*/locale){
		// summary: This function returns the date value as hebrew numerals for the Hebrew locale,
		//		a number for all others.
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |
		// |		console.log(date1.getDate());

		return locale.match(/^he(?:-.+)?$/) ?
			dojox.date.hebrew.numerals.getDayHebrewLetters(this._date) : this.getDate();
	},

	getMonth: function(){
		// summary: This function return the month value ( 0 - 11 )
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |
		// |		console.log(date1.getMonth()+1);

		return this._month;
	},


	getFullYear: function(){
		// summary: This function return the Year value 
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |
		// |		console.log(date1.getFullYear());
		return this._year;
	},
			
	getHours: function(){
 		//summary: returns the Hour value
		return this._hours;
	},
		
	getMinutes: function(){
		//summary: returns the Minuites value

		return this._minutes;
	},

	getSeconds: function(){
		//summary: returns the seconde value
		return this._seconds;
	},

	getMilliseconds: function(){
		//summary: returns the Milliseconds value

		return this._milliseconds;
	},

	setDate: function(/*number*/date){	
		// summary: This function sets the Date
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |		date1.setDate(2);

		date = +date;
		if(date>0){
			//FIXME: do..while?
			for(var mdays = this.getDaysInHebrewMonth(this._month, this._year);
					date > mdays;
					date -= mdays,mdays = this.getDaysInHebrewMonth(this._month, this._year)){
				this._month++;
				if(!this.isLeapYear(this._year) && this._month==5) { this._month ++;}
				if(this._month >= 13){this._year++; this._month -= 13;}
			}

			this._date = date;
		}else{
			//FIXME: do..while?
			for(mdays = this.getDaysInHebrewMonth((this._month-1)>=0 ? (this._month-1) : 12, ((this._month-1)>=0)? this._year : this._year-1);
					date<=0;
					mdays = this.getDaysInHebrewMonth((this._month-1)>=0 ? (this._month-1) : 12, ((this._month-1)>=0)? this._year : this._year-1)){
				this._month--;
				if(!this.isLeapYear(this._year) && this._month == 5){ this._month--; }
				if(this._month < 0){this._year--; this._month += 13;}

				date += mdays;
			} 
			this._date = date;
		}

		var day = this._startOfYear(this._year);
		if(this._month != 0){
			day += (this.isLeapYear(this._year) ? this._LEAP_MONTH_START : this._MONTH_START)[this._month][this._yearType(this._year)];
		}
		day += this._date - 1;
		this._day = (day+1) % 7;
		return this;
	},
	

	setFullYear: function(/*number*/year, /*number?*/month, /*number?*/ date){
		// summary: This function set Year 
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |		date1.setFullYear(5768);
		// |		date1.setFullYear(5768, 1, 1);
		
		this._year = year = +year;
		if(!this.isLeapYear(year) && this._month==5){ 
			this._month++; 
		} 
		var day = this._startOfYear(year);
		if(this._month != 0){
			day += (this.isLeapYear(year) ? this._LEAP_MONTH_START : this._MONTH_START)[this._month][this._yearType(year)];
		}
		day += this._date - 1;
		this._day = (day+1) % 7;

		if(month !== undefined){this.setMonth(month);}
		if(date !== undefined){this.setDate(date);}

		return this;
	},

	setMonth: function(/*number*/month){
		// summary: This function set Month
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |		date1.setMonth(0); //first month

		month = +month; // coerce to a Number					
		if(!this.isLeapYear(this._year) && month >= 5){month++;}

		if(month>=0){
			while(month >12){
				this._year++;
				month -= 13;
				if (!this.isLeapYear(this._year) && month >= 5){month++;}	
			}
		}else{
			while(month<0){
				this._year--;
				month += 13;
				if (!this.isLeapYear(this._year) && month < 5){month--;}	
			}		
		}
		
		this._month = month;

		var dnum = this.getDaysInHebrewMonth(this._month, this._year);
		if(dnum < this._date){
			this._date = dnum;
		} // if the date in this month more than number of the days in this month
		
		var day = this._startOfYear(this._year);
		if(this._month != 0){
			day += (this.isLeapYear(this._year) ? this._LEAP_MONTH_START : this._MONTH_START)[this._month][this._yearType(this._year)];
		}	
		day += (this._date - 1);
		this._day = ((day+1) % 7);
		return this;
	},

	setHours: function(/*TODOC*/){
		//summary: set the Hours  0-23

		var hours_arg_no = arguments.length;
		var hours = 0;
		if(hours_arg_no >= 1){
			hours += +arguments[0];
		}

		if(hours_arg_no >= 2){
			this._minutes += +arguments[1];
		}

		if(hours_arg_no >= 3){
			this._seconds += +arguments[2];
		}

		if(hours_arg_no == 4){
			this._milliseconds += +arguments[3];
		}

		while(hours >= 24){
			this._date++;
			var mdays = this.getDaysInHebrewMonth(this._month, this._year);
			if(this._date > mdays)
			{
				this._month++;
				if(!this.isLeapYear(this._year) && this._month==5){ this._month++; }
				if(this._month >= 13){this._year++; this._month -= 13;}
				this._date -= mdays;
			}
			hours -= 24;
		}
		this._hours = hours;
		var day = this._startOfYear(this._year);
		if(this._month != 0){
			day += (this.isLeapYear(this._year) ? this._LEAP_MONTH_START : this._MONTH_START)[this._month][this._yearType(this._year)];
		}
		day += this._date - 1;
		this._day = (day+1) % 7;
		return this;
	},

	setMinutes: function(/*number*/minutes){
		//summary: set the Minutes  frm 0-59
		minutes = +minutes;
		while(minutes >= 60){
			this._hours++;
			if(this._hours >= 24){     
				this._date++;
				this._hours -= 24;
				var mdays = this.getDaysInHebrewMonth(this._month, this._year);
				if(this._date > mdays){
					this._month ++;
					if(!this.isLeapYear(this._year) && this._month==5){ this._month++; }
					if(this._month >= 13){this._year++; this._month -= 13;}
					this._date -= mdays;
				}
			}
			minutes -= 60;
		}
		this._minutes = minutes;
		var day = this._startOfYear(this._year);
		if(this._month != 0){
			day += (this.isLeapYear(this._year) ? this._LEAP_MONTH_START : this._MONTH_START)[this._month][this._yearType(this._year)];
		}
		day += this._date - 1;
		this._day = (day+1) % 7;
		return this;
	},

	setSeconds: function(/*number*/seconds){
		//summary: set the Seconds  from 0-59

		seconds = +seconds;
		while(seconds >= 60){
			this._minutes++;
			if(this._minutes >= 60){
				this._hours++;
				this._minutes -= 60;
				if(this._hours >= 24){         
					this._date++;
					this._hours -= 24;
					var mdays = this.getDaysInHebrewMonth(this._month, this._year);
					if(this._date > mdays){
						this._month++;
						if(!this.isLeapYear(this._year) && this._month==5){ this._month++; }
						if(this._month >= 13){this._year++; this._month -= 13;}
							
						this._date -= mdays;
					}
				}
			}
			seconds -= 60;
		}
		this._seconds = seconds;
		var day = this._startOfYear(this._year);
		if(this._month != 0){
			day += (this.isLeapYear(this._year) ? this._LEAP_MONTH_START : this._MONTH_START)[this._month][this._yearType(this._year)];
		}
		day += (this._date - 1);
		this._day = ((day+1) % 7);
		return this;
	},

	setMilliseconds: function(/*number*/milliseconds){
		//summary: set the milliseconds

		milliseconds = +milliseconds;
		//FIXME: use mod instead of iterate for overflow? same for methods above.
		while(milliseconds >= 1000){
			this.setSeconds++;
			if(this._seconds >= 60){
				this._minutes++;
				this._seconds -= 60;
				if(this._minutes >= 60){
					this._hours++;
					this._minutes -= 60;
					if(this._hours >= 24){         
						this._date++;
						this._hours -= 24;
						var mdays = this.getDaysInHebrewMonth(this._month, this._year);
						if(this._date > mdays)
						{
							this._month++;
							if (!this.isLeapYear(this._year) && this._month == 5) {
								this._month++;
							}
							if(this._month >= 13){this._year++; this._month -= 13;}
							this._date -= mdays;
						}
					}
				}
			}
			milliseconds -= 1000;
		}
		this._milliseconds = milliseconds;
		var day = this._startOfYear(this._year);
		if(this._month != 0){
			day += (this.isLeapYear(this._year) ? this._LEAP_MONTH_START : this._MONTH_START)[this._month][this._yearType(this._year)];
		}
		day += this._date - 1;
		this._day = (day+1) % 7;
		return this;
	},


	toString: function(){ 
		// summary: This returns a string representation of the date in "dd, MM, YYYY HH:MM:SS" format
		// | 
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |		console.log(date1.toString());

		return this._date + ", " + ((!this.isLeapYear(this._year) && this._month>5) ? this._month : (this._month+1)) + ", " + this._year + "  " + this._hours + ":" + this._minutes + ":" + this._seconds; // String
	},

	// ported from the Java class com.ibm.icu.util.HebrewCalendar from ICU4J v3.6.1 at http://www.icu-project.org/
	getDaysInHebrewMonth: function(/*number*/month, /*number*/ year){
		// summary: returns the number of days in the month used

		// These two months can vary: 1=HESHVAN, 2=KISLEV.  The rest are a fixed length
		var yearType = (month == 1 || month == 2) ? this._yearType(year) : 0;
		return this._MONTH_LENGTH[month][yearType];
	},

	
	// ported from the Java class com.ibm.icu.util.HebrewCalendar from ICU4J v3.6.1 at http://www.icu-project.org/
	_yearType: function(/*number*/year){
		var yearLength = this._handleGetYearLength(Number(year));
		if(yearLength > 380){
			yearLength -= 30;        // Subtract length of leap month.
		}

		var yearType = yearLength - 353;
		if (yearType < 0 || yearType > 2){
			throw new Error("Illegal year length " + yearLength + " in year " + year);
		}
		return yearType;
	},

	// ported from the Java class com.ibm.icu.util.HebrewCalendar from ICU4J v3.6.1 at http://www.icu-project.org/
	_handleGetYearLength: function(/*number*/eyear){
		return this._startOfYear(eyear+1) - this._startOfYear(eyear);
	},

	// ported from the Java class com.ibm.icu.util.HebrewCalendar from ICU4J v3.6.1 at http://www.icu-project.org/
	_startOfYear: function(/*number*/year){
		var months = Math.floor((235 * year - 234) / 19),	// # of months before year
			frac = months * (12*1080 + 793) + 11*1080 + 204/*BAHARAD*/,	// Fractional part of day #
			day  = months * 29 + Math.floor(frac / (24*1080));	// Whole # part of calculation
		frac %= 24*1080;	// Time of day

		var wd = day % 7;	// Day of week (0 == Monday)

		if(wd == 2 || wd == 4 || wd == 6){
			// If the 1st is on Sun, Wed, or Fri, postpone to the next day
			day += 1;
			wd = day % 7;
		}
		if(wd == 1 && frac > 15 * 1080 + 204 && !this.isLeapYear(year)){
			// If the new moon falls after 3:11:20am (15h204p from the previous noon)
			// on a Tuesday and it is not a leap year, postpone by 2 days.
			// This prevents 356-day years.
			day += 2;
		}else if(wd == 0 && frac > 21 * 1080 + 589 && this.isLeapYear(year-1)){
			// If the new moon falls after 9:32:43 1/3am (21h589p from yesterday noon)
			// on a Monday and *last* year was a leap year, postpone by 1 day.
			// Prevents 382-day years.
			day += 1;
		}

		return day;
	},

	// ported from the Java class com.ibm.icu.util.HebrewCalendar from ICU4J v3.6.1 at http://www.icu-project.org/
	isLeapYear: function(/*number*/year){	
	//	summary:
	//		Determines if the year (argument) is a leap year
	//	description: The Leap year contains additional month adar sheni
	//	
		//return (year * 12 + 17) % 19 >= 12;
		var x = (year*12 + 17) % 19;
		return x >= ((x < 0) ? -7 : 12);
	},

	
	fromGregorian: function(/*Date*/gdate){
		// summary: This function sets this Date to the Hebrew Date corresponding to the Gregorian Date
		// example:
		// |		var dateHebrew = new dojox.date.hebrew.Date();
		// |		var dateGregorian = new Date(2008,10,12);
		// |		dateHebrew.fromGregorian(dateGregorian);
		var result = this._computeHebrewFields(gdate);
		this._year = result[0];
		this._month = result[1];
		this._date = result[2];
		this._hours = gdate.getHours();
		this._milliseconds = gdate.getMilliseconds();
		this._minutes = gdate.getMinutes();
		this._seconds = gdate.getSeconds();
		//TODO: need to set _day?
		return this;
	},

	// ported from the Java class com.ibm.icu.util.HebrewCalendar.handleComputeFields from ICU4J v3.6.1 at http://www.icu-project.org/
	_computeHebrewFields: function(/*Date*/gdate){
		var julianDay = this._getJulianDayFromGregorianDate(gdate),
			d = julianDay - 347997,
			m = Math.floor((d * 24*1080) / (29*24*1080 + 12*1080 + 793)),       // Months (approx)
			year = Math.floor((19 * m + 234) / 235) + 1,  // Years (approx)
			ys  = this._startOfYear(year),                 // 1st day of year
			dayOfYear = (d - ys);
		// Because of the postponement rules, it's possible to guess wrong.  Fix it.
		while(dayOfYear < 1){
			year--;
			ys  = this._startOfYear(year);
			dayOfYear = d - ys;
		}

		// Now figure out which month we're in, and the date within that month

		var typeofYear = this._yearType(year),
			monthStart = this.isLeapYear(year) ? this._LEAP_MONTH_START : this._MONTH_START,
			month = 0;

		while(dayOfYear > monthStart[month][typeofYear]){
			month++;
		}
		month--;
		var dayOfMonth = dayOfYear - monthStart[month][typeofYear];
		return [year, month, dayOfMonth];
	},

	// ported from the Java class com.ibm.icu.util.Calendar.computeGregorianFields from ICU4J v3.6.1 at http://www.icu-project.org/
	toGregorian: function(){
		// summary: This returns the equevalent Grogorian date value in Date object
		// example:
		// |		var dateHebrew = new dojox.date.hebrew.Date(5768,11,20);
		// |		var dateGregorian = dateHebrew.toGregorian();
		var hYear = this._year,
			hMonth = this._month,
			hDate = this._date,
			day = this._startOfYear(hYear);

		if(hMonth != 0){
			day += (this.isLeapYear(hYear) ? this._LEAP_MONTH_START : this._MONTH_START)[hMonth][this._yearType(hYear)];
		}

		var julianDay =  (hDate + day + 347997);
		// The Gregorian epoch day is zero for Monday January 1, year 1.
		var gregorianEpochDay = julianDay - 1721426;
		// Here we convert from the day number to the multiple radix
		// representation.  We use 400-year, 100-year, and 4-year cycles.
		// For example, the 4-year cycle has 4 years + 1 leap day; giving
		// 1461 == 365*4 + 1 days.
		var rem = [];
		var n400 = this._floorDivide(gregorianEpochDay , 146097, rem), // 400-year cycle length
			n100 = this._floorDivide(rem[0] , 36524, rem), // 100-year cycle length
			n4 = this._floorDivide(rem[0] , 1461, rem), // 4-year cycle length
			n1 = this._floorDivide(rem[0] , 365, rem),
			year = 400*n400 + 100*n100 + 4*n4 + n1,
			dayOfYear = rem[0]; // zero-based day of year

		if(n100 == 4 || n1 == 4){
			dayOfYear = 365; // Dec 31 at end of 4- or 400-yr cycle
		}else{
			++year;
		}

		var isLeap = !(year%4) && // equiv. to (year%4 == 0)
				(year%100 || !(year%400)),
			correction = 0,
			march1 = isLeap ? 60 : 59; // zero-based DOY for March 1
		if(dayOfYear >= march1){ correction = isLeap ? 1 : 2; }
		var month = Math.floor((12 * (dayOfYear + correction) + 6) / 367); // zero-based month
		var dayOfMonth = dayOfYear -
				this._GREGORIAN_MONTH_COUNT[month][isLeap ? 3 : 2] + 1; // one-based DOM

		return new Date(year, month, dayOfMonth, this._hours, this._minutes, this._seconds, this._milliseconds); // Date
	},
	_floorDivide: function(numerator, denominator, remainder){
		if(numerator >= 0){
			remainder[0] = (numerator % denominator);
			return Math.floor(numerator / denominator);
		}
		var quotient = Math.floor(numerator / denominator);
		remainder[0] = numerator - (quotient * denominator);
		return quotient;
	},

	getDay: function(){
		// summary: This function return Week Day value ( 0 - 6 )
		//
		// example:
		// |		var date1 = new dojox.date.hebrew.Date();
		// |
		// |		console.log(date1.getDay());

		var hYear = this._year,
			hMonth = this._month,
			hDate = this._date,
			day = this._startOfYear(hYear);

		if(hMonth != 0){
			day += (this.isLeapYear(hYear) ? this._LEAP_MONTH_START : this._MONTH_START)[hMonth][this._yearType(hYear)];
		}

		day += hDate - 1;
		return (day+1) % 7;
	},

	// ported from the Java class com.ibm.icu.util.Calendar.computeGregorianMonthStart from ICU4J v3.6.1 at http://www.icu-project.org/
	_getJulianDayFromGregorianDate: function(gdate){
		//summary: returns the Julian day of a Gregorian date

		var year = gdate.getFullYear(),
			month = gdate.getMonth(),
			d = gdate.getDate(),
			isLeap = !(year%4) && (year%100 || !(year%400)), //TODO: dup
			y = year - 1;
		// This computation is actually ... + (_JAN_1_1_JULIAN_DAY - 3) + 2.
		// Add 2 because Gregorian calendar starts 2 days after Julian
		// calendar.
		var julianDay = 365*y + Math.floor(y/4) - Math.floor(y/100) +
			Math.floor(y/400) + 1721426 - 1;
		// At this point julianDay indicates the day BEFORE the first day
		// of January 1, <eyear> of the Gregorian calendar.
		if(month != 0){
			julianDay += this._GREGORIAN_MONTH_COUNT[month][isLeap ? 3 : 2];
		}
		
		julianDay += d;
		return julianDay;
	}
});

dojox.date.hebrew.Date.prototype.valueOf = function(){
	return this.toGregorian().valueOf();
};
