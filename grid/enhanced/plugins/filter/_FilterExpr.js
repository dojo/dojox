dojo.provide("dojox.grid.enhanced.plugins.filter._FilterExpr");
//This is the main file that should be 'required' if filter expression facility is necessary.

dojo.require("dojox.grid.enhanced.plugins.filter._DataExprs");
dojo.require("dojo.date");

(function(){
	var f_ns = dojox.grid.enhanced.plugins.filter;
	/* Logic Operations */
	dojo.declare("dojox.grid.enhanced.plugins.filter.LogicAND", f_ns._BiOpExpr, {
		// summary:
		//		A logic AND condition expression.
		_calculate: function(/* _ConditionExpr */left_operand,/* _ConditionExpr */right_operand,
							/* data item*/datarow,/* function(row,colIdx) */getter){
			// summary:
			//		Override from _BiOpExpr
			var res = left_operand.applyRow(datarow, getter).getValue() 
					&& right_operand.applyRow(datarow, getter).getValue();
			return new f_ns.BooleanExpr(res);	//_ConditionExpr
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "and";	//string
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.LogicOR", f_ns._BiOpExpr, {
		// summary:
		//		A logic OR condition expression.
		_calculate: function(/* _ConditionExpr */left_operand,/* _ConditionExpr */right_operand,
							/* data item*/datarow,/* function(row,colIdx) */getter){
			// summary:
			//		Override from _BiOpExpr
			var res = left_operand.applyRow(datarow, getter).getValue()
					|| right_operand.applyRow(datarow, getter).getValue();
			return new f_ns.BooleanExpr(res);	//_ConditionExpr
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "or";	//string
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.LogicXOR", f_ns._BiOpExpr, {
		// summary:
		//		A logic XOR condition expression.
		_calculate: function(/* _ConditionExpr */left_operand,/* _ConditionExpr */right_operand,
							/* data item*/datarow,/* function(row,colIdx) */getter){
			// summary:
			//		Override from _BiOpExpr
			var left_res = left_operand.applyRow(datarow, getter).getValue();
			var right_res = right_operand.applyRow(datarow, getter).getValue();
			return new f_ns.BooleanExpr((!!left_res) != (!!right_res));	//_ConditionExpr
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "xor";	//String
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.LogicNOT", f_ns._UniOpExpr, {
		// summary:
		//		A logic NOT condition expression.
		_calculate: function(/* _ConditionExpr */operand,/* data item*/datarow,/* function(row,colIdx) */getter){
			// summary:
			//		Override from _UniOpExpr
			return new f_ns.BooleanExpr(!operand.applyRow(datarow, getter).getValue());	//_ConditionExpr
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "not";	//String
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.LogicALL", f_ns._OperatorExpr, {
		// summary:
		//		A logic ALL condition expression, equals a sequence of logic ANDs
		applyRow: function(/* data item */datarow,/* function(row,colIdx) */ getter){
			// summary:
			//		Override from _ConditionExpr
			for(var i = 0, res = true;
				res && (this._operands[i] instanceof f_ns._ConditionExpr);
				(res = this._operands[i].applyRow(datarow,getter).getValue()), ++i);
			return new f_ns.BooleanExpr(res);	//_ConditionExpr
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "all";	//String
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.LogicANY", f_ns._OperatorExpr, {
		// summary:
		//		A logic ANY condition expression, equals a sequence of logic ORs
		applyRow: function(/* data item */datarow,/* function(row,colIdx) */ getter){
			for(var i = 0,res = false;
				!res && (this._operands[i] instanceof f_ns._ConditionExpr);
				(res = this._operands[i].applyRow(datarow,getter).getValue()), ++i);
			return new f_ns.BooleanExpr(res);	//_ConditionExpr
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "any";	//string
		}
	});
	
	/* Comparison Operations */
	function compareFunc(left,right,row,getter){
		var left = left.applyRow(row, getter);
		var right = right.applyRow(row, getter);
		var left_res = left.getValue();
		var right_res = right.getValue();
		if(left instanceof f_ns.TimeExpr){
			return dojo.date.compare(left_res,right_res,"time");
		}else if(left instanceof f_ns.DateExpr){
			return dojo.date.compare(left_res,right_res,"date");
		}else{
			return left_res == right_res ? 0 : (left_res < right_res ? -1 : 1);
		}
	}
	dojo.declare("dojox.grid.enhanced.plugins.filter.EqualTo", f_ns._BiOpExpr, {
		// summary:
		//		An "equal to" condition expression.
		_calculate: function(/* _ConditionExpr */left_operand,/* _ConditionExpr */right_operand,
							/* data item*/datarow,/* function(row,colIdx) */getter){
			// summary:
			//		Override from _BiOpExpr
			var res = compareFunc(left_operand,right_operand,datarow,getter);
			return new f_ns.BooleanExpr(res == 0);	//_ConditionExpr
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "equal";	//string
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.LessThan", f_ns._BiOpExpr, {
		// summary:
		//		A "less than" condition expression.		
		_calculate: function(/* _ConditionExpr */left_operand,/* _ConditionExpr */right_operand,
							/* data item*/datarow,/* function(row,colIdx) */getter){
			// summary:
			//		Override from _BiOpExpr
			var res = compareFunc(left_operand,right_operand,datarow,getter);
			return new f_ns.BooleanExpr(res < 0);	//_ConditionExpr
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "less";	//string
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.LessThanOrEqualTo", f_ns._BiOpExpr, {
		// summary:
		//		A "less than or equal to" condition expression.	
		_calculate: function(/* _ConditionExpr */left_operand,/* _ConditionExpr */right_operand,
							/* data item*/datarow,/* function(row,colIdx) */getter){
			// summary:
			//		Override from _BiOpExpr
			var res = compareFunc(left_operand,right_operand,datarow,getter);
			return new f_ns.BooleanExpr(res <= 0);	//_ConditionExpr
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "lessEqual";	//string
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.LargerThan", f_ns._BiOpExpr, {
		// summary:
		//		A "larger than" condition expression.	
		_calculate: function(/* _ConditionExpr */left_operand,/* _ConditionExpr */right_operand,
							/* data item*/datarow,/* function(row,colIdx) */getter){
			// summary:
			//		Override from _BiOpExpr
			var res = compareFunc(left_operand,right_operand,datarow,getter);
			return new f_ns.BooleanExpr(res > 0);	//_ConditionExpr
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "larger";	//string
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.LargerThanOrEqualTo", f_ns._BiOpExpr, {
		// summary:
		//		A "larger than or equal to" condition expression.	
		_calculate: function(/* _ConditionExpr */left_operand,/* _ConditionExpr */right_operand,
							/* data item*/datarow,/* function(row,colIdx) */getter){
			// summary:
			//		Override from _BiOpExpr
			var res = compareFunc(left_operand,right_operand,datarow,getter);
			return new f_ns.BooleanExpr(res >= 0);	//_ConditionExpr
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "largerEqual";	//string
		}
	});
	
	/* String Operations */
	dojo.declare("dojox.grid.enhanced.plugins.filter.Contains", f_ns._BiOpExpr, {
		// summary:
		//		A "contains" condition expression.
		_calculate: function(/* _ConditionExpr */left_operand,/* _ConditionExpr */right_operand,
							/* data item*/datarow,/* function(row,colIdx) */getter){
			// summary:
			//		Override from _BiOpExpr
			var left_res = String(left_operand.applyRow(datarow, getter).getValue());
			var right_res = String(right_operand.applyRow(datarow, getter).getValue());
			return new f_ns.BooleanExpr(left_res.indexOf(right_res) >= 0);	//_ConditionExpr
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "contains";	//string
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.ContainsIgnoreCase", f_ns._BiOpExpr, {
		// summary:
		//		A "contains" condition expression.
		_calculate: function(/* _ConditionExpr */left_operand,/* _ConditionExpr */right_operand,
							/* data item*/datarow,/* function(row,colIdx) */getter){
			// summary:
			//		Override from _BiOpExpr
			var left_res = String(left_operand.applyRow(datarow, getter).getValue()).toLowerCase();
			var right_res = String(right_operand.applyRow(datarow, getter).getValue()).toLowerCase();
			return new f_ns.BooleanExpr(left_res.indexOf(right_res) >= 0);	//_ConditionExpr
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "containsignorecase";	//string
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.StartsWith", f_ns._BiOpExpr, {
		// summary:
		//		A "starts with" condition expression.
		_calculate: function(/* _ConditionExpr */left_operand,/* _ConditionExpr */right_operand,
							/* data item*/datarow,/* function(row,colIdx) */getter){
			// summary:
			//		Override from _BiOpExpr
			var left_res = String(left_operand.applyRow(datarow, getter).getValue());
			var right_res = String(right_operand.applyRow(datarow, getter).getValue());
			return new f_ns.BooleanExpr(left_res.substring(0, right_res.length) == right_res);	//_ConditionExpr
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "startsWith";	//string
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.EndsWith", f_ns._BiOpExpr, {
		// summary:
		//		An "ends with" condition expression.
		_calculate: function(/* _ConditionExpr */left_operand,/* _ConditionExpr */right_operand,
							/* data item*/datarow,/* function(row,colIdx) */getter){
			// summary:
			//		Override from _BiOpExpr
			var left_res = String(left_operand.applyRow(datarow, getter).getValue());
			var right_res = String(right_operand.applyRow(datarow, getter).getValue());
			return new f_ns.BooleanExpr(left_res.substring(left_res.length - right_res.length) == right_res);	//_ConditionExpr
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "endsWith";	//string
		}
	});
	dojo.declare("dojox.grid.enhanced.plugins.filter.Matches", f_ns._BiOpExpr, {
		// summary:
		//		A "regular expression match" condition expression.
		//		The second operand's value will be regarded as an regular expression string.
		_calculate: function(/* _ConditionExpr */left_operand,/* _ConditionExpr */right_operand,
							/* data item*/datarow,/* function(row,colIdx) */getter){
			// summary:
			//		Override from _BiOpExpr
			var left_res = String(left_operand.applyRow(datarow, getter).getValue());
			var right_res = new RegExp(right_operand.applyRow(datarow, getter).getValue());
			return new f_ns.BooleanExpr(left_res.search(right_res) >= 0);	//_ConditionExpr
		},
		getName: function(){
			// summary:
			//		override from _ConditionExpr
			return "matches";	//string
		}
	});
})();
