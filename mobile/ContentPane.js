define([
	"dojo/_base/kernel",
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dojo/_base/xhr",
	"./_ExecScriptMixin",
	"./Pane",
	"./ProgressIndicator"
], function(dojo, array, declare, lang, win, xhr, ExecScriptMixin, Pane, ProgressIndicator){

/*=====
	var Contained = dijit._Contained;
	var WidgetBase = dijit._WidgetBase;
=====*/

	// module:
	//		dojox/mobile/ContentPane
	// summary:
	//		A very simple content pane to embed an HTML fragment.

	return declare("dojox.mobile.ContentPane", [Pane, ExecScriptMixin], {
		// summary:
		//		A very simple content pane to embed an HTML fragment.
		// description:
		//		This widget embeds an HTML fragment and run the parser. onLoad()
		//		is called when parsing is done and the content is ready.
		//		"dojo/_base/xhr" is in the dependency list. Usually this is not
		//		necessary, but there is a case where dojox.mobile custom build
		//		does not contain xhr. Note that this widget does not inherit
		//		from dijit._Container.

		// href: String
		//		URL of the content to embed.
		href: "",

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
	
		onLoad: function(){
			// summary:
			//		Stub method to allow the application to connect to.
			//		Called when parsing is done and the content is ready.
		},
	
		_setHrefAttr: function(/*String*/href){
			var p = this._p;
			if(p){
				win.body().appendChild(p.domNode);
				p.start();
			}
			this._set("href", href);
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
				dojo.parser.parse(this.containerNode);
			}
			if(this._p){ this._p.stop(); }
			this.onLoad();
		}
	});
});
