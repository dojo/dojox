dojo.provide("dojox.embed.Flash");

(function(){
	/*******************************************************
		dojox.embed.Flash

		Base functionality to insert a flash movie into
		a document on the fly.

		Usage:
		var movie=new dojox.embed.Flash({ args }, containerNode);
	 ******************************************************/
	var fMarkup, fVersion;
	var keyBase="dojox-embed-flash-", keyCount=0;
	function prep(kwArgs){
		kwArgs=dojo.mixin({
			expressInstall: false,
			width: 320,
			height: 240,
			style: null,
			redirect: null
		}, kwArgs||{});

		if(!("path" in kwArgs)){
			console.error("dojox.embed.Flash(ctor):: no path reference to a Flash movie was provided.");
			return null;
		}

		if(!("id" in kwArgs)){
			kwArgs.id=(keyBase + keyCount++);
		}
		return kwArgs;
	}

	if(dojo.isIE){
		fMarkup=function(kwArgs){
			kwArgs=prep(kwArgs);
			if(!kwArgs){ return null; }

			var path=kwArgs.path;
			if(kwArgs.vars){
				var a=[];
				for(var p in kwArgs.vars){
					a.push(p+'='+kwArgs.vars[p]);
				}
				path += ((path.indexOf("?")==-1) ? "?":"&") + a.join("&");
			}
			var s='<object id="' + kwArgs.id + '" '
				+ 'classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" '
				+ 'width="' + kwArgs.width + '" '
				+ 'height="' + kwArgs.height + '"'
				+ ((kwArgs.style)?' style="' + kwArgs.style + '"':'')
				+ '>'
				+ '<param name="movie" value="' + path + '" />';
			if(kwArgs.params){
				for(var p in kwArgs.params){
					s += '<param name="' + p + '" value="' + kwArgs.params[p] + '" />';
				}
			}
			s += '</object>';
			return { id: kwArgs.id, markup: s };
		};

		fVersion=(function(){
			var testVersion=10, testObj=null;
			while(!testObj && testVersion > 7){
				try {
					testObj = new ActiveXObject("ShockwaveFlash.ShockwaveFlash." + testVersion--);
				} catch(e){ }
			}
			if(testObj){
				var v = testObj.GetVariable("$version").split(" ")[1].split(",");
				return {
					major: (v[0]!=null)?parseInt(v[0]):0, 
					minor: (v[1]!=null)?parseInt(v[1]):0, 
					rev: (v[2]!=null)?parseInt(v[2]):0 
				};
			}
			return { major: 0, minor: 0, rev: 0 };
		})();

		//	attach some cleanup for IE, thanks to deconcept :)
		dojo.addOnUnload(function(){
			var objs=dojo.query("object");
			for(var i=objs.length-1; i>=0; i--){
				objs[i].style.display="none";
				for(var p in objs[i]){
					if(p!="FlashVars" && dojo.isFunction(objs[i][p])){
						objs[i][p]=function(){ };
					}
				}
			}
		});

		//	TODO: ...and double check this fix; is IE really firing onbeforeunload with any kind of href="#" link?
		/*
		var beforeUnloadHandle = dojo.connect(dojo.global, "onbeforeunload", function(){
			try{
				if(__flash_unloadHandler){ __flash_unloadHandler=function(){ }; }
				if(__flash_savedUnloadHandler){ __flash_savedUnloadHandler=function(){ }; }
			} catch(e){ }
			dojo.disconnect(beforeUnloadHandle);
		});
		*/
	} else {
		//	*** Sane browsers branch ******************************************************************
		fMarkup=function(kwArgs){
			kwArgs=prep(kwArgs);
			if(!kwArgs){ return null; }
			var path=kwArgs.path;
			if(kwArgs.vars){
				var a=[];
				for(var p in kwArgs.vars){
					a.push(p+'='+kwArgs.vars[p]);
				}
				path += ((path.indexOf("?")==-1) ? "?":"&") + a.join("&");
			}
			var s = '<embed type="application/x-shockwave-flash" '
				+ 'src="' + path + '" '
				+ 'id="' + kwArgs.id + '" '
				+ 'name="' + kwArgs.id + '" '
				+ 'width="' + kwArgs.width + '" '
				+ 'height="' + kwArgs.height + '"'
				+ ((kwArgs.style)?' style="' + kwArgs.style + '" ':'')
				+ 'swLiveConnect="true" '
				+ 'allowScriptAccess="sameDomain" '
				+ 'pluginspage="' + window.location.protocol + '//www.adobe.com/go/getflashplayer" ';
			if(kwArgs.params){
				for(var p in kwArgs.params){
					s += ' ' + p + '="' + kwArgs.params[p] + '"';
				}
			}
			s += ' />'
			return { id: kwArgs.id, markup: s };
		};

		fVersion=(function(){
			var plugin = navigator.plugins["Shockwave Flash"];
			if(plugin && plugin.description){
				var v = plugin.description.replace(/([a-zA-Z]|\s)+/, "").replace(/(\s+r|\s+b[0-9]+)/, ".").split(".");
				return { 
					major: (v[0]!=null)?parseInt(v[0]):0, 
					minor: (v[1]!=null)?parseInt(v[1]):0, 
					rev: (v[2]!=null)?parseInt(v[2]):0 
				};
			}
			return { major: 0, minor: 0, rev: 0 };
		})();
	}


	/*=====
	dojox.embed.__flashArgs = function(path, id, width, height, style, params, vars, expressInstall, redirect){
		//	path: String
		//		The URL of the movie to embed.
		//	id: String?
		//		A unique key that will be used as the id of the created markup.  If you don't
		//		provide this, a unique key will be generated.
		//	width: Number?
		//		The width of the embedded movie; the default value is 320px.
		//	height: Number?
		//		The height of the embedded movie; the default value is 240px
		//	style: String?
		//		Any CSS style information (i.e. style="background-color:transparent") you want
		//		to define on the markup.
		//	params: Object?
		//		A set of key/value pairs that you want to define in the resultant markup.
		//	vars: Object?
		//		A set of key/value pairs that the Flash movie will interpret as FlashVars.
		//	expressInstall: Boolean?
		//		Whether or not to include any kind of expressInstall info. Default is false.
		//	redirect: String?
		//		A url to redirect the browser to if the current Flash version is not supported.
		this.id=id;
		this.path=path;
		this.width=width;
		this.height=height;
		this.style=style;
		this.params=params;
		this.vars=vars;
		this.expressInstall=expressInstall;
		this.redirect=redirect;
	}
	=====*/

	//	the main entry point
	dojox.embed.Flash=function(/* dojox.embed.__flashArgs */kwArgs, /* DOMNode */node){
		//	summary:
		//		Returns a reference to the HTMLObject/HTMLEmbed that is created to 
		//		place the movie in the document.  You can use this either with or
		//		without the new operator.  Note that if the Flash engine isn't available
		//		yet, this will throw an Error.
		//
		//	example:
		//		Embed a flash movie in a document using the new operator, and get a reference to it.
		//	|	var movie = new dojox.embed.Flash({
		//	|		path: "path/to/my/movie.swf",
		//	|		width: 400,
		//	|		height: 300
		//	|	}, myWrapperNode);
		//
		//	example:
		//		Embed a flash movie in a document without using the new operator.
		//	|	var movie = dojox.embed.Flash({
		//	|		path: "path/to/my/movie.swf",
		//	|		width: 400,
		//	|		height: 300,
		//	|		style: "position:absolute;top:0;left:0"
		//	|	}, myWrapperNode);

		if(dojox.embed.Flash.initialized){
			return dojox.embed.Flash.place(kwArgs, node);	//	HTMLObject
		}
		throw new Error("dojox.embed.Flash:: you must wait for the Flash engine to be initialized.");
	};

	//	expose information through the constructor function itself.
	dojo.mixin(dojox.embed.Flash, {
		//	summary:
		//		A singleton object used internally to get information
		//		about the Flash player available in a browser, and
		//		as the factory for generating and placing markup in a
		//		document.
		//
		//	minSupported: Number
		//		The minimum supported version of the Flash Player, defaults to 8.
		//	available: Number
		//		Used as both a detection (i.e. if(dojox.embed.Flash.available){ })
		//		and as a variable holding the major version of the player installed.
		//	supported: Boolean
		//		Whether or not the Flash Player installed is supported by dojox.embed.
		//	version: Object
		//		The version of the installed Flash Player; takes the form of
		//		{ major, minor, rev }.  To get the major version, you'd do this:
		//		var v=dojox.embed.Flash.version.major;
		//	initialized: Boolean
		//		Whether or not the Flash engine is available for use.
		//	onInitialize: Function
		//		A stub you can connect to if you are looking to fire code when the 
		//		engine becomes available.  A note: DO NOT use this event to
		//		place a movie in a document; it will usually fire before DOMContentLoaded
		//		is fired, and you will get an error.  Use dojo.addOnLoad instead.
		minSupported : 8,
		available: fVersion.major,
		supported: (fVersion.major >= 8),
		version: fVersion,
		initialized: false,
		onInitialize: function(){
			dojox.embed.Flash.initialized=true;
		},
		__ie_markup__: function(kwArgs){
			return fMarkup(kwArgs);
		}
	});

	if(dojo.isIE){
		//	Ugh!
		if(dojo._initFired){
			var e=document.createElement("script");
			e.type="text/javascript";
			e.src=dojo.moduleUrl("dojox", "embed/IE/flash.js");
			document.getElementsByTagName("head")[0].appendChild(e);
		} else {
			//	we can use document.write.  What a kludge.
			document.write('<scr'+'ipt type="text/javascript" src="' + dojo.moduleUrl("dojox", "embed/IE/flash.js") + '">'
				+ '</scr'+'ipt>');
		}
	} else {
		dojox.embed.Flash.place = function(kwArgs, node){
			var o=fMarkup(kwArgs);
			node=dojo.byId(node);
			if(!node){ 
				node=dojo.doc.createElement("div");
				node.id=o.id+"-container";
				dojo.body().appendChild(node);
			}
			if(o){
				node.innerHTML=o.markup;
				return document[o.id];
			}
			return null;
		}
		dojox.embed.Flash.onInitialize();
	}

	//	A port of Brad's Communicator code (dojox.Flash)
	//	in anticipation of removing that code at a later date.
	dojox.embed.FlashProxy = function(/* HTMLObject */mov, /* Array | String */methods){
		//	summary
		//		Create a proxy object around the passed movie
		//		that is then set up with any methods you plan
		//		on using with the movie's ExternalInterface. On
		//		creation, a set of methods are created on this object.
		//
		//	movie:	HTMLObject
		//		The Flash movie this proxy is wrapping
		//
		//	example:
		//		Create a proxy around a movie, define 2 methods, and use one.
		//	|	var proxy = new dojox.embed.Flash.Proxy(myMovie, [ "foo", "bar" ]);
		//	|	var someResults = proxy.foo("bar", "baz", "bop");

		this.movie = mov;
		dojo.forEach((dojo.isArray(methods) ? methods : [ methods ]), function(item){
			this[item] = dojo.hitch(this, function(){
				return this._exec(item, arguments);
			});
		}, this);
	};
	
	dojo.extend(dojox.embed.FlashProxy, {
		//	we will rely on the __flash__toXML method to encode things right.
		_exec: function(/* String */method, /* Array? */args){
			return (function(){
				//	we require the eval because the return is actually a JSON string.
				return eval(this.movie.CallFunction(
					'<invoke name="' + method + '" returntype="javascript">'
					+ '<arguments>'
					+ dojo.map(args, function(item){
						return __flash__toXML(item);
					}).join("")
					+ '</arguments>'
					+ '</invoke>'
				));
			}).apply(this, args||[]);
		}
	});
})();
