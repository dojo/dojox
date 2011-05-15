// dojox/renderer! plugin

define(["dojo"], function(dojo){
	var currentRenderer = null;
	return {
		load: function(id, require, load){
			if(currentRenderer && id != "force"){
				load(currentRenderer);
				return;
			}
			var renderer = dojo.config.forceGfxRenderer,
				renderers = !renderer && (dojo.isString(dojo.config.gfxRenderer) ?
					dojo.config.gfxRenderer : "svg,vml,canvas,silverlight").split(","),
				silverlightObject, silverlightFlag;

			while(!renderer && renderers.length){
				switch(renderers.shift()){
					case "svg":
						// the next test is from https://github.com/phiggins42/has.js
						if("SVGAngle" in dojo.global){
							renderer = "svg";
						}
						break;
					case "vml":
						if(dojo.isIE){
							renderer = "vml";
						}
						break;
					case "silverlight":
						try{
							if(dojo.isIE){
								silverlightObject = new ActiveXObject("AgControl.AgControl");
								if(silverlightObject && silverlightObject.IsVersionSupported("1.0")){
									silverlightFlag = true;
								}
							}else{
								if(navigator.plugins["Silverlight Plug-In"]){
									silverlightFlag = true;
								}
							}
						}catch(e){
							silverlightFlag = false;
						}finally{
							silverlightObject = null;
						}
						if(silverlightFlag){
							renderer = "silverlight";
						}
						break;
					case "canvas":
						if(dojo.global.CanvasRenderingContext2D){
							renderer = "canvas";
						}
						break;
				}
			}

			if (renderer === 'canvas' && dojo.config.canvasEvent !== false) {
				renderer = "canvasWithEvents";
			}

			if(dojo.config.isDebug){
				console.log("gfx renderer = " + renderer);
			}

			require(["dojox/gfx/" + renderer], function(renderer){
				// memorize the renderer module
				currentRenderer = renderer;
				// now load it
				load(renderer);
			});
		}
	};
});
