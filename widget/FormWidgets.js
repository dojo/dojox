dojo.provide("dojox.widget.FormWidgets");
dojo.experimental("dojox.widget.FormWidgets");

dojo.require("dijit._Widget");

dojo.declare("dojox.widget.Select",dijit._Widget,{
	// summary: Wrapper for a native select multiple="true" element to
	//		interact with dijit.form.Form
	//
	// name: String
	// 		The name of this form element
	name: "",
	
	postCreate: function(){
		this.inherited(arguments);
		this._selected = [];
		this.connect(this.domNode,"onchange","_setSelected");
	},
	
	addSelected: function(/* dojox.widget.Select */select){
		// summary: Appends the selected nodes af an passed Select widget
		//			instance to this Select widget.
		//
		// example:
		// |	// move all the selected values from "bar" to "foo"
		// | 	dijit.byId("foo").addSelected(dijit.byId("bar"));
		
		select._selected.forEach(function(n){
			this.domNode.appendChild(n);
		},this);
		dojo.hitch(select,"_setSelected");
		this._setSelected();

	},
					
	getSelected: function(){
		// summary: Access the NodeList of the selected options directly
		return this._setSelected(); // dojo.NodeList
	},
	
	getValues: function(){
		// summary: Returns an array of the selected options value's
		var vals = [];
		this._setSelected().forEach(function(n){
			vals.push(n.value);
		});
		return vals; // Array
	},
	
	getValue: function(){
		// summary: serialize the values of the selected nodes
		return this.getValues(); // Array
	},
	
	setValue: function(/* Array */values){
		// summary: Set the value(s) of this Select based on passed values
		dojo.query("option",this.domNode).forEach(function(n){
			n.selected = (dojo.indexOf(values,n.value) === 0);
		});
	},
		
	invertSelection: function(onChange){
		// summary: Invert the selection
		// onChange: Boolean
		//		If null, onChange is not fired.
		this._selected = dojo.query("option",this.domNode).filter(function(n){
			n.selected = !n.selected;
			return n.selected; // Boolean
		});
		if(onChange){ this.onChange(); }
	},

	_setSelected: function(e){
		// summary: Re-populate the selected NodeList
		this._selected = dojo.query("option",this.domNode).filter(function(n){
			return n.selected; // Boolean
		});
		if(e && e.type){ this.onChange(this._selected); }
		return this._selected; // dojo.NodeList
	},
	
	// for layout widgets:
	resize: function(/* Object */size){
		dojo.style(this.domNode,"width",size.w+"px");
		dojo.style(this.domNode,"height",size.h+"px");
	},
	
	onChange: function(e){
		// summary: a stub -- over-ride, or connect
	}
	
});

dojo.declare("dojox.widget.Hidden",
	dijit._Widget,
	{
	// summary: A widget corosponding to a native input type="hidden" element,
	//		which responds to dijit.form.Form, and degrades.
	//
	// example:
	//	|	<input type="hidden" dojoType="dojox.widget.Hidden" name="foo" value="bar" />
	//
	name: "",
	
	postCreate: function(){
		this.inherited(arguments);
		this.connect(this.domNode,"onchange","onChange");
	},
	
	getValue: function(){
		// summary: Normalized getter for this input
		return this.domNode.value || this.value; // String
	},
	
	setValue: function(/* String */val){
		// summary: Normalized control over this input
		this.onChange(val);
		this.domNode.value = this.value = val; 
	},
	
	onChange: function(val){
		// summary: stub -- connect or override to use	
	}
});

dojo.declare("dojox.widget.TextArea",dojox.widget.Hidden,{
	// summary: A Simple textarea that degrades, and responds to
	// 		minimal LayoutContiner usage, and works with dijit.form.Form
	
	resize: function(/* Object */size){
		dojo.style(this.domNode,"width",size.w+"px");
		dojo.style(this.domNode,"height",size.h+"px");
	}
	
});
