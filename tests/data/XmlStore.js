dojo.provide("dojox.tests.data.XmlStore");
dojo.require("dojox.data.XmlStore");

dojox.tests.data.XmlStore.getBooks2Store = function(){
	return new dojox.data.XmlStore({url: dojo.moduleUrl("dojox", "tests/data/books2.xml").toString()});
};

dojox.tests.data.XmlStore.getBooksStore = function(){
	return new dojox.data.XmlStore({url: dojo.moduleUrl("dojox", "tests/data/books.xml").toString()});
};

tests.register("dojox.tests.data.XmlStore", 
	[
		function testReadAPI_fetch_all(t){
			//	summary: 
			//		Simple test of fetching all xml items through an XML element called isbn
			//	description:
			//		Simple test of fetching all xml items through an XML element called isbn
			var store = dojox.tests.data.XmlStore.getBooksStore();

			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(20, items.length);
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"*"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_fetch_one(t){
			//	summary: 
			//		Simple test of fetching one xml items through an XML element called isbn
			//	description:
			//		Simple test of fetching one xml items through an XML element called isbn
			var store = dojox.tests.data.XmlStore.getBooks2Store();

			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(1, items.length);
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"A9B574"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_fetch_paging(t){
			//	summary: 
			//		Simple test of fetching one xml items through an XML element called isbn
			//	description:
			//		Simple test of fetching one xml items through an XML element called isbn
			var store = dojox.tests.data.XmlStore.getBooksStore();
			
			var d = new doh.Deferred();
			function dumpFirstFetch(items, request){
				t.assertEqual(5, items.length);
				request.start = 3;
				request.count = 1;
				request.onComplete = dumpSecondFetch;
				store.fetch(request);
			}

			function dumpSecondFetch(items, request){
				t.assertEqual(1, items.length);
				request.start = 0;
				request.count = 5;
				request.onComplete = dumpThirdFetch;
				store.fetch(request);
			}

			function dumpThirdFetch(items, request){
				t.assertEqual(5, items.length);
				request.start = 2;
				request.count = 20;
				request.onComplete = dumpFourthFetch;
				store.fetch(request);
			}

			function dumpFourthFetch(items, request){
				t.assertEqual(18, items.length);
				request.start = 9;
				request.count = 100;
				request.onComplete = dumpFifthFetch;
				store.fetch(request);
			}

			function dumpFifthFetch(items, request){
				t.assertEqual(11, items.length);
				request.start = 2;
				request.count = 20;
				request.onComplete = dumpSixthFetch;
				store.fetch(request);
			}

			function dumpSixthFetch(items, request){
				t.assertEqual(18, items.length);
			    d.callback(true);
			}

			function completed(items, request){
				t.assertEqual(20, items.length);
				request.start = 1;
				request.count = 5;
				request.onComplete = dumpFirstFetch;
				store.fetch(request);
			}

			function error(errData, request){
				d.errback(errData);
			}

			store.fetch({onComplete: completed, onError: error});
			return d; //Object
		},
		function testReadAPI_fetch_pattern0(t){
			//	summary: 
			//		Simple test of fetching one xml items through an XML element called isbn with ? pattern match
			//	description:
			//		Simple test of fetching one xml items through an XML element called isbn with ? pattern match
			var store = dojox.tests.data.XmlStore.getBooks2Store();
			var d = new doh.Deferred();                                                             
			function onComplete(items, request) {
				t.assertEqual(1, items.length);
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"?9B574"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_fetch_pattern1(t){
			//	summary: 
			//		Simple test of fetching one xml items through an XML element called isbn with ? pattern match
			//	description:
			//		Simple test of fetching one xml items through an XML element called isbn with ? pattern match
			var store = dojox.tests.data.XmlStore.getBooks2Store();
			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(4, items.length);
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"A9B57?"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_fetch_pattern2(t){
			//	summary: 
			//		Simple test of fetching one xml items through an XML element called isbn with * pattern match
			//	description:
			//		Simple test of fetching one xml items through an XML element called isbn with * pattern match
			var store = dojox.tests.data.XmlStore.getBooks2Store();
			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(5, items.length);
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"A9*"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_fetch_pattern_caseInsensitive(t){
			//	summary: 
			//		Simple test of fetching one xml items through an XML element called isbn with ? pattern match and in case insensitive mode.
			//	description:
			//		Simple test of fetching one xml items through an XML element called isbn with ? pattern match and in case insensitive mode.
			var store = dojox.tests.data.XmlStore.getBooks2Store();
			var d = new doh.Deferred();                                                             
			function onComplete(items, request) {
				t.assertEqual(1, items.length);
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"?9b574"}, queryIgnoreCase:true, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_fetch_pattern_caseSensitive(t){
			//	summary: 
			//		Simple test of fetching one xml items through an XML element called isbn with ? pattern match and in case sensitive mode.
			//	description:
			//		Simple test of fetching one xml items through an XML element called isbn with ? pattern match and in case sensitive mode.
			var store = dojox.tests.data.XmlStore.getBooks2Store();
			var d = new doh.Deferred();                                                             
			function onComplete(items, request) {
				t.assertEqual(1, items.length);
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"?9B574"}, queryIgnoreCase:false, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_fetch_all_rootItem(t){
			//	summary: 
			//		Simple test of fetching all xml items through an XML element called isbn
			//	description:
			//		Simple test of fetching all xml items through an XML element called isbn
			var store = new dojox.data.XmlStore({url: dojo.moduleUrl("dojox", "tests/data/books3.xml").toString(), 
				rootItem:"book"});

			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(5, items.length);
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"*"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_fetch_withAttrMap_all(t){
			var store = new dojox.data.XmlStore({url: dojo.moduleUrl("dojox", "tests/data/books_isbnAttr.xml").toString(),
				attributeMap: {"book.isbn": "@isbn"}});

			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(5, items.length);
				d.callback(true);
			}
			function onError(error, request) {
				console.debug(error);
				d.errback(error);
			}
			store.fetch({query:{isbn:"*"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_fetch_withAttrMap_one(t){
			var store = new dojox.data.XmlStore({url: dojo.moduleUrl("dojox", "tests/data/books_isbnAttr.xml").toString(),
				attributeMap: {"book.isbn": "@isbn"}});

			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(1, items.length);
				d.callback(true);
			}
			function onError(error, request) {
				console.debug(error);
				d.errback(error);
			}
			store.fetch({query:{isbn:"2"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_fetch_withAttrMap_pattern0(t){
			//	summary: 
			//		Simple test of fetching one xml items through an XML element called isbn with ? pattern match
			//	description:
			//		Simple test of fetching one xml items through an XML element called isbn with ? pattern match
			var store = new dojox.data.XmlStore({url: dojo.moduleUrl("dojox", "tests/data/books_isbnAttr2.xml").toString(), 
				attributeMap: {"book.isbn": "@isbn"}});
			var d = new doh.Deferred();                                                             
			function onComplete(items, request) {
				t.assertEqual(3, items.length);
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"ABC?"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_fetch_withAttrMap_pattern1(t){
			//	summary: 
			//		Simple test of fetching one xml items through an XML element called isbn with ? pattern match
			//	description:
			//		Simple test of fetching one xml items through an XML element called isbn with ? pattern match
			var store = new dojox.data.XmlStore({url: dojo.moduleUrl("dojox", "tests/data/books_isbnAttr2.xml").toString(),
				attributeMap: {"book.isbn": "@isbn"}});
			var d = new doh.Deferred();                                                             
			function onComplete(items, request) {
				t.assertEqual(5, items.length);
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"A*"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_fetch_withAttrMap_pattern2(t){
			//	summary: 
			//		Simple test of fetching one xml items through an XML element called isbn with ? pattern match
			//	description:
			//		Simple test of fetching one xml items through an XML element called isbn with ? pattern match
			var store = new dojox.data.XmlStore({url: dojo.moduleUrl("dojox", "tests/data/books_isbnAttr2.xml").toString(), 
				attributeMap: {"book.isbn": "@isbn"}});
			var d = new doh.Deferred();                                                             
			function onComplete(items, request) {
				t.assertEqual(2, items.length);
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"?C*"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_getValue(t){
			 //	summary: 
			 //		Simple test of the getValue API
			 //	description:
			 //		Simple test of the getValue API
			 var store = dojox.tests.data.XmlStore.getBooks2Store();

			 var d = new doh.Deferred();
			 function onComplete(items, request) {
				 t.assertEqual(1, items.length);
				 var item = items[0];
				 t.assertTrue(store.hasAttribute(item,"isbn"));
				 t.assertEqual(store.getValue(item,"isbn"), "A9B574");
				 d.callback(true);
			 }
			 function onError(error, request) {
				 d.errback(error);
			 }
			 store.fetch({query:{isbn:"A9B574"}, onComplete: onComplete, onError: onError});
			 return d; //Object
		},
		function testReadAPI_getValues(t){
			 //	summary: 
			 //		Simple test of the getValues API
			 //	description:
			 //		Simple test of the getValues API
			 var store = dojox.tests.data.XmlStore.getBooks2Store();

			 var d = new doh.Deferred();
			 function onComplete(items, request) {
				 t.assertEqual(1, items.length);
				 var item = items[0];
				 t.assertTrue(store.hasAttribute(item,"isbn"));
				 var values = store.getValues(item,"isbn");
				 t.assertEqual(1,values.length);
				 t.assertEqual("A9B574", values[0]);
				 d.callback(true);
			 }
			 function onError(error, request) {
				 d.errback(error);
			 }
			 store.fetch({query:{isbn:"A9B574"}, onComplete: onComplete, onError: onError});
			 return d; //Object
		},
		function testReadAPI_isItem(t){
			 //	summary: 
			 //		Simple test of the isItem API
			 //	description:
			 //		Simple test of the isItem API
			 var store = dojox.tests.data.XmlStore.getBooks2Store();

			 var d = new doh.Deferred();
			 function onComplete(items, request) {
				t.assertEqual(1, items.length);
				var item = items[0];
				t.assertTrue(store.isItem(item));
				t.assertTrue(!store.isItem({}));
				t.assertTrue(!store.isItem("Foo"));
				t.assertTrue(!store.isItem(1));
				d.callback(true);
			 }
			 function onError(error, request) {
				 d.errback(error);
			 }
			 store.fetch({query:{isbn:"A9B574"}, onComplete: onComplete, onError: onError});
			 return d; //Object
		},
		function testReadAPI_isItem_multistore(t){
			//	summary: 
			//		Simple test of the isItem API across multiple store instances.
			//	description:
			//		Simple test of the isItem API across multiple store instances.
			var store1 = dojox.tests.data.XmlStore.getBooks2Store();
			var store2 = dojox.tests.data.XmlStore.getBooks2Store();

			var d = new doh.Deferred();
			function onComplete1(items, request) {
				t.assertEqual(1, items.length);
				var item1 = items[0];
				t.assertTrue(store1.isItem(item1));

				function onComplete2(items, request) {
					t.assertEqual(1, items.length);
					var item2 = items[0];
					t.assertTrue(store2.isItem(item2));
					t.assertTrue(!store1.isItem(item2));
					t.assertTrue(!store2.isItem(item1));
					d.callback(true);
				}
				store2.fetch({query:{isbn:"A9B574"}, onComplete: onComplete2, onError: onError});
			}
			function onError(error, request) {
				d.errback(error);
			}
			store1.fetch({query:{isbn:"A9B574"}, onComplete: onComplete1, onError: onError});
			return d; //Object
		},
		function testReadAPI_hasAttribute(t){
			//	summary: 
			//		Simple test of the hasAttribute API
			//	description:
			//		Simple test of the hasAttribute API
			var store = dojox.tests.data.XmlStore.getBooks2Store();

			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(1, items.length);
				var item = items[0];
				t.assertTrue(store.hasAttribute(item,"isbn"));
				t.assertTrue(!store.hasAttribute(item,"bob"));
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"A9B574"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_containsValue(t){
			//	summary: 
			//		Simple test of the containsValue API
			//	description:
			//		Simple test of the containsValue API
			var store = dojox.tests.data.XmlStore.getBooks2Store();

			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(1, items.length);
				var item = items[0];
				t.assertTrue(store.containsValue(item,"isbn", "A9B574"));
				t.assertTrue(!store.containsValue(item,"isbn", "bob"));
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"A9B574"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_sortDescending(t){
			//	summary: 
			//		Simple test of the sorting API in descending order.
			//	description:
			//		Simple test of the sorting API in descending order.
			var store = dojox.tests.data.XmlStore.getBooksStore();

			//Comparison is done as a string type (toString comparison), so the order won't be numeric
			//So have to compare in 'alphabetic' order.
			var order = [9,8,7,6,5,4,3,20,2,19,18,17,16,15,14,13,12,11,10,1];
			
			var d = new doh.Deferred();
			function onComplete(items, request) {
				console.log("Number of items: " + items.length);
				t.assertEqual(20, items.length);

				for(var i = 0; i < items.length; i++){
					t.assertEqual(order[i], store.getValue(items[i],"isbn").toString());
				}
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}

			var sortAttributes = [{attribute: "isbn", descending: true}];
			store.fetch({query:{isbn:"*"}, sort: sortAttributes, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_sortAscending(t){
			//	summary: 
			//		Simple test of the sorting API in ascending order.
			//	description:
			//		Simple test of the sorting API in ascending order.
			var store = dojox.tests.data.XmlStore.getBooksStore();

			//Comparison is done as a string type (toString comparison), so the order won't be numeric
			//So have to compare in 'alphabetic' order.
			var order = [1,10,11,12,13,14,15,16,17,18,19,2,20,3,4,5,6,7,8,9];
						
			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(20, items.length);
				var itemId = 1;
				for(var i = 0; i < items.length; i++){
					t.assertEqual(order[i], store.getValue(items[i],"isbn").toString());
				}
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}

			var sortAttributes = [{attribute: "isbn"}];
			store.fetch({query:{isbn:"*"}, sort: sortAttributes, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_sortDescendingNumeric(t){
			//	summary: 
			//		Simple test of the sorting API in descending order using a numeric comparator.
			//	description:
			//		Simple test of the sorting API in descending order using a numeric comparator.
			var store = dojox.tests.data.XmlStore.getBooksStore();

			//isbn should be treated as a numeric, not as a string comparison
			store.comparatorMap = {};
			store.comparatorMap["isbn"] = function(a, b){
				var ret = 0;
				if(parseInt(a.toString()) > parseInt(b.toString())){
					ret = 1;
				}else if(parseInt(a.toString()) < parseInt(b.toString())){
					ret = -1;
				}
				return ret; //int, {-1,0,1}
			};

			var d = new doh.Deferred();
			function onComplete(items, request) {
                		t.assertEqual(20, items.length);
                		var itemId = 20;
				for(var i = 0; i < items.length; i++){
					t.assertEqual(itemId, store.getValue(items[i],"isbn").toString());
					itemId--;
				}
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}

			var sortAttributes = [{attribute: "isbn", descending: true}];
			store.fetch({query:{isbn:"*"}, sort: sortAttributes, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_sortAscendingNumeric(t){
			//	summary: 
			//		Simple test of the sorting API in ascending order using a numeric comparator.
			//	description:
			//		Simple test of the sorting API in ascending order using a numeric comparator.
			var store = dojox.tests.data.XmlStore.getBooksStore();

			//isbn should be treated as a numeric, not as a string comparison
			store.comparatorMap = {};
			store.comparatorMap["isbn"] = function(a, b){
				var ret = 0;
				if(parseInt(a.toString()) > parseInt(b.toString())){
					ret = 1;
				}else if(parseInt(a.toString()) < parseInt(b.toString())){
					ret = -1;
				}
				return ret; //int, {-1,0,1}
			};

			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(20, items.length);
				var itemId = 1;
				for(var i = 0; i < items.length; i++){
					t.assertEqual(itemId, store.getValue(items[i],"isbn").toString());
					itemId++;
				}
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}

			var sortAttributes = [{attribute: "isbn"}];
			store.fetch({query:{isbn:"*"}, sort: sortAttributes, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_isItemLoaded(t){
			//	summary: 
			//		Simple test of the isItemLoaded API
			//	description:
			//		Simple test of the isItemLoaded API
			var store = dojox.tests.data.XmlStore.getBooks2Store();

			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(1, items.length);
				var item = items[0];
				t.assertTrue(store.isItemLoaded(item));
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"A9B574"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testReadAPI_getFeatures(t){
			//	summary: 
			//		Simple test of the getFeatures function of the store
			//	description:
			//		Simple test of the getFeatures function of the store

			var store = dojox.tests.data.XmlStore.getBooks2Store();
			var features = store.getFeatures(); 
			var count = 0;
			for(i in features){
				t.assertTrue((i === "dojo.data.api.Read" || i === "dojo.data.api.Write"));
				count++;
			}
			t.assertEqual(2, count);
		},
		function testReadAPI_getAttributes(t){
			//	summary: 
			//		Simple test of the getAttributes API
			//	description:
			//		Simple test of the getAttributes API
			var store = dojox.tests.data.XmlStore.getBooks2Store();

			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(1, items.length);
				var item = items[0];
				var attributes = store.getAttributes(item);

				//Should be six, as all items should have tagName, childNodes, and text() special attributes 
				//in addition to any doc defined ones, which in this case are author, title, and isbn
				//FIXME:  Figure out why IE returns 5!  Need to get firebug lite working in IE for that.
				//Suspect it's childNodes, may not be defined if there are no child nodes.
				for(var i = 0; i < attributes.length; i++){
					console.log("attribute found: " + attributes[i]);
				}
				if(dojo.isIE){
					t.assertEqual(5,attributes.length);
				}else{
					t.assertEqual(6,attributes.length);
				}
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"A9B574"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testWriteAPI_setValue(t){
			//	summary: 
			//		Simple test of the setValue API
			//	description:
			//		Simple test of the setValue API
			var store = dojox.tests.data.XmlStore.getBooks2Store();

			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(1, items.length);
				var item = items[0];
				t.assertTrue(store.containsValue(item,"isbn", "A9B574"));
				store.setValue(item, "isbn", "A9B574-new");
				t.assertEqual(store.getValue(item,"isbn").toString(), "A9B574-new");
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"A9B574"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testWriteAPI_unsetAttribute(t){
			//	summary: 
			//		Simple test of the unsetAttribute API
			//	description:
			//		Simple test of the unsetAttribute API
			var store = dojox.tests.data.XmlStore.getBooks2Store();

			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(1, items.length);
				var item = items[0];
				t.assertTrue(store.containsValue(item,"isbn", "A9B574"));
				store.unsetAttribute(item,"isbn");
				t.assertTrue(!store.hasAttribute(item,"isbn"));
				t.assertTrue(store.isDirty(item));
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"A9B574"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testWriteAPI_isDirty(t){
			//	summary: 
			//		Simple test of the isDirty API
			//	description:
			//		Simple test of the isDirty API
			var store = dojox.tests.data.XmlStore.getBooks2Store();

			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(1, items.length);
				var item = items[0];
				t.assertTrue(store.containsValue(item,"isbn", "A9B574"));
				store.setValue(item, "isbn", "A9B574-new");
				t.assertEqual(store.getValue(item,"isbn").toString(), "A9B574-new");
				t.assertTrue(store.isDirty(item));
				d.callback(true);
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"A9B574"}, onComplete: onComplete, onError: onError});
			return d; //Object
		},
		function testWriteAPI_revert(t){
			//	summary: 
			//		Simple test of the isDirty API
			//	description:
			//		Simple test of the isDirty API
			var store = dojox.tests.data.XmlStore.getBooks2Store();

			var d = new doh.Deferred();
			function onComplete(items, request) {
				t.assertEqual(1, items.length);
				var item = items[0];
				t.assertTrue(store.containsValue(item,"isbn", "A9B574"));
				t.assertTrue(!store.isDirty(item));
				store.setValue(item, "isbn", "A9B574-new");
				t.assertEqual(store.getValue(item,"isbn").toString(), "A9B574-new");
				t.assertTrue(store.isDirty(item));
				store.revert();
				
				//Fetch again to see if it reset the state.
				function onComplete1(items, request) {
					t.assertEqual(1, items.length);
					var item = items[0];
					t.assertTrue(store.containsValue(item,"isbn", "A9B574"));
					d.callback(true);
				}
				store.fetch({query:{isbn:"A9B574"}, onComplete: onComplete1, onError: onError});
			}
			function onError(error, request) {
				d.errback(error);
			}
			store.fetch({query:{isbn:"A9B574"}, onComplete: onComplete, onError: onError});
			return d; //Object
		}
	]
);




