define([
	"dojo/_base/array",
	"dojo/_base/connect",
	"dojo/_base/Deferred",
	"dojo/dom-class",
	"dojo/dom-style",
	"dojo/DeferredList"
],
	function(array, connect, Deferred, domClass, domStyle, DeferredList){
	return function(from, to, options){
		var rev = (options && options.reverse) ? " mblReverse" : "";
		if(!options || !options.transition){
			console.log("from: ", from, "to: ", to);
			if(from && from.tagname){
				domStyle.style(from,"display","none");
			}
			if(to){
				domStyle.style(to, "display", "");
			}
		}else{
			var defs=[];
			if(to){
				domStyle.style(to, "display", "");
			}
			if(from){
				domStyle.style(from, "display", "");
				var fromDef = new Deferred();
				var fromHandle = connect.connect(from, "webkitAnimationEnd", function(){
					domStyle.style(from,"display","none");
					//remove the animation classes in the node
					array.forEach([options.transition,"mblIn","mblOut","mblReverse"], function(item){
						domClass.remove(from, item);
					});
					
					connect.disconnect(fromHandle);		
					fromDef.resolve(from);
				});
				defs.push(fromDef);
			}
			
			var toDef = new Deferred();
			var toHandle= connect.connect(to, "webkitAnimationEnd", function(){
				//remove the animation classes in the node
				array.forEach([options.transition,"mblIn","mblOut","mblReverse"], function(item){
					domClass.remove(to, item);
				});
				
				connect.disconnect(toHandle);		
				toDef.resolve(to);
			});

			defs.push(toDef);
			options.transition = "mbl"+(options.transition.charAt(0).toUpperCase() + options.transition.substring(1));

			domClass.add(from, options.transition + " mblOut" + rev);
			domClass.add(to, options.transition + " mblIn" + rev);

			return new DeferredList(defs);
			
		}
	}
});
