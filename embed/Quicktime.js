dojo.provide("dojox.embed.Quicktime");

(function(){
	/*******************************************************
		dojox.embed.Quicktime

		Base functionality to insert a QuickTime movie
		into a document on the fly.
	 ******************************************************/

	var qtMarkup, qtVersion, installed, __def__={
		width: 320,
		height: 240,
		redirect: null,
		params: []
	};
	var keyBase="dojox-embed-quicktime-", keyCount=0;

	//	reference to the test movie we will use for getting QT info from the browser.
	var testMovieUrl=dojo.moduleUrl("dojox", "embed/resources/version.mov");

	//	*** private methods *********************************************************
	function prep(kwArgs){
		kwArgs = dojo.mixin(dojo.clone(__def__), kwArgs || {});
		if(!("path" in kwArgs)){
			console.error("dojox.embed._quicktime(ctor):: no path reference to a QuickTime movie was provided.");
			return null;
		}
		if(!("id" in kwArgs)){
			kwArgs.id=(keyBase + keyCount++);
		}
		return kwArgs;
	}
	
	var getQTMarkup = 'This content requires the <a href="http://www.apple.com/quicktime/download/" title="Download and install QuickTime.">QuickTime plugin</a>.';
	if(dojo.isIE){
		qtVersion = 0;
		installed = (function(){
			try{
				var o = new ActiveXObject("QuickTimeCheckObject.QuickTimeCheck.1");
				if(o!==undefined){
					//	pull the qt version too
					var v=o.QuickTimeVersion.toString(16);
					qtVersion={
						major: parseInt(v.substring(0,1),10)||0,
						minor: parseInt(v.substring(1,2),10)||0,
						rev: parseInt(v.substring(2,3), 10)||0
					};
					return o.IsQuickTimeAvailable(0);
				}
			} catch(e){ }
			return false;
		})();

		qtMarkup = function(kwArgs){
			if(!installed){ return { id: null, markup: getQTMarkup }; }
			
			kwArgs = prep(kwArgs);
			if(!kwArgs){ return null; }
			var s = '<object classid="clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B" '
				+ 'codebase="http://www.apple.com/qtactivex/qtplugin.cab#version=6,0,2,0" '
				+ 'id="' + kwArgs.id + '" '
				+ 'width="' + kwArgs.width + '" '
				+ 'height="' + kwArgs.height + '">'
				+ '<param name="src" value="' + kwArgs.path + '" />';
			for(var i=0, l=kwArgs.params.length; i<l; i++){
				s += '<param name="' + kwArgs.params[i].key + '" value="' + kwArgs.params[i].value + '" />';
			}
			s += '</object>';
			return { id: kwArgs.id, markup: s };
		}
	} else {
		installed = (function(){
			for(var i=0, l=navigator.plugins.length; i<l; i++){
				if(navigator.plugins[i].name.indexOf("QuickTime")>-1){
					return true;
				}
			}
			return false;
		})();

		qtMarkup = function(kwArgs){
			if(!installed){ return { id: null, markup: getQTMarkup }; }

			kwArgs = prep(kwArgs);
			if(!kwArgs){ return null; }
			var s = '<embed type="video/quicktime" src="' + kwArgs.path + '" '
				+ 'id="' + kwArgs.id + '" '
				+ 'name="' + kwArgs.id + '" '
				+ 'pluginspage="www.apple.com/quicktime/download" '
				+ 'enablejavascript="true" '
				+ 'width="' + kwArgs.width + '" '
				+ 'height="' + kwArgs.height + '"';
			for(var i=0, l=kwArgs.params.length; i<l; i++){
				s += ' ' + kwArgs.params[i].key + '="' + kwArgs.params[i].value + '"';
			}
			s += '></embed>';
			return { id: kwArgs.id, markup: s };
		}
	}

	//	*** The public interface. ****************************************************************
	dojox.embed._quicktime={
		minSupported: 6,
		available: installed,
		supported: installed,
		version: qtVersion,
		initialized: false,
		onInitialize: function(){ 
			dojox.embed._quicktime.initialized = true; 
		},	//	stub function to let you know when this is ready

		place: function(kwArgs, node){
			var o = qtMarkup(kwArgs);

			node = dojo.byId(node);
			if(!node){
				node=dojo.doc.createElement("div");
				node.id=o.id+"-container";
				dojo.body().appendChild(node);
			}
			
			if(o){
				node.innerHTML = o.markup;
				if(o.id){
					return (dojo.isIE)? dojo.byId(o.id) : document[o.id];	//	QuickTimeObject
				}
			}
			return null;	//	QuickTimeObject
		}
	};
	
	if(!dojo.isIE){
		// FIXME: Opera does not like this at all for some reason, and of course there's no event references easily found.
		qtVersion = { major: 0, minor: 0, rev: 0 };
		var o = qtMarkup({ path: testMovieUrl, width:4, height:4 });
		if(!dojo._initFired){
			var s='<div style="top:0;left:0;width:1px;height:1px;overflow:hidden;position:absolute;" id="-qt-version-test">'
				+ o.markup
				+ '</div>';
			console.log(s);
			document.write(s);
		} else {
			var n = document.createElement("div");
			n.id="-qt-version-test";
			n.style.cssText = "top:0;left:0;width:1px;height:1px;overflow:hidden;position:absolute;";
			dojo.body().appendChild(n);
			n.innerHTML = o.markup;
		}

		function qtGetInfo(){
			var qt=document[o.id], n=dojo.byId("-qt-version-test"), v = [ 0, 0, 0 ];
			if(qt){
				try {
					v = qt.GetQuickTimeVersion().split(".");
					qtVersion = { major: parseInt(v[0]||0), minor: parseInt(v[1]||0), rev: parseInt(v[2]||0) };
				} catch(e){ 
					qtVersion = { major: 0, minor: 0, rev: 0 };
				}
			}

			dojox.embed._quicktime.supported = v[0];
			dojox.embed._quicktime.version = qtVersion;
			if(dojox.embed._quicktime.supported){
				dojox.embed._quicktime.onInitialize();
			} else {
				console.log("quicktime is not installed.");
			}

			// dojo.body().removeChild(n);
		}

		if(dojo.isOpera){
			setTimeout(qtGetInfo, 50);
		} else {
			qtGetInfo();
		}
	}
	
	if(dojo.isIE && installed){
		dojox.embed._quicktime.onInitialize();
	}

	//	the real entry point
	dojox.embed.Quicktime=function(/*  */kwArgs, /* DomNode */node){
		if(dojox.embed._quicktime.initialized){
			return dojox.embed._quicktime.place(kwArgs, node);	//	HTMLObject
		}
		throw new Error("dojox.embed.Quicktime:: you must wait for the Quicktime engine to be initialized.");
	};
})();
