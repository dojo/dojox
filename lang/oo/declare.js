dojo.provide("dojox.lang.oo.declare");

dojo.experimental("dojox.lang.oo.declare");

// a drop-in replacement for dojo.declare() with fixed bugs and enhancements

(function(){
	var d = dojo, oo = dojox.lang.oo, op = Object.prototype,
		isF = d.isFunction, each = d.forEach, xtor = function(){}, counter = 0;

	function error(cond, msg){ if(cond){ throw new Error("declare: " + msg); } }

	// C3 Method Resolution Order (see http://www.python.org/download/releases/2.3/mro/)
	function c3mro(bases){
		var result = [null], classes = new Array(bases.length),
			i, j, l = bases.length, m, m2, c, cls, lin, clsNum = 0;

		// initialize
		each(bases, function(c, i){
			error(!c, "mixin #" + i + " is null");
			lin = c._meta && c._meta.bases || [c];
			clsNum += lin.length;
			m = {};
			each(lin, function(c){
				var proto = c.prototype, name = proto.hasOwnProperty("declaredClass") && proto.declaredClass;
				if(!name) name = proto.declaredClass = "dojoUniqClassName_" + (counter++);
				m[name] = c;
			});
			classes[i] = {
				idx: 0,
				map: m,
				lin: d.map(lin, function(c){ return c.prototype.declaredClass; })
			};
		});

		// C3 MRO algorithm
		while(clsNum){
			for(i = l; i--;){
				m = classes[i];
				c = m.lin[m.idx];
				if(c){
					// check if it is in the tail of any classes
					for(j = l; j--;){
						m2 = classes[j];
						if(i != j && (c in m2.map) && c != m2.lin[m2.idx]) break;
					}
					if(j < 0){
						result.push(m.map[c]);
						// remove c from all heads
						for(j = l; j--;){
							m = classes[j];
							if(c == m.lin[m.idx]){
								++m.idx;
								--clsNum
							}
						}
						break;
					}
				}
			}
			error(i < 0, "can't build consistent linearization");
		}

		return result;
	}

	function isInstanceOf(cls){
		var bases = (isF(this) ? this : this.constructor)._meta.bases, i = 0, l = bases.length;
		for(; i < l; ++i){
			if(bases[i] === cls) return true;
		}
		return this instanceof cls;
	}

	oo.makeDeclare = function(ctorSpecial, chains){
		chains = chains || {};

		function buildMethodList(bases, name, inherited){
			var methods = [], i = 0, l = bases.length, h, b;
			for(;i < l; ++i){
				b = bases[i];
				// the assignment on the next line is intentional
				if(h = b._meta) (h = h.hidden).hasOwnProperty(name) && methods.push(h[name]);
				else{
					if(name == "constructor") methods.push(b);
					// the assignment on the next line is intentional
					else if((h = b.prototype[name]) && h !== op.name){
						methods.push(h);
						if(inherited) break;
					}
				}
			}
			name !== "constructor" && (h = op[name]) && methods.push(h);
			return chains[name] === "after" ? methods.reverse() : methods;
		}

		function inherited(args, a, b){
			var c = this.constructor, m = c._meta, cache = c._cache,
				caller, i, l, f, n, ch, s, x, name;

			// crack arguments
			if(typeof args == "string"){
				name = args;
				args = a;
				a = b;
			}

			caller = inherited.caller;
			n = caller.nom;
			error(n && name && n !== name, "calling inherited() with a different name: " + name);
			name = name || n;
			ch = cache.hasOwnProperty(name) && cache[name];

			// get the cached method list
			if(!ch){
				error(!name, "can't deduce a name to call inherited()");
				error(typeof chains[name] == "string", "calling chained method as inherited: " + name);
				ch = cache[name] = buildMethodList(m.bases, name, true);
			}

			// check the stack
			do{
				s = this._inherited;
				n = s.length - 1;
				if(n >= 0){
					x = s[n];
					if(x.name === name && ch[x.pos] === caller && caller.caller === inherited) break;
				}
				// find the caller
				for(i = 0, l = ch.length; i < l && ch[i] !== caller; ++i);
				// the assignment on the next line is intentional
				if(i == l) this[name] === caller && (i = -1) || error(1, "can't find the caller for inherited()");
				// the assignment on the next line is intentional
				s.push(x = {name: name, start: i, pos: i});
			}while(false);
			f = ch[++x.pos];

			try{
				return f ? f.apply(this, a || args) : undefined;
			}finally{
				x.start == --x.pos && s.pop();
			}
		}

		return function(className, superclass, props){
			var mixins, proto, i, l, t, f, ctor, ctorChain, name, bases;

			// crack parameters
			if(typeof className != "string"){
				props = superclass;
				superclass = className;
				className = "";
			}
			props = props || {};

			// build a prototype
			if(superclass){
				// multiple inheritance (potentially)
				bases = d.isArray(superclass) ? c3mro(superclass) :
					((t = superclass._meta) ? [null].concat(t.bases) : [null, superclass]);
				// the assignment on the next line is intentional
				superclass = bases[l = bases.length - 1];
				for(i = l - 1; i > 0; --i){
					t = bases[i];
					// delegation
					xtor.prototype = superclass.prototype;
					proto = new xtor;
					d._mixin(proto, t.prototype);
					(ctor = function(){}).superclass = superclass;
					ctor.prototype = proto;
					superclass = proto.constructor = ctor;
				}
				// add props
				xtor.prototype = superclass.prototype;
				proto = new xtor;
				xtor.prototype = null;
			}else{
				bases = [null];
				proto = {};
			}

			// add metadata for incoming functions
			for(name in props) (t = props[name]) !== op[name] && isF(t) && (t.nom = name);
			each(d._extraNames, function(name, t){ (t = props[name]) !== op[name] && isF(t) && (t.nom = name); });

			// add props
			d._mixin(proto, props);

			// add inherited to the prototype
			proto.inherited = inherited;

			// build ctor
			if(ctorSpecial){
				// compatibility mode with the legacy dojo.declare()
				ctor = function(){
					var a = arguments, args = a, a0, f, i, l, h, preArgs;
					this._inherited = [];
					// perform the shaman's rituals of the original dojo.declare()
					// 1) call two types of the preamble
					if((a0 = a[0]) && a0.preamble || this.preamble){
						// full blown ritual
						preArgs = new Array(bases.length);
						// prepare parameters
						preArgs[0] = a;
						for(i = 0, l = bases.length - 1; i < l;){
							// the assignment on the next line is intentional
							a = (a0 = a[0]) && (f = a0.preamble) && f.apply(this, a) || a;
							// the assignment on the next line is intentional
							a = (f = bases[i]._meta.hidden.preamble) && f.apply(this, a) || a;
							preArgs[++i] = a;
						}
						// call all constructors
						for(; i >= 0; --i){
							h = bases[i]._meta.hidden;
							h.hasOwnProperty("constructor") && h.constructor.apply(this, preArgs[i]);
						}
					}else{
						// reduced ritual
						// 2) call the constructor with the same parameters
						for(i = ctorChain.length - 1; i >= 0; ctorChain[i--].apply(this, a));
					}
					// 3) continue the original ritual: call the postscript
					// the assignment on the next line is intentional
					(f = this.postscript) && f.apply(this, args);
				};
			}else{
				if(chains.hasOwnProperty("constructor")){
					// chained constructor
					ctor = function(){
						var a = arguments, f, i, l;
						this._inherited = [];
						// perform the shaman's rituals of the original dojo.declare()
						// 1) do not call the preamble
						// 2) call the constructor with the same parameters
						for(i = 0, l = ctorChain.length; i < l; ctorChain[i++].apply(this, a));
						// 3) call the postscript
						// the assignment on the next line is intentional
						(f = this.postscript) && f.apply(this, a);
					};
				}else{
					// plain vanilla constructor
					ctor = function(){
						var a = arguments, f;
						this._inherited = [];
						// perform the shaman's rituals of the original dojo.declare()
						// 1) do not call the preamble
						// 2) call our original constructor
						// the assignment on the next line is intentional
						(f = ctorChain[0]) && f.apply(this, a);
						// 3) call the postscript
						// the assignment on the next line is intentional
						(f = this.postscript) && f.apply(this, a);
					};
				}
			}

			// build metadata on the constructor
			bases[0] = ctor;
			ctor._meta  = {bases: bases, hidden: props};
			ctor._cache = {};
			ctor.superclass = superclass && superclass.prototype;

			proto.constructor = ctor;
			ctor.prototype = proto;

			proto.isInstanceOf = ctor.isInstanceOf = isInstanceOf;

			// the assignment on the next line is intentional
			className && d.setObject(proto.declaredClass = className, ctor);

			// build chains and add them to the prototype
			function bindChain(name){
				if(typeof chains[name] == "string")
					(proto[name] = function(){
						var c = this.constructor, t = buildMethodList(c._meta.bases, name), l = t.length,
							f = function(){ for(var i = 0; i < l; ++i){ t[i].apply(this, arguments); } };
						f.nom = name;
						// the assignment on the next line is intentional
						(c.prototype[name] = f).apply(this, arguments);
					}).nom = name;
			}
			for(name in chains){ bindChain(name); }
			each(d._extraNames, bindChain);
			ctorChain = (ctorSpecial || chains.hasOwnProperty("constructor")) &&
				buildMethodList(bases, "constructor");

			return ctor;	// Function
		};
	};

	/*=====
	//	summary:
	//		Create a feature-rich constructor from compact notation
	//	className: String?:
	//		The optional name of the constructor (loosely, a "class")
	//		stored in the "declaredClass" property in the created prototype
	//	superclass: Function|Function[]:
	//		May be null, a Function, or an Array of Functions. If an array,
	//		the first element is used as the prototypical ancestor and
	//		any following Functions become mixin ancestors.
	//	props: Object:
	//		An object whose properties are copied to the created prototype.
	//		Add an instance-initialization function by making it a property
	//		named "constructor".
	//	description:
	//		Create a constructor using a compact notation for inheritance and
	//		prototype extension.
	//
	//		Mixin ancestors provide a type of multiple inheritance. Prototypes of mixin
	//		ancestors are copied to the new class: changes to mixin prototypes will
	//		not affect classes to which they have been mixed in.
	//
	//		"className" is cached in "declaredClass" property of the new class.
	//
	//	example:
	//	|	dojox.lang.oo.declare("my.classes.bar", my.classes.foo, {
	//	|		// properties to be added to the class prototype
	//	|		someValue: 2,
	//	|		// initialization function
	//	|		constructor: function(){
	//	|			this.myComplicatedObject = new ReallyComplicatedObject();
	//	|		},
	//	|		// other functions
	//	|		someMethod: function(){
	//	|			doStuff();
	//	|		}
	//	|	});
	=====*/
	oo.declare = oo.makeDeclare(true);
})();
