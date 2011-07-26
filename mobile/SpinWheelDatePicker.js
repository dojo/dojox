define([
	"dojo/_base/declare",
	"dojo/dom-class",
	"dojo/date",
	"dojo/date/locale",
	"./SpinWheel",
	"./SpinWheelSlot"
],function(declare, domClass, ddate, datelocale, SpinWheel, SpinWheelSlot){
	// module:
	//		dojox/mobile/SpinWheelDatePicker
	// summary:
	//		TODOC

	/*=====
		SpinWheel = dojox.mobile.SpinWheel;
		SpinWheelSlot = dojox.mobile.SpinWheelSlot;
	=====*/
	var SpinWheelYearSlot = declare(SpinWheelSlot, {
		buildRendering: function(){
			this.labels = [];
			if(this.labelFrom !== this.labelTo){
				var dtA = new Date(this.labelFrom, 0, 1);
				var i, idx;
				for(i = this.labelFrom, idx = 0; i <= this.labelTo; i++, idx++){
					dtA.setFullYear(i);
					this.labels.push(datelocale.format(dtA,{datePattern:"yyyy", selector:"date"}));
				}
			}
			this.inherited(arguments);
		}
	});

	var SpinWheelMonthSlot = declare(SpinWheelSlot, {
		buildRendering: function(){
			this.labels = [];
			var dtA = new Date(2000, 0, 1);
			var monthStr;
			for(var i = 0; i < 12; i++){
				dtA.setMonth(i);
				monthStr = datelocale.format(dtA,{datePattern:"MMM", selector:"date"});
				this.labels.push(monthStr);
			}
			this.inherited(arguments);
		}
	});

	var SpinWheelDaySlot = declare(SpinWheelSlot, {});



	return declare("dojox.mobile.SpinWheelDatePicker", SpinWheel, {
		slotClasses: [
			SpinWheelYearSlot,
			SpinWheelMonthSlot,
			SpinWheelDaySlot
		],
		slotProps: [
			{labelFrom:1970, labelTo:2038},
			{},
			{labelFrom:1, labelTo:31}
		],

		buildRendering: function(){
			this.inherited(arguments);
			domClass.add(this.domNode, "mblSpinWheelDatePicker");
			this.connect(this.slots[1], "onFlickAnimationEnd", "onMonthSet");
			this.connect(this.slots[2], "onFlickAnimationEnd", "onDaySet");
		},

		reset: function(){
			// goto today
			var slots = this.slots;
			var now = new Date();
			var monthStr = datelocale.format(now, {datePattern:"MMM", selector:"date"});
			this.setValue([now.getFullYear(), monthStr, now.getDate()]);
		},

		onMonthSet: function(){
			var daysInMonth = this.onDaySet();
			var disableValuesTable = {28:[29,30,31], 29:[30,31], 30:[31], 31:[]};
			this.slots[2].disableValues(disableValuesTable[daysInMonth]);
		
		},

		onDaySet: function(){
			var y = this.slots[0].getValue();
			var m = this.slots[1].getValue();
			var newMonth = datelocale.parse(y+"/"+m, {datePattern:'yyyy/MMM', selector:'date'});
			var daysInMonth = ddate.getDaysInMonth(newMonth);
			var d = this.slots[2].getValue();
			if(daysInMonth < d){
				this.slots[2].setValue(daysInMonth);
			}
			return daysInMonth;
		}
	});
});
