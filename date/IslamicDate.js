dojo.provide("dojox.date.IslamicDate");
dojo.experimental("dojox.date.IslamicDate");

dojo.require("dojo.date.locale"); //TODO: move dependency to another module?
dojo.requireLocalization("dojo.cldr", "islamic");

dojo.declare("dojox.date.IslamicDate", null, {
	// summary: The component defines the Islamic (Hijri) Calendar Object
	//
	// description:
	//	This module is similar to the Date() object provided by JavaScript
	//
	// example:
	// |	dojo.require("dojox.date.IslamicDate"); 
	// |		
	// |	var date = new dojox.date.IslamicDate();
	// |	document.writeln(date.getFullYear()+'\'+date.getMonth()+'\'+date.getDate());

	constructor: function(){
		// summary: This is the constructor
		// description:
		//	This fucntion initialize the date object values
		//
		// example:
		// |		var date1 = new dojox.date.IslamicDate();
		// |
		// |		var date2 = new dojox.date.IslamicDate("12\2\1429");
		// |
		// |		var date3 = new dojox.date.IslamicDate(date2);
		// |
		// |		var date4 = new dojox.date.IslamicDate(1429,2,12);

		var jd, arg_no = arguments.length;

		if(arg_no==0){
			// use the current date value
			var d = new Date();
			this.Day = d.getDay();
			jd = this._gregorian_to_jd(d.getFullYear(),d.getMonth()+1,d.getDate())+
			(Math.floor(d.getSeconds() + 60 * (d.getMinutes() + 60 * d.getHours()) + 0.5) / 86400.0);
			
			var year, month, day;

			jd = Math.floor(jd) + 0.5;
			year = Math.floor(((30 * (jd - this.ISLAMIC_EPOCH)) + 10646) / 10631);
			month = Math.min(12,
						Math.ceil((jd - (29 + this._islamic_to_jd(year, 1, 1))) / 29.5) + 1);
			day = (jd - this._islamic_to_jd(year, month, 1)) + 1;


			this.Date = day;
			this.Month = month-1;
			this.Year = year;
			this.Hours = d.getHours();
			this.Minutes = d.getMinutes();
			this.Seconds = d.getSeconds();
			this.Milliseconds = d.getMilliseconds();
		}else if(arg_no ==1){
			//date string or Islamic date object passed
			this.parse(arguments[0]);
		}else if(arg_no >=3){
			// YYYY MM DD arguments passed
			this.Year = arguments[0];
			this.Month = arguments[1];
			this.Date = arguments[2];
			this.Hours = arguments[3] || 0;
			this.Minutes = arguments[4] || 0;
			this.Seconds = arguments[5] || 0;
			this.Milliseconds = arguments[6] || 0;

			jd = this._islamic_to_jd(this.Year, this.Month+1, this.Date);
			this.Day = this._jd_to_gregorian(jd).getDay();
		}
	},

	getDate:function(){
		// summary: This function returns the date value (1 - 30)
		//
		// example:
		// |		var date1 = new dojox.date.IslamicDate();
		// |
		// |		document.writeln(date1.getDate);		
		return parseInt(this.Date);
	},
	
	getMonth:function(){
		// summary: This function return the month value ( 0 - 11 )
		//
		// example:
		// |		var date1 = new dojox.date.IslamicDate();
		// |
		// |		document.writeln(date1.getMonth()+1);

		return parseInt(this.Month);
	},

	getFullYear:function(){
		// summary: This function return the Year value 
		//
		// example:
		// |		var date1 = new dojox.date.IslamicDate();
		// |
		// |		document.writeln(date1.getFullYear());

		return parseInt(this.Year);
	},
		
	getDay:function(){
		// summary: This function return Week Day value ( 0 - 6 )
		//
		// example:
		// |		var date1 = new dojox.date.IslamicDate();
		// |
		// |		document.writeln(date1.getDay());

		var jd = this._islamic_to_jd(this.Year, this.Month+1, this.Date);
		var gd = this._jd_to_gregorian(jd);
		return gd.getDay();
	},
		
	getHours:function(){
		//summary: returns the Hour value
		return this.Hours;
	},
	
	getMinutes:function(){
		//summary: returns the Minuites value
		return this.Minutes;
	},

	getSeconds:function(){
		//summary: returns the seconde value
		return this.Seconds;
	},

	getMilliseconds:function(){
		//summary: returns the Milliseconds value
		return this.Milliseconds;
	},

	setDate: function(/*number*/date){	
		// summary: This function sets the Date
		// example:
		// |		var date1 = new dojox.date.IslamicDate();
		// |		date1.setDate(2);

		date = parseInt(date);

		if((date>0)&&(date<=this.getDaysInIslamicMonth(this.Month, this.Year))){
			this.Date = date;
		}else{
			var mdays;
			if(date>0){
				for(mdays = this.getDaysInIslamicMonth(this.Month, this.Year);	
					date > mdays; 
						date -= mdays,mdays =this.getDaysInIslamicMonth(this.Month, this.Year)){
					this.Month++;
					if(this.Month >= 12){this.Year++; this.Month -= 12;}
				}

				this.Date = date;
			}else{
				for(mdays = this.getDaysInIslamicMonth((this.Month-1)>=0 ?(this.Month-1) :11 ,((this.Month-1)>=0)? this.Year: this.Year-1);	
						date <= 0; 
							mdays = this.getDaysInIslamicMonth((this.Month-1)>=0 ? (this.Month-1) :11,((this.Month-1)>=0)? this.Year: this.Year-1)){
					this.Month--;
					if(this.Month < 0){this.Year--; this.Month += 12;}

					date+=mdays;
				}
				this.Date = date;   
			}
		}
		var jd = this._islamic_to_jd(this.Year, this.Month+1, this.Date);
		this.Day = this._jd_to_gregorian(jd).getDay();

		return this;
	},

	setYear:function(/*number*/year){
		// summary: This function set Year
		//
		// example:
		// |		var date1 = new dojox.date.IslamicDate();
		// |		date1.setYear(1429);

		this.Year = parseInt(year);
		var jd	  = this._islamic_to_jd(this.Year, this.Month+1, this.Date);
		this.Day  = this._jd_to_gregorian(jd).getDay();
	},
		
		
	setMonth:function(/*number*/month){
		// summary: This function set Month
		//
		// example:
		// |		var date1 = new dojox.date.IslamicDate();
		// |		date1.setMonth(2);

			this.Year += Math.floor(month / 12);
			this.Month = Math.floor(month % 12);
			var jd	 = this._islamic_to_jd(this.Year, this.Month+1, this.Date);
			this.Day   = this._jd_to_gregorian(jd).getDay();
	},
		
	setHours:function(){
		//summary: set the Hours
		var hours_arg_no = arguments.length;
		if(hours_arg_no >= 1){
			hours = parseInt(arguments[0]);
		}
			
		if(hours_arg_no >= 2){
			this.Minutes = parseInt(arguments[1]);
		}
			
		if(hours_arg_no >= 3){
			this.Seconds = parseInt(arguments[2]);
		}
			
		if(hours_arg_no == 4){
			this.Milliseconds = parseInt(arguments[3]);
		}
						
		while(hours >= 24){
			this.Date++;
			var mdays = this.getDaysInIslamicMonth(this.Month, this.Year);
			if(this.Date > mdays){
			
					this.Month ++;
					if(this.Month >= 12){this.Year++; this.Month -= 12;}
					this.Date -= mdays;
			}
			hours -= 24;
		}
		this.Hours = hours;
		var jd = this._islamic_to_jd(this.Year, this.Month+1, this.Date);
		this.Day = this._jd_to_gregorian(jd).getDay();
	},

	setMinutes:function(/*number*/minutes){
		//summary: set the Minutes

		while(minutes >= 60){
			this.Hours++;
			if(this.Hours >= 24){		 
				this.Date++;
				this.Hours -= 24;
				var mdays = this.getDaysInIslamicMonth(this.Month, this.Year);
				if(this.Date > mdays){
						this.Month ++;
						if(this.Month >= 12){this.Year++; this.Month -= 12;}
						this.Date -= mdays;
				}
			}
			minutes -= 60;
		}
		this.Minutes = minutes;
		var jd = this._islamic_to_jd(this.Year, this.Month+1, this.Date);
		this.Day = this._jd_to_gregorian(jd).getDay();
	},
		
		
	setSeconds:function(/*number*/seconds){
		//summary: set Seconds
		while(seconds >= 60){
			this.Minutes++;
			if(this.Minutes >= 60){
				this.Hours++;
				this.Minutes -= 60;
				if(this.Hours >= 24){		 
					this.Date++;
					this.Hours -= 24;
					var mdays = this.getDaysInIslamicMonth(this.Month, this.Year);
					if(this.Date > mdays){
						this.Month ++;
						if(this.Month >= 12){this.Year++; this.Month -= 12;}
						this.Date -= mdays;
					}
				}
			}
			seconds -= 60;
		}
		this.Seconds = seconds;
		var jd = this._islamic_to_jd(this.Year, this.Month+1, this.Date);
		this.Day = this._jd_to_gregorian(jd).getDay();
	},
		
	setMilliseconds:function(/*number*/milliseconds){
		//summary: set the Millisconds
		while(milliseconds >= 1000){
			this.setSeconds++;
			if(this.setSeconds >= 60){
				this.Minutes++;
				this.setSeconds -= 60;
				if(this.Minutes >= 60){
					this.Hours++;
					this.Minutes -= 60;
					if(this.Hours >= 24){		 
						this.Date++;
						this.Hours -= 24;
						var mdays = this.getDaysInIslamicMonth(this.Month, this.Year);
				if(this.Date > mdays){
					this.Month ++;
					if(this.Month >= 12){this.Year++; this.Month -= 12;}
					this.Date -= mdays;
					}
				}
			}
		}
			milliseconds -= 1000;
		}
		this.Milliseconds = milliseconds;
		var jd = this._islamic_to_jd(this.Year, this.Month+1, this.Date);
		this.Day = this._jd_to_gregorian(jd).getDay();
	},
		
		
	toString:function(){ 
		// summary: This returns a string representation of the date in "DDDD MMMM DD YYYY HH:MM:SS" format
		// example:
		// |		var date1 = new dojox.date.IslamicDate();
		// |		document.writeln(date1.toString());

		//FIXME: TZ/DST issues?
		var x = new Date();
		x.setHours(this.Hours);
		x.setMinutes(this.Minutes);
		x.setSeconds(this.Seconds);
		x.setMilliseconds(this.Milliseconds);
		var timeString = x.toTimeString();  
		//TODO : needs to be internationalized using dojo.date.format()?  or use separate module
		return(this.weekDays[this.Day] +" "+this.months[this.Month]+" "+ this.Date + " " + this.Year+" "+timeString);
	},
		
		
	toGregorian:function(){
		// summary: This returns the equevalent Grogorian date value in Date object
		// example:
		// |		var dateIslamic = new dojox.date.IslamicDate(1429,11,20);
		// |		var dateGregorian = dateIslamic.toGregorian();

		var hYear = this.Year;
		var hMonth = this.Month;
		var hDate = this.Date;
		var jd = this._islamic_to_jd(hYear,hMonth+1,hDate);

		var gdate = new Date(this._jd_to_gregorian(jd));

		gdate.setHours(this.Hours);
		gdate.setMilliseconds(this.Milliseconds);
		gdate.setMinutes(this.Minutes);
		gdate.setSeconds(this.Seconds); 

		return gdate;
	},

	//TODO: would it make more sense to make this a constructor option? or a static?
	fromGregorian:function(/*Date*/gdate){
		// summary: This function returns the equivalent Islamic Date value for the Gregorian Date
		// example:
		// |		var dateIslamic = new dojox.date.IslamicDate();
		// |		var dateGregorian = new Date(2008,10,12);
		// |		dateIslamic.fromGregorian(dateGregorian);

		var date = new Date(gdate);
		  
		var jd = this._gregorian_to_jd(date.getFullYear(),date.getMonth()+1,date.getDate())+
			(Math.floor(date.getSeconds() + 60 * (date.getMinutes() + 60 * date.getHours()) + 0.5) / 86400.0);
			   
		var year, month, day;

		jd = Math.floor(jd) + 0.5;
		year = Math.floor(((30 * (jd - this.ISLAMIC_EPOCH)) + 10646) / 10631);
		month = Math.min(12,
					Math.ceil((jd - (29 + this._islamic_to_jd(year, 1, 1))) / 29.5) + 1);
		day = (jd - this._islamic_to_jd(year, month, 1)) + 1;

		this.Date = day;
		this.Month = month-1;
		this.Year = year;
		this.Hours = date.getHours();
		this.Minutes = date.getMinutes();
		this.Seconds = date.getSeconds();
		this.Milliseconds = date.getMilliseconds();
		this.Day = date.getDay();
		return this;
	},

//TODO i18n: factor out and use CLDR patterns?		 
	parse:function(/*String*/dateObject){
		// summary: This function parse the date string
		//
		// example:
		// |		var dateIslamic = new dojox.date.IslamicDate();
		// |		dateIslamic.parse("Safar 2 1429");

		var sDate = dateObject.toString();
		var template = /\d{1,2}\D\d{1,2}\D\d{4}/;
		var sD, jd, mD = sDate.match(template);
		if(mD){
			mD = mD.toString();
			sD = mD.split(/\D/);
			this.Month = sD[0]-1;
			this.Date = sD[1];
			this.Year = sD[2];
			jd = this._islamic_to_jd(this.Year, this.Month+1, this.Date);
			this.Day = this._jd_to_gregorian(jd).getDay();
		}else{								
			mD = sDate.match(/\D{4,}\s\d{1,2}\s\d{4}/);
			if(mD){
				mD = mD.toString();

				var dayYear = mD.match(/\d{1,2}\s\d{4}/);
  				dayYear = dayYear.toString();
	 	
  				var mName = mD.replace(/\s\d{1,2}\s\d{4}/,'');

  				mName = mName.toString();
  				this.Month = this._getIndex(this.months,mName);
  				sD = dayYear.split(/\s/);
	 	
  				this.Date = sD[0];
  				this.Year = sD[1]; 

				jd = this._islamic_to_jd(this.Year, this.Month+1, this.Date);
				this.Day = this._jd_to_gregorian(jd).getDay();
			}
		}
								  
		var sTime = sDate.match(/\d{2}:/);
		if(sTime!=null){
			sTime = sTime.toString(); 
			var tArr=  sTime.split(':');
			this.Hours = tArr[0];
			sTime = sDate.match(/\d{2}:\d{2}/);
			if(sTime){
			sTime = sTime.toString();
			tArr = sTime.split(':');
			}
			this.Minutes = tArr[1]!=null?tArr[1]:0;
			   
			sTime = sDate.match(/\d{2}:\d{2}:\d{2}/);
			if(sTime){
			sTime = sTime.toString();
			tArr = sTime.split(':');
			}
			this.Seconds = tArr[2]!=null?tArr[2]:0;
		}else{
			this.Hours = 0;
			this.Minutes = 0;
			this.Seconds = 0;	   
		}
		this.Milliseconds = 0;
	},
	
	
	valueOf:function(){
		// summary: This function returns The stored time value in milliseconds 
		// since midnight, January 1, 1970 UTC
		//	
		var gdate = this.toGregorian();
		return gdate.valueOf();
	},

	_getIndex:function(arr,str){
		//summary: returns the String str index in the array arr
		for(i=0;i<arr.length;i++){
			if(arr[i]==str){
				return i;
			}
		}
		return -1;
	},

	_yearStart:function(/*Number*/year){
		//summary: return start of Islamic year
		 return (year-1)*354 + Math.floor((3+11*year)/30.0);
	},

	_monthStart:function(/*Number*/year,/*Number*/month){
		//summary: return the start of Islamic Month
		return Math.ceil(29.5*month) +
			(year-1)*354 + Math.floor((3+11*year)/30.0);
	},

	_civilLeapYear:function(/*Number*/year){
		//summary: return Boolean value if Islamic leap year
		return (14 + 11 * year) % 30 < 11;
	},

	getDaysInIslamicMonth:function(/*Number*/month ,/*Number*/ year){
		//summary: returns the number of days in the given Islamic Month
		var length =0;
		length = 29 + ((month+1) % 2);
		if((month == 11)&& this._civilLeapYear(year)){
				length++;
		}
		return length;
	},

	_mod:function(a, b){
		return a - (b * Math.floor(a / b));
	},


	//FIXME: use dojo.date?
	_leap_gregorian:function(/*Number*/year){
		return (year % 4) == 0 &&
			!((year % 100) == 0 && (year % 400) != 0);
	},

	GREGORIAN_EPOCH :1721425.5,

	_gregorian_to_jd:function(year, month, day)
	{
		//summary: convert from Gregorian Date to JD
		return (this.GREGORIAN_EPOCH - 1) +
			(365 * (year - 1)) +
			Math.floor((year - 1) / 4) +
			(-Math.floor((year - 1) / 100)) +
			Math.floor((year - 1) / 400) +
			Math.floor((((367 * month) - 362) / 12) +
			((month <= 2) ? 0 : (this._leap_gregorian(year) ? -1 : -2)) +
			day);
	},

	_jd_to_gregorian:function(jd){
		//summary: convert from JD to Gregorian date
		var wjd, depoch, quadricent, dqc, cent, dcent, quad, dquad,
			yindex, dyindex, year, yearday, leapadj;

		wjd = Math.floor(jd - 0.5) + 0.5;
		depoch = wjd - this.GREGORIAN_EPOCH;
		quadricent = Math.floor(depoch / 146097);
		dqc = this._mod(depoch, 146097);
		cent = Math.floor(dqc / 36524);
		dcent = this._mod(dqc, 36524);
		quad = Math.floor(dcent / 1461);
		dquad = this._mod(dcent, 1461);
		yindex = Math.floor(dquad / 365);
		year = (quadricent * 400) + (cent * 100) + (quad * 4) + yindex;
		if(!(cent == 4 || yindex == 4)){
			year++;
		}
		yearday = wjd -this._gregorian_to_jd(year, 1, 1);
		leapadj = ((wjd < this._gregorian_to_jd(year, 3, 1)) ? 0 :
					(this._leap_gregorian(year) ? 1 : 2));
		month = Math.floor((((yearday + leapadj) * 12) + 373) / 367);
		day = (wjd - this._gregorian_to_jd(year, month, 1)) + 1;

		return new Date(year, month-1, day);
	},

	ISLAMIC_EPOCH : 1948439.5,

	_islamic_to_jd:function(year, month, day){
		//summary: convert from Islamic Date to JD
		return (day +
			Math.ceil(29.5 * (month - 1)) +
			(year - 1) * 354 +
			Math.floor((3 + (11 * year)) / 30) +
			this.ISLAMIC_EPOCH) - 1;
	},

	GREGORIAN_EPOCH : 1721425.5,

	_gregorian_to_jd:function(year, month, day)	{
		//summary: convert from JD Date to Islamic Date
		return (this.GREGORIAN_EPOCH - 1) +
			(365 * (year - 1)) +
			Math.floor((year - 1) / 4) +
			(-Math.floor((year - 1) / 100)) +
			Math.floor((year - 1) / 400) +
			Math.floor((((367 * month) - 362) / 12) +
			((month <= 2) ? 0 :
								(this._leap_gregorian(year) ? -1 : -2)
			) +
			day);
	}
});

//TODOC
dojox.date.IslamicDate.getDaysInIslamicMonth = function(/*dojox.date.IslamicDate*/month){
	return new dojox.date.IslamicDate().getDaysInIslamicMonth(month.getMonth(),month.getFullYear()); // dojox.date.IslamicDate
};

dojox.date.IslamicDate._getNames = function(/*String*/item, /*String*/type, /*String?*/use, /*String?*/locale){
	// summary:
	//		Used to get localized strings from dojo.cldr for day or month names.
	//
	// item:
	//	'months' || 'days'
	// type:
	//	'wide' || 'narrow' || 'abbr' (e.g. "Monday", "Mon", or "M" respectively, in English)
	// use:
	//	'standAlone' || 'format' (default)
	// locale:
	//	override locale used to find the names

	var label;
	var lookup = dojo.i18n.getLocalization("dojo.cldr", "islamic", locale);
	var props = [item, use, type];
	if(use == 'standAlone'){
		label = lookup[props.join('-')];
	}
	props[1] = 'format';

	// return by copy so changes won't be made accidentally to the in-memory model
	return (label || lookup[props.join('-')]).concat(); /*Array*/
};

dojox.date.IslamicDate.weekDays = dojox.date.IslamicDate._getNames('days', 'wide', 'format');

dojox.date.IslamicDate.months = dojox.date.IslamicDate._getNames('months', 'wide', 'format');
	
