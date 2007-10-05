dojo.provide("dojox.grid._data.fields");

dojo.declare("dojox.grid.data.mixer", null, {
	constructor: function(){
		this.defaultValue = {};
		this.values = [];
	},
	count: function(){
		return this.values.length;
	},
	clear: function(){
		this.values = [];
	},
	build: function(inIndex){
		var result = dojo.mixin({owner: this}, this.defaultValue);
		result.key = inIndex;
		this.values[inIndex] = result;
		return result;
	},
	getDefault: function(){
		return this.defaultValue;
	},
	setDefault: function(inField /*[, inField2, ... inFieldN] */){
		for(var i=0, a; (a = arguments[i]); i++){
			dojo.mixin(this.defaultValue, a);
		}
	},
	get: function(inIndex){
		return (this.values[inIndex] || this.build(inIndex));
	},
	_set: function(inIndex, inField /*[, inField2, ... inFieldN] */){
		// each field argument can be a single field object of an array of field objects
		var v = this.get(inIndex);
		for (var i=1; i<arguments.length; i++)
			dojo.mixin(v, arguments[i]);
		this.values[inIndex] = v;
	},
	set: function(/* inIndex, inField [, inField2, ... inFieldN] | inArray */){
		if(arguments.length < 1){
			return;
		}
		var a = arguments[0];
		if (!dojo.isArray(a)){
			this._set.apply(this, arguments);
		}else{
			if (a.length && a[0]["default"]){
				this.setDefault(a.shift());
			}
			for (var i=0, l=a.length; i<l; i++){
				this._set(i, a[i]);
			}
		}
	},
	insert: function(inIndex, inProps){
		if (inIndex >= this.values.length){
			this.values[inIndex] = inProps;
		}else{
			this.values.splice(inIndex, 0, inProps);
		}
	},
	remove: function(inIndex){
		this.values.splice(inIndex, 1);
	},
	swap: function(inIndexA, inIndexB){
		dojox.grid.arraySwap(this.values, inIndexA, inIndexB);
	},
	move: function(inFromIndex, inToIndex){
		dojox.grid.arrayMove(this.values, inFromIndex, inToIndex);
	}
});

dojox.grid.data.compare = function(a, b){
	return (a > b ? 1 : (a == b ? 0 : -1));
}

dojox.grid.data.generateComparator = function(inCompare, inColumn, inSubCompare){
	return function(a, b){
		var c = Math.abs(inColumn) - 1;
		var ineq = inCompare(a[c], b[c]);
		return ineq ? (inColumn > 0 ? ineq : -ineq) : inSubCompare && inSubCompare(a, b);
	}
}

dojo.declare('dojox.grid.data.field', null, {
	constructor: function(inName){
		this.name = inName;
		this.compare = dojox.grid.data.compare;
	},
	na: '...'
});

dojo.declare('dojox.grid.data.fields', dojox.grid.data.mixer, {
	constructor: function(inFieldClass){
		var fieldClass = inFieldClass ? inFieldClass : dojox.grid.data.field;
		this.defaultValue = new fieldClass();
	}
});
