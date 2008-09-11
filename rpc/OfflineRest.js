dojo.provide("dojox.rpc.OfflineRest");

dojo.require("dojox.off.offline");
dojo.require("dojox.rpc.LocalStorageRest");

dojox.rpc.OfflineRest = dojo.mixin({
	initialize: function(/*String*/applicationName){
		// summary:
		// 		Sets up an offline Rest application
		//	applicationName: 
		//		You must provide an application to start the OfflineRest
		//	Store:
		//		Any data stores that you are using should be included here
		
		dojox.off.ui.appName = applicationName;
		dojox.off.files.slurp();
		dojox.off.initialize();
	
		var self = this;
		dojo.connect(dojox.off.sync, "onSync", this, function(type){
			if(type == "upload"){
				self.sendChanges();
			}
			if(type == "download"){
				self.downloadChanges(); // FIXME: Do this async?
				dojox.off.sync.finishedDownloading();
			}
		});
	}
},dojox.rpc.LocalStorageRest);
