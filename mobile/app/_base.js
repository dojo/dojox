dojo.provide("dojox.mobile.app._base");
dojo.experimental("dojox.mobile.app._base");

dojo.require("dijit._base");
dojo.require("dijit._Widget");
dojo.require("dojox.mobile");
dojo.require("dojox.mobile.parser");

dojo.require("dojox.mobile.app._event");
dojo.require("dojox.mobile.app._Widget");
dojo.require("dojox.mobile.app.StageController");
dojo.require("dojox.mobile.app.SceneController");
dojo.require("dojox.mobile.app.SceneAssistant");
dojo.require("dojox.mobile.app.AlertDialog");
dojo.require("dojox.mobile.app.List");
dojo.require("dojox.mobile.app.ListSelector");
dojo.require("dojox.mobile.app.TextBox");
dojo.require("dojox.mobile.app.ImageView");

(function(){

	var stageController;
	var appInfo;

	var jsDependencies = [
		"dojox.mobile",
		"dojox.mobile.parser"
	];
	var loadingDependencies;

	var rootNode;

	// Load the required resources asynchronously, since not all mobile OSes
	// support dojo.require and sync XHR
	function loadResources(resources){
		// summary:
		//		Loads one or more JavaScript files asynchronously. When complete,
		//		the first scene is pushed onto the stack.
		// resources:
		//		An array of module names, e.g. 'dojox.mobile.AlertDialog'
		
		var moduleName = resources.pop();

		var url = dojo.baseUrl + dojo._getModuleSymbols(moduleName).join("/") + '.js';
	
		dojo.xhrGet({
			url: url,
			sync: false
		}).addCallback(function(text){
			dojo["eval"](text);
	
			if(resources.length > 0){
				loadResources(resources);
			}else{
				dojox.mobile.app._pushFirstScene();
			}
		});
	}

	dojo.mixin(dojox.mobile.app, {
		init: function(node){
			// summary:
			//    Initializes the mobile app. Creates the
	
			rootNode = node || dojo.body();
	
			loadingDependencies = dojo.clone(jsDependencies);
//			loadResources(loadingDependencies);
	
			dojo.subscribe("/dojox/mobile/app/goback", function(){
				stageController.popScene();
			});
	
			dojo.subscribe("/dojox/mobile/app/alert", function(params){
				dojox.mobile.app.getActiveSceneController().showAlertDialog(params);
			});
			
			dojox.mobile.app._pushFirstScene();
		},
	
		getActiveSceneController: function(){
			// summary:
			//		Gets the controller for the active scene.

			return stageController.getActiveSceneController();
		},
	
		getStageController: function(){
			// summary:
			//		Gets the stage controller.
			return stageController;
		},
	
		_pushFirstScene: function(){
			// summary:
			//		Pushes the first scene onto the stack.

			stageController = new dojox.mobile.app.StageController(rootNode);
			var defaultInfo = {
				id: "com.test.app",
				version: "1.0.0",
				initialScene: "main"
			};
	
			// If the application info has been defined, as it should be,
			// use it.
			if(window["appInfo"]){
				dojo.mixin(defaultInfo, window["appInfo"]);
			}
			appInfo = dojox.mobile.app.info = defaultInfo;
	
			// Set the document title from the app info title if it exists
			if(appInfo.title){
				var titleNode = dojo.query("head title")[0] ||
								dojo.create("title", {},dojo.query("head")[0]);
				document.title = appInfo.title;
			}
	
			stageController.pushScene(appInfo.initialScene);
		},
	
		resolveTemplate: function(sceneName){
			// summary:
			//		Given the name of a scene, returns the path to it's template
			//		file.  For example, for a scene named 'main', the file
			//		returned is 'app/views/main/main-scene.html'
			//		This function can be overridden if it is desired to have
			//		a different name to file mapping.
			return "app/views/" + sceneName + "/" + sceneName + "-scene.html";
		},
	
		resolveAssistant: function(sceneName){
			// summary:
			//		Given the name of a scene, returns the path to it's assistant
			//		file.  For example, for a scene named 'main', the file
			//		returned is 'app/assistants/main-assistant.js'
			//		This function can be overridden if it is desired to have
			//		a different name to file mapping.
			return "app/assistants/" + sceneName + "-assistant.js";
		}
	});
})();