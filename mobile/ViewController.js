define([
	"dojo/_base/kernel",
	"dojo/_base/declare",
	"dojo/on",
	"dojo/_base/array",
	"dojo/DeferredList",
	"./TransitionEvent",
	"./ProgressIndicator"
],
	function(dojo, declare, on, darra, DeferredList, TransitionEvent, ProgressIndicator){

	var Controller = dojo.declare(null, {
		constructor: function(){
			this.viewMap={};
			this.currentView=null;
			this.defaultView=null;
			dojo.ready(dojo.hitch(this, function(){
				on(dojo.body(), "startTransition", dojo.hitch(this, "onStartTransition"));
			}));
		},

		findCurrentView: function(moveTo,src){
			if(moveTo){
				var w = dijit.byId(moveTo);
				if(w && w.getShowingView){ return w.getShowingView(); }
			}
			if (dojox.mobile.currentView) {
				return dojox.mobile.currentView;
			}
			w = src;
			while(true){
				w = w.getParent();
				if(!w){ return null; }
				if(w instanceof dojox.mobile.View){ break; }
			}
			return w;
		},

		onStartTransition: function(evt){
			//console.log("onStartTransition:", evt.detail, evt.detail.moveTo, evt.detail.href, evt.detail.scene, evt);
			evt.preventDefault();
			if(!evt.detail || (evt.detail && !evt.detail.moveTo && !evt.detail.href && !evt.detail.url && !evt.detail.scene)){ return; }
			var w = this.findCurrentView(evt.detail.moveTo, (evt.target && evt.target.id)?dijit.byId(evt.target.id):dijit.byId(evt.target)); // the current view widget
			if(!w || (evt.detail && evt.detail.moveTo && w === dijit.byId(evt.detail.moveTo))){ return; }
			if(evt.detail.href){
				var t = dijit.byId(evt.target.id).hrefTarget;
				if(t){
					dojox.mobile.openWindow(evt.detail.href, t);
				}else{
					w.performTransition(null, evt.detail.transitionDir, evt.detail.transition, evt.target, function(){location.href = evt.detail.href;});
				}
				return;
			} else if(evt.detail.scene){
				dojo.publish("/dojox/mobile/app/pushScene", [evt.detail.scene]);
				return;
			}
			var moveTo = evt.detail.moveTo;
			if(evt.detail.url){
				var id;
				if(dojox.mobile._viewMap && dojox.mobile._viewMap[evt.detail.url]){
					// external view has already been loaded
					id = dojox.mobile._viewMap[evt.detail.url];
				}else{
					// get the specified external view and append it to the <body>
					var text = this._text;
					if(!text){
						if(dijit.byId(evt.target.id).sync){
							text = dojo.trim(dojo._getText(evt.detail.url));
						}else{
							require(["dojo/_base/xhr"], dojo.hitch(this, function(xhr){ 
								var prog = ProgressIndicator.getInstance();
								dojo.body().appendChild(prog.domNode);
								prog.start();
								var xhr = dojo.xhrGet({
									url: evt.detail.url,
									handleAs: "text"
								});
								xhr.addCallback(dojo.hitch(this, function(response, ioArgs){
									prog.stop();
									if(response){
										this._text = response;
										new TransitionEvent(evt.target, {
												transition: evt.detail.transition,
											 	transitionDir: evt.detail.transitionDir, 
											 	moveTo: moveTo, 
											 	href: evt.detail.href, 
											 	url: evt.detail.url, 
											 	scene: evt.detail.scene}, 
											 		evt.detail)
											 			.dispatch(); 
									}
								}));
								xhr.addErrback(function(error){
									prog.stop();
									console.log("Failed to load "+evt.detail.url+"\n"+(error.description||error));
								});
							}));
							return;
						}
					}
					this._text = null;
					id = this._parse(text, dijit.byId(evt.target.id).urlTarget);
					if(!dojox.mobile._viewMap){
						dojox.mobile._viewMap = [];
					}
					dojox.mobile._viewMap[evt.detail.url] = id;
				}
				moveTo = id;
				w = this.findCurrentView(moveTo,dijit.byId(evt.target.id)) || w; // the current view widget
			}
			w.performTransition(moveTo, evt.detail.transitionDir, evt.detail.transition, null, null);
		},

		_parse: function(text, id){
			var container, view, i, j, len;
			var currentView	 = this.findCurrentView();
			var target = dijit.byId(id) && dijit.byId(id).containerNode 
						|| dojo.byId(id) 
						|| currentView && currentView.domNode.parentNode 
						|| dojo.body();
			// if a fixed bottom bar exists, a new view should be placed before it.
			var refNode = null;
			for(j = target.childNodes.length - 1; j >= 0; j--){
				var c = target.childNodes[j];
				if(c.nodeType === 1){
					if(c.getAttribute("fixed") === "bottom"){
						refNode = c;
					}
					break;
				}
			}
			if(text.charAt(0) === "<"){ // html markup
				container = dojo.create("DIV", {innerHTML: text});
				for(i = 0; i < container.childNodes.length; i++){
					var n = container.childNodes[i];
					if(n.nodeType === 1){
						view = n; // expecting <div dojoType="dojox.mobile.View">
						break;
					}
				}
				if(!view){
					console.log("dojox.mobile.ViewController#_parse: invalid view content");
					return;
				}
				view.style.visibility = "hidden";
				target.insertBefore(container, refNode);
				var ws = dojo.parser.parse(container);
				dojo.forEach(ws, function(w){
					if(w && !w._started && w.startup){
						w.startup();
					}
				});

				// allows multiple root nodes in the fragment,
				// but transition will be performed to the 1st view.
				for(i = 0, len = container.childNodes.length; i < len; i++){
					target.insertBefore(container.firstChild, refNode); // reparent
				}
				target.removeChild(container);

				dijit.byNode(view)._visible = true;
			}else if(text.charAt(0) === "{"){ // json
				container = dojo.create("DIV");
				target.insertBefore(container, refNode);
				this._ws = [];
				view = this._instantiate(eval('('+text+')'), container);
				for(i = 0; i < this._ws.length; i++){
					var w = this._ws[i];
					w.startup && !w._started && (!w.getParent || !w.getParent()) && w.startup();
				}
				this._ws = null;
			}
			view.style.display = "none";
			view.style.visibility = "visible";
			return dojo.hash ? "#" + view.id : view.id;
		},

		_instantiate: function(/*Object*/obj, /*DomNode*/node, /*Widget*/parent){
			var widget;
			for(var key in obj){
				if(key.charAt(0) == "@"){ continue; }
				var cls = dojo.getObject(key);
				if(!cls){ continue; }
				var params = {};
				var proto = cls.prototype;
				var objs = dojo.isArray(obj[key]) ? obj[key] : [obj[key]];
				for(var i = 0; i < objs.length; i++){
					for(var prop in objs[i]){
						if(prop.charAt(0) == "@"){
							var val = objs[i][prop];
							prop = prop.substring(1);
							if(typeof proto[prop] == "string"){
								params[prop] = val;
							}else if(typeof proto[prop] == "number"){
								params[prop] = val - 0;
							}else if(typeof proto[prop] == "boolean"){
							params[prop] = (val != "false");
							}else if(typeof proto[prop] == "object"){
								params[prop] = eval("(" + val + ")");
							}
						}
					}
					widget = new cls(params, node);
					if(node){ // to call View's startup()
						widget._visible = true;
						this._ws.push(widget);
					}
					if(parent && parent.addChild){
						parent.addChild(widget);
					}
					this._instantiate(objs[i], null, widget);
				}
			}
			return widget && widget.domNode;
		}
	});
	new Controller(); // singleton
	return Controller;
});

