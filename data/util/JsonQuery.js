dojo.provide("dojox.data.util.JsonQuery");
// this is a mixin to convert object attribute queries to 
// JSONQuery/JSONPath syntax to be sent to the server.
dojo.declare("dojox.data.util.JsonQuery", null, {
	_toJsonQuery: function(args){

		// performs conversion of Dojo Data query objects and sort arrays to JSONQuery strings
		if(args.query && typeof args.query == "object"){
			// convert Dojo Data query objects to JSONQuery
			var jsonQuery = "[?(", first = true;
			for(var i in args.query){
				if(args.query[i]!="*"){ // full wildcards can be ommitted
					jsonQuery += (first ? "" : "&") + "@[" + dojo._escapeString(i) + "]=" + dojox.json.ref.toJson(args.query[i]);
					first = false;
				}
			}
			if(!first){
				// use ' instead of " for quoting in JSONQuery, and end with ]
				jsonQuery += ")]"; 
			}else{
				jsonQuery = "";
			}
			args.queryStr = jsonQuery.replace(/\\"|"/g,function(t){return t == '"' ? "'" : t;});
		}else if(!args.query || args.query == '*'){
			args.query = "";
		}
		
		var sort = args.sort;
		if(sort){
			// if we have a sort order, add that to the JSONQuery expression
			args.queryStr = args.queryStr || (typeof args.query == 'string' ? args.query : ""); 
			first = true;
			for(i = 0; i < sort.length; i++){
				args.queryStr += (first ? '[' : ',') + (sort[i].descending ? '\\' : '/') + "@[" + dojo._escapeString(sort[i].attribute) + "]";
				first = false; 
			}
			if(!first){
				args.queryStr += ']';
			}
		}
		if(typeof args.queryStr == 'string'){
			args.queryStr = args.queryStr.replace(/\\"|"/g,function(t){return t == '"' ? "'" : t;});
			return args.queryStr;
		}
		return args.query;
	},
	fetch: function(args){
		this._toJsonQuery(args);
		return this.inherited(arguments);
	},
	isUpdateable: function(){
		return true;
	},
	matchesQuery: function(item,request){
		request._jsonQuery = request._jsonQuery || dojox.json.query(this._toJsonQuery(request)); 
		return request._jsonQuery([item]).length;
	},
	clientSideFetch: function(/*Object*/ request,/*Array*/ baseResults){
		request._jsonQuery = request._jsonQuery || dojox.json.query(this._toJsonQuery(request));
		return request._jsonQuery(baseResults);
	},
	querySuperSet: function(argsSuper,argsSub){
		if(!argsSuper.query){
			return argsSub.query;
		}
		return this.inherited(arguments);
	}
	
});
