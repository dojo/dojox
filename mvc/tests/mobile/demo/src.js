var listCtl, repeatModel, setRef, nextIndexToAdd, selectedIndex, nameCtl, genmodel;
var setDetailsContext, updateView, updateModel, addEmpty, remove, forceFocus;

require(['dojo/has',
	'dojox/mobile/parser',
	//'dojo/parser',
	'dojo/ready',
	'dijit/registry', 
	'dojox/mvc/at',
	'dojox/mvc/getStateful',
	'dojox/mvc/EditStoreRefListController',
	"dojo/store/Memory",
	"dojo/when",
	'dojox/mobile',
	'dojox/mobile/ScrollableView',
	'dojox/mobile/Button',
	'dojox/mobile/TextArea',
	'dojox/mvc/Group',
	'dojox/mvc/Output',
	'dojox/mvc/Generate',
	'dojox/mvc/Repeat',
	'dojox/mobile/TextBox',
	'dojox/mobile/deviceTheme',
	'dojox/mobile/Heading',
	'dojo/_base/json',
	'dojo/dom'
], function(has, parser, ready, registry, at, getStateful, EditStoreRefListController, 
		Memory, when, mobile, ScrollableView, Button, TextArea, Group, Output, Generate, 
		Repeat, TextBox, deviceTheme, Heading, json, dom){

	if(!has("webkit")){
		require(["dojox/mobile/compat"]);
	}

	window.at = at;
	
	var names = [{
	"id" 	 : "360324",
	"Serial" : "360324",
	"First"  : "John",
	"Last"   : "Doe",
	"Email"  : "jdoe@us.ibm.com",
	"ShipTo" : {
		"Street" : "123 Valley Rd",
		"City"   : "Katonah",
		"State"  : "NY",
		"Zip"    : "10536"
	},
	"BillTo" : {
		"Street" : "17 Skyline Dr",
		"City"   : "Hawthorne",
		"State"  : "NY",
		"Zip"    : "10532"
	}
}];

// Initial repeat data used in the Repeat Data binding demo
var repeatData = [ 
	{
		"First"   : "Chad",
		"Last"    : "Chapman",
		"Location": "CA",
		"Office"  : "1278",
		"Email"   : "c.c@test.com",
		"Tel"     : "408-764-8237",
		"Fax"     : "408-764-8228"
	},
	{
		"First"   : "Irene",
		"Last"    : "Ira",
		"Location": "NJ",
		"Office"  : "F09",
		"Email"   : "i.i@test.com",
		"Tel"     : "514-764-6532",
		"Fax"     : "514-764-7300"
	},
	{
		"First"   : "John",
		"Last"    : "Jacklin",
		"Location": "CA",
		"Office"  : "6701",
		"Email"   : "j.j@test.com",
		"Tel"     : "408-764-1234",
		"Fax"     : "408-764-4321"
	}
];

	selectedIndex = 0;

	nameCtl = new EditStoreRefListController({store: new Memory({data: names})});
	nameCtl.getStore("360324");
	model = nameCtl.model;
	
	listCtl = new EditStoreRefListController({store: new Memory({data: repeatData}), cursorIndex: 0});
	when(listCtl.queryStore(), function(model){
		repeatmodel = model;
		nextIndexToAdd = repeatmodel.length;
	});
	
	
	setDetailsContext=function(index){
		// summary:
		//		Called to move to the repeatdetails page when an item is selected on the Repeat Data Binding page. 
		//
		// index: string
		//		The index of the item to show in the repeatdetails page. 
		//
		listCtl.set("cursorIndex", index);
		registry.byId("firstInput").focus();
	};


	addEmpty = function(){
		// summary:
		//		Called to add an empty item when the white plus icon is pressed on the Repeat Data Binding page. 
		//
		var data = {id:Math.random(), "First": "", "Last": "", "Location": "CA", "Office": "", "Email": "",
					"Tel": "", "Fax": ""};
		repeatmodel.push(new getStateful(data));
		var r = registry.byId("repeat");
		r.performTransition("repeatdetails", 1, "none");
		setDetailsContext(repeatmodel.length-1);
	},

	remove = function(idx){
		// summary:
		//		Called to remove an item when the red circle minus icon is pressed on the Repeat Data Binding page. 
		//
		// idx: string
		//		The index of the item to remove. 
		//
		repeatmodel.splice(idx, 1);
		if(listCtl.get("cursorIndex") > repeatmodel.length-1){
			listCtl.set("cursorIndex", repeatmodel.length - 1);
		}
	},

	forceFocus = function(){
		// summary:
		//		Called to set the focus to force the update of the field when going back to the repeat list Repeat Data Binding page. 
		//
		registry.byId("telInput").focus();
	},
	
	updateView = function() {
		// summary:
		//		Called when the "Update View" button is pressed on the Generate Simple Form. 
		//
		try {
			registry.byId("view").set("children", at('widget:modelArea', 'value').direction(at.from).transform({format: dojo.fromJson}));
			dom.byId("outerModelArea").style.display = "none";
			dom.byId("viewArea").style.display = "";              		
		}catch(err){
			console.error("Error parsing json from model: "+err);
		}
	};

	// used in the Generate View demo
	updateModel = function() {
		// summary:
		//		Called when the "Update Model" button is pressed on the Generate View page. 
		//
		dom.byId("outerModelArea").style.display = "";
		try {
			dom.byId("modelArea").focus(); // hack: do this to force focus off of the textbox, bug on mobile?
			dom.byId("viewArea").style.display = "none";
			var test = registry.byId("view");
			registry.byId("modelArea").set("value",(json.toJson(test.get("children"), true)));
		} catch(e) {
			console.log(e);
		};
	};


	// when "dojo/ready" is ready call parse
	ready(function(){
		parser.parse();
	});

	// when domReady! is ready show the page 
	require(['dojo/domReady!'], function(){
		dom.byId("wholepage").style.display = "";
	});

}); // end function

function setRef(id, model, attr) {
		// summary:
		//		Called when the "Ship To" or "Bill To" button is pressed on the Simple Data binding. 
		//
		// id: string
		//		The id of the widget, in our test it will be 'addrGroup' 
		// model: string
		//		The name of the "model", in our test it will be 'rel:' since it is a relative binding
		// attr: string
		//		The attr to bind, in our test it will be 'ShipTo' or 'BillTo'
		//
	require([
	         "dijit/registry",
	         "dojox/mvc/at"
	         ], function(registry, at){
					var widget = registry.byId(id);
					widget.set("target", at(model,attr));
				});
};
