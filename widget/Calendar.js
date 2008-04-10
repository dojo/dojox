dojo.provide("dojox.widget.Calendar");
dojo.experimental("dojox.widget.Calendar");

dojo.require("dijit._Calendar");
dojo.require("dojox.widget.FisheyeLite");
dojo.require("dojox.fx");

dojo.declare("dojox.widget.Calendar", [dijit._Calendar], {
	//
	//	summary:
	//		A GUI for choosing a date in the context of a monthly calendar.
	//
	//	description:
	//		A GUI for choosing a date in the context of a monthly calendar.
	//		This widget extends the basic functionality of the dijit._Calendar mixin.
	//		This widget can't be used in a form because it doesn't serialize the date to an
	//		`<input>` field.  For a form element, use dijit.form.DateTextBox instead.
	//
	//		Note that the parser takes all dates attributes passed in the
	//		[RFC 3339 format](http://www.faqs.org/rfcs/rfc3339.html), e.g. `2005-06-30T08:05:00-07:00`
	//		so that they are serializable and locale-independent.
	//
	//	example:
	//	|	var calendar = new dojox.widget.Calendar({}, dojo.byId("calendarNode"));
	//
	//	example:
	//	|	<div dojoType="dojox.widget._Calendar"></div>
	//

	// templatePath: URL
	//  the path to the template to be used to construct the widget.
	templatePath: dojo.moduleUrl("dojox.widget","Calendar/Calendar.html"),
	_state: "days",
	useFisheye: true,

	useDayOnly: false,

	useMonthOnly: false,

	useYearOnly: false,

	postCreate: function() {
		this.inherited(arguments);
		this._height = dojo.style(this.calendarBody, "height");

		if (!this.useDayOnly && !this.useMonthOnly && !this.useYearOnly) {
			//When the top label is clicked, it should change the widget to show either the
			//months or years, depending on the current state of the widget.
			dojo.connect(this.monthYearLabel, "onclick", dojo.hitch(this, function(evt){
				switch (this._state) {
					case "days":
						this._transitionVert(this.dayContainer, this._height, this.monthContainer, 0);
						this.yearHeader.innerHTML = this.currentYearLabelNode.innerHTML;
						this._setState("months");
						break;
					case "months":
						this._populateYears();
						this._transitionVert(this.monthContainer, this._height, this.yearContainer, 0);
						this._setState("years");
						break;
					default:
						break;
				}
			}));
		} else {
			dojo.style(this.monthYearLabel, "cursor", "auto");
			var toHide;
			if(this.useMonthOnly) {
				this.setMode("month");
			} else if(this.useYearOnly){
				this.setMode("year");
			}
		}

		//Initialize some listeners.
		this._addMonthListener();
		this._addYearListener();

		//Complete the generation of the template.
		var cloneClass = dojo.hitch(this, function(clazz, n){
			var template = dojo.query(clazz, this.domNode)[0];
 			for(var i=0; i<n; i++){
				template.parentNode.appendChild(template.cloneNode(true));
			}
		});

		cloneClass(".dojoxCalendarMonthTemplate", 3);
		cloneClass(".dojoxCalendarMonthGroupTemplate", 2);
		cloneClass(".dojoxCalendarYearTemplate", 3);
		cloneClass(".dojoxCalendarYearGroupTemplate", 2);

		if (this.useFisheye) {
			dojo.query(".dijitCalendarDateTemplate div, .dojoxCalendarMonthTemplate div, .dojoxCalendarYearTemplate div", this.domNode).forEach(function(node){
				new dojox.widget.FisheyeLite({
					properties: {
						fontSize: 1.5/*,
						backgroundColor: "#83b4d8"*/
					}
				}, node);
			});
		}

		//Add text to the template
		this._populateMonths();
		this._populateYears();

		//Populate the footer with today's date.
		var today = new Date();

		this.footer.innerHTML = "Today: " + dojo.date.locale.format(today, {formatLength:'full',selector:'date', locale:this.lang});
		dojo.connect(this.footer, "onclick", this, "goToToday");
	},
	
	setMode: function(mode) {
		switch(mode){
			case "month":
				this.useMonthOnly = true;
				this._setState("months");
				dojo.addClass(this.container, "monthOnly");
				dojo.style(this.monthContainer, "top", "0px");
				break;
			case "year":
				this.useYearOnly = true;
				dojo.addClass(this.container, "yearOnly");
				dojo.style(this.yearContainer, "top", "0px");
				this._setState("years");
				break;
			case "day":			
				break;
			default: throw new Error("Unsupported mode: must be either 'day', 'month' or 'year'");
		}
		dojo.style(this.monthYearLabel, "cursor", "auto");
	},

	_addYearListener: function() {
		// summary: Adds listeners to the yearly display, so that when a year is clicked, the displayed year
		//   in the "day" display will change, and also that the widget will change itself to display the months.
		this.yearContainer._conn = dojo.connect(this.yearContainer, "onclick", dojo.hitch(this, function(evt){
			if(!dojo.hasClass(evt.target, "dojoxCalendarYearLabelValue")){dojo.stopEvent(evt); return;}
			var year = Number(evt.target.innerHTML);
			this.setYear(year);
			if (!this.useYearOnly) {
				this._transitionVert(this.yearContainer, this._height * -1, this.monthContainer, 0);
				this._setState("months");
			}
		}));
	},

	_addMonthListener: function() {
		// summary: Adds listeners to the month display, so that when a month is clicked, the
		//   displayed month in the "day" display will change, and also that the widget will
		//   change itself to display the days.
		this.monthContainer._conn = dojo.connect(this.monthContainer, "onclick", dojo.hitch(this, function(evt){
			if(!dojo.hasClass(evt.target, "dojoxCalendarMonthLabel")){dojo.stopEvent(evt); return;}
			var month = evt.target.parentNode.cellIndex + (evt.target.parentNode.parentNode.rowIndex * 4);
			this.setMonth(month);
			if (!this.useMonthOnly) {
				this._transitionVert(this.monthContainer, this._height * -1, this.dayContainer, 0);
				this._setState("days");
			}
		}));
	},

	_transitionVert: function(node1, height1, node2, height2){
		// summary: Slides two nodes vertically.
		var anim1 = dojo.animateProperty({node: node1, properties: {top: height1}});
		var anim2 = dojo.animateProperty({node: node2, properties: {top: height2}});

		anim1.play();
		anim2.play();
	},
	
	_syncYear: function() {
		this.yearHeader.innerHTML = this.currentYearLabelNode.innerHTML;
	},

	_adjustDisplay: function(/*String*/part, /*int*/amount, noSlide){
		// summary: This function overrides the base function defined in dijit._Calendar.
		//   It changes the displayed years, months and days depending on the inputs.
		if(this._state == "years" && part == "month") {
			this._slideTable("yearContainer", amount, dojo.hitch(this, function(){
				this._populateYears(this._displayedYear + (amount * 12));
			}));
			return;
		} else if(this._state == "months" && part == "month") {
			if (!noSlide) {
				this._adjustDisplay("year", amount);
				this._syncYear();
				this._slideTable("monthContainer", amount, dojo.hitch(this, function(){
					this._populateMonths(this._displayedYear + (amount * 12));
				}));
				return;
			}
		} else if(this._state == "days") {
			this.displayMonth = dojo.date.add(this.displayMonth, part, amount);

			this._slideTable("dayContainer", amount, dojo.hitch(this, function(){
				this._populateGrid();
			}));
			return;
		}
		this.displayMonth = dojo.date.add(this.displayMonth, part, amount);
		this._populateGrid();
	},

	_getMonthNames: function(format) {
		return dojo.date.locale.getNames('months', format, 'standAlone', this.lang);
	},

	_populateMonths: function() {
		// summary: Populate the month names using the localized values.
		var monthNames = this._getMonthNames('abbr');
		dojo.query(".dojoxCalendarMonthLabel", this.monthContainer).forEach(dojo.hitch(this, function(node, cnt){
			this._setText(node, monthNames[cnt]);
		}));
	},

	_populateYears: function(year) {
		// summary: Fills the list of years with a range of 12 numbers, with the current year
		//   being the 6th number.
		this._displayedYear = year || this.displayMonth.getFullYear();
		var firstYear = this._displayedYear - 5;

		dojo.query(".dojoxCalendarYearLabelValue", this.yearContainer).forEach(dojo.hitch(this, function(node, cnt){
			this._setText(node, firstYear + (cnt));
		}));
		this._setText(this.yearRangeHeader, firstYear + " - " + (firstYear + 12));
	},

	_setState: function(state){
		this._state = state;
		dojo.query("div", this.monthYearLabel).style("display", "none");

		dojo.style(state == "days" ? this.monthAndYearHeader : (state == "months" ? this.yearHeader : this.yearRangeHeader), "display" , "");
	},

	_slideTable: function(/*String*/name, /*Number*/direction, /*Function*/callback){
		// summary: Animates the horizontal sliding of a table.
		var table = this[name];

		//Clone the existing table
		var newTable = table.cloneNode(true);
		var left = dojo.style(table, "width");

		table.parentNode.appendChild(newTable);

		//Place the existing node either to the left or the right of the new node,
		//depending on which direction it is to slide.
		dojo.style(table, "left", (left * direction) + "px");

		//If the dayContainer is being moved, remove the 'dijitCalendarDateTemplate' class from it's nodes,
		// otherwise dijit._Calendar will add classes to it when populating the grid, since it
		// searches the whole widget's DOM tree for classes with 'dijitCalendarDateTemplate' class.
		if(name == "dayContainer"){
			dojo.query(".dijitCalendarDateTemplate", newTable).forEach("dojo.removeClass(item, 'dijitCalendarDateTemplate');");
		}

		//Call the function that generally populates the new cloned node with new data.
		//It may also attach event listeners.
		callback();

		//Animate the two nodes.
		var anim1 = dojo.animateProperty({node: newTable, properties:{left: left * direction * -1}, duration: 500, onEnd: function(){
			newTable.parentNode.removeChild(newTable);
		}});
		var anim2 = dojo.animateProperty({node: table, properties:{left: 0}, duration: 500});

		anim1.play();
		anim2.play();
	},

	setMonth: function(/*Number*/month) {
		// summary: set the current month to be displayed. This should be a number between 0 and 11
		this._adjustDisplay("month", month - this.displayMonth.getMonth(), true);
		if(this.useMonthOnly){
			this.onValueSelected(month);
		}
	},

	setYear: function(/*Number*/year) {
		// summary: set the current month to be displayed. This should be a number between 0 and 11
		this._adjustDisplay("year", year - this.displayMonth.getFullYear());
		this._syncYear();
		if(this.useYearOnly){
			this.onValueSelected(year);
		}
	}
});
