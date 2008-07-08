dojo.provide("dojox.io.windowName");
// Implements the window.name transport  

dojox.io.windowName = {
	send: function(/*String*/ method, /*dojo.__IoArgs*/ args){
		// summary:
		//		Provides secure cross-domain request capability.
		// 		Sends a request using an iframe (POST or GET) and reads the response through the 
		// 		frame's window.name.
		//
		//	method:
		//		The method to use to send the request, GET or POST
		//
		//	args:
		//		See dojo.xhr
		//
		//	description:
		//		In order to provide a windowname transport accessible resources/web services, a server
		// 		should check for the presence of a parameter window.name=true and if a request includes
		// 		such a parameter, it should respond to the request with an HTML 
		// 		document that sets it's window.name to the string that is to be 
		// 		delivered to the client. For example, if a client makes a window.name request like:
		// 	|	http://othersite.com/greeting?windowname=true
		// 		And server wants to respond to the client with "Hello", it should return an html page:
		// |	<html><script type="text/javascript">
		// |	window.name="Hello";
		// |	</script></html>
		// 		One can provide XML or JSON data by simply quoting the data as a string, and parsing the data
		// 		on the client.
		args.url += (args.url.match(/\?/) ? '&' : '?') + "windowname=" + (args.windowName || true); // indicate our desire for window.name communication
		var cleanup = function(result){
			var innerDoc = frame.contentWindow.document;
			// we have to do this to stop the wait cursor in FF 
			try{
				innerDoc.write(" ");
				innerDoc.close();
			}catch(e){}
			dojo.body().removeChild(frame1); // clean up
			return result;
		}
		var dfd = dojo._ioSetArgs(args,cleanup,cleanup,cleanup);
		if(args.timeout){
				setTimeout(function(){
					if(state!=2){
						dfd.callback(new Error("Timeout"));
					}
				},
				args.timeout
			);
		}
		var ioArgs = dfd.ioArgs;
		var startName = "__starting__";
		var frameName = "dojox.io.windowName" + Math.random();
		var frameNum = dojox.io.windowName._frameNum++;
		var doc = dojo.doc;
		var body = dojo.body();
		if(dojo.isMoz && ![].reduce){
			// FF2 allows unsafe sibling frame modification,
			// the fix for this is to create nested frames with getters and setters to protect access
			var frame1 = doc.createElement("iframe");
			frame1.style.display='none';
			body.appendChild(frame1);
			var firstWindow = frame1.contentWindow;
			doc = firstWindow.document;
			doc.write("<html><body>first frame<iframe name='protectedFrame'></iframe></body></html>");
			doc.close();
			var secondWindow = firstWindow[0]; 
			firstWindow.__defineGetter__(0,function(){});
			firstWindow.__defineGetter__("protectedFrame",function(){});
			doc = secondWindow.document;
			doc.write("<html><body>second frame</body></html>");
			doc.close();
			body = doc.body;
		}

		frame = doc.createElement(dojo.isIE ? '<iframe name="' + frameName + '" onload="dojox.io.windowName['+frameNum+']()">' : 'iframe');
		frame1 = frame1 || frame; 
		frame1.style.display='none';
		var state = 0;
		function getData(){
			var data = frame.contentWindow.name;
			if(typeof data == 'string'){
				state = 2; // we are done now
				if(data == startName){
					data = new Error("The requested resource did not set it's window.name");
				}
				dfd.callback(data);
			}
		}
		dojox.io.windowName[frameNum] = frame.onload = function(){
			try{
				if(frame.contentWindow.location =='about:blank'){
					// opera and safari will do an onload for about:blank first, we can ignore this first onload
					return;
				}
			}catch(e){
				// if we are in the target domain, frame.contentWindow.location will throw an ignorable error 
			}
			if(state == 1){
				// back to our domain, we should be able to access the frame name now				
				getData();
			}
			if(!state){
				// we have loaded the target resource, now time to navigate back to our domain so we can read the frame name
				state=1;
				var sameDomainUrl = dojo.config["dojoBlankHtmlUrl"]||dojo.moduleUrl("dojo", "resources/blank.html");
				frame.contentWindow.location = sameDomainUrl;
				try{
					getData();
				}
				catch(e){
				}
			}
		};
		frame.name = frameName;
		if(method.match(/GET/i)){
			// if it is a GET we can just the iframe our src url
			dojo._ioAddQueryToUrl(ioArgs);
			frame.src = ioArgs.url;
			body.appendChild(frame);
		}else if(method.match(/POST/i)){
			// if it is a POST we will build a form to post it
			body.appendChild(frame);
			var form = dojo.doc.createElement("form");
			dojo.body().appendChild(form);
			var query = dojo.queryToObject(ioArgs.query);
			for(var i in query){
				var values = query[i];
				values = values instanceof Array ? values : [values];
				for(j = 0; j < values.length; j++){
					// create hidden inputs for all the parameters
					var input = doc.createElement("input");
					input.type = 'hidden';
					input.name = i;
					input.value = values[j];				
					form.appendChild(input);	
				}
			}
			form.method = 'POST';
			form.action = args.url;
			form.target = frameName;// connect the form to the iframe
			
			form.submit();
			form.parentNode.removeChild(form);
		}else{
			throw new Error("Method " + method + " not supported with the windowName transport");
		}
		if(frame.contentWindow){
			frame.contentWindow.name = startName; // IE likes it afterwards
		}
		return dfd;
	},
	_frameNum: 0 
	
}