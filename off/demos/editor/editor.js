dojo.require("dijit._editor.RichText");
dojo.require("dojo.parser");

dojo.require("dojox.sql");
dojo.require("dojox.off");
dojo.require("dojox.off.ui");
dojo.require("dojox.off.sync");

// configure how we should work offline

// set our application name
dojox.off.ui.appName = "Moxie";

// add our list of resources we need offline
// Moxie resources
dojox.off.files.cache([
					"editor.html",
					"editor.js",
					"about.html"
					]);
					
// add the RichText widget JavaScript files
dojox.off.files.cache([
					"../../../../dijit/_editor/selection.js",
					"../../../../dijit/_editor/RichText.js"
					]);

var moxie = {
	_availableKeys: null,
	_documents: null,

	initialize: function(){
		//console.debug("moxie.initialize");
		
		// make sure the rich text control is finished
		// loading; workaround for bug 3395
		var richTextControl = dijit.byId("storageValue");
		if(richTextControl.isLoaded == false){
			dojo.connect(richTextControl, "onLoad", this, "initialize");
			return;
		}
		
		// clear out old values
		dojo.byId("storageKey").value = "";
		richTextControl.setValue("Click Here to Begin Editing");
		
		// initialize our event handlers
		var directory = dojo.byId("directory");
		dojo.connect(directory, "onchange", this, this.directoryChange);
		dojo.connect(dojo.byId("saveButton"), "onclick", this, this.save);
		
		// create our database
		this._createDb();
		
		// load and write out our available keys
		this._loadKeys();
		
		// setup our offline handlers
		this._initOfflineHandlers();
		
		this._initialized = true;
	},
	
	directoryChange: function(evt){
		var key = evt.target.value;
		
		// add this value into the form
		var keyNameField = dojo.byId("storageKey");
		keyNameField.value = key;
		
		// if blank key ignore
		if(key == ""){
			return;
		}
		
		this._load(key);		
	},
	
	save: function(evt){
		// cancel the button's default behavior
		evt.preventDefault();
		evt.stopPropagation();
		
		// get the new values
		var key = dojo.byId("storageKey").value;
		var richTextControl = dijit.byId("storageValue");
		var value = richTextControl.getValue();
		
		if(key == null || typeof key == "undefined" || key == ""){
			alert("Please enter a file name");
			return;
		}
		
		if(value == null || typeof value == "undefined" || value == ""){
			alert("Please enter file contents");
			return;
		}
		
		// do the save
		this._save(key, value)
	},
	
	_save: function(key, value, log){
		this._printStatus("Saving '" + key + "'...");
		
		if(dojox.off.isOnline == true){
			this._saveOnline(key, value, log);
		}else{
			this._saveOffline(key, value);
		}
	},
	
	_saveOnline: function(key, value){
		var self = this;
		var doLoad = function(data){
			//console.debug("load, data="+data);	
			self._printStatus("Saved '" + key + "'");
			
			// add to our list of available keys
			self._addKey(key);
			
			if(dojox.off.sync.log.isReplaying == false){
				// update the list of available keys
				self._printAvailableKeys();
			}else{
				dojox.off.sync.log.continueReplay();	
			}
		};
		
		var bindArgs = {
			url:	 "/moxie/" + encodeURIComponent(key),
			content:	{"content": value},
			error:		function(err){
				//console.debug("error, err="+err);
				var msg = "Unable to save file " + key + ": " + err;
				if(dojox.off.sync.log.isReplaying == false){
					alert(msg);
				}else{
					dojox.off.sync.log.haltReplay(msg);
				}
			},
			load:		doLoad
		};
		
		// dispatch the request
		dojo.xhrPost(bindArgs);	
	},
	
	_saveOffline: function(key, value){
		// create a command object to capture this action
		var command = {name: "save", key: key, value: value};
		
		// save it in our command log for replaying when we 
		// go back online
		dojox.off.sync.log.add(command);
		
		// also add it to our offline, downloaded data
		this._documents.push({fileName: key, content: value});
		dojox.sql("INSERT INTO DOCUMENTS (fileName, content) VALUES (?, ?)",
						key, value);
		
		// update our UI
		this._printStatus("Saved '" + key + "'");
		this._addKey(key);
		this._printAvailableKeys();
	},
	
	_loadKeys: function(){
		if(dojox.off.isOnline == true){
			this._loadKeysOnline();
		}else{
			this._loadKeysOffline();
		}
	},
	
	_loadKeysOnline: function(){
		var self = this;
		var url = "/moxie/*"
					+ "?browserbust=" + new Date().getTime()
					+ "&proxybust=" + new Date().getTime();
		var bindArgs = {
			url:	 url,
			handleAs:	"javascript",
			headers:		{ "Accept" : "text/javascript" },
			error:		function(err){
				//console.debug("error, err="+err);
				alert("Unable to load our list of available keys from "
						+ "the server: " + err.message);
			},
			load:		function(data){
				//console.debug("load, data="+data);	
				// 'data' is a JSON array, where each entry is a String filename
				// of the available keys
				self._availableKeys = data;
				self._printAvailableKeys();
			}
		};
		
		// dispatch the request
		dojo.xhrGet(bindArgs);	
	},
	
	_loadKeysOffline: function(){
		this._loadDownloadedData();
		this._printAvailableKeys();
	},
	
	_printAvailableKeys: function(){
		var directory = dojo.byId("directory");
		
		// clear out any old keys
		directory.innerHTML = "";
		
		// add a blank selection
		var optionNode = document.createElement("option");
		optionNode.appendChild(document.createTextNode(""));
		optionNode.value = "";
		directory.appendChild(optionNode);
		
		// sort our available keys alphabetically
		var keys = this._availableKeys.slice();
		keys.sort();
		
		// add new ones
		for (var i = 0; i < keys.length; i++) {
			var optionNode = document.createElement("option");
			optionNode.appendChild(document.createTextNode(keys[i]));
			optionNode.value = keys[i];
			directory.appendChild(optionNode);
		}
	},
	
	_addKey: function(key){
		var alreadyPresent = false;
		for(var i = 0; i < this._availableKeys.length; i++){
			if(this._availableKeys[i] == key){
				alreadyPresent = true;
				break;
			}	
		}	
		
		if(alreadyPresent == false){
			this._availableKeys.push(key);
		}
	},
	
	_load: function(key){
		this._printStatus("Loading '" + key + "'...");
		
		if(dojox.off.isOnline == true){
			this._loadOnline(key);
		}else{
			this._loadOffline(key);
		}
	},
	
	_loadOnline: function(key){
		// get the value from the server
		var self = this;
		// add 'cachebust' to the URL to make sure we get a fresh
		// copy that is not returned from either the browser's cache
		// or the local offline proxy's cache
		var url = "/moxie/" + encodeURIComponent(key) 
					+ "?cachebust=" + new Date().getTime(); 
		var bindArgs = {
			url:	 url,
			handleAs:	"text",
			error:		function(err){
				//console.debug("error, err="+err);
				alert("The file " + key + " is not available: "
						+ err.message);
			},
			load:		function(data){
				//console.debug("load, data="+data);	
				self._updateEditorContents(data);
			
				// print out that we are done
				self._printStatus("Loaded '" + key + "'");
			}
		};
		
		// dispatch the request
		dojo.xhrGet(bindArgs);	
	},
	
	_loadOffline: function(key){
		var doc = null;
		for(var i = 0; i < this._documents.length; i++){
			var currentDoc = this._documents[i];
			if(currentDoc.fileName == key){
				doc = currentDoc;
				break;
			}
		}
		
		this._updateEditorContents(doc.content);
	},
	
	_updateEditorContents: function(contents){
		// set the new Editor widget value
		var richTextControl = dijit.byId("storageValue");
		richTextControl.setValue(contents);
	},
	
	_printStatus: function(message){
		// remove the old status
		var top = dojo.byId("top");
		for (var i = 0; i < top.childNodes.length; i++) {
			var currentNode = top.childNodes[i];
			if (currentNode.nodeType == 1 &&
					currentNode.className == "status") {
				top.removeChild(currentNode);
			}		
		}
		
		var status = document.createElement("span");
		status.className = "status";
		status.innerHTML = message;
		
		top.appendChild(status);
		dojo.fadeOut({ node: status, duration: 2000 }).play();
	},
	
	_initOfflineHandlers: function(){
		// setup what we do when we are replaying our command
		// log when the network reappears
		var self = this;
		dojox.off.sync.log.onCommand = function(command){
			if(command.name == "save"){
				self._save(command.key, command.value);
			}
		}
		
		// setup how we download our data from the server
		dojox.off.sync.doDownload = function(){
			// actually download our data
			self._downloadData();
		}
		
		// refresh our UI when we are finished syncing
		dojox.off.sync.onFinished = function(){
			dojox.off.ui.onFinished();
			
			self._printAvailableKeys();
		}
	},
	
	_downloadData: function(){
		var self = this;
		// add 'cachebust' to the URL to make sure we get a fresh
		// copy that is not returned from either the browser's cache
		// or the local offline proxy's cache
		var bindArgs = {
			url:	 "/moxie/download?cachebust=" + new Date().getTime(),
			handleAs:	"javascript",
			headers:	{ "Accept" : "text/javascript" },
			error:		function(err){
				//console.debug("moxie._downloadData.error, err="+err);
				if(err.message){
					err = err.message;
				}
				
				var message = "Unable to download our documents from server: "
								+ err;
				dojox.off.sync.finishedDownloading(false, message);
			},
			load:		function(data){
				//console.debug("moxie._downloadData.load");
				self._saveDownloadedData(data);
			}
		};
		
		// dispatch the request
		dojo.xhrGet(bindArgs);	
	},
	
	_saveDownloadedData: function(data){
		// 'data' is a JSON structure passed to us by the server
		// that is an array of object literals, where each literal
		// has a 'fileName' entry and a 'content' entry.
		this._createDb();
					
		dojo.forEach(data, function(record){
			dojox.sql("INSERT INTO DOCUMENTS (fileName, content) VALUES (?, ?)",
						record.fileName, record.content);
		});
		dojox.off.sync.finishedDownloading(true, null);
	},
	
	_loadDownloadedData: function(){
		this._availableKeys = [];
		this._documents = dojox.sql("SELECT * FROM DOCUMENTS");
		if(this._documents == null
			|| typeof this._documents == "undefined"){
			this._documents = [];
		}
		
		for(var i = 0; i < this._documents.length; i++){
			var fileName = this._documents[i].fileName;
			this._availableKeys.push(fileName);
		}
	},
	
	_createDb: function(){
		dojox.sql("DROP TABLE DOCUMENTS");
		dojox.sql("CREATE TABLE IF NOT EXISTS DOCUMENTS ("
					+ "fileName		TEXT NOT NULL PRIMARY KEY UNIQUE, "
					+ "content		TEXT NOT NULL) ");
	}
};

// wait until Dojo Offline and the default Offline Widget are ready
// before we initialize ourselves. When this gets called the page
// is also finished loading.
dojo.connect(dojox.off.ui, "onLoad", moxie, moxie.initialize);

// tell Dojo Offline we are ready for it to initialize itself now
// that we have finished configuring it for our application
dojox.off.initialize();
