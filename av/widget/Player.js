dojo.provide("dojox.av.widget.Player");
dojo.require("dijit._Widget");
dojo.require("dijit._Templated");



dojo.declare("dojox.av.widget.Player", [dijit._Widget, dijit._Templated], {
	
	//
	// playerWidth: /* Number or String */
	//		Sets the width of the player (not the video size)
	//		Number will be converted to pixels
	//		String will be used literally. EX: "320px" or "100%"
	playerWidth: "480px", 
	//
	// TODO:
	//playerHeight
	//videoWidth: 320,
	//videoHeight: 240,
	
	widgetsInTemplate:true,
	templatePath: dojo.moduleUrl("dojox.av.widget","resources/Player.html"),
	
	_fillContent: function(){ 
		if(!this.items && this.srcNodeRef){
			this.items = [];
			var nodes = dojo.query("*", this.srcNodeRef);
			dojo.forEach(nodes, function(n){
				this.items.push(n);
			}, this);
		}
	},
	
	postCreate: function(){
		dojo.style(this.domNode, "width", this.playerWidth+(dojo.isString(this.playerWidth)?"":"px"));
		
		if(dojo.isString(this.playerWidth) && this.playerWidth.indexOf("%")){
			dojo.connect(window, "resize", this, "onResize");	
		}
		this.children = [];
		var domNode;
		dojo.forEach(this.items, function(n, i){
			n.id = dijit.getUniqueId("player_control");
			switch(dojo.attr(n, "controlType")){
				case "play":
					this.playContainer.appendChild(n); break;
				case "volume" :
					this.controlsBottom.appendChild(n);	break;
				case "status" :
					this.statusContainer.appendChild(n);	break;
				case "progress":
				case "slider":
					this.progressContainer.appendChild(n);	break;
				case "video":
					this.mediaNode = n;
					this.playerScreen.appendChild(n);	break;
				default:
					
			}
			this.items[i] = n.id;
		}, this);
		
	},
	startup: function(){
		
		this.media = dijit.byId(this.mediaNode.id);
		if(!dojo.isAIR){
			dojo.style(this.media.domNode, "width", "100%");
			dojo.style(this.media.domNode, "height", "100%");
		}
		
		//dojo.style(this.media.domNode, "width", this.videoWidth+(dojo.isString(this.playerWidth)?"":"px"));
		//dojo.style(this.media.domNode, "height", this.videoHeight+(dojo.isString(this.playerWidth)?"":"px"));
		
		dojo.forEach(this.items, function(id){
			if(id!=this.mediaNode.id){
				var child = dijit.byId(id);
				this.children.push(child);							  
				child.setMedia(this.media);
			}
		}, this);
		
	},
	onResize: function(evt){
		var dim = dojo.marginBox(this.domNode);
		if(this.media.onResize){
			this.media.onResize(dim);	
		}
		dojo.forEach(this.children, function(child){
			if(child.onResize){
				child.onResize(dim);
			}
		});
	}

});