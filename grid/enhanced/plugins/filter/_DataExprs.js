dojo.provide("dojox.grid.enhanced.plugins.filter._DataExprs");

dojo.require("dojox.grid.enhanced.plugins.filter._ConditionExpr");
dojo.require("dojo.date.locale");

(function(){
	var f_ns = dojox.grid.enhanced.plugins.filter;

	dojo.declare("dojox.grid.enhanced.plugins.filter.BooleanExpr", f_ns._DataExpr, {
		// summary:
		//		A condition expression wrapper for boolean values
		_convertData: function(/* anything */dataValue){
			// summary:
			//		override from _DataExpr
			return !!dataValue;	//Boolean
		},
		getName: function(){
			return "bool";	//String
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.StringExpr", f_ns._DataExpr, {
		// summary:
		//		A condition expression wrapper for string values
		_convertData: function(/* anything */dataValue){
			// summary:
			//		override from _DataExpr
			return String(dataValue);	//String
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "string";	//String
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.NumberExpr", f_ns._DataExpr, {
		// summary:
		//		A condition expression wrapper for number values
		_convertDataToExpr: function(/* anything */dataValue){
			// summary:
			//		override from _DataExpr
			return parseFloat(dataValue);	//Number
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "number";	//String
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.DateExpr", f_ns._DataExpr, {
		// summary:
		//		A condition expression wrapper for date values
		_selector: "date",
		_convertData: function(/* anything */dataValue){
			// summary:
			//		override from _DataExpr
			if(dataValue instanceof Date){
				return dataValue;
			}else if(typeof dataValue == "number"){
				return new Date(dataValue);
			}else{
				var res = dojo.date.locale.parse(String(dataValue), dojo.mixin({selector: this._selector}, this._convertArgs));
				if(!res){
					throw new Error("Datetime parse failed: " + dataValue);
				}
				return res;
			}
		},
		toObject: function(){
			// summary:
			//		Overrided from _DataExpr.toObject
			if(this._value instanceof Date){
				var tmp = this._value;
				this._value = this._value.valueOf();
				var res = this.inherited(arguments);
				this._value = tmp;
				return res;
			}else{
				return this.inherited(arguments);
			}
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return this._selector;	//String
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.TimeExpr", f_ns.DateExpr, {
		// summary:
		//		A condition expression wrapper for time values
		_selector: "time"
	});
})();

