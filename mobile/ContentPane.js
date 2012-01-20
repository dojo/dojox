define([
	"dojo/_base/declare",
	"dojo/_base/Deferred",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dojo/_base/xhr",
	"./_ExecScriptMixin",
	"./Pane",
	"./ProgressIndicator",
	"./lazyLoadUtils"
], function(declare, Deferred, lang, win, xhr, ExecScriptMixin, Pane, ProgressIndicator, lazyLoadUtils){

	// module:
	//		dojox/mobile/ContentPane
	// summary:
	//		A very simple content pane to embed an HTML fragment.

	return declare("dojox.mobile.ContentPane", [Pane, ExecScriptMixin], {
		// summary:
		//		A very simple content pane to embed an HTML fragment.
		// description:
		//		This widget embeds an HTML fragment and run the parser. It has
		//		ability to load external content using dojo/_base/xhr. onLoad()
		//		is called when parsing is done and the content is
		//		ready. Compared with dijit.layout.ContentPane, this widget
		//		provides only basic fuctionality, but it is much smaller than
		//		dijit.layout.ContentPane.

		// href: String
		//		URL of the content to embed.
		href: "",

		// lazy: String
		//		If true, external content specified with the href property is
		//		not loaded at startup time. It can be loaded by calling load().
		lazy: false,

		// content: String
		//		An html fragment to embed.
		content: "",

		// parseOnLoad: Boolean
		//		If true, runs the parser when the load completes.
		parseOnLoad: true,

		// prog: Boolean
		//		If true, shows progress indicator.
		prog: true,

		// executeScripts: Boolean
		//		If true, executes scripts that is found in the content
		executeScripts: true,

		baseClass: "mblContentPane",

		startup: function(){
			if(this._started){ return; }
			if(this.prog){
				this._p = ProgressIndicator.getInstance();
			}
			var parent = this.getParent && this.getParent();
			if(!parent || !parent.resize){ // top level widget
				this.resize();
			}
			this.inherited(arguments);
		},

		loadHandler: function(/*String*/response){
			// summary:
			//		A handler called when load completes.
			this.set("content", response);
		},

		errorHandler: function(err){
			// summary:
			//		An error handler called when load fails.
			if(this._p){ this._p.stop(); }
		},

		load: function(){
			this.set("href", this.href);
		},

		onLoad: function(){
			// summary:
			//		Stub method to allow the application to connect to.
			//		Called when parsing is done and the content is ready.
			return true;
		},

		_setHrefAttr: function(/*String*/href){
			if(this.lazy || href === this._loaded){
				this.lazy = false;
				return null;
			}
			var p = this._p;
			if(p){
				win.body().appendChild(p.domNode);
				p.start();
			}
			this._set("href", href);
			this._loaded = href;
			return xhr.get({
				url: href,
				handleAs: "text",
				load: lang.hitch(this, "loadHandler"),
				error: lang.hitch(this, "errorHandler")
			});
		},

		_setContentAttr: function(/*String|DomNode*/data){
			this.destroyDescendants();
			if(typeof data === "object"){
				this.containerNode.appendChild(data);
			}else{
				if(this.executeScripts){
					data = this.execScript(data);
				}
				this.containerNode.innerHTML = data;
			}
			if(this.parseOnLoad){
				var _this = this;
				return Deferred.when(lazyLoadUtils.instantiateLazyWidgets(_this.containerNode), function(){
					if(_this._p){ _this._p.stop(); }
					return _this.onLoad();
				});
			}
			if(this._p){ this._p.stop(); }
			return this.onLoad();
		}
	});
});
