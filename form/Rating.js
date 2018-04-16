define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/dom-attr",
	"dojo/dom-class",
	"dojo/mouse",
	"dojo/on",
	"dojo/string",
	"dojo/query",
	"dijit/form/_FormWidget"
], function(declare, lang, domAttr, domClass, mouse, on, string, query, FormWidget){


	return declare("dojox.form.Rating", FormWidget, {
		// summary:
		//		A widget for rating using stars.

		/*=====
		// required: Boolean
		//		TODO: Can be true or false, default is false.
		required: false,
		=====*/

		templateString: null,

		// numStars: Integer|Float
		//		The number of stars to show, default is 3.
		numStars: 3,

		// value: Integer|Float
		//		The current value of the Rating
		value: 0,

		// name: String
		// 		The name value for the radio inputs
		name: 'rating-' + Math.random().toString(36).substring(2),

		buildRendering: function(/*Object*/ params){
			// summary:
			//		Build the templateString. The number of stars is given by this.numStars,
			//		which is normally an attribute to the widget node.

			// The radio input used to display and select stars
			var starTpl = '<label class="dojoxRatingStar dijitInline">' +
			 	'<input type="radio" name="' + this.name + '" value="${value}" class="dojoxRatingInput">' +
				'</label>';

			// The hidden value node is attached as "focusNode" because tabIndex, id, etc. are getting mapped there.
			var tpl = '<div dojoAttachPoint="domNode" class="dojoxRating dijitInline">' +
				'<div data-dojo-attach-point="list">' +
				string.substitute(starTpl, {value:0}) +
				'${stars}' +
				'</div></div>';

			var rendered = "";
			for(var i = 0; i < this.numStars; i++){
				rendered += string.substitute(starTpl, {value:i + 1});
			}
			this.templateString = string.substitute(tpl, {stars:rendered});

			this.inherited(arguments);
		},

		postCreate: function(){
			this.inherited(arguments);
			this._renderStars(this.value);
			this.own(
				// Fire when mouse is moved over one of the stars.
				on(this.list, on.selector(".dojoxRatingStar", "mouseover"), lang.hitch(this, "_onMouse")),
				on(this.list, on.selector(".dojoxRatingStar", "click"), lang.hitch(this, "_onClick")),
				on(this.list, on.selector(".dojoxRatingInput", "change"), lang.hitch(this, "onStarChange")),
				on(this.list, mouse.leave, lang.hitch(this, function(){
					// go from hover display back to dormant display
					this._renderStars(this.value);
				}))
			);
		},

		_onMouse: function(evt){
			// summary:
			//		Called when mouse is moved over one of the stars
			var hoverValue = +domAttr.get(evt.target.children[0], "value");
			this._renderStars(hoverValue, true);
			this.onMouseOver(evt, hoverValue);
		},

		_onClick: function(evt) {
			var clickedValue = +domAttr.get(evt.target.children[0], "value");
			// for backwards compatibility
			evt.target.value = clickedValue;
			this.onStarClick(evt, clickedValue);
		},

		_renderStars: function(value, hover){
			// summary:
			//		Render the stars depending on the value.
			query(".dojoxRatingStar", this.domNode).forEach(function(star, i){
				if(i + 1 > value){
					domClass.remove(star, "dojoxRatingStarHover");
					domClass.remove(star, "dojoxRatingStarChecked");
				}else{
					domClass.remove(star, "dojoxRatingStar" + (hover ? "Checked" : "Hover"));
					domClass.add(star, "dojoxRatingStar" + (hover ? "Hover" : "Checked"));
				}
			});
		},

		onStarChange: function(/*Event*/ evt){
			// summary:
			//		Connect on this method to get noticed when the star value was changed.
			// example:
			//	|	connect(widget, "onStarChange", function(event){ ... })
			var newVal = +domAttr.get(evt.target, "value");
			this._renderStars(this.value);
		},

		onMouseOver: function(/*=====evt, value=====*/ ){
			// summary:
			//		Connect here, the value is passed to this function as the second parameter!
		},

		setAttribute: function(/*String*/ key, /*Number*/ value){
			// summary:
			//		Deprecated.   Use set("value", ...) instead.
			this.set(key, value);
		},

		_setValueAttr: function(val){
			this._set("value", val);
			this._renderStars(val);
			let input = query("input[type=radio]", this.domNode)[val];
			if (input) {
				input.checked = true;
			}
		}
	});
});
