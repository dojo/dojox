dojo.provide("dojox.form.FileInputFlash");
dojo.require("dojox.embed.Flash");


dojo.experimental("dojox.form.FileInputFlash");

dojo.declare("dojox.form.FileInputFlash", null, {
	//summary: 
	
	//	uploadUrl: /* String */
	// The Url the file will be uploaded
	uploadUrl: "",			
	
	//	button: /* dijit.form.Button or a domNode */
	// REQUIRED: The button that when clicked, launches the Flash Upload dialog
	button:null,			
	
	// uploadOnChange: /* Boolean */
	// if true, begins upload immediately
	// leave false if you wish to display the text of the selection
	//	and present an "upload" button
	uploadOnChange: false, 	
	
	//	fieldName: /* String */
	//	The form field attribute. This will be needed by the server to get the value.
	//	If using the ReceiveFile.php test, leave this as-is.
	// TODO:fieldName:"uploadedfile",
	
	_swfPath: dojo.moduleUrl("dojox.form", "resources/uploader.swf"),
	
	flashObject:null,
	flashMovie:null,
	
	constructor: function(options){
		this.button = options.button;
		this.uploadUrl = options.uploadUrl;
		this.uploadOnChange = false;//options.uploadOnChange;
		this.id = options.id || dijit.getUniqueId("flashuploader");
		console.warn("FileInputFlash: ", this._swfPath);	
		console.log("Flash version:", dojox.embed.Flash.available);
		
		var args = {
			path:this._swfPath.uri,
			width:1,
			height:1,
			vars:{
				uploadUrl:this.uploadUrl, 
				uploadOnSelect:this.uploadOnChange, 
				id:dijit.getUniqueId("flash")
			}
		}
		var flashDiv = dojo.doc.createElement("div");
		dojo.body().appendChild(flashDiv);
		dojo.style(flashDiv, "position", "absolute");
		dojo.style(flashDiv, "top", "0");
		dojo.style(flashDiv, "left", "0");
		
		dojo.subscribe("filesSelected", this, "onChange")
		dojo.subscribe("filesUploaded", this, "onComplete")
		this.flashObject = new dojox.embed.Flash(args, flashDiv);
		this.flashObject.onLoad = dojo.hitch(this, function(mov){
			this.flashMovie = mov;													
		})
		dojo.connect(this.button, "onClick", this, "openDialog");
	},
	
	onChange: function(data){
		console.warn("onChange:", data)	
	},
	
	openDialog: function(evt){
		this.flashMovie.openDialog();
	},
	
	upload: function(){
		console.log("upload", (!this.uploadOnChange));
		if(!this.uploadOnChange){
			this.flashMovie.doUpload();
		}
	},
	
	onComplete: function(data){
		console.warn("onComplete:", data);
	},
	
	_registerCallback: function(strThisCallback){
		var strFunc = this.id+"_"+strThisCallback;
		var self = this;
		dojo.global[strFunc] = function(data){ // FIXME: Make this some namespace
			self[strThisCallback](data);
		}
		return strFunc;
	}
	
});