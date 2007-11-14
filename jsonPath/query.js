dojo.provide("dojox.jsonPath.query");

dojox.jsonPath._regularExpressions = {
	"regA": /[\['](\??\(.*?\))[\]']/g,
	"regB": /'?\.'?|\['?/g,
	"regC": /;;;|;;/g,
	"regD": /;$|'?\]|'$/g,
	"regE": /#([0-9]+)/g,
	"regF": /^[0-9*]+$/,
	"regG": /,/,
	"regH": /'?,'?/,
	"regI": /^\(.*?\)$/,
	"regJ": /^\?\(.*?\)$/,
	"regK": /^\?\((.*?)\)$/,
	"regL": /^(-?[0-9]*):(-?[0-9]*):?([0-9]*)$/,
	"regM": /^(-?[0-9]*):(-?[0-9]*):?(-?[0-9]*)$/g,
	"regN": /@/g,
	"regO": /\^/g,
	"regP": /^\$;/
};

dojox.jsonPath.query = function(/*Object*/obj, /*String*/expr, /*Object*/arg) {
	// summay
	// 	Perform jsonPath query `expr` on javascript object or json string `obj`
	//	obj - object || json string to perform query on
	//	expr - jsonPath expression (string) to be evaluated
	//	arg - {}special arugments.  
	//		resultType: "VALUE"||"PATH"} (defaults to value)

	var re = dojox.jsonPath._regularExpressions;
	if (!arg){arg={};};

	var P = {
		resultType: arg.resultType || "VALUE",
		result: [],

		normalize: function(expr) {
			var subx = [];

			return expr.replace(re.regA, function($0,$1){return "[#"+(subx.push($1)-1)+"]";})
				.replace(re.regB, ";")
				.replace(re.regC, ";..;")
				.replace(re.regD, "")
				.replace(re.regE, function($0,$1){return subx[$1];});
		},

		asPath: function(path) {
			var x = path.split(";"), p = "$";
			for (var i=1,n=x.length; i<n; i++){
				p += re.regF.test(x[i]) ? ("["+x[i]+"]") : ("['"+x[i]+"']");
			}
			return p;
		},

		store: function(p, v) {
			if (p){
				switch(P.resultType){
					case "PATH":
						P.result.push(P.asPath(p));
						break;
					case "BOTH":
						P.result.push({path: P.asPath(p), value: v});
						break;
					case "VALUE":
					default:
						P.result.push(v);	
						break;
				}
			}
			return !!p;
		},

		trace: function(expr, val, path) {
			if (expr) {
				var x = expr.split(";"), loc = x.shift();
				x = x.join(";");
				if (val && val.hasOwnProperty(loc)){
					P.trace(x, val[loc], path + ";" + loc);
				}else if (loc === "*"){
					P.walk(loc, x, val, path, function(m,l,x,v,p) { P.trace(m+";"+x,v,p); });
				}else if (loc === ".."){
					P.trace(x, val, path);
					P.walk(loc, x, val, path, function(m,l,x,v,p) { typeof v[m] === "object" && P.trace("..;"+x,v[m],p+";"+m); });
				}else if (re.regG.test(loc)) { // [name1,name2,...]
					for (var s=loc.split(re.regH),i=0,n=s.length; i<n; i++){
						P.trace(s[i]+";"+x, val, path);
					}
				}else if (re.regI.test(loc)){ // [(expr)]
					P.trace(P.eval(loc, val, path.substr(path.lastIndexOf(";")+1))+";"+x, val, path);
				}else if (re.regJ.test(loc)){ // [?(expr)]
					P.walk(loc, x, val, path, function(m,l,x,v,p) { if (P.eval(l.replace(re.regK,"$1"),v[m],m)) P.trace(m+";"+x,v,p); });
				}else if (re.regL.test(loc)){ // [start:end:step]  phyton slice syntax
					P.slice(loc, x, val, path);
				}
			}else{
       			     	P.store(path, val);
			}
		},

		walk: function(loc, expr, val, path, f) {
			if (val instanceof Array) {
				for (var i=0,n=val.length; i<n; i++)
					if (i in val)
						f(i,loc,expr,val,path);
			}else if (typeof val === "object"){
				for (var m in val)
					if (val.hasOwnProperty(m))
						f(m,loc,expr,val,path);
			}
		},

		slice: function(loc, expr, val, path) {
			if (val instanceof Array) {
				var len=val.length, start=0, end=len, step=1;
				loc.replace(re.regM, function($0,$1,$2,$3){start=parseInt($1||start);end=parseInt($2||end);step=parseInt($3||step);});
				start = (start < 0) ? Math.max(0,start+len) : Math.min(len,start);
				end   = (end < 0)   ? Math.max(0,end+len)   : Math.min(len,end);
				for (var i=start; i<end; i+=step)
					P.trace(i+";"+expr, val, path);
			}
		},

		eval: function(x, _v, _vname) {
			try { 
				return obj && _v && eval(x.replace(re.regN, "_v")); 
			}catch(e){ 
				throw new SyntaxError("dojox.jsonPath: " + e.message + ": " + x.replace(re.regN, "_v").replace(re.regO, "_a")); 
			}
		}
	};

	if (expr && obj && (P.resultType == "VALUE" || P.resultType == "PATH" || P.resultType=="BOTH")) {
		P.trace(P.normalize(expr).replace(re.regP,""), obj, "$");
		return P.result.length ? P.result : false;
	}
}; 
