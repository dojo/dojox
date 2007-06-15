dojo.provide("dojox.storage.GearsStorageProvider");
dojo.require("dojox.storage.Provider");
dojo.require("dojox.storage.manager");
dojo.require("dojox.sql");

if(dojo.isGears){
	
	(function(){
		// make sure we don't define the gears provider if we're not gears
		// enabled
		
		dojo.declare("dojox.storage.GearsStorageProvider", 
			[ dojox.storage.Provider ],
			function(){
				// summary:
				//		Storage provider that uses the features of Google Gears
				//		to store data (it is saved into the local SQL database
				//		provided by Gears, using dojox.sql)
				// description: 
				//		
				//
				//		You can disable this storage provider with the following djConfig
				//		variable:
				//		var djConfig = { disableGearsStorage: true };
				//		
				//		Authors of this storage provider-	
				//			Brad Neuberg, bkn3@columbia.edu 
			},
			{
				// instance methods and properties
				TABLE_NAME: "__DOJO_STORAGE",
				initialized: false,
				
				_available: null,
				
				initialize: function(){
					// console.debug("dojox.storage.GearsStorageProvider.initialize");
					if(djConfig["disableGearsStorage"] == true){
						return;
					}
					
					// create the table that holds our data
					try{
						dojox.sql("CREATE TABLE IF NOT EXISTS " + this.TABLE_NAME + "( "
									+ " namespace TEXT, "
									+ " key TEXT, "
									+ " value TEXT "
									+ ")"
								);
						dojox.sql("CREATE UNIQUE INDEX IF NOT EXISTS namespace_key_index" 
									+ " ON " + this.TABLE_NAME
									+ " (namespace, key)");
					}catch(e){
						console.debug("dojox.storage.GearsStorageProvider.initialize:", e);
						
						this.initialized = false; // we were unable to initialize
						dojox.storage.manager.loaded();
						return;
					}
					
					// indicate that this storage provider is now loaded
					this.initialized = true;
					dojox.storage.manager.loaded();	
				},
				
				isAvailable: function(){
					// is Google Gears available and defined?
					return this._available = dojo.isGears;
				},

				put: function(key, value, resultsHandler, namespace){
					if(this.isValidKey(key) == false){
						throw new Error("Invalid key given: " + key);
					}
					namespace = namespace||this.DEFAULT_NAMESPACE;
					
					// serialize the value;
					// handle strings differently so they have better performance
					if(dojo.isString(value)){
						value = "string:" + value;
					}else{
						value = dojo.toJson(value);
					}
					
					// try to store the value	
					try{
						dojox.sql("DELETE FROM " + this.TABLE_NAME
									+ " WHERE namespace = ? AND key = ?",
									namespace, key);
						dojox.sql("INSERT INTO " + this.TABLE_NAME
									+ " VALUES (?, ?, ?)",
									namespace, key, value);
					}catch(e){
						// indicate we failed
						console.debug("dojox.storage.GearsStorageProvider.put:", e);
						resultsHandler(this.FAILED, key, e.toString());
						return;
					}
					
					if(resultsHandler){
						resultsHandler(dojox.storage.SUCCESS, key, null);
					}
				},

				get: function(key, namespace){
					if(this.isValidKey(key) == false){
						throw new Error("Invalid key given: " + key);
					}
					namespace = namespace||this.DEFAULT_NAMESPACE;
					
					// try to find this key in the database
					var results = dojox.sql("SELECT * FROM " + this.TABLE_NAME
												+ " WHERE namespace = ? AND "
												+ " key = ?",
												namespace, key);
					if(!results.length){
						return null;
					}else{
						results = results[0].value;
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
				
				getNamespaces: function(){
					var results = [ dojox.storage.DEFAULT_NAMESPACE ];
					
					var rs = dojox.sql("SELECT namespace FROM " + this.TABLE_NAME
										+ " DESC GROUP BY namespace");
					for(var i = 0; i < rs.length; i++){
						if(rs[i].namespace != dojox.storage.DEFAULT_NAMESPACE){
							results.push(rs[i].namespace);
						}
					}
					
					return results;
				},

				getKeys: function(namespace){
					namespace = namespace||this.DEFAULT_NAMESPACE;
					if(this.isValidKey(namespace) == false){
						throw new Error("Invalid namespace given: " + namespace);
					}
					
					var rs = dojox.sql("SELECT key FROM " + this.TABLE_NAME
										+ " WHERE namespace = ?",
										namespace);
					
					var results = [];
					for(var i = 0; i < rs.length; i++){
						results.push(rs[i].key);
					}
					
					return results;
				},

				clear: function(namespace){
					if(this.isValidKey(namespace) == false){
						throw new Error("Invalid namespace given: " + namespace);
					}
					namespace = namespace||this.DEFAULT_NAMESPACE;
					
					dojox.sql("DELETE FROM " + this.TABLE_NAME 
								+ " WHERE namespace = ?",
								namespace);
				},
				
				remove: function(key, namespace){
					namespace = namespace||this.DEFAULT_NAMESPACE;
					
					dojox.sql("DELETE FROM " + this.TABLE_NAME 
								+ " WHERE namespace = ? AND"
								+ " key = ?",
								namespace,
								key);
				},
				
				isPermanent: function(){ return true; },

				getMaximumSize: function(){ return this.SIZE_NO_LIMIT; },

				hasSettingsUI: function(){ return false; },
				
				showSettingsUI: function(){
					throw new Error(this.declaredClass 
										+ " does not support a storage settings user-interface");
				},
				
				hideSettingsUI: function(){
					throw new Error(this.declaredClass 
										+ " does not support a storage settings user-interface");
				}
			}
		);

		// register the existence of our storage providers
		dojox.storage.manager.register("dojox.storage.GearsStorageProvider",
										new dojox.storage.GearsStorageProvider());
	
		dojox.storage.manager.initialize();
	})();
}
