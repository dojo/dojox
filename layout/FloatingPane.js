dojo.provide("dojox.layout.FloatingPane");

dojo.require("dijit.TitlePane");
dojo.require("dojo.dnd.move"); 

dojo.declare(
	"dojox.layout.FloatingPane",
	[dijit.TitlePane],
	null,{	
	// summary:
	//
	// most simple widget extension, ever. Makes a dijit.TitlePane float
	// and draggable by it's title
	// and over-rides onClick to onDblClick for wipeIn/Out of containerNode

	// closable: Boolean
	//	allow closure of this Node
	closable: true,

	// title: String
	//	title to put in titlebar
	title: null,

	// duration: Integer
	//	time is MS to spend toggling in/out node
	duration: 400,

	// animations for toggle
	_showAnim: null,
	_hideAnim: null, 

	templatePath: dojo.moduleUrl("dojox.layout","resources/FloatingPane.html"),

	postCreate: function() {
		this.title = this.label || this.title; 
		new dojo.dnd.Moveable(this.domNode,this.focusNode);
		dojox.layout.FloatingPane.superclass.postCreate.call(this);
	},

	// extend 		
	hide: function() {
		dojo.fadeOut({node:this.domNode, duration:this.duration}).play();
	},
	show: function() {
		dojo.fadeIn({node:this.domNode, duration:this.duration}).play();
	}

});
