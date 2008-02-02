dojo.provide("dojox.dtl.tag.logic");

dojo.require("dojox.dtl._base");

dojox.dtl.tag.logic.IfNode = function(bools, trues, falses, type){
	this.bools = bools;
	this.trues = trues;
	this.falses = falses;
	this.type = type;
}
dojo.extend(dojox.dtl.tag.logic.IfNode, {
	render: function(context, buffer){
		var i, bool, ifnot, filter, value;
		if(this.type == "or"){
			for(i = 0; bool = this.bools[i]; i++){
				ifnot = bool[0];
				filter = bool[1];
				value = filter.resolve(context);
				if((value && !ifnot) || (ifnot && !value)){
					if(this.falses){
						buffer = this.falses.unrender(context, buffer);
					}
					return (this.trues) ? this.trues.render(context, buffer, this) : buffer;
				}
			}
			if(this.trues){
				buffer = this.trues.unrender(context, buffer);
			}
			return (this.falses) ? this.falses.render(context, buffer, this) : buffer;
		}else{
			for(i = 0; bool = this.bools[i]; i++){
				ifnot = bool[0];
				filter = bool[1];
				value = filter.resolve(context);
				// If we ever encounter a false value
				if(value == ifnot){
					if(this.trues){
						buffer = this.trues.unrender(context, buffer);
					}
					return (this.falses) ? this.falses.render(context, buffer, this) : buffer;
				}
			}
			if(this.falses){
				buffer = this.falses.unrender(context, buffer);
			}
			return (this.trues) ? this.trues.render(context, buffer, this) : buffer;
		}
		return buffer;
	},
	unrender: function(context, buffer){
		if(this.trues) buffer = this.trues.unrender(context, buffer);
		if(this.falses) buffer = this.falses.unrender(context, buffer);
		return buffer;
	},
	clone: function(buffer){
		var trues = this.trues;
		var falses = this.falses;
		if(trues){
			trues = trues.clone(buffer);
		}
		if(falses){
			falses = falses.clone(buffer);
		}
		return new this.constructor(this.bools, trues, falses, this.type);
	},
	toString: function(){ return "dojox.dtl.tag.logic.IfNode"; }
});

dojox.dtl.tag.logic.ForNode = function(assign, loop, reversed, nodelist){
	this.assign = assign;
	this.loop = loop;
	this.reversed = reversed;
	this.nodelist = nodelist;
	this.pool = [];
}
dojo.extend(dojox.dtl.tag.logic.ForNode, {
	render: function(context, buffer){
		var i, parentloop = {};
		if(context.forloop){
			parentloop = context.forloop;
		}
		context.push();

		var items = dojox.dtl.resolveVariable(this.loop, context);
		for(i = items.length; i < this.pool.length; i++){
			this.pool[i].unrender(context, buffer);
		}
		if(this.reversed){
			items = items.reverse();
		}

		var isObject = dojo.isObject(items) && !dojo.isArrayLike(items);
		var arred = [];
		if(isObject){
			for(var key in items){
				arred.push([key, items[key]]);
			}
		}else{
			arred = items;
		}

		var j = 0;
		for(i = 0; i < arred.length; i++){
			var item = arred[i];
			context.forloop = {
				counter0: j,
				counter: j + 1,
				revcounter0: arred.length - j - 1,
				revcounter: arred.length - j,
				first: j == 0,
				last: j == arred.length - 1,
				parentloop: parentloop
			};

			if(this.assign.length > 1 && dojo.isArrayLike(item)){
				var zipped = {};
				for(var k = 0; k < item.length && k < this.assign.length; k++){
					zipped[this.assign[k]] = item[k];
				}
				context.update(zipped);
			}else{
				context[this.assign[0]] = (isObject) ? item[1] : item;
			}

			if(j + 1 > this.pool.length){
				this.pool.push(this.nodelist.clone(buffer));
			}
			buffer = this.pool[j].render(context, buffer, this);
			++j;
		}
		context.pop();
		return buffer;
	},
	unrender: function(context, buffer){
		for(var i = 0, pool; pool = this.pool[i]; i++){
			buffer = pool.unrender(context, buffer);
		}
		return buffer;
	},
	clone: function(buffer){
		return new this.constructor(this.assign, this.loop, this.reversed, this.nodelist.clone(buffer));
	},
	toString: function(){ return "dojox.dtl.tag.logic.ForNode"; }
});

dojox.dtl.tag.logic.if_ = function(parser, text){
	var i, part, type, falses, bools = [], parts = dojox.dtl.text.pySplit(text);
	parts.shift();
	text = parts.join(" ");
	parts = text.split(" and ");
	if(parts.length == 1){
		type = "or";
		parts = text.split(" or ");
	}else{
		type = "and";
		for(i = 0; i < parts.length; i++){
			if(parts[i].indexOf(" or ") != -1){
				// Note, since we split by and, this is the only place we need to error check
				throw new Error("'if' tags can't mix 'and' and 'or'");
			}
		}
	}
	for(i = 0; part = parts[i]; i++){
		var not = false;
		if(part.indexOf("not ") == 0){
			part = part.slice(4);
			not = true;
		}
		bools.push([not, new dojox.dtl.Filter(part)]);
	}
	var trues = parser.parse(["else", "endif"]);
	falses = false;
	var token = parser.next();
	if(token.text == "else"){
		falses = parser.parse(["endif"]);
		parser.next();
	}
	return new dojox.dtl.tag.logic.IfNode(bools, trues, falses, type);
}

dojox.dtl.tag.logic.for_ = function(parser, text){
	var parts = dojox.dtl.text.pySplit(text);
	if(parts.length < 4){
		throw new Error("'for' statements should have at least four words: " + text);
	}
	var reversed = parts[parts.length - 1] == "reversed";
	var index = (reversed) ? -3 : -2;
	if(parts[parts.length + index] != "in"){
		throw new Error("'for' tag received an invalid argument: " + text);
	}
	var loopvars = parts.slice(1, index).join(" ").split(/ *, */);
	for(var i = 0; i < loopvars.length; i++){
		if(!loopvars[i] || loopvars[i].indexOf(" ") != -1){
			throw new Error("'for' tag received an invalid argument: " + text);
		}
	}
	var nodelist = parser.parse(["endfor"]);
	parser.next();
	return new dojox.dtl.tag.logic.ForNode(loopvars, parts[parts.length + index + 1], reversed, nodelist);
}