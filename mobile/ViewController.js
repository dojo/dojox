define(["dojo/_base/declare","dojo/listen","dojo/_base/array","dojo/DeferredList"], function(declare,listen,darra,DeferredList){

var Controller = dojo.declare(null, {
                constructor: function(){
                        this.viewMap={};
                        this.currentView=null;
                        this.defaultView=null;
			dojo.ready(dojo.hitch(this, function(){
				listen(dojo.body(), "startTransition", dojo.hitch(this, "onStartTransition"));
			}));
                },

		findCurrentView: function(moveTo,src){
			if(moveTo){
				w = dijit.byId(moveTo);
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

			var w = this.findCurrentView(evt.detail.moveTo, (evt.srcElement && evt.srcElement.id)?dijit.byId(evt.srcElement.id):dijit.byId(evt.target)); // the current view widget
			if(!w || (evt.detail && evt.detail.moveTo && w === dijit.byId(evt.detail.moveTo))){ return; }
		
			if(evt.detail.href){
				if(dijit.byId(evt.srcElement.id).hrefTarget){
					dojox.mobile.openWindow(evt.detail.href, evt.srcElement.hrefTarget);
				}else{
					w.performTransition(null, evt.detail.transitionDir, evt.detail.transition, evt.target, function(){location.href = evt.detail.href;});
				}
				return;
			} else if(evt.detail.scene){
				dojo.publish("/dojox/mobile/app/pushScene", [evt.detail.scene]);
				return;
			}
			if(evt.detail.url){
				var id;
				if(dojox.mobile._viewMap && dojox.mobile._viewMap[evt.detail.url]){
					// external view has already been loaded
					id = dojox.mobile._viewMap[evt.detail.url];
				}else{
					// get the specified external view and append it to the <body>
					var text = this._text;
					if(!text){
						if(this.sync){
							text = dojo.trim(dojo._getText(url));
						}else{
							require(["dojo/_base/xhr"], dojo.hitch(this, function(xhr){	
								var prog = dojox.mobile.ProgressIndicator.getInstance();
								dojo.body().appendChild(prog.domNode);
								prog.start();
								var xhr = dojo.xhrGet({
									url: url,
									handleAs: "text"
								});
								xhr.addCallback(dojo.hitch(this, function(response, ioArgs){
									prog.stop();
									if(response){
										this._text = response;
												
										new TransitionEvent(evt.domNode, {transition: evt.detail.transition,transitionDir: evt.detail.transitionDir, moveTo: evt.detail.moveTo, href: evt.detail.href, url: evt.detail.url, scene: evt.detail.scene}, evt.detail).dispatch(); 
									}
								}));
								xhr.addErrback(function(error){
									prog.stop();
									alert("Failed to load "+url+"\n"+(error.description||error));
								});
							}));
							return;
						}
					}
					this._text = null;
					id = this._parse(text);
					if(!dojox.mobile._viewMap){
						dojox.mobile._viewMap = [];
					}
					dojox.mobile._viewMap[url] = id;
				}
				moveTo = id;
				w = this.findCurrentView(moveTo,dijit.byId(evt.srcElement.id)) || w; // the current view widget
			}
			w.performTransition(evt.detail.moveTo, evt.detail.transitionDir, evt.detail.transition, null, null);
		},

                _parse: function(text,id){
                        var container = dojo.create("DIV");
                        var view;
			var currentView  = this.getView();
                        var target = dijit.byId(id) && dijit.byId(id).containerNode ||
                                dojo.byId(id) ||
                                currentView  && currentView.domNode.parentNode ||
                                dojo.body();
                        if(text.charAt(0) == "<"){ // html markup
                                //container.innerHTML = text;
				var container = dojo.create("DIV",{innerHTML: text});
                                view = container.firstChild; // <div dojoType="dojox.mobile.View">
                                if(!view && view.nodeType != 1){
                                        alert("dojox.mobile._ItemBase#transitionTo: invalid view content");
                                        return;
                                }
                                view.style.visibility = "hidden";
                                target.appendChild(container);
                                var ws = dojo.parser.parse(container);
                                dojo.forEach(ws, function(w){
                                        if(w && !w._started && w.startup){
                                                w.startup();
                                        }
                                });
                                target.appendChild(target.removeChild(container).firstChild); // reparent
                                dijit.byNode(view)._visible = true;
                        }else if(text.charAt(0) == "{"){ // json
                                target.appendChild(container);
                                this._ws = [];
                                view = this._instantiate(eval('('+text+')'), container);
                                for(var i = 0; i < this._ws.length; i++){
                                        var w = this._ws[i];
                                        w.startup && !w._started && (!w.getParent || !w.getParent()) && w.startup();
                                }
                                this._ws = null;
                        }
                        view.style.display = "none";
                        view.style.visibility = "visible";
                        var id = view.id;
                        return dojo.hash ? "#" + id : id;
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
                                        if(!node){ // not to call View's startup()
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

mobileController = new Controller();
return Controller;
});

