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
	 	append: function(/*String*/s){ 
			// summary: Append all arguments to the end of the buffer 
			if(arguments.length>1){
				//	Some Duff's device love here.
				var n = Math.floor(arguments.length/8), r = arguments.length%8, i=0;
				do {
					switch(r){
						case 0: this.b += arguments[i++];
						case 7: this.b += arguments[i++];
						case 6: this.b += arguments[i++];
						case 5: this.b += arguments[i++];
						case 4: this.b += arguments[i++];
						case 3: this.b += arguments[i++];
						case 2: this.b += arguments[i++];
						case 1: this.b += arguments[i++];
					}
					r = 0;
				} while(--n>0);
			} else {
				this.b += s;
			}
			return this;	//	dojox.string.Builder
		},
		concat: function(/*String*/s){
			return this.append(s);
		},
		appendArray: function(/*Array*/strings) {
			this.b = String.prototype.concat.apply(this.b, strings);
			return this;
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
		},
		toString: function(){
			return this.b;
		},
		_clear: function(){
			this.b = "";
		},
		_reset: function(s){
			this.b = s;
		}
	}; // will hold methods for Builder
	
	if(dojo.isIE){
		dojo.mixin(m, {
			toString: function(){ 
				// Summary: Get the buffer as a string
				return this.b.join(""); 
			},
			append: function(/*String*/s){ 
				// summary: Append all arguments to the end of the buffer 
				if(arguments.length>1){
					//	Some Duff's device love here.
					var n = Math.floor(arguments.length/8), r = arguments.length%8, i=0;
					do {
						switch(r){
							case 0: this.b[this.b.length]=arguments[i++];
							case 7: this.b[this.b.length]=arguments[i++];
							case 6: this.b[this.b.length]=arguments[i++];
							case 5: this.b[this.b.length]=arguments[i++];
							case 4: this.b[this.b.length]=arguments[i++];
							case 3: this.b[this.b.length]=arguments[i++];
							case 2: this.b[this.b.length]=arguments[i++];
							case 1: this.b[this.b.length]=arguments[i++];
						}
						r = 0;
					} while(--n>0);
				} else {
					//	this seems to shave off a little time over .push().
					this.b[this.b.length]=s;
				}
				return this;	//	dojox.string.Builder
			},
			appendArray: function(strings){
				this.b = this.b.concat(strings);
				return this;
			},
			_clear: function(){
				this.b = [];
			},
			_reset: function(s){
				this.b = [ s ];
			}
		});
	}
	
	dojo.extend(dojox.string.Builder, m);
})();
