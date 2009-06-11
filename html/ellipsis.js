dojo.provide("dojox.html.ellipsis");

dojo.require("dojo.behavior");

(function(d){
	if(d.isFF){
		// The delay (in ms) to wait so that we don't keep querying when many 
		// changes happen at once - set config "dojoxFFEllipsisDelay" if you
		// want a different value
		var delay = 1;
		if("dojoxFFEllipsisDelay" in d.config){
			delay = Number(d.config.dojoxFFEllipsisDelay);
			if(isNaN(delay)){
				delay = 1;
			}
		}
		
		// Create our stub XUL elements for cloning later
		var sNS = 'http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul';
		var xml = document.createElementNS(sNS, 'window');
		var label = document.createElementNS(sNS, 'description');
		label.setAttribute('crop', 'end');
		xml.appendChild(label);
		
		var createXULEllipsis = function(/* Node */ n){
			// Summary:
			//		Given a node, it creates the XUL and sets its
			//		content so that it will have an ellipsis
			var x = xml.cloneNode(true);
			x.firstChild.setAttribute('value', n.textContent);
			n.innerHTML = '';
			n.appendChild(x);
		};

		// Add our behavior
		var b = d.behavior;
		b.add({
			".dojoxEllipsis": function(n){
				createXULEllipsis(n);
			}
		});
		
		d.addOnLoad(function(){
			// Apply our initial stuff
			b.apply();
			var t = null;
			var running = false;
			
			// Connect to the modified function so that we can catch
			// future changes
			dojo.connect(dojo.body(), "DOMSubtreeModified", function(){
				if(running){ 
					// We are in the process of applying - so we just return
					return;
				}
				if(t){ clearTimeout(t); }
				t = setTimeout(function(){
					t = null;
					running = true;
					b.apply();
					running = false;
				}, delay);
			});
		});
	}
})(dojo);