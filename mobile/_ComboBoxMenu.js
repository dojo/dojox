define("dojox/mobile/_ComboBoxMenu", ["dojo", "dijit", "dojox", "dijit/form/_ComboBoxMenuMixin", "dijit/_WidgetBase", "dojox/mobile/_ListTouchMixin", "dojox/mobile/scrollable"], function(dojo, dijit, dojox) {

dojo.declare(
	"dojox.mobile._ComboBoxMenu",
	[dijit._WidgetBase, dojox.mobile._ListTouchMixin, dijit.form._ComboBoxMenuMixin],
	{
		// summary:
		//		Focus-less menu for internal use in `dijit.form.ComboBox`
		//		Abstract methods that must be defined externally:
		//			onChange: item was explicitly chosen (mousedown somewhere on the menu and mouseup somewhere on the menu)
		//			onPage: next(1) or previous(-1) button pressed
		// tags:
		//		private

		baseClass: "mblComboBoxMenu",

		buildRendering: function(){
			this.focusNode = this.domNode = dojo.create("div", { style:{ overflow:"hidden" }, "class":"mblReset" });
			this.containerNode = dojo.create("div", {}, this.domNode, "last"); // needed for scrollable
			this.previousButton = dojo.create("div", { "class":"mblComboBoxMenuItem mblComboBoxMenuPreviousButton", role:"option" }, this.containerNode, "last");
			this.nextButton = dojo.create("div", { "class":"mblComboBoxMenuItem mblComboBoxMenuNextButton", role:"option" }, this.containerNode, "last");
			this.inherited(arguments);
		},

		_createMenuItem: function(){
			return dojo.create("div", {
				"class": "mblReset mblComboBoxMenuItem" +(this.isLeftToRight() ? "" : " mblComboBoxMenuItemRtl"),
				role: "option"
			});
		},

		onSelect: function(/*DomNode*/ node){
			// summary:
			//		Add selected CSS
			dojo.addClass(node, "mblComboBoxMenuItemSelected");
		},

		onDeselect: function(/*DomNode*/ node){
			// summary:
			//		Remove selected CSS
			dojo.removeClass(node, "mblComboBoxMenuItemSelected");
		},

		onOpen: function(){
			this.scrollable.init({
				domNode: this.domNode,
				containerNode: this.domNode.firstChild
			});
			this.scrollable.scrollTo({x:0, y:0});
		},

		postCreate: function(){
			this.inherited(arguments);
			this.scrollable = new dojox.mobile.scrollable();
			this.scrollable.resize = dojo.hitch(this, "onClose", null); // resize changes the height rudely
		}
	}
);

return dojox.mobile._ComboBoxMenu;
});
