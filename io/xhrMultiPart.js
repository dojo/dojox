dojo.provide("dojox.io.xhrMultiPart");
dojo.require("dojo._base.xhr");

dojox.io.xhrMultiPart = function(args){
	// unique guid as a boundary value for multipart posts
	var boundary = "45309FFF-BD65-4d50-99C9-36986896A96F";

	if(!args["file"]){
		throw new Error("file must be provided to dojox.io.xhrMultiPart's arguments");
	}

	var d = (dojo.isArray(args.file) ? args.file : [args.file]);
	var tmp = [];

	for(var i=0; i < d.length; i++){
		var o = d[i];
		var fileName = (typeof o["fileName"] != undefined ? o.fileName : o.name);
		var contentType = (typeof o["contentType"] != undefined ? o.contentType : "application/octet-stream");

		tmp.push("--" + boundary,
				 "Content-Disposition: form-data; name=\"" + o.name + "\"; filename=\"" + fileName + "\"",
				 "Content-Type: " + contentType,
				 "",
				 o.content);
	}

	var out = "";
	if(d.length){
		tmp.push("--"+boundary+"--", "");
		out = tmp.join("\r\n");
	}

	return dojo.rawXhrPost(dojo.mixin(args, {
		contentType: "multipart/form-data; boundary=" + boundary,
		postData: out
	}));
}
