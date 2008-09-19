dojo.provide("dojox.gfx");

dojo.require("dojox.gfx.matrix");
dojo.require("dojox.gfx._base");

dojo.loadInit(function(){
	//Since loaderInit can be fired before any dojo.provide/require calls,
	//make sure the dojox.gfx object exists and only run this logic if dojox.gfx.renderer
	//has not been defined yet.
	var gfx = dojo.getObject("dojox.gfx", true), sl, flag;
	if(!gfx.renderer){
		var renderers = (typeof dojo.config["gfxRenderer"] == "string" ?
			dojo.config["gfxRenderer"] : "svg,vml,silverlight,canvas").split(",");

		//	comprehensive iPhone test.  Have to figure out whether it's SVG or Canvas based on the build.
		//	iPhone OS build numbers from en.wikipedia.org.
		var ua = navigator.userAgent, iPhoneOSBuild=0;
		if(ua.indexOf("iPhone")>-1 || ua.indexOf("iPod")>-1){
			//	grab the build out of this.  Expression is a little nasty because we want 
			//		to be sure we have the whole version string.
			var match = ua.match(/Version\/(\d(\.\d)?(\.\d)?)\sMobile\/([^\s]*)\s?/);
			if(match){
				//	grab the build out of the match.  Only use the first three because of specific builds.
				iPhoneOSBuild = parseInt(match[4].substr(0,3), 16);
			}
		}

		for(var i = 0; i < renderers.length; ++i){
			switch(renderers[i]){
				case "svg":
					//	iPhone OS builds greater than 5F1 should have SVG.
					if(!dojo.isIE && (!iPhoneOSBuild || iPhoneOSBuild >= 0x5f1)){ 
						dojox.gfx.renderer = "svg";
					}
					break;
				case "vml":
					if(dojo.isIE){
						dojox.gfx.renderer = "vml";
					}
					break;
				case "silverlight":
					try{
						if(dojo.isIE){
							sl = new ActiveXObject("AgControl.AgControl");
							if(sl && sl.IsVersionSupported("1.0")){
								flag = true;
							}
						}else{
							if(navigator.plugins["Silverlight Plug-In"]){
								flag = true;
							}
						}
					}catch(e){
						flag = false;
					}finally{
						sl = null;
					}
					if(flag){ dojox.gfx.renderer = "silverlight"; }
					break;
				case "canvas":
					//TODO: need more comprehensive test for Canvas
					if(!dojo.isIE){ 
						dojox.gfx.renderer = "canvas";
					}
					break;
			}
			if(dojox.gfx.renderer){ break; }
		}
		console.log("gfx renderer = " + dojox.gfx.renderer);
	}
});

// include a renderer conditionally
dojo.requireIf(dojox.gfx.renderer == "svg", "dojox.gfx.svg");
dojo.requireIf(dojox.gfx.renderer == "vml", "dojox.gfx.vml");
dojo.requireIf(dojox.gfx.renderer == "silverlight", "dojox.gfx.silverlight");
dojo.requireIf(dojox.gfx.renderer == "canvas", "dojox.gfx.canvas");
