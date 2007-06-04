dojo.provide("dojox.off.sync");

dojo.require("dojox.storage.GearsStorageProvider");
dojo.require("dojox.off._common");
dojo.require("dojox.off.files");

// Author: Brad Neuberg, bkn3@columbia.edu, http://codinginparadise.org

// summary:
//		A class that records actions taken by a user when they are offline,
//		suitable for replaying when the network reappears. 
// description:
//		The basic idea behind this method is to record user actions that would
//		normally have to contact a server into a command log when we are
//		offline, so that later when we are online we can simply replay this log
//		in the order user actions happened so that they can be executed against
//		the server, causing synchronization to happen. When we replay, for each
//		of the commands that were added, we call a method named onCommand that
//		applications should override and which will be called over and over for
//		each of our commands -- applications should take the offline command
//		information and use it to talk to a server to have this command
//		actually happen online, 'syncing' themselves with the server. If the
//		command was "update" with the item that was updated, for example, we
//		might call some RESTian server API that exists for updating an item in
//		our application.  The server could either then do sophisticated merging
//		and conflict resolution on the server side, for example, allowing you
//		to pop up a custom merge UI, or could do automatic merging or nothing
//		of the sort. When you are finished with this particular command, your
//		application is then required to call continueReplay() on the log object
//		passed to onCommand() to continue replaying the log, or haltReplay()
//		with the reason for halting to completely stop the syncing/replaying
//		process.
dojo.declare("dojox.off.sync.CommandLog", null, null, 
	{
		// commands: Array
		//		An array of our command entries, where each one is simply a custom
		//		object literal that were passed to add() when this command entry
		//		was added.
		commands: [],
		
		// autoSave: boolean
		//		Whether we automatically save the command log after each call to
		//		add(); defaults to true. For applications that are rapidly adding
		//		many command log entries in a short period of time, it can be
		//		useful to set this to false and simply call save() yourself when
		//		you are ready to persist your command log -- otherwise performance
		//		could be slow as the default action is to attempt to persist the
		//		command log constantly with calls to add().
		autoSave: true,
		
		// reasonHalted: String
		//		If we halted, the reason why
		reasonHalted: null,
		
		// isReplaying: boolean
		//		If true, we are in the middle of replaying a command log; if false,
		//		then we are not
		isReplaying: false,
		
		// onReplayFinished: Function
		//	Called when we are finished replaying our commands;
		//	called if we have successfully exhausted all of our
		//	commands, or if an error occurred during replaying.
		//	The default implementation simply continues the
		//	synchronization process.
		onReplayFinished: null,
		
		replay: function(){ /* void */
			// summary:
			//	Replays all of the commands that have been
			//	cached in this command log when we go back online;
			//	onCommand will be called for each command we have
			
			if(this.isReplaying == true){
				return;
			}
			
			this.reasonHalted = null;
			
			if(this.commands.length == 0){
				this.onReplayFinished();
				return;
			}
			
			this.isReplaying = true;
			
			var nextCommand = this.commands[0];
			this.onCommand(nextCommand);
		},
		
		onCommand: function(command /* Object */){ /* void */
			// summary:
			//	Called when we replay our log, for each of our command
			//	entries.
			// command: Object
			//	A custom object literal representing a command for this
			//	application, such as 
			//	{commandName: "create", item: {title: "message", content: "hello world"}}
			// description:
			//	This callback should be overridden by applications so that
			//	they can sync themselves when we go back online. When we
			//	replay our command log, this callback is called for each
			//	of our command entries in the order they were added. The 
			//	'command' entry that was passed to add() for this command will 
			//	also be passed in to onCommand, so that applications can use this information
			//	to do their syncing, such as contacting a server web-service
			//	to create a new item, for example. 
			// 
			//	Inside your overridden onCommand, you should either call
			//	log.halt(reason) if an error occurred and you would like to halt
			//	command replaying or log.continueReplay() to have the command log
			//	continue replaying its log and proceed to the next command; 
			//	the reason you must call these is the action you execute inside of 
			//	onCommand will probably be asynchronous, since it will be talking on 
			//	the network, and you should call one of these two methods based on 
			//	the result of your network call.
		},
		
		add: function(command /* Object */){ /* void */
			// summary:
			//	Adds an action to our command log
			// description:
			//	This method will add an action to our
			//	command log, later to be replayed when we
			//	go from offline to online. 'command'
			//	will be available when this command is
			//	replayed and will be passed to onCommand.
			//
			//	Example usage:
			//	
			//	dojox.off.sync.log.add({commandName: "create", itemType: "document",
			//					  {title: "Message", content: "Hello World"}});
			// 
			//	The object literal is simply a custom object appropriate
			//	for our application -- it can be anything that preserves the state
			//	of a user action that will be executed when we go back online
			//	and replay this log. In the above example,
			//	"create" is the name of this action; "documents" is the 
			//	type of item this command is operating on, such as documents, contacts,
			//	tasks, etc.; and the final argument is the document that was created. 
			
			if(this.isReplaying == true){
				throw new String("Programming error: you can not call log.add() while "
									+ "we are replaying a command log");
			}
			
			this.commands.push(command);
			
			// save our updated state into persistent
			// storage
			if(this.autoSave == true){
				this.save();
			}
		},
		
		length: function(){ /* Number */
			// summary:
			//	Returns the length of this 
			//	command log
			return this.commands.length;
		},
		
		haltReplay: function(reason /* Anything with a toString() method */){ /* void */
			// summary: Halts replaying this command log.
			// reason: Anything with a toString() method
			//		The reason we halted; this can be a string, an Exception,
			//		or anything with a toString() method actually.
			// description:
			//		This method is called as we are replaying a command log; it
			//		can be called from dojox.off.sync.log.onCommand, for
			//		example, for an application to indicate an error occurred
			//		while replaying this command, halting further processing of
			//		this command log. Note that any command log entries that
			//		were processed before have their effects retained (i.e.
			//		they are not rolled back), while the command entry that was
			//		halted stays in our list of commands to later be replayed.	
			if(this.isReplaying == false){
				return;
			}
			
			if(reason != null && typeof reason != "undefined"){
				this.reasonHalted = reason.toString();		
			}
			
			// save the state of our command log, then
			// tell anyone who is interested that we are
			// done when we are finished saving
			if(this.autoSave == true){
				var self = this;
				this.save(function(){
					self.isReplaying = false;
					self.onReplayFinished();
				});
			}else{
				this.isReplaying = false;
				this.onReplayFinished();
			}
		},
		
		continueReplay: function(){ /* void */
			// summary:
			//		Indicates that we should continue processing out list of
			//		commands.
			// description:
			//		This method is called by applications that have overridden
			//		log.onCommand() to continue replaying our command log after
			//		the application has finished handling the current command.
			
			if(this.isReplaying == false){
				return;
			}
			
			// shift off the old command we just ran
			this.commands.shift();
			
			// are we done?
			if(this.commands.length == 0){
				// save the state of our command log, then
				// tell anyone who is interested that we are
				// done when we are finished saving
				if(this.autoSave == true){
					var self = this;
					this.save(function(){
						self.isReplaying = false;
						self.onReplayFinished();
					});
					return;
				}else{
					this.isReplaying = false;
					this.onReplayFinished();
					return;
				}
			}
			
			// get the next command
			var nextCommand = this.commands[0];
			this.onCommand(nextCommand);
		},
		
		clear: function(){ /* void */
			// summary:
			//	Completely clears this command log of its entries
			
			if(this.isReplaying == true){
				return;
			}
			
			this.commands = new Array();
			
			// save our updated state into persistent
			// storage
			if(this.autoSave == true){
				this.save();
			}
		},
		
		save: function(finishedCallback){ /* void */
			// summary:
			//		Saves this command log to persistent, client-side storage
			// description:
			//		Persists our command log into reliable, local storage; you
			//		should not normally ever have to call this method, since we
			//		automatically persist our command log after every call to
			//		add(). See 'autoSave' inside this class for details on how
			//		to override this behavior for custom applications.	
			
			//console.debug("dojox.off.sync.save");
			
			try{
				var self = this;
				var resultsHandler = function(status, key, message){
					if(status == dojo.storage.FAILED){
						dojo.off.onSave(true, message, key, self.commands,
										dojo.off.STORAGE_NAMESPACE);
						if(finishedCallback){
							finishedCallback();	
						}
					}else if(status == dojo.storage.SUCCESS){
						if(finishedCallback){
							finishedCallback();
						}
					}
				};
				
				dojo.storage.put("commandlog", this.commands, resultsHandler,
								dojo.off.STORAGE_NAMESPACE);
			}catch(exp){
				dojo.off.onSave(true, exp.toString(), "commandlog", 
								this.commands, dojo.off.STORAGE_NAMESPACE);
			}
		},
		
		load: function(finishedCallback){ /* void */
			// summary:
			//		Loads our command log from reliable, persistent local
			//		storage; you should never have to do this since the Dojo
			//		Offline Framework takes care of doing this for you.

			//dojo.debug("dojox.off.sync.load");
			
			var commands = dojo.storage.get("commandlog", dojo.off.STORAGE_NAMESPACE);
			
			if(commands == null || typeof commands == "undefined"){
				commands = new Array();
			}
			
			this.commands = commands;
			
			finishedCallback();
		},

		toString: function(){
			var results = new String();
			results += "[";
			
			for(var i = 0; i < this.commands.length; i++){
				results += "{";
				for(var j in this.commands[i]){
					results += j + ": \"" + this.commands[i][j] + "\"";
					results += ", ";
				}
				results += "}, ";
			}
			
			results += "]";
			
			return results;
		}
	}
);


// summary:
//		dojox.off.sync exposes syncing functionality to offline applications
dojo.mixin(dojox.off.sync, {
	// onStart: Function
	//		An event handler that will be called when syncing has started
	onStart: null,
	
	// onRefreshFiles: Function
	//		An event handler that will be called when syncing starts refreshing
	//		our offline file cache
	onRefreshFiles: null,

	// onUpload: Function
	//		An event handler that will be called when syncing starts uploading
	//		any local data changes we have on the client.  Applications can
	//		either wait until we call log.onCommand for each of our command
	//		entries to do upload syncing, or could completely bypass the
	//		command log process and just do all uploading within this method,
	//		using the command log as its dataset for applications that have
	//		complex, custom upload syncing requirements. This method can also
	//		be used to update a UI on the sync progress.
	onUpload: null,
	
	// onDownload: Function
	//		An event handler that is called to download any new data that is
	//		needed into persistent storage. Applications are required to
	//		implement this themselves, storing the required data into
	//		persistent local storage using Dojo Storage. 
	onDownload: null,
	
	// onFinished: Function
	//		An event handler that will be called when syncing is finished; this
	//		will be called whether an error ocurred or not; check
	//		dojox.off.sync.successful and dojox.off.sync.error for sync details
	onFinished: null,
	
	// onCancel: Function
	//		Called when canceling has been initiated; canceling will be
	//		attempted, followed by a call to onFinished
	onCancel: null,
	
	// isSyncing: boolean
	//		Whether we are in the middle of a syncing session.
	isSyncing: false,
	
	// cancelled: boolean
	//		Whether we were cancelled during our last sync request or not. If
	//		we are cancelled, then successful will be false.
	cancelled: false,
	
	// successful: boolean
	//		Whether the last sync was successful or not.  If false, an error
	//		occurred.
	successful: true,
	
	// details: String[]
	//		Details on the sync. If the sync was successful, this will carry
	//		any conflict or merging messages that might be available; if the
	//		sync was unsuccessful, this will have an error message.  For both
	//		of these, this should be an array of Strings, where each string
	//		carries details on the sync. 
	//	Example: 
	//		dojox.off.sync.details = ["The document 'foobar' had conflicts - yours one",
	//						"The document 'hello world' was automatically merged"];
	details: [],
	
	// autoSync: boolean
	//		Whether we do automatically sync on page load or when we go online.
	//		If true we do, if false syncing must be manually initiated.
	//		Defaults to true.
	autoSync: true,
	
	// error: boolean
	//		Whether an error occurred during the syncing process.
	error: false,
	
	// log: dojox.off.sync.CommandLog
	//		Our CommandLog that we store offline commands into for later
	//		replaying when we go online
	log: new dojox.off.sync.CommandLog(),
	
	synchronize: function(){ /* void */
		// summary: Begin a synchronization session.

		//dojo.debug("synchronize");
		if(this.isSyncing == true
			|| dojo.off.goingOnline == true
			|| dojo.off.isOnline == false){
			return;
		}
	
		this.isSyncing = true;
		this.successful = false;
		this.details = new Array();
		this.cancelled = false;
		
		this.start();
	},
	
	cancel: function(){ /* void */
		// summary:
		//	Attempts to cancel this sync session
		
		if(this.isSyncing == false){
			return;
		}
		
		this.cancelled = true;
		if(dojo.off.files.refreshing == true){
			dojo.off.files.abortRefresh();
		}
		
		if(this.onCancel){
			this.onCancel();
		}
	},
	
	start: function(){ /* void */
		if(this.cancelled == true){
			this.finished();
			return;
		}
		
		if(this.onStart){
			this.onStart();
		}
		
		this.refreshUI();
	},
	
	refreshUI: function(){ /* void */
		//dojo.debug("refreshUI");
		if(this.cancelled == true){
			this.finished();
			return;
		}
		
		if(this.onRefreshUI){
			this.onRefreshUI();
		}
		
		dojo.off.files.refresh(dojo.hitch(this, function(error, errorMessages){
			if(error == true){
				this.error = true;
				this.successful = false;
				for(var i = 0; i < errorMessages.length; i++){
					this.details.push(errorMessages[i]);
				}
				
				this.finished();
			}else{
				this.upload();	
			}
		}));
	},
	
	upload: function(){ /* void */
		if(this.cancelled == true){
			this.finished();
			return;
		}
		
		if(this.onUpload){
			this.onUpload();
		}
		
		var self = this;
		// when we are done uploading start downloading
		// if the app developer has not provided
		// their own implementation of onReplayFinished
		if(this.log.onReplayFinished == null){
			this.log.onReplayFinished = function(){
				self.download();
			}
		}
		
		// replay the log
		this.log.replay();
	},
	
	download: function(){ /* void */
		if(this.cancelled == true){
			this.finished();
			return;
		}
		
		if(this.onDownload){
			this.onDownload();
		}
		
		// actually do the download -- apps override
		// the method below with their own implementations.
		// when they are done they call dojox.off.sync.finishedDownloading()
		this.doDownload();
	},
	
	doDownload: function(){ /* void */
		// summary:
		//		Actually downloads the data we need to work offline for this
		//		application.
		// description: 
		//		Application's should override this method and provide their own
		//		implementations. When they are finished downloading their data,
		//		they should call dojox.off.sync.finishedDownloading()
	},
	
	finishedDownloading: function(successful /* boolean */, 
									errorMessage /* String */){
		// summary:
		//		Applications call this method from their
		//		dojox.off.sync.doDownload() implementationts to signal that
		//		they are finished downloading any data that should be available
		//		offline
		// successful: boolean
		//		Whether our downloading was successful or not.
		// errorMessage: String
		//		If unsuccessful, a message explaining why
		if(successful == false){
			this.successful = false;
			this.details.push(errorMessage);
			this.error = true;
		}
		
		this.finished();
	},
	
	finished: function(){ /* void */
		this.isSyncing = false;
		
		if(this.cancelled == false && this.error == false){
			this.successful = true;
		}else{
			this.successful = false;
		}
		
		if(this.onFinished){
			this.onFinished();
		}
	},
	
	save: function(finishedCallback){ /* void */
		// summary:
		//		Causes dojox.off.sync to save its configuration data into local
		//		storage. You should not have to call this, as it is handle
		//		automatically by the Dojo Offline framework.
		this.log.save(function(){
			finishedCallback();
		});
	},
	
	load: function(finishedCallback){ /* void */
		// summary:
		//		Causes dojox.off.sync to load its configuration data from local
		//		storage. You should not have to call this, as it is handle
		//		automatically by the Dojo Offline framework.
		this.log.load(function(){
			finishedCallback();
		});
	}
});
