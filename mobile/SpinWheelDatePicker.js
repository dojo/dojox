dojo.provide("dojox.mobile.SpinWheelDatePicker");

dojo.require("dojo.date");
dojo.require("dojo.date.locale");
dojo.require("dojox.mobile.SpinWheel");

dojo.declare(
	"dojox.mobile.SpinWheelDatePicker",
	dojox.mobile.SpinWheel,
{
	slotClasses: [
		"dojox.mobile.SpinWheelYearSlot",
		"dojox.mobile.SpinWheelMonthSlot",
		"dojox.mobile.SpinWheelDaySlot"
	],
	slotProps: [
		{labelFrom:1900, labelTo:2100},
		{},
		{labelFrom:1, labelTo:31}
	],

	buildRendering: function(){
		this.inherited(arguments);
		dojo.addClass(this.domNode, "mblSpinWheelDatePicker");
		this.connect(this.slots[1], "onFlickAnimationEnd", "onMonthSet");
		this.connect(this.slots[2], "onFlickAnimationEnd", "onDaySet");
	},

	reset: function(){
		// goto today
		var slots = this.slots;
		var now = new Date();
		var monthStr = dojo.date.locale.format(now, {datePattern:"MMM", selector:"date"});
		slots[0].setValue(now.getFullYear());
		slots[0].setColor(now.getFullYear());
		slots[1].setValue(monthStr);
		slots[1].setColor(monthStr);
		slots[2].setValue(now.getDate());
		slots[2].setColor(now.getDate());
	},

	onMonthSet: function(){
		var daysInMonth = this.onDaySet();
		var disableValuesTable = {28:[29,30,31], 29:[30,31], 30:[31], 31:[]};
		this.slots[2].disableValues(disableValuesTable[daysInMonth]);
		
	},

	onDaySet: function(){
		var y = this.slots[0].getValue();
		var m = this.slots[1].getValue();
		var newMonth = dojo.date.locale.parse(y+"/"+m, {datePattern:'yyyy/MMM', selector:'date'});
		var daysInMonth = dojo.date.getDaysInMonth(newMonth);
		var d = this.slots[2].getValue();
		if(daysInMonth < d){
			this.slots[2].setValue(daysInMonth);
		}
		return daysInMonth;
	}
});

dojo.declare(
	"dojox.mobile.SpinWheelYearSlot",
	dojox.mobile.SpinWheelSlot,
{
	buildRendering: function(){
		this.labels = [];
		if(this.labelFrom !== this.labelTo){
			var dtA = new Date(this.labelFrom, 0, 1);
			var i, idx;
			for(i = this.labelFrom, idx = 0; i <= this.labelTo; i++, idx++){
				dtA.setFullYear(i);
				yearStr = dojo.date.locale.format(dtA,{datePattern:"yyyy", selector:"date"});
				this.labels.push(yearStr);
			}
		}
		this.inherited(arguments);
	}
	
});

dojo.declare(
	"dojox.mobile.SpinWheelMonthSlot",
	dojox.mobile.SpinWheelSlot,
{
	buildRendering: function(){
		this.labels = [];
		var dtA = new Date(2000, 0, 1);
		var monthStr;
		for(var i = 0; i < 12; i++){
			dtA.setMonth(i);
			monthStr = dojo.date.locale.format(dtA,{datePattern:"MMM", selector:"date"});
			this.labels.push(monthStr);
		}
		this.inherited(arguments);
	}
});

dojo.declare(
	"dojox.mobile.SpinWheelDaySlot",
	dojox.mobile.SpinWheelSlot,
{
});
