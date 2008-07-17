dojo.provide("dojox.editor.plugins.UploadImage");
dojo.require("dijit._editor._Plugin");
dojo.require("dojox.form.FileInputOverlay");

dojo.experimental("dojox.editor.plugins.UploadImage");

dojo.declare("dojox.editor.plugins.UploadImage",
	dijit._editor._Plugin,
	{
		//summary: 
		// 	Adds an icon to the Editor toolbar that when clicked, opens a system dialog
		//	Although the toolbar icon is a tiny "image" the uploader could be used for 
		//	any file type
		
		tempImageUrl: "",
		iconClassPrefix: "editorIcon",
		useDefaultCommand: false,
		uploadUrl: "",
		fileInput:null,
		
		label:"Mike",
		_initButton: function(){
			this.command = "uploadImage";
			this.editor.commands[this.command] = "Upload Image";
			this.inherited("_initButton", arguments);
			delete this.command;
			setTimeout(dojo.hitch(this, "createFileInput"), 200);
		},
		
		createFileInput: function(){
			this.fileInput = new dojox.form.FileInputOverlay({button:this.button, uploadUrl:this.uploadUrl, uploadOnChange:true});
			
			dojo.connect(this.fileInput, "onChange", this, "insertTempImage");
			dojo.connect(this.fileInput, "onComplete", this, "onComplete");
		},
		
		onComplete: function(data,ioArgs,widgetRef){
			// Image is ready to insert
			var tmpImgNode = dojo.withGlobal(this.editor.window, "byId", dojo, [this.currentImageId]);
			var file = data.downloadfile;
			
			console.log("image uploaded:", data, "File:", file);
			
			tmpImgNode.src = file;
			tmpImgNode.width = data.width;
			tmpImgNode.height = data.height;
			
		},
		
		insertTempImage: function(){
			// inserting a "busy" image to show something is hapening
			//	during upload and download of the image.
			this.currentImageId = "img_"+(new Date().getTime()); 
			var iTxt = '<img id="'+this.currentImageId+'" src="'+this.tempImageUrl+'" width="32" height="32"/>';
			this.editor.execCommand('inserthtml', iTxt);
		}
		
	}
);

dojo.subscribe(dijit._scopeName + ".Editor.getPlugin",null,function(o){
	if(o.plugin){ return; }
	switch(o.args.name){
	case "uploadImage":
		o.plugin = new dojox.editor.plugins.UploadImage({url: o.args.url});
	}
});
