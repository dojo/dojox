import DojoExternalInterface;

class Storage {
	public static var SUCCESS = "success";
	public static var FAILED = "failed";
	public static var PENDING = "pending";
	
	public var so;
	
	private var _NAMESPACE_KEY = "allNamespaces";
	
	public function Storage(){
		//getURL("javascript:console.debug('FLASH:Storage constructor')");
		DojoExternalInterface.initialize();
		DojoExternalInterface.addCallback("put", this, put);
		DojoExternalInterface.addCallback("get", this, get);
		DojoExternalInterface.addCallback("showSettings", this, showSettings);
		DojoExternalInterface.addCallback("clear", this, clear);
		DojoExternalInterface.addCallback("getKeys", this, getKeys);
		DojoExternalInterface.addCallback("getNamespaces", this, getNamespaces);
		DojoExternalInterface.addCallback("remove", this, remove);
		DojoExternalInterface.loaded();
		
		// preload the System Settings finished button movie for offline
		// access so it is in the cache
		_root.createEmptyMovieClip("_settingsBackground", 1);
		// getURL("javascript:alert('"+DojoExternalInterface.dojoPath+"');");
		_root._settingsBackground.loadMovie(DojoExternalInterface.dojoPath + "storage_dialog.swf");
	}

	// FIXME: This code has gotten ugly -- refactor
	public function put(keyName, keyValue, namespace){
		// Get the SharedObject for these values and save it
		so = SharedObject.getLocal(namespace);
		
		// prepare a storage status handler
		var self = this;
		so.onStatus = function(infoObject:Object){
			//getURL("javascript:console.debug('FLASH: onStatus, infoObject="+infoObject.code+"')");
			
			// delete the data value if the request was denied
			if(infoObject.code == "SharedObject.Flush.Failed"){
				delete self.so.data[keyName];
			}
			
			var statusResults;
			if(infoObject.code == "SharedObject.Flush.Failed"){
				statusResults = Storage.FAILED;
			}else if(infoObject.code == "SharedObject.Flush.Pending"){
				statusResults = Storage.PENDING;
			}else if(infoObject.code == "SharedObject.Flush.Success"){
				// if we have succeeded saving our value, see if we
				// need to update our list of namespaces
				if(self.hasNamespace(namespace) == true){
					statusResults = Storage.SUCCESS;
				}else{
					// we have a new namespace we must store
					self.addNamespace(namespace, keyName);
					return;
				}
			}
			//getURL("javascript:console.debug('FLASH: onStatus, statusResults="+statusResults+"')");
			
			// give the status results to JavaScript
			DojoExternalInterface.call("dojox.storage._onStatus", null, statusResults, 
										keyName);
		}
		
		// save the key and value
		so.data[keyName] = keyValue;
		var flushResults = so.flush();
		
		// return results of this command to JavaScript
		var statusResults;
		if(flushResults == true){
			// if we have succeeded saving our value, see if we
			// need to update our list of namespaces
			if(hasNamespace(namespace) == true){
				statusResults = Storage.SUCCESS;
			}else{
				// we have a new namespace we must store
				addNamespace(namespace, keyName);
				return;
			}
		}else if(flushResults == "pending"){
			statusResults = Storage.PENDING;
		}else{
			statusResults = Storage.FAILED;
		}
		
		DojoExternalInterface.call("dojox.storage._onStatus", null, statusResults, 
															 keyName);
	}

	public function get(keyName, namespace){
		// Get the SharedObject for these values and save it
		so = SharedObject.getLocal(namespace);
		var results = so.data[keyName];
		
		return results;
	}
	
	public function showSettings(){
		// Show the configuration options for the Flash player, opened to the
		// section for local storage controls (pane 1)
		System.showSettings(1);
		
		// there is no way we can intercept when the Close button is pressed, allowing us
		// to hide the Flash dialog. Instead, we need to load a movie in the
		// background that we can show a close button on.
		_root.createEmptyMovieClip("_settingsBackground", 1);
		_root._settingsBackground.loadMovie(DojoExternalInterface.dojoPath + "storage_dialog.swf");
	}
	
	public function clear(namespace){
		so = SharedObject.getLocal(namespace);
		so.clear();
		so.flush();
		
		// remove this namespace entry now
		removeNamespace(namespace);
	}
	
	public function getKeys(namespace){
		// Returns a list of the available keys in this namespace
		
		// get the storage object
		so = SharedObject.getLocal(namespace);
		
		// get all of the keys
		var results = new Array();
		for(var i in so.data){
			results.push(i);	
		}
			
		// remove our key that records our list of namespaces
		for(var i = 0; i < results.length; i++){
			if(results[i] == _NAMESPACE_KEY){
				results.splice(i, 1);
				break;
			}
		}
		
		// join the keys together in a comma seperated string
		results = results.join(",");
		
		return results;
	}
	
	public function getNamespaces(){
		var allNamespaces = SharedObject.getLocal(_NAMESPACE_KEY);
		var results = new Array();
		for(var i in allNamespaces.data){
			results.push(i);
		}
	
		return results.join(",");
	}
	
	public function remove(keyName, namespace){
		// Removes a key

		// get the storage object
		so = SharedObject.getLocal(namespace);
		
		// delete this value
		delete so.data[keyName];
		
		// save the changes
		so.flush();
		
		// see if we are the last entry for this namespace
		var availableKeys = getKeys(namespace);
		if(availableKeys == ""){
			// we are empty
			removeNamespace(namespace);
		}
	}
	
	private function hasNamespace(namespace):Boolean{
		// Get the SharedObject for the namespace list
		var allNamespaces = SharedObject.getLocal(_NAMESPACE_KEY);
		
		var results = false;
		for(var i in allNamespaces.data){
			if(i == namespace){
				results = true;
				break;
			}
		}
		
		return results;
	}
	
	// FIXME: This code has gotten ugly -- refactor
	private function addNamespace(namespace, keyName){
		if(hasNamespace(namespace) == true){
			return;
		}
		
		// Get the SharedObject for the namespace list
		var allNamespaces = SharedObject.getLocal(_NAMESPACE_KEY);
		
		// prepare a storage status handler if the keyName is
		// not null
		if(keyName != null && typeof keyName != "undefined"){
			var self = this;
			allNamespaces.onStatus = function(infoObject:Object){
				// delete the data value if the request was denied
				if(infoObject.code == "SharedObject.Flush.Failed"){
					delete self.so.data[keyName];
				}
				
				var statusResults;
				if(infoObject.code == "SharedObject.Flush.Failed"){
					statusResults = Storage.FAILED;
				}else if(infoObject.code == "SharedObject.Flush.Pending"){
					statusResults = Storage.PENDING;
				}else if(infoObject.code == "SharedObject.Flush.Success"){
					statusResults = Storage.SUCCESS;
				}
				
				// give the status results to JavaScript
				DojoExternalInterface.call("dojox.storage._onStatus", null, statusResults, 
											keyName);
			}
		}
		
		// save the namespace list
		allNamespaces.data[namespace] = true;
		var flushResults = allNamespaces.flush();
		
		// return results of this command to JavaScript
		if(keyName != null && typeof keyName != "undefined"){
			var statusResults;
			if(flushResults == true){
				statusResults = Storage.SUCCESS;
			}else if(flushResults == "pending"){
				statusResults = Storage.PENDING;
			}else{
				statusResults = Storage.FAILED;
			}
			
			DojoExternalInterface.call("dojox.storage._onStatus", null, statusResults, 
										keyName);
		}
	}
	
	// FIXME: This code has gotten ugly -- refactor
	private function removeNamespace(namespace){
		if(hasNamespace(namespace) == false){
			return;
		}
		
		// try to save the namespace list; don't have a return
		// callback; if we fail on this, the worst that will happen
		// is that we have a spurious namespace entry
		var allNamespaces = SharedObject.getLocal(_NAMESPACE_KEY);
		delete allNamespaces.data[namespace];
		allNamespaces.flush();
	}

	static function main(mc){
		//getURL("javascript:console.debug('FLASH: storage loaded')");
		_root.app = new Storage(); 
	}
}

