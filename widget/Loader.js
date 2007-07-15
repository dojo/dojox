dojo.provide("dojox.widget.Loader");
dojo.experimental("dojox.widget.Loader"); 

dojo.require("dijit._Widget");
dojo.require("dijit._Templated"); 
dojo.require("dijit.util.place"); 

dojo.declare("dojox.widget.Loader",
	[dijit._Widget,dijit._Templated],
	null,
	{
	// summary: a configurable global xhr-listener to display
	// a loading message during running xhr's or to simply provide 
	// base-level topic to subscribe to for custom loading messages 

	// loadIcon: String
	// 	location to the icon used. 
	loadIcon: dojo.moduleUrl("dojox.widget.Loader","icons/loading.gif"),

	// loadMessage: String
	//	string to use for progress loading
	loadMessage: 'Loading ...',

	// hasVisuals: Boolean
	// 	true to display a fixed loading message in TR cornder, false to unly provide
	//	"Loader" topic to subscribe to for your own custom loading message.	
	hasVisuals: true,

	// attachToPointer
	// 	true to use visual indicator where cursor is
	attachToPointer: true,

	// duration: Integer
	//	time in ms to toggle in/out the visual load indicator
	duration: 125,

	// holder for mousemove connection
	_pointerConnect: null, 

	templateString: '<div dojoAttachPoint="loadNode" class="dojoxLoader">'
		+'<img src="${loadIcon}" class="dojoxLoaderIcon"> <span dojoAttachPoint="loadMessageNode" class="dojoxLoaderMessage"></span>'
		+'</div>',
	
	postCreate: function(){
		// summary: setup the loader

		if(!this.hasVisuals){ 
			this.loadNode.style.display = "none"; // _destroy()?
		}else{
			if(this.attachToPointer){
				dojo.removeClass(this.loadNode,"dojoxLoader"); 
				dojo.addClass(this.loadNode,"dojoxLoaderPointer"); 
			}
			this._hide();
		}
		this._setMessage(this.loadMessage); 

		// create our connections.  would be easier, and this might be redundant
		// if Deferred published something
		this.handle = dojo.connect(dojo,"_ioSetArgs",this,"_show"); 
		this.otherHandle = dojo.connect(dojo.Deferred.prototype,"_fire",this,"_hide"); 

	},

	_setMessage: function(/* String */ message){
		// summary: set's the message in the loader
		this.loadMessageNode.innerHTML = message;
	},

	_putLoader: function(/* Event */ e){
		// summary: place the floating loading element based on mousemove connection position
		// console.log('put image at: ',e.clientY,e.clientX); 
		dijit.util.placeOnScreen(this.loadNode,{ x: e.clientX+16, y:e.clientY+16 }, ["TL","BR"]); 
	},

	_show: function(){
		// summary: publish and show progress indicator
		dojo.publish("Loader",{ message: 'started' });
		if(this.hasVisuals){ 
			if(this.attachToPointer){
				this._pointerConnect = dojo.connect(document,"onmousemove",this,"_putLoader");
			}
			dojo.fadeIn({ node: this.loadNode, duration:this.duration }).play(); 
		}
	},

	_hide: function(){
		// summary: publish "xhr ended" and hide progress indicator
		dojo.publish("Loader", { message: 'ended' });
		if(this.hasVisuals){ 
			dojo.disconnect(this._pointerConnect); 
			dojo.fadeOut({ node: this.loadNode, duration:this.duration }).play();
		}
	}

});
