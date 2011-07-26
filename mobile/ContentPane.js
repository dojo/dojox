define([
	"dojo/_base/kernel",
	"dojo/_base/array",
	"dojo/_base/declare",
	"dojo/_base/lang",
	"dojo/_base/window",
	"dijit/_Contained",
	"dijit/_WidgetBase",
	"dojo/_base/xhr",
	"./ProgressIndicator"
],
	function(dojo, array, declare, lang, win, Contained, WidgetBase, xhr, ProgressIndicator){

	// summary:
	//		A very simple content pane to embed an HTML fragment.
	// description:
	//		This widget embeds an HTML fragment and run the parser.
	//		onLoad() is called when parsing is done and the content is ready.
	//		"dojo/_base/xhr" is in the dependency list. Usually this is not
	//		necessary, but there is a case where dojox.mobile custom build does not
	//		contain xhr.

	/*=====
		WidgetBase = dijit._WidgetBase;
		Contained = dijit._Contained;
	=====*/
	return declare("dojox.mobile.ContentPane", [WidgetBase, Contained],{
		href: "",
		content: "",
		parseOnLoad: true,
		prog: true, // show progress indicator

		buildRendering: function(){
			this.inherited(arguments);
			if(!this.containerNode){
				this.containerNode = this.domNode;
			}
		},

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
	
		resize: function(){
			array.forEach(this.getChildren(), function(child){
				if(child.resize){ child.resize(); }
			});
		},
	
		loadHandler: function(/*String*/response){
			this.set("content", response);
		},
	
		errorHandler: function(err){
			if(p){ p.stop(); }
		},
	
		onLoad: function(){
			// Stub method to allow the application to connect to.
			// Called when parsing is done and the content is ready.
		},
	
		_setHrefAttr: function(/*String*/href){
			var p = this._p;
			if(p){
				win.body().appendChild(p.domNode);
				p.start();
			}
			this.href = href;
			xhr.get({
				url: href,
				handleAs: "text",
				load: lang.hitch(this, "loadHandler"),
				error: lang.hitch(this, "errorHandler")
			});
		},

		_setContentAttr: function(/*String|DomNode*/data){
			this.destroyDescendants();
			if(typeof data === "object"){
				this.domNode.appendChild(data);
			}else{
				this.domNode.innerHTML = data;
			}
			if(this.parseOnLoad){
				dojo.parser.parse(this.domNode);
			}
			if(this._p){ this._p.stop(); }
			this.onLoad();
		}
	});
});
