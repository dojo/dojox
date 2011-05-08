define(["dojo/_base/html","dojo/_base/Deferred","dojo/DeferredList"], function(dhtml,Deferred,DeferredList){

	var getClass = function(s){
		// convert from transition name to corresponding class name
		// ex. "slide" -> "mblSlide"
		return "mbl"+s.charAt(0).toUpperCase() + s.substring(1);
	}


	return function(from, to, options){
		console.log("Trasition opts: ", arguments);
		var rev = (options && options.reverse) ? " mblReverse" : "";
		if(!options || !options.transition){
			dojo.style(from,"display","none");
			dojo.style(to, "display", "");
			return [from,to];
		}

		var defs=[];
		dojo.style(from, "display", ""); // from node might be set to display:none by layout() call in setSelectedChild()
		dojo.style(to, "display", "");
		if (from){
			var fromDef = new dojo.Deferred();
			var fromHandle = dojo.connect(from, "webkitAnimationEnd", function(){
				dojo.style(from,"display","none");
				//remove the animation classes in the node
				dojo.forEach([options.transition,"in","out","reverse"], function(item){
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
			dojo.forEach([options.transition,"in","out","reverse"], function(item){
				dojo.removeClass(to, item);
			});
			
			console.log("toDef ended");
			dojo.disconnect(toHandle);		
			toDef.resolve(to);
		}); 
		defs.push(toDef);
		dojo.addClass(from, options.transition + " out" + rev);
		dojo.addClass(to, options.transition + " in" + rev);
		return new dojo.DeferredList(defs);
	}
});
