define([
	"dojo/_base/declare",
	"dojo/dom-class",
	"./_TimePickerMixin",
	"./ToolBarButton",
	"./ValuePicker",
	"./ValuePickerSlot"
], function(declare, domClass, TimePickerMixin, ToolBarButton, ValuePicker, ValuePickerSlot){

/*=====
	var ValuePicker = dojox.mobile.ValuePicker;
=====*/

	// module:
	//		dojox/mobile/ValuePickerTimePicker
	// summary:
	//		A ValuePicker-based time picker widget.

	return declare("dojox.mobile.ValuePickerTimePicker", [ValuePicker, TimePickerMixin], {
		// summary:
		//		A ValuePicker-based time picker widget.
		// description:
		//		ValuePickerTimePicker is a time picker widget. It is a subclass of
		//		dojox.mobile.ValuePicker. It has the hour and minute slots.

		// readOnly: Boolean
		//		If true, slot input fields are read-only. Only the plus and
		//		minus buttons can be used to change the values.
		readOnly: false,

		is24h: false,

		slotClasses: [
			ValuePickerSlot,
			ValuePickerSlot
		],

		slotProps: [
			{labelFrom:0, labelTo:23, style:{width:"72px"}},
			{labelFrom:0, labelTo:59, zeroPad:2, style:{width:"72px"}}
		],

		buildRendering: function(){
			var p = this.slotProps;
			p[0].readOnly = p[1].readOnly = this.readOnly;
			this.inherited(arguments);
			var items = this.slots[0].items;
			this._zero = items.slice(0, 1);
			this._pm = items.slice(13);

			domClass.add(this.domNode, "mblValuePickerTimePicker");

			this.ampmButton = new ToolBarButton();
			this.addChild(this.ampmButton);
			this._conn = [
				this.connect(this.ampmButton, "onClick", "onBtnClick")
			];
			this.set("is24h", this.is24h);
		},

		to12h: function(a){
			// a = [hour24, minute]
			var h = a[0] - 0;
			var ampm = h < 12 ? "AM" : "PM";
			if(h == 0){
				h = 12;
			}else if(h > 12){
				h = h - 12;
			}
			return [h + "", a[1], ampm]; // [hour12, minute, ampm]
		},

		to24h: function(a){
			// a = [hour12, minute, ampm]
			var h = a[0] - 0;
			if(a[2] == "AM"){
				h = h == 12 ? 0 : h; // 12AM is 0h
			}else{
				h = h == 12 ? h : h + 12; // 12PM is 12h
			}
			return [h + "", a[1]]; // [hour24, minute]
		},

		onBtnClick: function(e){
			var ampm = this.ampmButton.get("label") == "AM" ? "PM" : "AM";
			var v = this.get("values12");
			v[2] = ampm;
			this.set("values12", v);
		},

		_setIs24hAttr: function(/*Boolean*/f){
			var items = this.slots[0].items;
			if(f && items.length != 24){ // 24h: 0 - 23
				this.slots[0].items = this._zero.concat(items).concat(this._pm);
			}else if(!f && items.length != 12){ // 12h: 1 - 12
				items.splice(0, 1);
				items.splice(12);
			}
			var v = this.get("values");
			this._set("is24h", f);
			this.ampmButton.domNode.style.display = f ? "none" : "";
			this.set("values", v);
		},

		_getValuesAttr: function(){
			// summary:
			//		Returns an array of hour an minute in 24h format.
			var v = this.inherited(arguments); // [hour, minute]
			return this.is24h ? v : this.to24h([v[0], v[1], this.ampmButton.get("label")]);
		},

		_setValuesAttr: function(/*Array*/a){
			// summary:
			//		Sets an array of hour an minute in 24h format.
			// a:
			//		[hour24, minute]
			if(this.is24h){
				this.inherited(arguments);
			}else{
				a = this.to12h(a);
				this.ampmButton.set("label", a[2]);
				this.inherited(arguments);
			}
		},

		_getValues12Attr: function(){
			return this.to12h(this._getValuesAttr());
		},

		_setValues12Attr: function(/*Array*/a){
			// summary:
			//		Sets an array of hour an minute in 12h format.
			// a:
			//		[hour12, minute, ampm]
			this.set("values", this.to24h(a));
		}
	});
});
