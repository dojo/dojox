dojo.provide("dojox.wire.demos.WidgetRepeater")
		
dojo.require("dojo.parser");
dojo.require("dijit.base.Widget");
dojo.require("dijit.base.TemplatedWidget");
dojo.require("dijit.base.Container");

dojo.declare(
	"dojox.wire.demos.WidgetRepeater", 
	[ dijit.base.Widget, dijit.base.TemplatedWidget, dijit.base.Container ],
	null,
	{
		//	summary:
		//		Simple widget that does generation of widgets repetatively, based on calls to 
		//		the createNew function and contains them as child widgets.
		templateString: "<div class='WidgetRepeater' dojoAttachPoint='repeaterNode'></div>",
		widget: null,
		repeater: null,
		createNew: function(obj){
			//	summary:
			//		Function to handle the creation of a new widget and appending it into the widget tree.
			//	obj:	
			//		The parameters to pass to the widget.
			try{
				if(dojo.isString(this.widget)){
					dojo.require(this.widget);
					this.widget = dojo.getObject(this.widget);
				}
				this.addChild(new this.widget(obj));
				this.repeaterNode.appendChild(document.createElement("br"));
			}catch(e){ console.debug(e); }
		}
	}
);


