dojo.provide("dojox.storage.FlashStorageProvider");
dojo.require("dojox.flash");

// summary: 
//		Storage provider that uses features in Flash to achieve permanent
//		storage
// description:
//		Authors of this storage provider-
//			Brad Neuberg, bkn3@columbia.edu	
dojo.declare(
	"dojox.storage.FlashStorageProvider",
	[ dojox.storage.Provider ], null,
	{
		initialized: false,
		
		_available: null,
		_statusHandler: null,
		
		initialize: function(){
			if(djConfig["disableFlashStorage"] == true){
				return;
			}
			
			// initialize our Flash
			var loadedListener = function(){
				// indicate our Flash subsystem is now loaded
				dojox.storage._flashLoaded();
			}
			dojox.flash.addLoadedListener(loadedListener);
			dojox.flash.setSwf({
				flash6: dojo.moduleUrl("dojox", "storage/Storage_version6.swf").toString(), 
				flash8: dojo.moduleUrl("dojox", "storage/Storage_version8.swf").toString(), 
				visible: false
			});
		},
		
		isAvailable: function(){
			if(djConfig["disableFlashStorage"] == true){
				this._available = false;
			}else{
				this._available = true;
			}
			
			return this._available;
		},

		put: function(key, value, resultsHandler, namespace){
			if(this.isValidKey(key) == false){
				dojo.raise("Invalid key given: " + key);
			}
			
			if(namespace == null || typeof namespace == "undefined"){
				namespace = dojox.storage.DEFAULT_NAMESPACE;		
			}
			
			if(this.isValidKey(namespace) == false){
				dojo.raise("Invalid namespace given: " + namespace);
			}
				
			this._statusHandler = resultsHandler;
			
			// serialize the value;
			// handle strings differently so they have better performance
			if(dojo.isString(value)){
				value = "string:" + value;
			}else{
				value = dojo.json.serialize(value);
			}
			
			dojox.flash.comm.put(key, value, namespace);
		},

		get: function(key, namespace){
			if(this.isValidKey(key) == false){
				dojo.raise("Invalid key given: " + key);
			}
			
			if(namespace == null || typeof namespace == "undefined"){
				namespace = dojox.storage.DEFAULT_NAMESPACE;		
			}
			
			if(this.isValidKey(namespace) == false){
				dojo.raise("Invalid namespace given: " + namespace);
			}
			
			var results = dojox.flash.comm.get(key, namespace);

			if(results == ""){
				return null;
			}
		
			// destringify the content back into a 
			// real JavaScript object;
			// handle strings differently so they have better performance
			if(dojo.isString(results) && (/^string:/.test(results))){
				results = results.substring("string:".length);
			}else{
				results = dojo.fromJson(results);
			}
		
			return results;
		},

		getKeys: function(namespace){
			if(namespace == null || typeof namespace == "undefined"){
				namespace = dojox.storage.DEFAULT_NAMESPACE;		
			}
			
			if(this.isValidKey(namespace) == false){
				dojo.raise("Invalid namespace given: " + namespace);
			}
			
			var results = dojox.flash.comm.getKeys(namespace);
			
			if(results == ""){
				return [];
			}

			// the results are returned comma seperated; split them
			results = results.split(",");
			
			return results;
		},
		
		getNamespaces: function(){
			var results = dojox.flash.comm.getNamespaces();
			if(results == ""){
				return [dojox.storage.DEFAULT_NAMESPACE];
			}
			
			// the results are returned comma seperated; split them
			results = results.split(",");
			
			return results;
		},

		clear: function(namespace){
			if(namespace == null || typeof namespace == "undefined"){
				namespace = dojox.storage.DEFAULT_NAMESPACE;
			}
			
			if(this.isValidKey(namespace) == false){
				dojo.raise("Invalid namespace given: " + namespace);
			}
			
			dojox.flash.comm.clear(namespace);
		},
		
		remove: function(key, namespace){
			if(namespace == null || typeof namespace == "undefined"){
				namespace = dojox.storage.DEFAULT_NAMESPACE;		
			}
			
			if(this.isValidKey(namespace) == false){
				dojo.raise("Invalid namespace given: " + namespace);
			}
			
			dojox.flash.comm.remove(key, namespace);
		},
		
		isPermanent: function(){
			return true;
		},

		getMaximumSize: function(){
			return dojox.storage.SIZE_NO_LIMIT;
		},

		hasSettingsUI: function(){
			return true;
		},

		showSettingsUI: function(){
			dojox.flash.comm.showSettings();
			dojox.flash.obj.setVisible(true);
			dojox.flash.obj.center();
		},

		hideSettingsUI: function(){
			// hide the dialog
			dojox.flash.obj.setVisible(false);
			
			// call anyone who wants to know the dialog is
			// now hidden
			if(dojo.isFunction(dojox.storage.onHideSettingsUI)){
				dojox.storage.onHideSettingsUI.call(null);	
			}
		},
		
		getType: function(){
			return "dojox.storage.FlashStorageProvider";
		},
		
		getResourceList: function(){ /* Array[] */
			var swfloc6 = dojo.moduleUrl("dojox", "storage/Storage_version6.swf").toString();
			var swfloc8 = dojo.moduleUrl("dojox", "storage/Storage_version8.swf").toString();
			
			var results = dojox.flash.info.getResourceList(swfloc6, swfloc8);
			results.push(dojo.moduleUrl("dojox", "storage/storage_dialog.swf").toString());
					
			return results;
		},
		
		/** Called when the Flash is finished loading. */
		_flashLoaded: function(){
			// get available namespaces
			this._allNamespaces = this.getNamespaces();
			
			this._initialized = true;

			// indicate that this storage provider is now loaded
			dojox.storage.manager.loaded();
		},
		
		//	Called if the storage system needs to tell us about the status
		//	of a put() request. 
		_onStatus: function(statusResult, key){
			var ds = dojox.storage;
			var dfo = dojox.flash.obj;
			
			if(statusResult == ds.PENDING){
				dfo.center();
				dfo.setVisible(true);
			}else{
				dfo.setVisible(false);
			}
			
			if((!dj_undef("_statusHandler", ds))&&(ds._statusHandler != null)){
				ds._statusHandler.call(null, statusResult, key);		
			}
		}
	}
);

dojox.storage.manager.register("dojox.storage.FlashStorageProvider",
								new dojox.storage.FlashStorageProvider());
