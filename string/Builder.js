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
				/*  
					This is a loop unroll designed specifically for Firefox;
					it would seem that static index access on an Arguments
					object is a LOT faster than doing dynamic index access.
					Therefore, we create a buffer string and take advantage
					of JS's switch fallthrough.  The peformance of this method
					comes very close to straight up string concatenation (+=).

					If the arguments object length is greater than 9, we fall
					back to standard dynamic access.

					This optimization seems to have no real effect on either
					Safari or Opera, so we just use it for all.

					Loop unroll per suggestion from Kris Zyp, implemented by 
					Tom Trenka.
				 */
				var tmp="", l=arguments.length;
				switch(l){
					case 9: tmp=arguments[8]+tmp;
					case 8: tmp=arguments[7]+tmp;
					case 7: tmp=arguments[6]+tmp;
					case 6: tmp=arguments[5]+tmp;
					case 5: tmp=arguments[4]+tmp;
					case 4: tmp=arguments[3]+tmp;
					case 3: tmp=arguments[2]+tmp;
					case 2: {
						this.b+=arguments[0]+arguments[1]+tmp;
						break;
					}
					default: {
						var i=0;
						while(i<arguments.length){
							this.b += arguments[i++];
						}
					}
				}
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
					this.b.push.apply(this.b, arguments);
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
