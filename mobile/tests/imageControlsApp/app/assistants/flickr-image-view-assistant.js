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
	
	var deferred = dojo.io.script.get({
		url: url,
		content: { 
			api_key: "8c6803164dbc395fb7131c9d54843627",
			format: "json"
		},
		jsonp: "jsoncallback"
	});
	deferred.addBoth(function(res){
		console.log("res = ", res);

		if(res && res.photos && res.photos.photo){
			images = res.photos.photo;
			
			var urls = [];
			
			for(var i = 0; i < images.length; i++){
				urls.push({
					large: "http://farm" 
							+ images[i].farm 
							+ ".static.flickr.com/"
							+ images[i].server
							+ "/"
							+ images[i].id
							+ "_"
							+ images[i].secret
							+ "_m.jpg",
					small: "http://farm" 
							+ images[i].farm 
							+ ".static.flickr.com/"
							+ images[i].server
							+ "/"
							+ images[i].id
							+ "_"
							+ images[i].secret
							+ "_s.jpg"
				});
			}
			_this.urls = urls;
			_this.index = 0;
			
			console.log("got " + urls.length + " urls, setting centerUrl to ", urls[0]);
			
			viewer.attr("centerUrl", urls[0]);
			viewer.attr("rightUrl", urls[1]);
			
		}else{
			console.log("didn't get photos");
		}
	});
	
	var index = 1;
	
	dojo.connect(viewer, "onChange", function(direction){
		_this.index += direction;
		
		if(_this.index > 0){
			viewer.attr("leftUrl", _this.urls[_this.index - 1]);
		}
		if(_this.index < _this.urls.length - 1){
			console.log("setting right url to ", _this.urls[_this.index + 1])
			viewer.attr("rightUrl", _this.urls[_this.index + 1]);
		}else{
			console.log("not setting right url")	
		}
		
		_this.controller.query(".report")[0].innerHTML = 
			_this.index + " of " + images.length
			+ " " + images[_this.index].title;
	});
  },
  
  activate: function(){
    console.log("In main assistant activate");
    
    
  }
  
});