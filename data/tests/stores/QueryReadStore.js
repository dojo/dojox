dojo.provide("dojox.data.tests.stores.QueryReadStore");
dojo.require("dojox.data.QueryReadStore");
dojo.require("dojo.data.api.Read");

//dojo.require("dojox.testing.DocTest");

dojox.data.tests.stores.QueryReadStore.getStore = function(){
	return new dojox.data.QueryReadStore({
			url: dojo.moduleUrl("dojox.data.tests", "stores/QueryReadStore.php").toString(),
			doClientPaging:true // "true" is actually also the default, but make sure :-).
		});
};

dojox.data.tests.stores.QueryReadStore.assertError = function(/*Error object*/expectedError, /*Object*/scope, /*String*/functionName, /*Array*/args) { 
	//	summary: 
	//              Test for a certain error to be thrown by the given function. 
	//	example: 
	//		dojox.data.tests.stores.QueryReadStore.assertError(dojox.data.QueryReadStore.InvalidAttributeError, store, "getValue", [item, "NOT THERE"]); 
	//		dojox.data.tests.stores.QueryReadStore.assertError(dojox.data.QueryReadStore.InvalidItemError, store, "getValue", ["not an item", "NOT THERE"]); 
	try{ 
		scope[functionName].apply(scope, args); 
 	}catch (e){ 
		if(e instanceof expectedError){ 
			return true; 
		}else{ 
			throw new doh._AssertFailure("assertError() failed: expected error |"+expectedError+"| but got |"+e+"|"); 
		} 
		throw new doh._AssertFailure("assertError() failed: expected error |"+expectedError+"| but no error caught."); 
	}
} 

tests.register("dojox.data.tests.stores.QueryReadStore", 
	[
		/*
		function testDocTests(t) {
			//	summary:
			// 		Run all the doc comments.
			var doctest = new dojox.testing.DocTest();
			doctest.run("dojox.data.QueryReadStore");
			t.assertTrue(doctest.errors.length==0);
		},
		*/
		
		function testReadApi_getValue(t){
			//	summary: 
			//	description:
			var store = dojox.data.tests.stores.QueryReadStore.getStore();
			
			var d = new doh.Deferred();
			function onComplete(items, request){
				var item = items[0];
				// The good cases.
				t.assertEqual("Alabama", store.getValue(item, "name"));
				t.assertEqual("<img src='images/Alabama.jpg'/>Alabama", store.getValue(item, "label"));
				t.assertEqual("AL", store.getValue(item, "abbreviation"));
				// Test the defaultValue cases (the third paramter).
				t.assertEqual("default value", store.getValue(item, "NAME", "default value"));
				// TODO Test for null somehow ...
				// Read api says: Returns null if and only if null was explicitly set as the attribute value.
				
				// Test for not-existing attributes without defaultValues and invalid items.
				dojox.data.tests.stores.QueryReadStore.assertError(dojox.data.QueryReadStore.InvalidAttributeError, store, "getValue", [item, "NOT THERE"]);
				dojox.data.tests.stores.QueryReadStore.assertError(dojox.data.QueryReadStore.InvalidItemError, store, "getValue", ["not an item", "NOT THERE"]);
				
				d.callback(true);
			}
			store.fetch({query:{q:"Alabama"}, onComplete: onComplete});
			return d; //Object
		},

		function testReadApi_getValues(t){
			//	summary: 
			//	description:
			var store = dojox.data.tests.stores.QueryReadStore.getStore();
			
			var d = new doh.Deferred();
			function onComplete(items, request){
				var item = items[0];
				// The good cases.
				t.assertEqual(["Alabama"], store.getValues(item, "name"));
				t.assertEqual(["<img src='images/Alabama.jpg'/>Alabama"], store.getValues(item, "label"));
				t.assertEqual(["AL"], store.getValues(item, "abbreviation"));
				// TODO Test for null somehow ...
				// Read api says: Returns null if and only if null was explicitly set as the attribute value.

				// Test for not-existing attributes without defaultValues and invalid items.
				// TODO
				//dojox.data.tests.stores.QueryReadStore.assertError(dojox.data.QueryReadStore.InvalidAttributeError, store, "getValues", [item, "NOT THERE"]);
				//dojox.data.tests.stores.QueryReadStore.assertError(dojox.data.QueryReadStore.InvalidItemError, store, "getValues", ["not an item", "NOT THERE"]);
				
				d.callback(true);
			}
			store.fetch({query:{q:"Alabama"}, onComplete: onComplete});
			return d; //Object
		},
		
		function testReadApi_getAttributes(t){
			//	summary: 
			//	description:
			var store = dojox.data.tests.stores.QueryReadStore.getStore();
			
			var d = new doh.Deferred();
			function onComplete(items, request){
				var item = items[0];
				// The good case(s).
				t.assertEqual(['name', 'label', 'abbreviation'], store.getAttributes(item));
				dojox.data.tests.stores.QueryReadStore.assertError(dojox.data.QueryReadStore.InvalidItemError, store, "getAttributes", [{}]);
				
				d.callback(true);
			}
			store.fetch({query:{q:"Alabama"}, onComplete: onComplete});
			return d; //Object
		},

		function testReadApi_hasAttribute(t){
			//	summary: 
			//	description:
			var store = dojox.data.tests.stores.QueryReadStore.getStore();
			
			var d = new doh.Deferred();
			function onComplete(items, request){
				var item = items[0];
				// The positive cases.
				t.assertEqual(true, store.hasAttribute(item, "name"));
				t.assertEqual(true, store.hasAttribute(item, "label"));
				t.assertEqual(true, store.hasAttribute(item, "abbreviation"));
				// Make sure attribute case doesnt matter.
				t.assertEqual(false, store.hasAttribute(item, "NAME"));
				t.assertEqual(false, store.hasAttribute(item, "Name"));
				t.assertEqual(false, store.hasAttribute(item, "Label"));
				// Pass in an invalid item.
				t.assertEqual(false, store.hasAttribute({}, "abbreviation"));
				// pass in something that looks like the item with the attribute.
				t.assertEqual(false, store.hasAttribute({name:"yo"}, "name"));
				
				d.callback(true);
			}
			store.fetch({query:{q:"Alaska"}, onComplete: onComplete});
			return d; //Object
		},

		function testReadApi_containsValue(t){
			//	summary: 
			//	description:
			var store = dojox.data.tests.stores.QueryReadStore.getStore();

			var d = new doh.Deferred();
			function onComplete(items, request){
				var item = items[0];
				t.assertTrue(store.containsValue(item, "name", "Alaska"));
				d.callback(true);
			}
			store.fetch({query:{q:"Alaska"}, onComplete: onComplete});
			return d; //Object
		},

		function testReadApi_isItem(t){
			//	summary: 
			//	description:
			var store = dojox.data.tests.stores.QueryReadStore.getStore();
			
			var d = new doh.Deferred();
			function onComplete(items, request){
				// The good case.
				t.assertEqual(true, store.isItem(items[0]));
				// Try a pure object.
				t.assertEqual(false, store.isItem({}));
				// Try to look like an item.
				t.assertEqual(false, store.isItem({name:"Alaska", label:"Alaska", abbreviation:"AK"}));
				d.callback(true);
			}
			store.fetch({query:{q:"Alaska"}, onComplete: onComplete});
			return d; //Object
		},

		function testReadApi_isItemLoaded(t){
			//	summary: 
			//	description:
			var store = dojox.data.tests.stores.QueryReadStore.getStore();
			
			var d = new doh.Deferred();
			function onComplete(items, request){
				var item = items[0];
				// The good case(s).
				t.assertTrue(store.isItemLoaded(item));
				
				d.callback(true);
			}
			store.fetch({query:{q:"Alabama"}, onComplete: onComplete});
			return d; //Object
		},

		//function testReadApi_loadItem(t){
		//	//	summary: 
		//	//	description:
		//	t.assertTrue(false);
		//},

		function testReadApi_fetch_all(t){
			//	summary: 
			//		Simple test of fetching all items.
			//	description:
			//		Simple test of fetching all items.
			var store = dojox.data.tests.stores.QueryReadStore.getStore();

			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(8, items.length);
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{q:"a"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		
		function testReadApi_fetch_one(t){
			//	summary: 
			//	description:
			var store = dojox.data.tests.stores.QueryReadStore.getStore();
			
			var d = new doh.Deferred();
			function onComplete(items, request){
				t.assertEqual(1, items.length);
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{q:"Alaska"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},

		function testReadApi_fetch_client_paging(t){
			//	summary:
			//		Lets test that paging on the same request does not trigger
			//		server requests.
			//	description:
			var store = dojox.data.tests.stores.QueryReadStore.getStore();

			var lastRequestTimestamp = null;
			var firstItems = [];
			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(5, items.length);
				lastRequestTimestamp = store.lastRequestTimestamp;
				firstItems = items;
				
				// Do the next request AFTER the previous one, so we are sure its sequential.
				// We need to be sure so we can compare to the data from the first request.
				function onComplete1(items, request) {
					t.assertEqual(5, items.length);
					t.assertEqual(lastRequestTimestamp, store.lastRequestTimestamp);
					t.assertEqual(firstItems[1], items[0]);
					d.callback(true);
				}
				req.start = 1;
				req.onComplete = onComplete1;
				store.fetch(req);
			}
			function onError(error, request) {
				d.errback(error);
			}
			var req = {query:{q:"a"}, start:0, count:5,
						onComplete: onComplete, onError: onError};
			store.fetch(req);
			return d; //Object
		},
		
		function testReadApi_fetch_serverQuery(t) {
			// TODO verify serverQuery vs. query 
			t.assertTrue(true);
		},
		
		function testReadApi_getFeatures(t) {
			var store = dojox.data.tests.stores.QueryReadStore.getStore();
			var features = store.getFeatures();
			t.assertTrue(features["dojo.data.api.Read"]);
		},
		function testReadAPI_functionConformance(t){
			//	summary:
			//		Simple test read API conformance.  Checks to see all declared functions are actual functions on the instances.
			//	description:
			//		Simple test read API conformance.  Checks to see all declared functions are actual functions on the instances.

			var testStore = dojox.data.tests.stores.QueryReadStore.getStore();
			var readApi = new dojo.data.api.Read();
			var passed = true;

			for(i in readApi){
				var member = readApi[i];
				//Check that all the 'Read' defined functions exist on the test store.
				if(typeof member === "function"){
					var testStoreMember = testStore[i];
					if(!(typeof testStoreMember === "function")){
						console.log("Problem with function: [" + i + "]");
						passed = false;
						break;
					}
				}
			}
			t.assertTrue(passed);
		}
	]
);
