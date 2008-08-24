dojo.provide("dojox.lang.mix");

(function(){
	var empty = {}, elist = [], mix = dojox.lang.mix;
	
	dojo.mixin(mix, {
		copyProps: function(object, props, rename, skip){
			// summary: adds properties to an object renaming and skipping them as needed,
			//			only own properties are processed.
			// description: properties are filtered by "skip" parameter, then renamed,
			//			then added.
			// object: Object: the object to be updated
			// props: Object: the source object, whose properties to be added
			// rename: Object?: the dictionary for renaming
			// skip: Array?|Object?: the source of properties to be skipped
			
			if(object && props){
				// massage input parameters
				var skipList = elist, i, j, l, p;
				if(!rename){
					rename = empty;
				}
				if(skip){
					if(dojo.isArray(skip)){
						p = {};
						for(j = 0, l = skip.length; j < l; ++j){
							p[skip[j]] = 1;
						}
						skip = p;
					}
				}else{
					skip = empty;
				}
				
				// add properties skipping and renaming them, if necessary
				for(i in props){
					if(props.hasOwnProperty(i) && !skip.hasOwnProperty(i)){
						object[rename.hasOwnProperty(i) ? rename[i] : i] = props[i];
					}
				}
				
				// IE doesn't recognize custom toStrings in for..in
				// this code is taken almost verbatim from dojo._mixin()
				if(dojo.isIE && !skip.hasOwnProperty("toString")){
					p = props.toString;
					if(p){
						if(typeof p == "function" && p !== object.toString && p !== empty.toString &&
							p != "\nfunction toString() {\n    [native code]\n}\n"){
								object[rename.hasOwnProperty("toString") ? rename.toString : "toString"] = p;
						}
					}
				}
			}
			
			return object;	// Object
		},
		
		cloneProps: function(props, rename, skip){
			// summary: creates new object by copying, renaming, and skipping properties as needed,
			//			only own properties are processed.
			// description: properties are filtered by "skip" parameter, then renamed,
			//			then added.
			// object: Object: the object to be processed
			// rename: Object?: the dictionary for renaming
			// skip: Array?|Object?: the source of properties to be skipped
			
			return mix.copyProps({}, props, rename, skip);	// Object
		},
		
		processProps: function(props, rename, remove){
			// summary: process properties in place by renaming and removing them as needed,
			//			only own properties are processed.
			// description: properties are filtered by "skip" parameter, then renamed.
			// props: Object: the object to be processed
			// rename: Object?: the dictionary for renaming
			// remove: Array?|Object?: the source of properties to be skipped
			
			if(props){
				var t, i, j, l;
				// delete properties
				if(remove){
					if(dojo.isArray(remove)){
						for(j = 0, l = remove.length; j < l; ++j){
							delete props[remove[j]];
						}
					}else{
						for(var i in remove){
							if(remove.hasOwnProperty(i)){
								delete props[i];
							}
						}
					}
				}

				// rename properties
				if(rename){
					for(i in rename){
						if(rename.hasOwnProperty(i) && props.hasOwnProperty(i)){
							t = props[i];
							delete props[i];
							props[rename[i]] = t;
						}
					}
				}
			}
			return props;	// Object
		}
	});
})();
