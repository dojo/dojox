define([
	'intern!object',
	'intern/chai!assert',
	'../transaction',
	'dojo/Deferred',
	'dojo/promise/all',
	'dojo/_base/declare',
	'dojo/store/Memory',
	'dojo/store/util/QueryResults'
], function (registerSuite, assert, transaction, Deferred, all, declare, Memory, QueryResults) {

	var started = 0;
	function anAsyncMethod(query){
		return function(){
			started++;
			var results = this.inherited(arguments);
			var deferred = new Deferred();
			setTimeout(function(){
				deferred.resolve(results);
			}, 10);
			return query ? new QueryResults(deferred) : deferred;
		}
	}
	var AsyncMemory = declare(Memory, {
		get: anAsyncMethod(),
		put: anAsyncMethod(),
		add: anAsyncMethod(),
		query: anAsyncMethod(true)
	});
	var data = [
		{id: 1, name: 'one', prime: false, mappedTo: 'E', words: ['banana']},
		{id: 2, name: 'two', even: true, prime: true, mappedTo: 'D', words: ['banana', 'orange']},
		{id: 3, name: 'three', prime: true, mappedTo: 'C', words: ['apple', 'orange']},
		{id: 4, name: 'four', even: true, prime: false, mappedTo: null},
		{id: 5, name: 'five', prime: true, mappedTo: 'A'}
	];
	var masterStore = new AsyncMemory({
		data: data
	});
	var cachingStore = new AsyncMemory();
	var logStore = new AsyncMemory();

	var transactionStore = transaction(masterStore, cachingStore, {
		transactionLogStore: logStore
	});
	registerSuite({
		name: "transaction",
		transaction: function(){
			var results = [];
			var operations = [];
			var order = [];
			var initialData = data.slice(0);

			// initially in auto-commit mode
			operations.push(transactionStore.add(
				{id: 6, name: 'six'}
			));
			assert.strictEqual(masterStore.data.length, 6);
			operations.push(transactionStore.remove(6));
			assert.strictEqual(masterStore.data.length, 5);

			var transaction = transactionStore.transaction();
			operations.push(transactionStore.add(
				{id: 6, name: 'six'}
			));
			operations.push(transactionStore.put(
				{id: 7, name: 'seven'}
			));
			operations.push(transactionStore.remove(3));
			// make sure the master store hasn't been updated yet
			assert.strictEqual(masterStore.data.length, 5);
			// make sure it is in the caching store
			assert.strictEqual(cachingStore.data.length, 2);
			operations.push(transactionStore.get(6).then(function(six){
				assert.deepEqual(six, {id: 6, name: 'six'});
			}));
			return all(operations).then(function(){
				assert.strictEqual(logStore.data.length, 3);
				return transaction.commit().then(function(){
					operations = [];
					operations.push(transactionStore.get(6).then(function(six){
						assert.deepEqual(six, {id: 6, name: 'six'});
					}));
					operations.push(transactionStore.get(7).then(function(seven){
						assert.deepEqual(seven, {id: 7, name: 'seven'});
					}));
					operations.push(transactionStore.get(3).then(function(gone){
						assert.strictEqual(gone, undefined);
					}));
					return all(operations);
				});
			});
		}
	});
});
