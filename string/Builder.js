dojo.provide("dojox.string.Builder");

(function(){
	dojox.string.Builder = function(/*String?*/str){
		// summary:
		//		A fast buffer for creating large strings
		// str: The initial string to seed the buffer with
		this.b = dojo.isIE ? [] : "";
		if(str){ this.append(str); }
	};
	
	var m = {
	 	append: function(){ 
			// summary: Append all arguments to the end of the buffer
			dojo.forEach(arguments, function(s){
				if(dojo.isArrayLike(s)){ 
					this.append.apply(this, s); 
				}else{
					if(!dojo.isString(s)){ s = String(s); } 
					this._append(s);
					this.length += s.length;
				}
			}, this);
			return this; // dojox.string.Builder
		},
		concat: function(){
			return this.append.apply(this, arguments);
		},
		clear: function(){
			// summary: Remove all characters from the buffer
			this._clear();
			this.length = 0;
			return this;
		},
		replace: function(oldStr,newStr){
			// summary: Replace instances of one string with another in the buffer
			var s = this.toString();
			s = s.replace(oldStr,newStr);
			this._reset(s);
			this.length = s.length;
			return this;
		},
		remove: function(start, len){
			// summary: Remove len characters starting at index start
			if(len == 0){ return this; }
			var s = this.toString();
			this.clear();
			if(start > 0){
				this.append(s.substring(0, start));
			}
			if(start+len < s.length){
				this.append(s.substring(start+len));
			}
			return this;
		},
		insert: function(index, str){
			// summary: Insert string str starting at index
			var s = this.toString();
			this.clear();
			if(index == 0){
				this.append(str);
				this.append(s);
				return this;
			}else{
				this.append(s.substring(0, index));
				this.append(str);
				this.append(s.substring(index));
			}
			return this;
		}
		
	}; // will hold methods for Builder
	
	
	if(dojo.isIE){
		dojo.mixin(m, {
			toString: function(){ 
				// Summary: Get the buffer as a string
				return this.b.join(""); 
			},
			_append: function(s){
				this.b.push(s);
			},
			_clear: function(){
				this.b = [];
			},
			_reset: function(s){
				this.b = [ s ];
			}
		});
	}else{
		dojo.mixin(m, {
			toString: function(){ 
				// Summary: Get the buffer as a string
				return this.b; 
			},
			_append: function(s){
				this.b += s;
			},
			_clear: function(){
				this.b = "";
			},
			_reset: function(s){
				this.b = s;
			}
		});
	}
	
	dojo.extend(dojox.string.Builder, m);
})();
