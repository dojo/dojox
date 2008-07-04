dojo.provide("dojox.rpc.OfflineRest");

dojo.require("dojox.off.offline");
dojo.require("dojox.rpc.LocalStorageRest");

dojox.rpc.OfflineRest = function(/*String*/applicationName){
	// summary:
	// 		Sets up an offline Rest application
	//	applicationName: 
	//		You must provide an application to start the OfflineRest
	//	Store:
	//		Any data stores that you are using should be included here
	
	dojox.off.ui.appName = applicationName;
	dojox.off.files.slurp();
	dojox.off.initialize();

	var lsr = dojox.rpc.LocalStorageRest;
	dojo.connect(dojox.off.sync, "onSync", this, function(type){
		if(type == "upload"){
			lsr.sendChanges();
		}
		if(type == "download"){
			lsr.downloadChanges(); // FIXME: Do this async?
			dojox.off.sync.finishedDownloading();
		}
	});
};