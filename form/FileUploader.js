dojo.provide("dojox.form.FileUploader");
dojo.experimental("dojox.form.FileUploader");
var swfPath = dojo.config.uploaderPath || dojo.moduleUrl("dojox.form", "resources/uploader.swf");

dojo.require("dojox.embed.Flash");
dojo.require("dojo.io.iframe");
dojo.require("dojox.html.styles");

dojo.declare("dojox.form.FileUploader", null, {
	// summary: 
	// 		Handles File Uploading to a server (PHP script included for testing)
	//		Does *NOT* create a button, it transforms a button into an uploader. 
	//		This can be used for toolbar buttons for example.
	//
	// description:
	//		If the correct version of Flash Player is available (> 9.0) , a SWF
	//		is used. If Flash Player is not installed or is outdated, a typical
	//		html fileInput is used. This process can be overridden with
	//		force:"flash" or force:"html".
	//
	//		FileUploader now works with Flash 10, but it comes with consequences.
	//		Instead of calling to open the browse dialog with script, we HAVE to
	//		click a Flash button. Therefore, we are floating a SWF over the 'fake'
	//		button just like we do with the fileInput. As a result, the Flash 
	//		uploader will have the same CSS problems as the fileInput.
	//
	//	NEW FEATURES - 
	//		You can now pass in POST data that will be posted to the server along
	//		with the Flash uploaded files. Also, you can now specify the field name
	//		that the server expects the files to be in.
	//
	//	CDN USERS - 
	//		FileUpload now works with the CDN but with limitations. The SWF must 
	//		be from the same domain as the HTML page. 'swfPath' has been exposed
	//		so that you may link to that file (could of course be the same SWF in 
	//		dojox resource folder). The SWF will *NOT* work from the
	//		CDN server. This would require a special XML file that would allow 
	//		access to your server, and the logistics to that is impossible.
	//		
	// LIMITATIONS -
	//		Because of the nature of this "hack" - floating a zero-opacity fileInput
	//		over a "fake" button - this won't work in all circumstances. For instance
	//		you couldn't put a fileInput in a scrolling div. Some complicated CSS can 
	//		mess up the placement - or for that matter, some simple, but not expected
	//		CSS can mess up the placement. Being near the botton of a complex document
	//		can throw off the positioning. The positioning methods have been exposed
	//		for over-writing in these cases.
	//
	//	OPERA USERS -
	//		Not much love from Opera on FileInput hacks. Should still work with 
	//		the Flash 10 hack though.
	//
	//	ALSO - 
	//		Only works programmatically. Does not work in markup. Use the other
	//		other FileInput files for markup solutions.
	//
	//	example:
	//		|	var f1 = new dojox.form.FileUploader({
	//		|		id:"upload_1",
	//		|		devMode:false,
	//		|		isDebug:false,
	//		|		button:dijit.byId("btn1"), 
	//		|		uploadUrl:"www.absolutelUrl.com/upload.php", 
	//		|		uploadOnChange:true
	//		|	});
	//		|	dojo.connect(f1, "onChange", "handleChange");
	//		|	dojo.connect(f1, "onComplete", "onComplete");
	//
	// arguments:
	//
	// degradable: REMOVED
	//
	//	isDebug: Boolean
	//		If true, outputs traces from the SWF to console. What exactly gets passed
	//		is very relative, and depends upon what traces have been left in the DEFT SWF.
	isDebug:false,
	//
	//	devMode: Boolean.
	//		If true, gives a red overlay to the Flash button and the HTML fileInput button's
	//		opcaity is set to 1.0. Since this code uses some crazy CSS to get the uploaders 
	//		to hover over the 'fake' button, there is no garuantee that it will work in all 
	//		cases. Set this param to true to see if the button is properly positioned.
	//		Methods may be called over over-written to help in this case.
	devMode:false,
	//
	//	id: String
	//		The object id, just like any other widget in Dojo. However, this id
	//		is also used as a reference for the SWF
	id:"",
	//
	//	uploadUrl: String
	// 		REQUIRED: The Url to where the file will be uploaded
	uploadUrl: "",
	//
	//	button: dijit.form.Button or a domNode
	// 		REQUIRED: The button that when clicked, launches the upload dialog
	button: null,
	//
	//	uploadOnChange: Boolean
	//		If true, uploads imeediately after a file has been selected. If false,
	//		waits for upload() to be called.
	uploadOnChange: false,
	//	selectMultipleFiles: Boolean
	//		If true and flash mode, multiple files may be selected from the dialog.
	//		If html mode, files are not uploaded until upload() is called. The references
	//		to each file is incremented:uploadedfile0, uploadedfile1, uploadedfile2... etc.
	selectMultipleFiles: true,
	//
	//	htmlFieldName: String
	//		The name of the field of the fileInput that the server is expecting
	htmlFieldName:"uploadedfile",
	//
	//	flashFieldName: String
	//		The name of the field of the flash uploaded files that the server is expecting
	flashFieldName:"flashUploadFiles",
	// fileMask:  Array[ Array[Description, FileTypes], Array[...]...] 
	// 		(an array, or an array of arrays)
	//		Restrict file selection to certain file types
	// 		Empty array defaults to "All Files"
	// example:
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
	//			Windows.
	fileMask: [],
	//
	//	force: String
	//			options:
	//				"flash" forces Flash Uploader
	//				"html" forces HTML fileInput
	//				"" checks availability of the proper Flash player
	force:"",
	//
	//	postData: Object
	//		FLASH ONLY - In HTML, append the vars to the uploadUrl
	//		Sends data via POST to the server along with the uploaded
	//		files.
	//	NEW:
	//		You can also pass postData in the upload method
	//		which can be different with each upload
	postData:null,
	//
	//	swfPath: String
	// 		optional: pass in a path to your own SWF file uploader. defaults to the one in dojox.
	//		CDN USERS NOTE: For the Flash Uploader to work via CDN, the SWF must be from the 
	//		same server as the HTML page. Pass the link to that file here.
	swfPath: swfPath,
	//
	//	minFlashVersion: Number
	//		Internal. Version of Flash Player to check for. Thi may be over-written
	//		for testing.
	minFlashVersion: 9,
	//
	//	uploaderType: String
	//		Internal.
	uploaderType:"",
	//
	//	flashObject: dojox.embed.Flash 
	//		The object that creates the SWF embed object. Mostly Internal.
	flashObject: null,
	//
	//	flashMovie: Function
	//		The SWF. Mostly Internal.
	flashMovie: null,
	//
	//	flashDiv: HTMLNode
	//		The div that holds the SWF. While mostly internal, ccould be accessed 
	//		for advanced positioning.
	flashDiv: null,
	//
	//	domNode: HTMLNode
	//either flash div or fileInput, depending on type
	domNode:null, 
	
	constructor: function(options){
		// summary:
		//		Calling init function instead of doing operations in 
		//		constructor, to allow for patches and over-writes.
		//
		this.init(options);
	},
	
	log: function(){
		//	summary:
		//		Due to the excessive logging necessary to make this code happen,
		//		It's easier to turn it on and off here in one place.
		//		Also helpful if there are multiple uploaders on one page.
		if (this.isDebug) {
			console.log.apply(console, arguments);
		}
	},
	
	init: function(options){
		//	summary:
		//		Determine which uploader to use and initialize it.
		//
		dojo.mixin(this, options);
		//this.isDebug = true;
		console.info("isdebug:", this.isDebug, options.isDebug, this.id)
		this.id = this.id || dijit.getUniqueId("uploader");
		dijit.registry.add(this);
		this.log("init Flash:", (dojox.embed.Flash.available >= this.minFlashVersion || this.force=="flash"), dojox.embed.Flash.available >= this.minFlashVersion, this.force=="flash")
		
		this.fileList = [];
		this._subs = [];
		this._cons = [];
		
		if((dojox.embed.Flash.available >= this.minFlashVersion || this.force=="flash") && this.force!="html"){
			this.uploaderType = "flash";
			this.createFlashUploader();
		}else{
			this.uploaderType = "html";
			
			this.fileInputs = [];
			this.fileCount = 0;
			
			if (dojo.isIE && dojo.isIE<7) {
				// if we are create more than one FileInputOverlay,
				// IE6 needs a breather or it locks up
				setTimeout(dojo.hitch(this, "createHtmlUploader"), 1);
			}
			else {
				this.createHtmlUploader();
			}
		}
	},
	
	onMouseDown: function(evt){
		// summary:
		//		Fired when upload button is down
		//		Stub to which user can connect
	},
	
	onMouseUp: function(evt){
		// summary:
		//		Fired when upload button is up
		//		Stub to which user can connect
	},
	
	onMouseOver: function(evt){
		// summary:
		//		Fired when upload button is over
		// 		Can be connected to for manipulating hover state
		if (this.button.domNode) {
			dojo.addClass(this.button.domNode, "dijitButtonHover dijitHover");
		}
	},
	
	onMouseOut: function(evt){
		// summary:
		//		Fired when upload button is off
		// Can be connected to for manipulating hover state
		if (this.button.domNode) {
			dojo.removeClass(this.button.domNode, "dijitButtonHover dijitHover");
		}
	},
	/*onClick: function(){
		// summary:
		//		Fired when upload button is up
		//		Stub to which user can connect
	},*/
	
	onChange: function(dataArray){
		//	summary:
		// 		stub to connect 
		// 		Fires when files are selected
		// 		Event is an array of last files selected
	},
	
	onProgress: function(dataArray){
		// summary:
		// 		Stub to connect 
		// 		Fires as progress returns from SWF
		// 		Event is an array of all files uploading
		//		Can be connected to for HTML uploader,
		//		but will not return anything.
	},
	
	onComplete: function(dataArray){
		// summary
		// stub to connect 
		// Fires when all files have uploaded
		// Event is an array of all files
	},
	
	onCancel: function(){
		// summary:
		// 		Stub to connect 
		// 		Fires when dialog box has been closed 
		//		without a file selection
		this.log("Upload Canceled")
	},
	
	onError: function(evtObject){
		//FIXME: Unsure of a standard form for receieving errors
		var type = evtObject.type ? evtObject.type.toUpperCase() : "ERROR";
		var msg = evtObject.msg ? evtObject.msg : evtObject;
		console.warn("FLASH/ERROR/"+type , msg);
	},
	
	upload: function(/*Object ? */data){
		// summary:
		// 		When called, begins file upload
		//	data: Object
		//		postData to be sent to server
		if(data){
			this.postData = data;
		}
		this.log("upload type:", this.uploaderType, " - postData:", this.postData);
		
		if (this.uploaderType == "flash") {
			try{
				this.flashMovie.doUpload(this.postData);	
			}catch(err){
				throw new Error("Sorry, the SWF failed to initialize properly. The page will have to be refreshed. ERROR:" + err)
			}
			
		}else{
			//this.log("POST FORM")
			//this.log("FORM:", this._formNode)
			//this.log("FILE:")
			dojo.io.iframe.send({
				url: this.uploadUrl,
				form: this._formNode,
				handleAs: "json",
				handle: dojo.hitch(this, function(data, ioArgs, widgetRef){
					this._complete([data]);
					//this._complete(this.selectMultipleFiles ? data : [data]);
				})
			});
		}
	},
	
	setPosition: function(){
		//	summary:
		//		Positions the upload button over the 'fake' button.
		//		This method is called on init, and may be called 
		//		for various other reasons, for example, when the browser 
		//		window is resized. Also, this code detects if the 
		//		upload button is within a Dijit Dialog, and calls
		//		this method when the Dialog is dragged. Whenever the 
		//		DOM has been redrawn, you should call this method.
		if (this.uploaderType == "flash") {
			this.setFlashPosition();
		}else{
			this.setHtmlPosition();
		}
	},

	hide: function(){
		//	summary:
		//		Hides the upload button. This is called
		//		when within a dialog.
		dojo.style(this.domNode, "display", "none");
	},
	
	show: function(){
		//	summary:
		//		Shows the upload button. This is called
		//		when within a dialog.
		dojo.style(this.domNode, "display", "");
	},
	
	disable: function(/*Boolean*/disabled){
		// summary:
		//	This method is connected to the "fake" dijit
		//	button, and hides and shows on the disabling.
		//	If the "fake" button is a dom node, this method
		//	would need to be called directly.
		if(disabled){
			this.hide();
		}else{
			this.show();
		}
	},
	destroyAll: function(){
		//	summary:
		// 		Destroys everything including 'fake' button
		if (this.button.destroy) {
			this.button.destroy();
		}else{
			dojo.destroy(this.button);
		}
		this.destroy();
	},
	
	destroy: function(){
		//	summary:
		//		Destroys flash
		//		TODO: This doesn't look complete. HTML?
		if (this.uploaderType == "flash" && !this.flashMovie) {
			this._cons.push(dojo.connect(this, "onLoad", this, "destroy"));
			return;
		}
		dojo.forEach(this._subs, function(s){
			dojo.unsubscribe(s);
		});
		dojo.forEach(this._cons, function(c){
			dojo.disconnect(c);
		});
		
		if (this.uploaderType == "flash") {
			this.flashObject.destroy();
			dojo.destroy(this.flashDiv);
		}
	},
	
	
	
	
	createFlashUploader: function(){
		//	summary
		//		Create embedded SWF
		this.log("FLASH")
		var uurl = this.uploadUrl.toLowerCase();
		if(uurl.indexOf("http")<0 && uurl.indexOf("/")!=0){
			// Appears to be a relative path. Attempt to 
			//	convert it to absolute, so it will better 
			//target the SWF.
			//
			var loc = window.location.href.split("/");
			loc.pop();
			loc = loc.join("/")+"/";
			//this.log("Fix Relative url:", this.uploadUrl);
			this.uploadUrl = loc+this.uploadUrl;
			//this.log("SWF Fixed - Relative loc:", loc, " abs loc:", this.uploadUrl);
		}else{
			//this.log("SWF did not fix upload URL");
		}
		
		
		var dim = this.getFakeButtonSize();
		
		// the size of the embedded SWF, not it's containing DIV 
		var w = "100%";
		var h = "100%";
		var args = {
			expressInstall:true,
			path: this.swfPath.uri || this.swfPath,
			width: w,
			height: h,
				allowScriptAccess:"always",
				allowNetworking:"all",
			// only pass in simple variables - no deep objects
			vars: {
				uploadDataFieldName: this.flashFieldName,
				uploadUrl: this.uploadUrl,
				uploadOnSelect: this.uploadOnChange,
				selectMultipleFiles: this.selectMultipleFiles,
				id: this.id,
				//width:w, ///   width and height mess up the embed query string. very strange.
				//height:h,
				isDebug: this.isDebug,
				devMode:this.devMode
			},
			params: {
				wmode:"transparent"
			}
		};
		if(args.vars.isDebug && window.console && window.console.dir){
			
			window.passthrough = function(){
				console.log.apply(console, arguments);
			}
			window.passthrough("Flash trace enabled.")
		}else{
			window.passthrough = function(){}
		}
		//this.log("ARG VARS:", args.vars)
		this.flashDiv = dojo.doc.createElement("div");
		this.domNode = this.flashDiv;
		dojo.body().appendChild(this.flashDiv);
		
		this._connectFlash();
		
		// Flash 10 BUG
		// Must set the position before creating the embed object
		//	or it will get created twice - seems okay after
		this.setPosition();
		
		this.flashObject = new dojox.embed.Flash(args, this.flashDiv);
		this.flashObject.onError = function(msg){
			console.warn("Flash Error:", msg);
		}
		this.flashObject.onLoad = dojo.hitch(this, function(mov){
			this.log("ONLOAD", mov)
			this.flashMovie = mov;
			this.setFlashVars();
		});
		
		
	},
	
	setFlashVars: function(){
		
		this.flashMovie.setFileMask(this.fileMask);
		this.flashMovie.setPostData(this.postData);
		console.log("setFlashVars / postData --------> ", this.postData);
		return;
		try{	
			this.flashMovie.setFileMask(this.fileMask);
			if(this.postData){
				this.flashMovie.setPostData(this.postData);
			}
		}catch(e){
			if(this.setvarTries===undefined) this.setvarTries = 0;
			this.setvarTries++
			if(this.setvarTries<10){
				setTimeout(dojo.hitch(this, "setFlashVars"), 500);	
			}else{
				console.warn("Tried to set Flash Vars and Post data but failed.")
			}
			
		}
			
	},
	
	createHtmlUploader: function(){
		// summary:
		// 		Create the fileInput overlay
		//
		if (!this.button.id) {
			this.button.id = dijit.getUniqueId("btn");
		}
		var node;
		if (this.button.domNode) {
			//this.log(this.button.domNode);this.log(this.button.id);this.log(dojo.byId(this.button.id))
			node = dojo.byId(this.button.id).parentNode.parentNode;
			// killing this event on the dijit button - it takes over the FileInput
			node.parentNode.onmousedown = function(){}
		}else {
			node = this.button.parentNode;
		}
		
		this._buildForm(node);
		
		this._buildFileInput(node);
		
		this.setPosition();
		
		this._connectInput();
		
		
	},
	
	setFlashPosition: function(){
		//	summary:
		//		Get size and location of the 'fake' node (the button)
		//		Resize, set position of the SWF
		var dim = this.getFakeButtonSize();
		// IE mainly needs the help for the timeout.
		// but may as well do it for all then the check
		// for whether we are in a dialog 
		setTimeout(dojo.hitch(this, function(){
			dojo.style(this.flashDiv, {
				position:"absolute",
				top: dim.y + "px",
				left: dim.x + "px",
				width: dim.w + "px",
				height: dim.h + "px",
				zIndex: 2001
			});
			this.log("this.flashDiv:", this.flashDiv)
		}), 100);
	},
	
	setHtmlPosition: function(){
		// summary:
		//		Get size and location of the 'fake' node (the button)
		//		Resize, set position, and clip the 'real' button (the fileInput)	
		// 		setPosition will fire on browser resize. The button may wrap to a different position
		//		and sometimes it just shifts slightly in the html, maybe because of the scrollbar.
		//
		var fake = this.getFakeButtonSize();
		
		// could memoize this, but it at 2-5ms, doesn't seem quite worth it.
		var real = dojo.marginBox(this._fileInput);
		// Now we have an extremely large fileInput button and field.
		//	We mask the areas that extend passed the boundaries of the button.
		//	Thanks to quirksmode for this hack.
		var clip = "rect(0px " + real.w + "px " + fake.h + "px " + (real.w - fake.w) + "px)";
		this._fileInput.style.clip = clip;
		
		// absolutely position the fileInput.
		this._fileInput.style.left = (fake.x + fake.w - real.w) + "px";
		this._fileInput.style.top = fake.y + "px";
		
		//PATCH
		this._fileInput.style.zIndex = 2001;
	},
	
	_connectFlash: function(){
		// 	summary:
		//		Subscribing to published topics coming from the
		//		Flash uploader.
		// 	description:
		//		Sacrificing some readbilty for compactness. this.id
		//		will be on the beginning of the topic, so more than
		//		one uploader can be on a page and can have unique calls.
		//
		this._doSub("/filesSelected", "_change");
		this._doSub("/filesUploaded", "_complete");
		this._doSub("/filesProgress", "_progress");
		this._doSub("/filesError", "_error");
		this._doSub("/filesCanceled", "onCancel");
		
		this._doSub("/up", "onMouseUp");
		this._doSub("/down", "onMouseDown");
		this._doSub("/over", "onMouseOver");
		this._doSub("/out", "onMouseOut");
		this._connectCommon();
	},
	
	_doSub: function(subStr, funcStr){
		this._subs.push(dojo.subscribe(this.id + subStr, this, funcStr));
	},
	
	_connectInput: function(){
		this._disconnect();
		this._cons.push(dojo.connect(this._fileInput, "mouseover", this, function(evt){
			this.onMouseOver(evt);
		}));
		this._cons.push(dojo.connect(this._fileInput, "mouseout", this, function(evt){
			this.onMouseOut(evt);
			this._checkHtmlCancel("off");
		}));
		this._cons.push(dojo.connect(this._fileInput, "mousedown", this, function(evt){
			this.onMouseDown(evt);
		}));
		this._cons.push(dojo.connect(this._fileInput, "mouseup", this, function(evt){
			this.onMouseUp(evt);
			this._checkHtmlCancel("up");
		}));
		
		this._cons.push(dojo.connect(this._fileInput, "change", this, function(){
			console.log("html change")
			this._checkHtmlCancel("change");
			this._change([{
				name: this._fileInput.value,
				type: "",
				size: 0
			}]);
		}));
		this._connectCommon();
		
	},
	
	_connectCommon: function(){
		this._cons.push(dojo.connect(window, "resize", this, "setPosition"));
		// a bit of a hack...
		// if all else fails, and the stupid button still isn't
		// in position, if the fakeButton is clicked on, that
		// will move it. Would require two clicks in this case.
		if(this.button.domNode){
			this._cons.push(dojo.connect(this.button, "onClick", this, "setPosition"));	
		}else{
			this._cons.push(dojo.connect(this.button, "click", this, "setPosition"));
		}
		var dialog = this._dialogParent();
		if(dialog){
			this._cons.push(dojo.connect(dialog, "show", this, function(){
				this.show();
				this.setPosition();
			}));	
			this._cons.push(
				dojo.connect(dialog, "hide", this, "hide"),
				dojo.connect(dialog, "destroy", this, "destroy") // this one may not be needed
			);
			this._subs.push(dojo.subscribe("/dnd/move/stop",this,"setPosition"));
		}
		if(this.button.domNode){
			this._cons.push(dojo.connect(this.button, "_setDisabledAttr", this, "disable"));
		}
		// in some cases, mainly due to scrollbars, the buttons
		//	are initially misplaced
		setTimeout(dojo.hitch(this, "setPosition"), 500);
	},
	_checkHtmlCancel: function(mouseType){
		if(mouseType=="change"){
			this.dialogIsOpen = false;
		}
		if(mouseType=="up"){
			this.dialogIsOpen = true;
		}
		if(mouseType=="off"){
			this.dialogIsOpen = false;
			this.onCancel();
		}
	},
	_error: function(evt){
		this.onError(evt);
	},
		
	_change: function(dataArray){
		this.fileList = this.fileList.concat(dataArray);
		this.onChange(dataArray);
		if (this.uploadOnChange) {
			this.upload();
		}
	},
	
	_complete: function(dataArray){
		this.log("_complete", dataArray);
		for (var i = 0; i < this.fileList.length; i++) {
			this.fileList[i].percent = 100;
		}
		this._progress(this.fileList);
		this.fileList = [];
		
		this.onComplete(dataArray);
	},
	
	_progress: function(dataObject){
		this.log("_progress", dataObject);
		for (var i = 0; i < this.fileList.length; i++) {
			var f = this.fileList[i];
			if (f.name == dataObject.name) {
				f.bytesLoaded = dataObject.bytesLoaded;
				f.bytesTotal = dataObject.bytesTotal;
				f.percent = Math.ceil(f.bytesLoaded / f.bytesTotal * 100);
			}
			else {
				if (!f.percent) {
					f.bytesLoaded = 0;
					f.bytesTotal = 0;
					f.percent = 0;
				}
			}
		}
		this.onProgress(this.fileList);
		
	},
	
	_dialogParent: function(){
		var dialog;
		var node = this.button.domNode || this.button;
		for(var i=0;i<50;i++){
			if(node.tagName.toLowerCase()=="body"){
				node = null;
				break;
			}
			if(node.tagName && node.tagName.toLowerCase()=="div" && (dojo.attr(node, "widgetId") || dojo.attr(node, "widgetid"))){
				dialog = dijit.byNode(node);
				if(dialog.titleBar && dialog.titleNode){
					break;	
				}else{
					dialog = null; // keep looking
				}
				
			}
			node = node.parentNode;
		}
		//console.warn("INNA DIALOG:", i, dialog)
		return dialog;
	},
	_disconnect: function(){
		dojo.forEach(this._cons, function(c){
			dojo.disconnect(c);
		});
	},
	
	_buildFileInput: function(node){
		// summary
		//	Build the fileInput field
		//
		if (this._fileInput) {
			//this._formNode.removeChild(this._fileInput);
			this._disconnect();
			dojo.style(this._fileInput, "display", "none");
		}
		this._fileInput = document.createElement('input');
		this.domNode = this._fileInput;
		this._fileInput.setAttribute("type", "file");
		this.fileInputs.push(this._fileInput);
		// server will need to know this variable:
		var nm = this.htmlFieldName;
		var _id = this.id;
		if (this.selectMultipleFiles) {
			nm += this.fileCount;
			_id += this.fileCount;
			this.fileCount++;
		}
		this.log("NAME:", nm, this.htmlFieldName, this.fileCount);
		this._fileInput.setAttribute("id", this.id);
		this._fileInput.setAttribute("name", nm);
		dojo.addClass(this._fileInput, "dijitFileInputReal");
		
		if(this.devMode){
			dojo.style(this._fileInput, "opacity", 1)
		}
		
		this._formNode.appendChild(this._fileInput);
		
	},
	
	_removeFileInput: function(){
		dojo.forEach(this.fileInputs, function(inp){
			inp.parentNode.removeChild(inp);
		});
		this.fileInputs = [];
		this.fileCount = 0;
	},
	
	_buildForm: function(node){
		// summary:
		//		Build the form that holds the fileInput
		//		This form also holds the class that targets
		//		the input to change its size
		//
		if (this._formNode) return;
		
		if (dojo.isIE) {
			// just to reiterate, IE is a steaming pile of code. 
			this._formNode = document.createElement('<form enctype="multipart/form-data" method="post">');
			this._formNode.encoding = "multipart/form-data";
			
		}
		else {
			// this is how all other sane browsers do it
			this._formNode = document.createElement('form');
			this._formNode.setAttribute("enctype", "multipart/form-data");
		}
		this._formNode.id = dijit.getUniqueId("form");
		if (node && dojo.style(node, "display").indexOf("inline") > -1) {
			document.body.appendChild(this._formNode);
		}
		else {
			node.appendChild(this._formNode);
		}
		this._setHtmlPostData();
		this._setFormStyle();
	},
	_setHtmlPostData: function(){
		if(this.postData){
			for (var nm in this.postData) {
				var f = document.createElement('input');
				dojo.attr(f, "type", "hidden");
				dojo.attr(f, "name", nm);
				dojo.attr(f, "value", this.postData[nm]);
				this._formNode.appendChild(f);
			}
		}
	},
	
	
	_setFormStyle: function(){
		// summary:
		//		Apply a dynamic style to the form and input
		//	description:
		// 		YAY! IE makes us jump through more hoops!
		//		We want to make the fileInput's button large enough to cover our
		//		fake button, and we do this with fontSize=(x)em.
		// 		It seems that after you build a fileInput, it's too late to style it. IE 
		//		styles the input field, but not the button. 
		//		To style the button, we'll create a class that fits, apply it to the form, 
		//		then it will cascade down properly. Geez.
		//
		// 		If the fake button is bigger than the fileInput, we need to resize
		//		the fileInput. Due to browser security, the only consistent sizing 
		//		method is font EMs. We're using a rough formula here to determine 
		//		if the fake button is very tall or very wide, and resizing based
		//		on the result.
		// 		We want a minimum of 2em, because on a Mac, system buttons have 
		//		rounded corners. The larger size moves that corner out of position
		var fake = this.getFakeButtonSize();
		var size = Math.max(2, Math.max(Math.ceil(fake.w / 60), Math.ceil(fake.h / 15)));
		
		// Now create a style associated with the form ID
		dojox.html.insertCssRule("#" + this._formNode.id + " input", "font-size:" + size + "em");
	},
	

	getFakeButtonSize: function(){
			// summary:
			//		Get the size and position of the Dijit Button or DOM node.
			//	description:
			//		This isn't easy. An awful lot has been accounted for, but a page full
			//		of cascading styles can be simply impossible to predict.
			// 		In these cases, it's reccomended that this function be 
			//		overwritten with more precise paramters
			//
			var fakeNode = (this.button.domNode) ? dojo.byId(this.button.id).parentNode : dojo.byId(this.button.id) || this.button;
			//this.log(this.id, "fakeNode", fakeNode)
			
			// This should be tested - or allow an ability to overwrite the settings
			if (fakeNode.tagName.toLowerCase() == "span") {
				fakeNode = dojo.byId(this.button.id)
			}
			// can't memoize this, because we need the location. And the size could possibly change anyway.
			var fake = dojo.coords(fakeNode, true);
			// if block, get the width from the style
			fake.w = (dojo.style(fakeNode, "display") == "block") ? dojo.style(fakeNode, "width") : fake.w;
			//relative and absolute positioning are totally different
			var p = fakeNode.parentNode.parentNode;
			if (p && dojo.style(p, "position") == "relative") {
				fake.x = dojo.style(p, "left");
				fake.y = dojo.style(p, "top");
			}
			if (p && dojo.style(p, "position") == "absolute") {
				fake.x = 0;
				fake.y = 0;
			}
			
			//Tweaking the size of the fileInput to be just a little bigger
			var s = 3;
			fake.x -= s;
			fake.y -= s;
			fake.w += s * 2;
			fake.h += s * 2;
			return fake;
		}
		
});