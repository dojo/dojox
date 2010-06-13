dojo.provide("FlickrImageViewAssistant");
dojo.require("dojox.mobile.app.SceneAssistant");

dojo.require("dojo.io.script");

dojo.declare("FlickrImageViewAssistant", dojox.mobile.app.SceneAssistant, {
  
  setup: function(){
    
    // Instantiate widgets in the template HTML.
    this.controller.parse();
    
	var viewer = this.viewer = dijit.byId("flickrImageView");
	
	var url = "http://api.flickr.com/services/rest/?method=" +
				"flickr.interestingness.getList";
				
	var _this = this;
	
	var images;
	
	var loadingDiv = this.controller.query(".loading")[0];
	
	// When the first image loads, hide the loading indicator.
	var loadConn = dojo.connect(viewer, "onLoad", function(type, url, isSmall){
		if(type == "center"){
			dojo.disconnect(loadConn);
			dojo.destroy(loadingDiv);
			loadingDiv = null;
		}
	});
	
	var deferred = dojo.io.script.get({
		url: url,
		content: { 
			api_key: "8c6803164dbc395fb7131c9d54843627",
			format: "json"
		},
		jsonp: "jsoncallback"
	});
	deferred.addBoth(function(res){

		if(res && res.photos && res.photos.photo){
			images = res.photos.photo;
			
			var urls = [];
			
			var baseUrl;
			
			for(var i = 0; i < images.length; i++){
				baseUrl = "http://farm" 
							+ images[i].farm 
							+ ".static.flickr.com/"
							+ images[i].server
							+ "/"
							+ images[i].id
							+ "_"
							+ images[i].secret;
				urls.push({
					large: baseUrl + "_m.jpg",
					small: baseUrl + "_t.jpg"
				});
			}
			_this.urls = urls;
			_this.index = 0;

			viewer.attr("centerUrl", urls[0]);
			viewer.attr("rightUrl", urls[1]);
			
		}else{
			console.log("didn't get photos");
		}
	});
	
	var index = 1;
	
	var reportDiv = this.controller.query(".report")[0];
	
	this.connect(viewer, "onChange", function(direction){
		_this.index += direction;
		
		// If we are not at the first image, set the leftUrl attribute
		if(_this.index > 0){
			viewer.attr("leftUrl", _this.urls[_this.index - 1]);
		}

		// If we are not at the last image, set the rightUrl attribute
		if(_this.index < _this.urls.length - 1){
			viewer.attr("rightUrl", _this.urls[_this.index + 1]);
		}
		
		reportDiv.innerHTML = 
			_this.index + " of " + images.length
			+ " " + images[_this.index].title;
	});
  },
  
  activate: function(){
    console.log("In main assistant activate");
    
    
  }
  
});