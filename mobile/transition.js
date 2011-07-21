define([
	"dojo/_base/kernel",
	"dojo/_base/array",
	"dojo/_base/html",
	"dojo/DeferredList"
],
	function(dojo, darray, dhtml, DeferredList){
	return function(from, to, options){
		var rev = (options && options.reverse) ? " mblReverse" : "";
		if(!options || !options.transition){
			console.log("from: ", from, "to: ", to);
			if (from && from.tagname) {
				dojo.style(from,"display","none");
			}
			if (to){
				dojo.style(to, "display", "");
			}
		}else{
			var defs=[];
			if(to){
				dojo.style(to, "display", "");
			}
			if (from){
				dojo.style(from, "display", ""); 
				var fromDef = new dojo.Deferred();
				var fromHandle = dojo.connect(from, "webkitAnimationEnd", function(){
					dojo.style(from,"display","none");
					//remove the animation classes in the node
					dojo.forEach([options.transition,"mblIn","mblOut","mblReverse"], function(item){
						dojo.removeClass(from, item);
					});
					
					dojo.disconnect(fromHandle);		
					fromDef.resolve(from);
				}); 
				defs.push(fromDef);
			}
			
			var toDef = new dojo.Deferred();
			var toHandle= dojo.connect(to, "webkitAnimationEnd", function(){
				//remove the animation classes in the node
				dojo.forEach([options.transition,"mblIn","mblOut","mblReverse"], function(item){
					dojo.removeClass(to, item);
				});
				
				dojo.disconnect(toHandle);		
				toDef.resolve(to);
			}); 

			defs.push(toDef);
			options.transition = "mbl"+(options.transition.charAt(0).toUpperCase() + options.transition.substring(1));

			dojo.addClass(from, options.transition + " mblOut" + rev);
			dojo.addClass(to, options.transition + " mblIn" + rev);

			return new DeferredList(defs);
			
		}
	}
});
