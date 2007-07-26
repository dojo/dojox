dojo.provide("dojox.layout.ContentPane");

dojo.require("dijit.layout.ContentPane");
dojo.require("dojox.string.Builder");

(function(){ // private scope, sort of a namespace

	// TODO: should these methods be moved to dojox.html.cssPathAdjust or something?
	function adjustCssPaths(cssUrl, cssText, imports){
		//	summary
		//  say cssText comes from dojoroot/src/widget/templates/Foobar.css
		// 	it has a css selector: .dojoFoo { background-image: url(images/bar.png);}
		// then uri should point to dojoroot/src/widget/templates/
		if(!cssText || !cssUrl){ return; }

		var match, str = "", url = "", regex, pad = "";
		var urlChrs = "[\\t\\s\\w\\(\\)\\/\\.\\\\'\"-:#=&?~]+";
		
		if(imports){
			pad = " ";
			regex = new RegExp('(@import)(\\s+'+urlChrs+')\\s*(;)'); // TODO support media rules
		}else{
			regex = new RegExp('(url\\()\\s*('+urlChrs+')\\s*(\\))');
		}
		var regexProtocol = /https?:\/\//;
		var regexTrim = new RegExp("^[\\s]*(['\"]?)("+urlChrs+")\\1[\\s]*?$");
	
		while(match = regex.exec(cssText)){
			url = match[2].replace(regexTrim, "$2");
			if(!regexProtocol.exec(url)){
				url = (new dojo._Url(cssUrl, url).toString());
			}
			str += cssText.substring(0, match.index) + match[1] + pad + "'" + url + "'" + match[3];
			cssText = cssText.substr(match.index + match[0].length);
		}

		str = str + cssText;

		if(!imports){
			str = arguments.callee(cssUrl, str, true);
		}
		return str; // String
	}

	function adjustHtmlPaths(htmlUrl, cont){
		// TODO: clean up this mess!
		// use dojox string builder to achive more speed on slow string merging env.

		// attributepaths one tag can have multiple paths example:
		// <input src="..." style="url(..)"/> or <a style="url(..)" href="..">
		// strip out the tag and run fix on that.
		// this guarantees that we won't run replace on another tag's attribute + it was easier do
		var regexFindTag = /<[a-z][a-z0-9]*[^>]*\s(?:(?:src|href|style)=[^>])+[^>]*>/i;
		// FIXME: get the url regex part from dojo.regex instead
		var regexFindAttr = /\s(src|href|style)=(['"]?)([\w()\[\]\/.,\\'"-:;#=&?\s@]+?)\2/i;
		// these are the supported protocols, all other is considered relative
		var regexProtocols = /^(?:[#]|(?:(?:https?|ftps?|file|javascript|mailto|news):))/;
		var url = htmlUrl || "./";

		var str = "", tag, tagFix = '', attr, path, origPath;

		while(tag = regexFindTag.exec(cont)){
			str += cont.substring(0, tag.index);
			cont = cont.substring((tag.index + tag[0].length), cont.length);
			tag = tag[0];

			// loop through attributes
			tagFix = '';
			while(attr = regexFindAttr.exec(tag)){
				path = ""; origPath = attr[3];
				switch(attr[1].toLowerCase()){
					case "src":// falltrough
					case "href":
						if(regexProtocols.exec(origPath)){
							path = origPath;
						} else {
							path = (new dojo._Url(url, origPath).toString());
						}
						break;
					case "style":// style
						path = adjustCssPaths(url, origPath);
						attr[2] = '"';
						break;
					default:
						path = origPath;
				}
				fix = " " + attr[1] + '=' + attr[2] + path + attr[2];
				// slices up tag before next attribute check
				tagFix += tag.substring(0, attr.index) + fix;
				tag = tag.substring((attr.index + attr[0].length), tag.length);
			}
			str += tagFix + tag; 
			//console.debug(tagFix + tag);
		}
		return str+cont;
	}

	function secureForInnerHtml(cont){
		/********* remove <!DOCTYPE.. tag **********/
		cont = cont.replace(/$\s*<!DOCTYPE\s[^>]+>/i, "");

		/************** <title> ***********/
		// khtml is picky about dom faults, you can't attach a <style> or <title> node as child of body
		// must go into head, so we need to cut out those tags
		var regex = /<title[^>]*>([\s\S]*?)<\/title>/i;
		while(match = regex.exec(cont)){
			cont = cont.substring(0, match.index) + s.substr(match.index + match[0].length);
		}

		return cont;
	}

	function snarfStyles(/*String*/cssUrl, /*String*/cont, /*Array*/styles){
		/****************  cut out all <style> and <link rel="stylesheet" href=".."> **************/
		var regex = /(?:<(style)[^>]*>([\s\S]*?)<\/style>|<link ([^>]*rel=['"]?stylesheet['"]?[^>]*)>)/i;
		var match, attr;
		while(match = regex.exec(cont)){
			if(match[1] && match[1].toLowerCase() == "style"){
				styles.push(adjustCssPaths(cssUrl, match[2]));
			}else if(attr = match[3].match(/href=(['"]?)([^'">]*)\1/i)){
				styles.push("@import '" + attr[2] + "';");
			}
			cont = cont.substring(0, match.index) + cont.substr(match.index + match[0].length);
		};
		return cont;
	}

	function snarfScripts(cont, byRef){
		// summary
		//		strips out script tags from cont
		// invoke with 
		//	byRef = {errBack:function(){/*add your download error code here*/, downloadRemote: true(default false)}}
		//	byRef will have {code:}
		byRef.code = "";
		var regex = /<script([^>]*)>([\s\S]*?)<\/script>/i;
		var regexSrc = /src=(['"])([^'"]*)\1/, regexExcl = /type=['"]dojo\/method/i;
		var tag, match, attr, src, s = "";
		while(tag = cont.match(regex)){
			s = cont.substring(0, tag.index);
			cont = cont.substr(tag.index + tag[0].length);

			if(byRef.downloadRemote && tag[1].length
				&& (src = tag[1].match(regexSrc))
			){
				dojo.xhrGet({
					url: src[2],
					sync: true,
					load: function(code){
						byRef.code += code+";";
					},
					error: byRef.errBack
				});
			}else if(!regexExcl.test(tag[1])){
				byRef.code += tag[2] + ";";
			}
		}

		return s + cont; // String
	}

	function evalInGlobal(code, appendNode){
		// we do our own eval here as dojo.eval doesn't eval in global crossbrowser
		// This work X browser but but it relies on a DOM
		// plus it doesn't return anything, thats unrelevant here but not for dojo core
		appendNode = appendNode || dojo.doc.body;
		var n = appendNode.ownerDocument.createElement('script');
		n.type = "text/javascript";
		appendNode.appendChild(n);
		n.text = code; // DOM 1 says this should work
	}

	/*=====
	dojox.layout.ContentPane.DeferredHandle = {
		// cancel: Function
		cancel: function(){
			// summary: cancel a in flight download
		},

		addOnLoad: function(func){
			// summary: add a callback to the onLoad chain
			// func: Function
		},

		addOnUnload: function(func){
			// summary: add a callback to the onUnload chain
			// func: Function
		}
	}
	=====*/


dojo.declare(
	"dojox.layout.ContentPane",
	dijit.layout.ContentPane,
{
	// summary:
	//		An extended version of dijit.layout.ContentPane
	//		Supports inline scrips, relative path adjustments,
	//		Java function content generation

	// adjustPaths: Boolean
	//		Adjust relative paths in html string content to point to this page
	//		Only usefull if you grab content from a another folder then the current one
	adjustPaths: false,

	// cleanContent: Boolean
	//	summary:
	//		cleans content to make it less likly to generate DOM/JS errors.
	//	description:
	//		usefull if you send contentpane a complete page, instead of a html fragment
	//		scans for 
	//			style nodes, inserts in Document head
	//			title Node, remove
	//			DOCTYPE tag, remove
	//			<!-- *JS code here* -->
	//			<![CDATA[ *JS code here* ]]>
	cleanContent: false,

	// renderStyles: Boolean
	//		trigger/load styles in the content
	renderStyles: false,

	// executeScripts: Boolean
	//		Execute (eval) scripts that is found in the content
	executeScripts: true,

	// scriptHasHooks: Boolean
	//		replace keyword '_container_' in scripts with 'dijit.byId(this.id)'
	scriptHasHooks: false,

	/*======
	// ioMethod: dojo.xhrGet|dojo.xhrPost
	//		reference to the method that should grab the content
	ioMethod: dojo.xhrGet,
	
	// ioArgs: Object
	//		makes it possible to add custom args to xhrGet, like ioArgs.headers['X-myHeader'] = 'true'
	ioArgs: {},

	// onLoadDeferred: dojo.Deferred
	//		callbackchain will start when onLoad occurs
	onLoadDeferred: new dojo.Deferred(),

	// onUnloadDeferred: dojo.Deferred
	//		callbackchain will start when onUnload occurs
	onUnloadDeferred: new dojo.Deferred(),

	setHref: function(url){
		// summary: replace current content with url's content
		return ;// dojox.layout.ContentPane.DeferredHandle
	},

	refresh: function(){
		summary: force a re-download of content
		return ;// dojox.layout.ContentPane.DeferredHandle 
	},

	======*/

	preamble: function(){
		// init per instance properties, initializer doesn't work here because how things is hooked up in dijit._Widget
		this.ioArgs = {};
		this.ioMethod = dojo.xhrGet;
		this.onLoadDeferred = new dojo.Deferred();
		this.onUnloadDeferred = new dojo.Deferred();
	},

	postCreate: function(){
		// override to support loadDeferred
		this._setUpDeferreds();

		dijit.layout.ContentPane.prototype.postCreate.apply(this, arguments);
	},

	onExecError: function(e){
		// summary
		//		event callback, called on script error or on java handler error
		//		overide and return your own html string if you want a some text 
		//		displayed within the ContentPane
	},

	setContent: function(data){
		// summary: set data as new content, sort of like innerHTML
		// data: String|DomNode|NodeList|dojo.NodeList
		if(!this._isDownloaded){
			var defObj = this._setUpDeferreds();
		}

		dijit.layout.ContentPane.prototype.setContent.apply(this, arguments);
		return defObj; // dojox.layout.ContentPane.DeferredHandle
	},

	cancel: function(){
		// summary: cancels a inflight download
		if(this._xhrDfd && this._xhrDfd.fired == -1){
			// we are still in flight, which means we should reset our DeferredHandle
			// otherwise we will trigger onUnLoad chain of the canceled content,
			// the canceled content have never gotten onLoad so it shouldn't get onUnload
			this.onUnloadDeferred = null;
		}
		dijit.layout.ContentPane.prototype.cancel.apply(this, arguments);
	},

	_setUpDeferreds: function(){
		var _t = this, cancel = function(){ _t.cancel();	}
		var onLoad = (_t.onLoadDeferred = new dojo.Deferred());
		var onUnload = (_t._nextUnloadDeferred = new dojo.Deferred());
		return {
			cancel: cancel,
			addOnLoad: function(func){onLoad.addCallback(func);},
			addOnUnload: function(func){onUnload.addCallback(func);}
		};
	},

	_onLoadHandler: function(){
		dijit.layout.ContentPane.prototype._onLoadHandler.apply(this, arguments);
		if(this.onLoadDeferred){
			this.onLoadDeferred.callback(true);
		}
	},

	_onUnloadHandler: function(){
		this.isLoaded = false;
		this.cancel();// need to cancel so we don't get any inflight suprises
		if(this.onUnloadDeferred){
			this.onUnloadDeferred.callback(true);
		}

		dijit.layout.ContentPane.prototype._onUnloadHandler.apply(this, arguments);

		if(this._nextUnloadDeferred){
			this.onUnloadDeferred = this._nextUnloadDeferred;
		}
	},

	_onError: function(type, err){
		dijit.layout.ContentPane.prototype._onError.apply(this, arguments);
		if(this.onLoadDeferred){
			this.onLoadDeferred.errback(err);
		}
	},

	_prepareLoad: function(forceLoad){
		// sets up for a xhrLoad, load is deferred until widget is showing
		var defObj = this._setUpDeferreds();

		dijit.layout.ContentPane.prototype._prepareLoad.apply(this, arguments);

		return defObj;
	},

	_setContent: function(cont){
		// override dijit.layout.ContentPane._setContent, to enable path adjustments
		var styles = [];// init vars

		if(dojo.isString(cont)){
			var url = this.href || './';
			if(this.adjustPaths && this.href){
				cont = adjustHtmlPaths(url, cont);
			}
			if(this.cleanContent){
				cont = secureForInnerHtml(cont);
			}
			if(this.renderStyles || this.cleanContent){
				cont = snarfStyles(url, cont, styles);
			}

			// because of a bug in IE, script tags that is first in html hierarchy doesnt make it into the DOM 
			//	when content is innerHTML'ed, so we can't use dojo.query to retrieve scripts from DOM
			if(this.executeScripts){
				var _t = this, code, byRef = {
					downloadRemote: true,
					errBack:function(e){
						_t._onError.call(_t, 'Exec', 'Error downloading remote script in "'+_t.id+'"', e);
					}
				};
				cont = snarfScripts(cont, byRef);
				code = byRef.code;
			}

			// rationale for this block:
			// if containerNode/domNode is a table derivate tag, some browsers dont allow innerHTML on those
			var node = (this.containerNode || this.domNode), pre = post = '', walk = 0;
			switch(name = node.nodeName.toLowerCase()){
				case 'tr':
					pre = '<tr>'; post = '</tr>';
					walk += 1;//fallthrough
				case 'tbody': case 'thead':// children of THEAD is of same type as TBODY
					pre = '<tbody>' + pre; post += '</tbody>';
					walk += 1;// falltrough
				case 'table':
					pre = '<table>' + pre; post += '</table>';
					walk += 1;
					break;
			}
			if(walk){
				var n = node.ownerDocument.createElement('div');
				n.innerHTML = pre + cont + post;
				do{
					n = n.firstChild;
				}while(--walk);
				cont = n.childNodes;
			}
		}

		// render the content
		dijit.layout.ContentPane.prototype._setContent.call(this, cont);

		// clear old stylenodes from the DOM
		if(this._styleNodes && this._styleNodes.length){
			while(this._styleNodes.length){
				dojo._destroyElement(this._styleNodes.pop());
			}
		}
		// render new style nodes
		if(this.renderStyles && styles && styles.length){
			this._renderStyles(styles);
		}

		if(this.executeScripts && code){
			if(this.cleanContent){
				// clean JS from html comments and other crap that browser
				// parser takes care of in a normal page load
				code = code.replace(/(<!--|(?:\/\/)?-->|<!\[CDATA\[|\]\]>)/g, '');
			}
			if(this.scriptHasHooks){
				// replace _container_ with dijit.byId(this.id)
				code = code.replace(/_container_(?!\s*=[^=])/g, "dijit.byId('"+this.id+"')");
			}
			try{
				evalInGlobal(code, (this.containerNode || this.domNode));
			}catch(e){
				this._onError('Exec', 'Error eval script in '+this.id+', '+e.message, e);
			}
		}
	},

	_renderStyles: function(styles){
		// insert css from content into document head
		this._styleNodes = [];
		var doc = this.domNode.ownerDocument;
		var head = doc.getElementsByTagName('head')[0];

		dojo.forEach(styles, function(cssText){
			var st = doc.createElement('style');
			st.setAttribute("type", "text/css");
			this._styleNodes.push(st);
			head.appendChild(st); // must insert into DOM before setting cssText

			if(st.styleSheet){ // IE
				st.styleSheet.cssText = cssText;
			}else{ // w3c
				st.appendChild(doc.createTextNode(cssText));
			}
		}, this);
	}
});

})();
