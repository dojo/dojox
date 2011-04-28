define(["./common","dijit/_WidgetBase","dijit/_Container","dijit/_Contained","./View","./ProgressIndicator"], function(mcommon,WidgetBase,Container,Contained,View,ProgressIndicator){
	// module:
	//		dojox/mobile/_ItemBase
	// summary:
	//		TODOC

	return dojo.declare("dojox.mobile._ItemBase", [WidgetBase,Container,Contained],{
		icon: "",
		iconPos: "", // top,left,width,height (ex. "0,0,29,29")
		alt: "",
		href: "",
		hrefTarget: "",
		moveTo: "",
		scene: "",
		clickable: false,
		url: "",
		urlTarget: "", // node id under which a new view is created
		transition: "",
		transitionDir: 1,
		callback: null,
		sync: true,
		label: "",
		toggle: false,
		_duration: 800, // duration of selection, milliseconds
	
		inheritParams: function(){
			var parent = this.getParent();
			if(parent){
				if(!this.transition){ this.transition = parent.transition; }
				if(!this.icon){ this.icon = parent.iconBase; }
				if(!this.iconPos){ this.iconPos = parent.iconPos; }
			}
		},
	
		findCurrentView: function(moveTo){
			var w;
			if(moveTo){
				w = dijit.byId(moveTo);
				if(w){ return w.getShowingView(); }
			}
			w = this;
			while(true){
				w = w.getParent();
				if(!w){ return null; }
				if(w instanceof dojox.mobile.View){ break; }
			}
			return w;
		},
	
		setTransitionPos: function(e){
			var w = this.findCurrentView(null); // the current view widget
			if(w){
				w.clickedPosX = e.clientX;
				w.clickedPosY = e.clientY;
			}
		},
	
		transitionTo: function(moveTo, href, url, scene){
			if(!moveTo && !href && !url && !scene){ return; }
			var w = this.findCurrentView(moveTo); // the current view widget
			if(!w || moveTo && w === dijit.byId(moveTo)){ return; }
			if(href){
				if(this.hrefTarget){
					dojox.mobile.openWindow(this.href, this.hrefTarget);
				}else{
					w.performTransition(null, this.transitionDir, this.transition, this, function(){location.href = href;});
				}
				return;
			} else if(scene){
				dojo.publish("/dojox/mobile/app/pushScene", [scene]);
				return;
			}
			if(url){
				var id;
				if(dojox.mobile._viewMap && dojox.mobile._viewMap[url]){
					// external view has already been loaded
					id = dojox.mobile._viewMap[url];
				}else{
					// get the specified external view and append it to the <body>
					var text = this._text;
					if(!text){
						if(this.sync){
							text = dojo.trim(dojo._getText(url));
						}else{
							require(["dojo/_base/xhr"], function(xhr){	
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
										this.transitionTo(moveTo, href, url, scene);
									}
								}));
								xhr.addErrback(function(error){
									prog.stop();
									alert("Failed to load "+url+"\n"+(error.description||error));
								});
							});
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
				w = this.findCurrentView(moveTo) || w; // the current view widget
			}
			w.performTransition(moveTo, this.transitionDir, this.transition, this.callback && this, this.callback);
		},
	
		_parse: function(text){
			var container = dojo.create("DIV");
			var view;
			var id = this.urlTarget;
			var target = dijit.byId(id) && dijit.byId(id).containerNode ||
				dojo.byId(id) ||
				dojox.mobile.currentView && dojox.mobile.currentView.domNode.parentNode ||
				dojo.body();
			if(text.charAt(0) == "<"){ // html markup
				container.innerHTML = text;
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
		},
	
		select: function(/*Boolean?*/deselect){
			// subclass must implement
		},
	
		defaultClickAction: function(){
			if(this.toggle){
				this.select(this.selected);
			}else if(!this.selected){
				this.select();
				if(!this.selectOne){
					var _this = this;
					setTimeout(function(){
						_this.select(true);
					}, this._duration);
				}
				if(this.moveTo || this.href || this.url || this.scene){
					this.transitionTo(this.moveTo, this.href, this.url, this.scene);
				}
			}
		},
	
		getParent: function(){
			// almost equivalent to _Contained#getParent, but this method does not
			// cause a script error even if this widget has no parent yet.
			var ref = this.srcNodeRef || this.domNode;
			return ref && ref.parentNode ? dijit.getEnclosingWidget(ref.parentNode) : null;
		}
	});
});
