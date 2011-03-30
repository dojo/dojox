define("dojox/mobile/_ComboBoxMenu", ["dojo", "dijit", "dijit/form/_ComboBoxMenuMixin", "dijit/_WidgetBase", "dijit/_TemplatedMixin", "dojox/mobile/_ListTouchMixin", "dojox/mobile/scrollable"], function(dojo, dijit) {

dojo.declare(
	"dojox.mobile._ComboBoxMenu",
	[dijit._WidgetBase, dijit._TemplatedMixin, dojox.mobile._ListTouchMixin, dijit.form._ComboBoxMenuMixin],
	{
		// summary:
		//		Focus-less menu for internal use in `dijit.form.ComboBox`
		//		Abstract methods that must be defined externally:
		//			onChange: item was explicitly chosen (mousedown somewhere on the menu and mouseup somewhere on the menu)
		//			onPage: next(1) or previous(-1) button pressed
		// tags:
		//		private

		templateString: "<div class='dijitReset dijitMenu dijitMenuActive' style='overflow:hidden;'>"
				+"<div dojoAttachPoint='containerNode'>" // needed for scrollable
				+"<div class='dijitMenuItem dijitMenuPreviousButton' dojoAttachPoint='previousButton' role='option'></div>"
				+"<div class='dijitMenuItem dijitMenuNextButton' dojoAttachPoint='nextButton' role='option'></div>"
				+"</div>"
				+"</div>",

		baseClass: "dijitComboBoxMenu",

		_createMenuItem: function(){
			return dojo.create("div", {
				"class": "dijitReset dijitMenuItem" +(this.isLeftToRight() ? "" : " dijitMenuItemRtl"),
				role: "option"
			});
		},

		clearResultList: function(){
			this.inherited(arguments);
			this.scrollable.scrollTo({x:0, y:0});
		},

		onSelect: function(/*DomNode*/ node){
			// summary:
			//		Add selected CSS
			dojo.addClass(node, "dijitMenuItemSelected");
		},

		onDeselect: function(/*DomNode*/ node){
			// summary:
			//		Remove selected CSS
			dojo.removeClass(node, "dijitMenuItemSelected");
		},

		postCreate: function(){
			this.inherited(arguments);
			var scrollable = this.scrollable = new dojox.mobile.scrollable();
			scrollable.resize = dojo.hitch(this, "onClose", null); // resize changes the height rudely
			scrollable.init({
				domNode: this.domNode,
				containerNode: this.domNode.firstChild
			});
		}
	}
);

return dojox.mobile._ComboBoxMenu;
});
