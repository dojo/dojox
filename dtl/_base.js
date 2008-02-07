dojo.provide("dojox.dtl._base");

dojo.require("dojox.string.Builder");
dojo.require("dojox.string.tokenize");

(function(){
	var dd = dojox.dtl;

	dd._Context = dojo.extend(function(dict){
		// summary: Pass one of these when rendering a template to tell the template what values to use.
		dojo.mixin(this, dict || {});
		this._dicts = [];
	},
	{
		push: function(){
			var dict = {};
			var keys = this.getKeys();
			for(var i = 0, key; key = keys[i]; i++){
				dict[key] = this[key];
				delete this[key];
			}
			this._dicts.unshift(dict);
		},
		pop: function(){
			if(!this._dicts.length){
				throw new Error("pop() called on empty Context");
			}
			var dict = this._dicts.shift();
			dojo.mixin(this, dict);
		},
		getKeys: function(){
			var keys = [];
			for(var key in this){
				if(this.hasOwnProperty(key) && key != "_dicts" && key != "_this"){
					keys.push(key);
				}
			}
			return keys;
		},
		get: function(key, otherwise){
			if(typeof this[key] != "undefined"){
				return this._normalize(this[key]);
			}

			for(var i = 0, dict; dict = this._dicts[i]; i++){
				if(typeof dict[key] != "undefined"){
					return this._normalize(dict[key]);
				}
			}

			return otherwise;
		},
		_normalize: function(value){
			if(value instanceof Date){
				value.year = value.getFullYear();
				value.month = value.getMonth() + 1;
				value.day = value.getDate();
				value.date = value.year + "-" + ("0" + value.month).slice(-2) + "-" + ("0" + value.day).slice(-2);
				value.hour = value.getHours();
				value.minute = value.getMinutes();
				value.second = value.getSeconds();
				value.microsecond = value.getMilliseconds();
			}
			return value;
		},
		update: function(dict){
			this.push();
			if(dict){
				dojo.mixin(this, dict);
			}
		}
	});

	var ddt = dd.text = {
		types: {tag: -1, varr: -2, text: 3},
		pySplit: function(str){
			// summary: Split a string according to Python's split function
			str = dojo.trim(str);
			if(!str.length){
				return [];
			}
			return str.split(/\s+/g);
		},
		_get: function(module, name, errorless){
			// summary: Used to find both tags and filters
			var params = dd.register.get(module, name, errorless);
			if(!params) return null;

			var fn = params[1];
			var require = params[2];

			var parts;
			if(fn.indexOf(":") != -1){
				parts = fn.split(":");
				fn = parts.pop();
			}

			dojo["require"](require);

			var parent = dojo.getObject(require);

			return parent[fn || name] || parent[name + "_"];
		},
		getTag: function(name, errorless){
			return ddt._get("tag", name, errorless);
		},
		getFilter: function(name, errorless){
			return ddt._get("filter", name, errorless);
		},
		getTemplate: function(file){
			return new dd.Template(dd.getTemplateString(file));
		},
		getTemplateString: function(file){
			return dojo._getText(file.toString()) || "";
		},
		_re: /(?:\{\{\s*(.+?)\s*\}\}|\{%\s*(.+?)\s*%\})/g,
		tokenize: function(str){
			return dojox.string.tokenize(str, ddt._re, ddt._parseDelims);
		},
		_parseDelims: function(varr, tag){
			var types = ddt.types;
			if(varr){
				return [types.varr, varr];
			}else{
				return [types.tag, tag];
			}
		}
	}

	dd.Template = dojo.extend(function(str){
		var tokens = ddt.tokenize(str);
		var parser = new dd._Parser(tokens);
		this.nodelist = parser.parse();
	},
	{
		render: function(context, /*concatenatable?*/ buffer){
			buffer = buffer || this.getBuffer();
			context = context || new dd._Context({});
			return this.nodelist.render(context, buffer) + "";
		},
		getBuffer: function(){
			dojo.require("dojox.string.Builder");
			return new dojox.string.Builder();
		}
	});

	dd._Filter = dojo.extend(function(token){
		// summary: Uses a string to find (and manipulate) a variable
		if(!token) throw new Error("Filter must be called with variable name");
		this.contents = token;
		var key = null;
		var re = this._re;
		var matches, filter, arg, fn;
		var filters = [];
		while(matches = re.exec(token)){
			if(key === null){
				if(this._exists(matches, 3)){
					// variable
					key = matches[3];
				}else if(this._exists(matches, 1)){
					// _("text")
					key = '"' + matches[1] + '"';
				}else if(this._exists(matches, 2)){
					// "text"
					key = '"' + matches[2] + '"';
				}else if(this._exists(matches, 9)){
					// 'text'
					key = '"' + matches[9] + '"';
				}
			}else{
				if(this._exists(matches, 7)){
					// :variable
					arg = [true, matches[7]];
				}else if(this._exists(matches, 5)){
					// :_("text")
					arg = [false, matches[5].replace(/\\"/g, '"')];
				}else if(this._exists(matches, 6)){
					// :"text"
					arg = [false, matches[6].replace(/\\"/g, '"')];
				}else if(this._exists(matches, 8)){
					// :"text"
					arg = [false, matches[8].replace(/\\'/g, "'")];
				}
				// Get a named filter
				fn = ddt.getFilter(matches[4]);
				if(typeof fn != "function") throw new Error(matches[4] + " is not registered as a filter");
				filters.push([fn, arg]);
			}
		}

		this.key = key;
		this.filters = filters;
	},
	{
		_re: /(?:^_\("([^\\"]*(?:\\.[^\\"])*)"\)|^"([^\\"]*(?:\\.[^\\"]*)*)"|^([a-zA-Z0-9_.]+)|\|(\w+)(?::(?:_\("([^\\"]*(?:\\.[^\\"])*)"\)|"([^\\"]*(?:\\.[^\\"]*)*)"|([a-zA-Z0-9_.]+)|'([^\\']*(?:\\.[^\\']*)*)'))?|^'([^\\']*(?:\\.[^\\']*)*)')/g,
		_exists: function(arr, index){
			if(typeof arr[index] != "undefined" && arr[index] !== ""){
				return true;
			}
			return false;
		},
		resolve: function(context){
			var str = this.resolvePath(this.key, context);
			for(var i = 0, filter; filter = this.filters[i]; i++){
				// Each filter has the function in [0], a boolean in [1][0] of whether it's a variable or a string
				// and [1][1] is either the variable name of the string content.
				if(filter[1]){
					if(filter[1][0]){
						str = filter[0](str, this.resolvePath(filter[1][1], context));
					}else{
						str = filter[0](str, filter[1][1]);
					}
				}else{
					str = filter[0](str);
				}
			}
			return str;
		},
		resolvePath: function(path, context){
			var current, parts;
			var first = path.charAt(0);
			var last = path.charAt(path.length - 1);
			if(!isNaN(parseInt(first))){
				current = (path.indexOf(".") == -1) ? parseInt(path) : parseFloat(path);
			}else if(first == '"' && first == last){
				current = path.substring(1, path.length - 1);
			}else{
				if(path == "true") return true;
				if(path == "false") return false;
				if(path == "null" || path == "None") return null;
				parts = path.split(".");
				current = context.get(parts.shift());
				while(parts.length){
					if(current && typeof current[parts[0]] != "undefined"){
						current = current[parts[0]];
						if(typeof current == "function"){
							if(current.alters_data){
								current = "";
							}else{
								current = current();
							}
						}
					}else{
						return "";
					}
					parts.shift();
				}
			}
			return current;
		}
	});

	dd._Node = dojo.extend(function(/*Object*/ obj){
		// summary: Basic catch-all node
		this.contents = obj;
	},
	{
		set: function(data){
			this.contents = data;
		},
		render: function(context, buffer){
			// summary: Adds content onto the buffer
			return buffer.concat(this.contents);
		}
	});

	dd._NodeList = dojo.extend(function(/*Node[]*/ nodes){
		// summary: Allows us to render a group of nodes
		this.contents = nodes || [];
		this.last = "";
	},
	{
		push: function(node){
			// summary: Add a new node to the list
			this.contents.push(node);
		},
		render: function(context, buffer){
			// summary: Adds all content onto the buffer
			for(var i = 0; i < this.contents.length; i++){
				buffer = this.contents[i].render(context, buffer);
				if(!buffer) throw new Error("Template node render functions must return their buffer");
			}
			return buffer;
		},
		dummyRender: function(context, buffer){
			return this.render(context, dd.Template.prototype.getBuffer()).toString();
		},
		unrender: function(context, buffer){ return buffer; },
		clone: function(){ return this; }
	});

	dd._TextNode = dd._Node;

	dd._VarNode = dojo.extend(function(str){
		// summary: A node to be processed as a variable
		this.contents = new dd._Filter(str);
	},
	{
		render: function(context, buffer){
			var str = this.contents.resolve(context);
			return buffer.concat(str);
		}
	});

	dd._Parser = dojo.extend(function(tokens){
		// summary: Parser used during initialization and for tag groups.
		this.contents = tokens;
	},
	{
		parse: function(/*Array?*/ stop_at){
			// summary: Turns tokens into nodes
			// description: Steps into tags are they're found. Blocks use the parse object
			//		to find their closing tag (the stop_at array). stop_at is inclusive, it
			//		returns the node that matched.
			var types = ddt.types;
			var terminators = {};
			var tokens = this.contents;
			stop_at = stop_at || [];
			for(var i = 0; i < stop_at.length; i++){
				terminators[stop_at[i]] = true;
			}

			var nodelist = new dd._NodeList();
			while(tokens.length){
				token = tokens.shift();
				if(typeof token == "string"){
					nodelist.push(new dd._TextNode(token));
				}else{
					var type = token[0];
					var text = token[1];
					if(type == types.varr){
						nodelist.push(new dd._VarNode(text));
					}else if(type == types.tag){
						if(terminators[text]){
							tokens.unshift(token);
							return nodelist;
						}
						var cmd = text.split(/\s+/g);
						if(cmd.length){
							cmd = cmd[0];
							var fn = ddt.getTag(cmd);
							if(fn){
								nodelist.push(fn(this, text));
							}
						}
					}
				}
			}

			if(stop_at.length){
				throw new Error("Could not find closing tag(s): " + stop_at.toString());
			}

			return nodelist;
		},
		next: function(){
			// summary: Returns the next token in the list.
			var token = this.contents.shift();
			return {type: token[0], text: token[1]};
		},
		skipPast: function(endtag){
			var types = ddt.types;
			while(this.contents.length){
				var token = this.contents.shift();
				if(token[0] == types.tag && token[1] == endtag){
					return;
				}
			}
			throw new Error("Unclosed tag found when looking for " + endtag);
		},
		getVarNodeConstructor: function(){
			return dd._VarNode;
		},
		getTextNodeConstructor: function(){
			return dd._TextNode;
		},
		getTemplate: function(file){
			return new dd.Template(file);
		}
	});

	dd.register = {
		_registry: {
			tags: [],
			filters: []
		},
		get: function(/*String*/ module, /*String*/ name){
			var registry = dd.register._registry[module + "s"];
			for(var i = 0, entry; entry = registry[i]; i++){
				if(dojo.isString(entry[0])){
					if(entry[0] == name){
						return entry;
					}
				}else if(name.match(entry[0])){
					return entry;
				}
			}
		},
		_any: function(type, base, locations){
			for(var path in locations){
				for(var i = 0, fn; fn = locations[path][i]; i++){
					var key = fn;
					if(dojo.isArray(fn)){
						key = fn[0];
						fn = fn[1];
					}
					dd.register._registry[type].push([
						key,
						fn,
						base + "." + path
					]);
				}
			}
		},
		tags: function(/*String*/ base, /*Object*/ locations){
			dd.register._any("tags", base, locations);
		},
		filters: function(/*String*/ base, /*Object*/ locations){
			dd.register._any("filters", base, locations);
		}
	}

	dd.register.tags("dojox.dtl.tag", {
		"date": ["now"],
		"logic": ["if", "for", "ifequal", "ifnotequal"],
		"loader": ["extends", "block"],
		"misc": ["comment", "debug", "filter", "firstof"],
		"loop": ["cycle", "ifchanged"]
	});
	dd.register.filters("dojox.dtl.filter", {
		"dates": ["date", "time", "timesince", "timeuntil"],
		"htmlstrings": ["escape", "linebreaks", "linebreaksbr", "removetags", "striptags"],
		"integers": ["add", "get_digit"],
		"lists": ["dictsort", "dictsortreversed", "first", "join", "length", "length_is", "random", "slice", "unordered_list"],
		"logic": ["default", "default_if_none", "divisibleby", "yesno"],
		"misc": ["filesizeformat", "pluralize", "phone2numeric", "pprint"],
		"strings": ["addslashes", "capfirst", "center", "cut", "fix_ampersands", "floatformat", "iriencode", "linenumbers", "ljust", "lower", "make_list", "rjust", "slugify", "stringformat", "title", "truncatewords", "truncatewords_html", "upper", "urlencode", "urlize", "urlizetrunc", "wordcount", "wordwrap"]
	});
})();