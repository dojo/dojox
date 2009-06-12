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
		
		// Create our iframe elements for cloning later
		var create = d.create;
		var dd = d.doc;
		var dp = d.place;
		var iFrame = create("iframe", {className: "dojoxEllipsisIFrame",
					src: "javascript:'<html><head><script>if(\"loadFirebugConsole\" in window){window.loadFirebugConsole();}</script></head><body></body></html>'"});
		var rollRange = function(/* W3C Range */ r){
			// Summary:
			//		Rolls the given range back one character from the end
			if(r.collapsed){
				// Do nothing - we are already collapsed
				return;
			}
			if(r.endContainer.nodeType == 3 && r.endOffset > 0){
				r.setEnd(r.endContainer, r.endOffset - 1);
			}else if(r.endContainer.nodeType == 3){
				r.setEndBefore(r.endContainer);
				rollRange(r);
				return;
			}else if(r.endOffset && r.endContainer.childNodes.length >= r.endOffset){
				var nCont = r.endContainer.childNodes[r.endOffset - 1];
				if(nCont.nodeType == 3){
					r.setEnd(nCont, nCont.length - 1);
				}else if(nCont.childNodes.length){
					r.setEnd(nCont, nCont.childNodes.length);
					rollRange(r);
					return;
				}else{
					r.setEndBefore(nCont);
					rollRange(r);
					return;
				}
			}else{
				r.setEndBefore(r.endContainer);
				rollRange(r);
				return;
			}
		};
		var createIFrameEllipsis = function(/* Node */ n){
			// Summary:
			//		Given a node, it creates an iframe and and ellipsis div and
			//		sets up the connections so that they will work correctly.
			//		This function is used when createXULEllipsis is not able
			//		to be used (because there is markup within the node) - it's
			//		a bit slower, but does the trick
			var c = create("div", {className: "dojoxEllipsisContainer"});
			var e = create("div", {className: "dojoxEllipsisShown", style: {display: "none"}});
			n.parentNode.replaceChild(c, n);
			c.appendChild(n);
			c.appendChild(e);
			var i = iFrame.cloneNode(true);
			var ns = n.style;
			var es = e.style;
			var ranges;
			var resizeNode = function(){
				ns.display = "";
				es.display = "none";
				if(n.scrollWidth <= n.offsetWidth){ return; }
				var r = dd.createRange();
				r.selectNodeContents(n);
				ns.display = "none";
				es.display = "";
				do{
					dp(r.cloneContents(), e, "only");
					rollRange(r);
				}while(!r.collapsed && e.scrollWidth > e.offsetWidth);
			};
			i.onload = function(){
				i.contentWindow.onresize = resizeNode;
				resizeNode();
			};
			c.appendChild(i);
		};

		// Add our behavior
		var b = d.behavior;
		b.add({
			".dojoxEllipsis": function(n){
				if(n.textContent == n.innerHTML){
					// We can do the faster XUL version, instead of calculating
					createXULEllipsis(n);
				}else{
					createIFrameEllipsis(n);
				}
			}
		});
		
		d.addOnLoad(function(){
			// Apply our initial stuff
			b.apply();
			var t = null;
			var running = false;
			
			// Connect to the modified function so that we can catch
			// future changes
			d.connect(d.body(), "DOMSubtreeModified", function(){
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