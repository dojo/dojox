dojo.provide("dojox.form.FileInputFlash");
dojo.require("dojox.embed.Flash");


dojo.experimental("dojox.form.FileInputFlash");

dojo.declare("dojox.form.FileInputFlash", null, {
	//summary: 
	
	//	uploadUrl: /* String */
	// 		The Url the file will be uploaded
	uploadUrl: "",			
	
	//	button: /* dijit.form.Button or a domNode */
	// REQUIRED: The button that when clicked, launches the Flash Upload dialog
	button:null,			
	
	// uploadOnChange: /* Boolean */
	// 		if true, begins upload immediately
	// 		leave false if you wish to display the text of the selection
	//		and present an "upload" button
	uploadOnChange: false, 	
	
	//	fieldName: /* String */
	//			The form field attribute. This will be needed by the server to get the value.
	//			If using the ReceiveFile.php test, leave this as-is.
	// TODO:fieldName:"uploadedfile",
	
	//selectMultipleFiles: /* Boolean */
	// 		Option to restrict to single-file upload, or allow
	// 		multi-file uploader
	selectMultipleFiles:true,
	
	// fileMask: /* Array[ Array[Description, FileTypes], Array[...]...] */
	// 		(an array, or an array of arrays)
	//		Restrict file selection to certain file types
	// Empty array defaults to "All Files"
	//
	// Usage:
	//	fileMask = ["Images", "*.jpg;*.jpeg;*.gif;*.png"]
	//	or
	//	fileMask = [
	//		["Jpeg File", 	"*.jpg;*.jpeg"],
	//		["GIF File", 	"*.gif"],
	//		["PNG File", 	"*.png"],
	//		["All Images", 	"*.jpg;*.jpeg;*.gif;*.png"],
	//	]
	//	NOTE: MacType is not supported, as it does not work very well.
	//			fileMask will work on a Mac, but differently than 
	//			Windows. The second example above in Windows will mask
	//			All but the selected file type, shown in a drop-down at
	//			the bottom of the system dialog. In Mac, all types in 
	//			all arrays will be shown and non-types masked.
	fileMask:[],
	
	_swfPath: dojo.moduleUrl("dojox.form", "resources/uploader.swf"),
	
	flashObject:null,
	flashMovie:null,
	
	constructor: function(options){
		console.log("Flash version detected:", dojox.embed.Flash.available);
		
		this.button = options.button;
		this.uploadUrl = options.uploadUrl;
		this.selectMultipleFiles = (options.selectMultipleFiles===undefined)?this.selectMultipleFiles:options.selectMultipleFiles;
		this.fileMask = options.fileMask || this.fileMask;
		this.uploadOnChange = false;
		this.id = options.id || dijit.getUniqueId("flashuploader");
		//console.warn("this.parseFileMask:", this.parseFileMask());
		var args = {
			path:this._swfPath.uri,
			width:1,
			height:1,
			// only pass in simple variables - no deep objects
			vars:{
				uploadUrl:this.uploadUrl, 
				uploadOnSelect:this.uploadOnChange,
				selectMultipleFiles:this.selectMultipleFiles,
				id:this.id,
				isDebug:true
			}
		};
		console.log("VARS:", args.vars)
		var flashDiv = dojo.doc.createElement("div");
		dojo.body().appendChild(flashDiv);
		dojo.style(flashDiv, "position", "absolute");
		dojo.style(flashDiv, "top", "0");
		dojo.style(flashDiv, "left", "0");
		
		dojo.subscribe(this.id+"/filesSelected", this, "onChange")
		dojo.subscribe(this.id+"/filesUploaded", this, "onComplete")
		this.flashObject = new dojox.embed.Flash(args, flashDiv);
		this.flashObject.onLoad = dojo.hitch(this, function(mov){
			this.flashMovie = mov;
			this.flashMovie.setFileMask(this.fileMask);
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
	}
	
});