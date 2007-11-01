dojo.provide("dojox.widget.FileInputAuto");

dojo.require("dojox.widget.FileInput");
dojo.require("dojo.io.iframe"); 

dojo.declare("dojox.widget.FileInputAuto",
	dojox.widget.FileInput,
	{
	// summary: An extension on dojox.widget.FileInput providing background upload progress
	//
	// description: An extended version of FileInput - when the user focuses away from the input
	//	the selected file is posted via dojo.io.iframe to the url. example implementation
	//	comes with PHP solution for handling upload, and returning required data.
	//	
	// notes: the return data from the io.iframe is used to populate the input element with 
	//	data regarding the results. it will be a JSON object, like:
	//	
	//	results = { size: "1024", filename: "file.txt" }
	//	
	//	all the parameters allowed to dojox.widget.FileInput apply

	// url: String
	// 	the URL where our background FileUpload will be sent
	url: "",

	// blurDelay: Integer
	//	time in ms before an un-focused widget will wait before uploading the file to the url="" specified
	//	default: 2 seconds
	blurDelay: 2000,

	// duration: Integer
	//	The time in ms to use as the generic timing mechanism for the animations
	//	set to 1 or 0 for "immediate respose"
	duration: 500,

	// uploadMessage: String
	//	
	//	FIXME: i18n somehow?
	uploadMessage: "Uploading ...", 
	
	_sent: false,

	// small template changes, new attachpoint: overlay
	templatePath: dojo.moduleUrl("dojox.widget","FileInput/FileInputAuto.html"),

	startup: function(){
		// summary: add our extra blur listeners
		this._blurListener = dojo.connect(this.fileInput,"onblur",this,"_onBlur");
		this._focusListener = dojo.connect(this.fileInput,"onfocus",this,"_onFocus"); 
		this.inherited("startup",arguments);
	},

	_onFocus: function(){
		// summary: clear the upload timer
		if(this._blurTimer){ clearTimeout(this._blurTimer); }
	},

	_onBlur: function(){
		// summary: start the upload timer
		if(this._blurTimer){ clearTimeout(this._blurTimer); }
		if(!this._sent){
			this._blurTimer = setTimeout(dojo.hitch(this,"_sendFile"),this.blurDelay);		
		}
	},


	setMessage: function(/*String*/title){
		// summary: set the text of the progressbar
		
		// FIXME: this throws errors in IE?!?!?!? egads.		
		this.overlay.innerHTML = title;	
	},
	
	_sendFile: function(/* Event */e){
		var i=0;
		// summary: triggers the chain of events needed to upload a file in the background.
		if(!this.fileInput.value){ return; }
		
		dojo.style(this.fakeNodeHolder,"display","none");
		dojo.style(this.overlay,"opacity","0");
		dojo.style(this.overlay,"display","block");

		this.setMessage(this.uploadMessage);

		dojo.fadeIn({ node: this.overlay, duration:this.duration }).play();

		var _newForm = document.createElement('form');
		_newForm.setAttribute("enctype","multipart/form-data");
		var node = dojo.clone(this.fileInput);
		_newForm.appendChild(this.fileInput);
		dojo.body().appendChild(_newForm);

		// no error checking :( we are a prototype
		dojo.io.iframe.send({
			url: this.url+"?name="+this.name,
			form: _newForm,
			handleAs: "text",
			// TODO: make this a setable callback
			handle: dojo.hitch(this,function(data,ioArgs){
				var d = dojo.fromJson(data);
				dojo.disconnect(this._blurListener); 
				if(d.status == "success"){ 
					// we should get this from ioArgs? or user-spcified callback?
					dojo.style(this.overlay,"opacity","0");
					dojo.style(this.overlay,"border","none");
					dojo.style(this.overlay,"background","none"); 
					var num = (Math.floor((d.details.size/1024)*100)/100);
					var size = (num>1) ? (num+"k") : (((num*1024)*100) + "bytes");
					this.overlay.innerHTML = "success:" + d.details.name + " " +size;
					this.overlay.style.backgroundImage = "none";
					this.fileInput.style.display = "none";
					this.fakeNodeHolder.style.display = "none";
					dojo.fadeIn({ node:this.overlay, duration:this.duration }).play(25);
					this.onComplete(d);
					this._sent = true;
					this.inputNode.value = d.details.name; 
				}
			}) 
		});
	},

	_onClick: function(e){
		// summary: accomodate our extra focusListeners
		if(this._blurTimer){ clearTimeout(this._blurTimer); }

		dojo.disconnect(this._blurListener);
		dojo.disconnect(this._focusListener);

		this.inherited("_onClick",arguments);

		this._blurListener = dojo.connect(this.fileInput,"onblur",this,"_onBlur");
		this._focusListener = dojo.connect(this.fileInput,"onfocus",this,"_onFocus"); 
	},

	onComplete: function(/* Object */data){
		// summary: stub function fired when an upload was successful to be overridden
	}
});

dojo.declare("dojox.widget.FileInputBlind",
	dojox.widget.FileInputAuto,
	{
	// summary: An extended version of dojox.widget.FileInputAuto
	//	that does not display an input node, but rather only a button
	// 	and otherwise behaves just like FileInputAuto
	
	startup: function(){
		// summary: hide our fileInput input field
		this.inherited("startup",arguments);
		this._off = dojo.style(this.inputNode,"width");
		this.inputNode.style.display = "none";
		this._fixPosition();
	},
	
	_fixPosition: function(){		
		// summary: in this case, set the button under where the visible button is 
		if(dojo.isIE){
			dojo.style(this.fileInput,"width","1px");
			//dojo.style(this.fileInput,"height",this.overlay.scrollHeight+"px")
		}else{
			dojo.style(this.fileInput,"left","-"+(this._off)+"px");
		}
	},

	_onClick: function(e){
		// summary: onclick, we need to reposition our newly created input type="file"
		this.inherited("_onClick",arguments);
		this._fixPosition(); 
	}
});
