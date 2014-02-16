define([
	'intern!object',
	'intern/chai!assert',
	'../db/has!indexeddb?../db/IndexedDB',
	'../db/SQL',
	'dojo/promise/all'
], function (registerSuite, assert, IndexedDB, SQL, all) {
	var data = [
		{id: 1, name: 'one', prime: false, mappedTo: 'E', words: ['bananna']},
		{id: 2, name: 'two', even: true, prime: true, mappedTo: 'D', words: ['bananna', 'orange']},
		{id: 3, name: 'three', prime: true, mappedTo: 'C', words: ['apple', 'orange']},
		{id: 4, name: 'four', even: true, prime: false, mappedTo: null},
		{id: 5, name: 'five', prime: true, mappedTo: 'A'}
	];
	var dbConfig = {
		version: 3,
		stores: {
			test: {
				name: 10,
				even: {},
				id: {
					autoIncrement: true,
					preference: 20
				},
				words: {
					multiEntry: true,
					preference: 5
				}
			}
		}
	};
	if (IndexedDB) {
		registerSuite(testsForDB('dojox/store/db/IndexedDB', IndexedDB));
	}
	if (window.openDatabase) {
		registerSuite(testsForDB('dojox/store/db/SQL', SQL, true));	
	}
	function testsForDB(name, DB, nonIndexed){
		var db = new DB({dbConfig: dbConfig, storeName: 'test'});
		function testQuery(query, options, results){
			if(!results){
				results = options;
				options = undefined;
			}else if(options.nonIndexed && nonIndexed){
				// skip these tests
				return function(){};
			}
			return function(){
				var i = 0;
				var queryResults = db.query(query, options);
				var total = queryResults.total;
				return queryResults.forEach(function(object){
					assert.strictEqual(results[i++], object.id);
				}).then(function(){
					assert.strictEqual(results.length, i);
					if(!options){
						return queryResults.total.then(function(total){
							assert.strictEqual(results.length, total);
						});
					}
				});
			};
		}
		return {
			name: name,
			setup: function(){
				var results = [];
				return db.query({}).forEach(function(object){
					// clear the data
					results.push(db.remove(object.id));
				}).then(function(){
					return all(results);
				}).then(function(){
					results = [];
					// load new data
					for (var i = 0; i < data.length; i++) {
						results.push(db.put(data[i]));
					}
					return all(results);
				});
			},
			"{id: 2}": testQuery({id: 2}, [2]),
			"{name: 'four'}": testQuery({name: 'four'}, [4]),
			"{name: 'two'}": testQuery({name: 'two'}, [2]),
			"{even: true}": testQuery({even: true}, [2, 4]),
			"{even: true, name: 'two'}": testQuery({even: true, name: 'two'}, [2]),
			// test non-indexed values
			"{mappedTo: 'C'}": testQuery({mappedTo: 'C'}, {nonIndexed: true}, [3]),
			// union
			"[{name: 'two'}, {mappedTo: 'C'}, {mappedTo: 'D'}]": testQuery([{name: 'two'}, {mappedTo: 'C'}, {mappedTo: 'D'}], {nonIndexed: true}, [2, 3]),
			"{id: {from: 1, to: 3}}": testQuery({id: {from: 1, to: 3}}, [1, 2, 3]),
			"{name: {from: 'm', to: 'three'}}": testQuery({name: {from: 'm', to: 'three'}}, [1, 3]),
			"{name: 't*'}": testQuery({name: 't*'}, {sort:[{attribute: "name"}]}, [3, 2]),
			"{name: 'not a number'}": testQuery({name: 'not a number'}, []),
			"{words: {contains: ['orange']}}": testQuery({words: {contains: ['orange']}}, [2, 3]),
			"{words: {contains: ['or*']}}": testQuery({words: {contains: ['or*']}}, [2, 3]),
			"{words: {contains: ['apple', 'bananna']}}": testQuery({words: {contains: ['apple', 'bananna']}}, []),
			"{words: {contains: ['orange', 'bananna']}}": testQuery({words: {contains: ['orange', 'bananna']}}, [2]),
			"{id: {from: 0, to: 4}, words: {contains: ['orange', 'bananna']}}": testQuery({id: {from: 0, to: 4}, words: {contains: ['orange', 'bananna']}}, [2]),
			// "{name: '*e'}": testQuery({name: '*e'}, [5, 1, 3]), don't know if we even support this yet
			"{id: {from: 1, to: 3}}, sort by name +": testQuery({id: {from: 1, to: 3}}, {sort:[{attribute: "name"}]}, [1, 3, 2]),
			"{id: {from: 1, to: 3}}, sort by name -": testQuery({id: {from: 1, to: 3}}, {sort:[{attribute: "name", descending: true}]}, [2, 3, 1]),
			"{id: {from: 0, to: 4}}, paged": testQuery({id: {from: 0, to: 4}}, {start: 1, count: 2}, [2, 3]),
			'db interaction': function(t){
				return db.get(1).then(function(one){
					assert.strictEqual(one.id, 1);
					assert.strictEqual(one.name, 'one');
					assert.strictEqual(one.prime, false);
					assert.strictEqual(one.mappedTo, 'E');
					return all([db.remove(2), db.remove(4), db.add({id: 6, name: 'six', prime: false, words: ['pineapple', 'orange juice']})]).then(function(){
						return all([
							testQuery({name: {from: 's', to: 'u'}}, [6, 3])(),
							testQuery({words: {contains: ['orange*']}}, [3, 6])()
						]);
					})
				});
			},

		};
	}
});
