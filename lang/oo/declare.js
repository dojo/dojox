dojo.provide("dojox.lang.oo.declare");

dojo.experimental("dojox.lang.oo.declare");

// a drop-in replacement for dojo.declare() with fixed bugs and enhancements

(function(){
	var d = dojo, oo = dojox.lang.oo, op = Object.prototype,
		isF = d.isFunction, each = d.forEach, xtor = function(){}, counter = 0;

	function err(msg){ throw new Error("declare: " + msg); }

	// C3 Method Resolution Order (see http://www.python.org/download/releases/2.3/mro/)
	function c3mro(bases){
		var result = [0], l = bases.length, classes = new Array(l),
			i = 0, j, m, m2, c, cls, lin, proto, name, t;

		// initialize
		for(; i < l; ++i){
			c = bases[i];
			if(!c){
				err("mixin #" + i + " is null");
			}
			lin = c._meta && c._meta.bases || [c];
			m = {};
			for(j = 0, m2 = lin.length; j < m2; ++j){
				cls = lin[j];
				proto = cls.prototype;
				name = proto.hasOwnProperty("declaredClass") && proto.declaredClass;
				if(!name){
					name = proto.declaredClass = "dojoUniqClassName_" + (counter++);
				}
				m[name] = cls;
			}
			classes[i] = {
				idx: 0,
				map: m,
				lin: d.map(lin, function(c){ return c.prototype.declaredClass; })
			};
		}

		// C3 MRO algorithm
		while(l){
			if(l == 1){
				// just one chain of inheritance => copy it directly
				c = classes[0];
				m = c.map;
				return result.concat(d.map(c.lin.slice(c.idx), function(c){ return m[c]; }));
			}
			for(i = l; i--;){
				m = classes[i];
				c = m.lin[m.idx];
				if(c){
					// check if it is in the tail of any classes
					t = 1;
					for(j = l; j--;){
						m2 = classes[j];
						if(i != j && (c in m2.map)){
							if(c == m2.lin[m2.idx]){
								++t;
							}else{
								// there is a class in the tail => aborting
								break;
							}
						}
					}
					if(j < 0){
						result.push(m.map[c]);
						// remove c from all heads
						for(j = l; j--;){
							m = classes[j];
							if(c == m.lin[m.idx]){
								++m.idx;
								if(!--t){
									// all heads are deleted => stop
									break;
								}
							}
						}
						break;
					}
				}else{
					// remove the empty class list
					classes.splice(i, 1);
					--l
				}
			}
			if(i < 0 && l > 0){
				err("can't build consistent linearization");
			}
		}

		return result;
	}

	oo.makeDeclare = function(ctorSpecial, chains){
		chains = chains || {};

		function buildMethodList(bases, name){
			var methods = [], i = 0, l = bases.length, h, b;
			for(;i < l; ++i){
				b = bases[i];
				h = b._meta;
				if(h){
					// this is a class created with dojo.declare()
					h = h.hidden;
					if(h.hasOwnProperty(name)){
						// if this class has the method we need => add it
						methods.push(h[name]);
					}
				}else{
					// this is a native class
					if(name == "constructor"){
						// constructor => add it
						methods.push(b);
					}else{
						h = b.prototype[name];
						if(h && h !== op[name]){
							// if this class has the method we need,
							// and it is not default one => add it
							methods.push(h);
						}
					}
				}
			}
			// the last method comes from Object
			if(name != "constructor"){
				// we already handled the native constructor above => skip it
				h = op[name];
				if(h){
					// there is a native method with such name => add it
					methods.push(h);
				}
			}
			// reverse the chain for "after" methods
			return chains[name] === "after" ? methods.reverse() : methods;
		}

		function inherited(args, a, b){
			var c = this.constructor, m = c._meta, cache = c._cache,
				caller, i, l, f, n, ch, x, name;

			// crack arguments
			if(typeof args == "string"){
				name = args;
				args = a;
				a = b;
			}

			caller = inherited.caller;
			n = caller.nom;
			if(n && name && n !== name){
				err("calling inherited() with a different name: " + name);
			}
			name = name || n;
			ch = cache.hasOwnProperty(name) && cache[name];

			// get the cached method list
			if(!ch){
				if(!name){
					err("can't deduce a name to call inherited()");
				}
				if(name == "constructor" && ctorSpecial){
					err("calling constructor as inherited");
				}
				if(chains.hasOwnProperty(name)){
					err("calling chained method as inherited: " + name);
				}
				ch = cache[name] = buildMethodList(m.bases, name);
			}

			// simple caching
			x = this._inherited;
			if(x.name !== name || ch[x.pos] !== caller){
				// find the caller
				for(i = 0, l = ch.length; i < l && ch[i] !== caller; ++i);
				if(i == l){
					if(this[name] === caller){
						i = -1;
					}else{
						err("can't find the caller for inherited()");
					}
				}
				this._inherited = x = {name: name, pos: i};
			}
			
			f = ch[++x.pos];
			
			// do not calling the inherited at the end of the chain
			return f ? f.apply(this, a || args) : undefined;
		}

		return function(className, superclass, props){
			var mixins, proto, i, l, t, ctor, ctorChain, name, bases;

			// crack parameters
			if(typeof className != "string"){
				props = superclass;
				superclass = className;
				className = "";
			}
			props = props || {};

			// build a prototype
			t = 0; // flag: the superclass chain is not handled yet
			if(d.isArray(superclass)){
				// suspected multiple inheritance
				if(superclass.length > 1){
					// we have several base classes => C3 MRO
					bases = c3mro(superclass);
					// build a chain
					l = bases.length - 1;
					superclass = bases[l];
					for(i = l - 1;;){
						t = bases[i--];
						// delegation
						xtor.prototype = superclass.prototype;
						proto = new xtor;
						if(!t){
							// stop if nothing to add (the last base)
							break;
						}
						// mix in properties
						d._mixin(proto, t.prototype);
						// chain in new constructor
						ctor = function(){};
						ctor.superclass = superclass;
						ctor.prototype = proto;
						superclass = proto.constructor = ctor;
					}
					t = 1; // flag: the superclass chain is handled
				}else{
					// false alarm: we have just one (or zero?) base class
					superclass = superclass[0];
				}
			}
			if(!t){
				// the supeclass chain is not handled yet
				bases = [0];
				if(superclass){
					// we have a superclass
					t = superclass._meta;
					if(t){
						// this class was made by dojo.declare() => add its bases
						bases = bases.concat(t.bases);
					}else{
						// this is a native class => add it
						bases.push(superclass);
					}
					// delegation
					xtor.prototype = superclass.prototype;
					proto = new xtor;
				}else{
					// no superclass
					proto = {};
				}
			}
			xtor.prototype = 0;	// cleanup

			// add metadata for incoming functions
			for(name in props){
				t = props[name];
				if(t !== op[name] && isF(t)){
					// non-trivial function method => attach its name
					t.nom = name;
				}
			}
			// process unenumerable methods on IE
			each(d._extraNames, function(name, t){
				t = props[name];
				if(t !== op[name] && isF(t)){
					// non-trivial function method => attach its name
					t.nom = name;
				}
			});

			// add props
			d._mixin(proto, props);

			// build ctor
			if(ctorSpecial){
				// compatibility mode with the legacy dojo.declare()
				ctor = function(){
					var a = arguments, args = a, a0 = a[0], f, i, l, h, preArgs;
					this._inherited = {};
					// perform the shaman's rituals of the original dojo.declare()
					// 1) call two types of the preamble
					if(a0 && a0.preamble || this.preamble){
						// full blown ritual
						preArgs = new Array(bases.length);
						// prepare parameters
						preArgs[0] = a;
						for(i = 0, l = bases.length;;){
							// process the preamble of the 1st argument
							a0 = a[0];
							if(a0){
								f = a0.preamble;
								if(f){
									a = f.apply(this, a) || a;
								}
								
							}
							// process the preamble of this class
							f = bases[i]._meta.hidden.preamble;
							if(f){
								a = f.apply(this, a) || a;
							}
							// one pecularity of the preamble:
							// it is called if it is not needed,
							// e.g., there is no constructor to call
							// let's watch for the last constructor
							// (see ticket #9795)
							if(++i == l){
								break;
							}
							preArgs[i] = a;
						}
						// call all unique constructors using prepared arguments
						for(--i; i >= 0; --i){
							h = bases[i]._meta.hidden;
							if(h.hasOwnProperty("constructor")){
								h.constructor.apply(this, preArgs[i]);
							}
						}
					}else{
						// reduced ritual
						// 2) call the constructor with the same parameters
						for(i = ctorChain.length - 1; i >= 0; --i){
							ctorChain[i].apply(this, a);
						}
					}
					// 3) continue the original ritual: call the postscript
					f = this.postscript;
					if(f){
						f.apply(this, args);
					}
				};
			}else{
				// new construction (no preabmle, chaining is allowed)
				if(chains.hasOwnProperty("constructor")){
					// chained constructor
					ctor = function(){
						var a = arguments, f, i, l;
						this._inherited = {};
						// perform the shaman's rituals of the original dojo.declare()
						// 1) do not call the preamble
						// 2) call the constructor with the same parameters
						for(i = 0, l = ctorChain.length; i < l; ++i){
							ctorChain[i].apply(this, a)
						}
						// 3) call the postscript
						f = this.postscript;
						if(f){
							f.apply(this, args);
						}
					};
				}else{
					// plain vanilla constructor (can use inherited() to call its base constructor)
					ctor = function(){
						var a = arguments, f;
						this._inherited = {};
						// perform the shaman's rituals of the original dojo.declare()
						// 1) do not call the preamble
						// 2) call our original constructor
						f = ctorChain[0];
						if(f){
							f.apply(this, a);
						}
						// 3) call the postscript
						f = this.postscript;
						if(f){
							f.apply(this, args);
						}
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

			// add "standard" methods to the ptototype
			proto.inherited = inherited;
			proto.isInstanceOf = function(cls){
				for(var i = 0, l = bases.length; i < l; ++i){
					if(bases[i] === cls){
						return true;
					}
				}
				return this instanceof cls;
			};

			// process named classes
			if(className){
				proto.declaredClass = className;
				d.setObject(className, ctor);
			}

			// build chains and add them to the prototype
			function bindChain(name){
				if(typeof chains[name] == "string")
					var f = proto[name] = function(){
						var t = buildMethodList(bases, name), l = t.length,
							f = function(){ for(var i = 0; i < l; ++i){ t[i].apply(this, arguments); } };
						f.nom = name;
						// memoization
						ctor.prototype[name] = f;
						f.apply(this, arguments);
					};
					f.nom = name;
			}
			for(name in chains){
				bindChain(name);
			}
			//each(d._extraNames, bindChain); // no need to chain functions
			
			// get the constructor chain (used directly in constructors)
			ctorChain = buildMethodList(bases, "constructor");
			if(!ctorSpecial && !chains.hasOwnProperty(name)){
				ctor._cache.constructor = ctorChain;
			}

			return ctor;	// Function
		};
	};

	oo.declare = oo.makeDeclare(true);

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
})();
