dojo.provide("dojox.editor.plugins.AutoUrlLink");

dojo.require("dojo.string");

dojo.declare("dojox.editor.plugins.AutoUrlLink", [dijit._editor._Plugin], {
	// _saved [pivate] DomNode
	//		The previous dom node when the cursor is at a new dom node. When we click elsewhere, the previous dom node
	//		should be examed to see if there is any URL need to be activated
	_saved: null,
	
	// _template [private] String
	//		The link template
	_template: "<a _djrealurl='${url}' href='${url}'>${url}</a>",
	
	setEditor: function(/*dijit.Editor*/ editor){
		// summary:
		//		Called by the editor it belongs to.
		// editor:
		//		The editor it belongs to.
		this.editor = editor;
		if(!dojo.isIE){
			// IE will recognize URL as a link automatically
			// No need to re-invent the wheel.
			this.connect(editor, "onKeyPress", "_keyPress");
			this.connect(editor, "onClick", "_recognize");
			this.connect(editor, "onBlur", "_recognize");
		}
	},
	
	_keyPress: function(evt){
		// summary:
		//		Handle the keypress event and dispatch it to the target handler
		// evt:
		//		The keypress event object.
		// tags:
		//		protected
		var _this = this, ed = this.editor, ks = dojo.keys,
			v = 118, V = 86,
			kc = evt.keyCode, cc = evt.charCode;
		if(evt.ctrlKey && (cc == v || cc == V)){
			setTimeout(function(){ _this._recognize(); }, 10);
		}else if(kc == ks.ENTER){
			this._recognize();
		}else if(cc == ks.SPACE){
			// Give it time to apply the space, then look for the link.
			setTimeout(dojo.hitch(this, "_recognize"),0);
		}else{
			this._saved = ed.window.getSelection().anchorNode;
		}
	},
	
	_recognize: function(){
		// summary:
		//		Recognize the URL like strings and turn them into a link
		// tags:
		//		private
		var template = this._template,
			ed = this.editor,
			selection = ed.window.getSelection(),
			node = this._saved || selection.anchorNode,
			bm = this._saved = selection.anchorNode,
			bmoff = selection.anchorOffset;

		var findUrls = function(/*String*/ value){
			// summary:
			//		Find the occurrace of the URL strings.
			//		FF, Chrome && Safri have a behavior that when insertHTML is executed,
			//		the orignal referrence to the text node will be the text node next to
			//		the inserted anchor automatically. So we have to re-caculate the index of 
			//		the following URL occurrence.
			// value:
			//		A text to be scanned.
			var pattern = /(http|https|ftp):\/[^\s]+/ig,
				list = [], baseIndex = 0, result;
				
			while((result = pattern.exec(value)) != null && (result.index == 0 || value.charAt(result.index - 1) == " ")){
				list.push({start: result.index - baseIndex, end: result.index + result[0].length - baseIndex});
				baseIndex = result.index + result[0].length;
			}
			return list;
		};

		if(node.nodeType == 3 && !this._inLink(node)){
			var linked = false, result = findUrls(node.nodeValue),
				range = ed.document.createRange(),
				item, cost = 0, isSameNode = (bm == node);
					
				
			item = result.shift();	
			while(item){
				// Covert a URL to a link.
				range.setStart(node, item.start);
				range.setEnd(node, item.end);
				selection.removeAllRanges();
				selection.addRange(range);
				ed.execCommand("insertHTML", dojo.string.substitute(template, {url: range.toString()}));
				cost += item.end;
				item = result.shift();
				linked = true;
			}
			
			// If bm and node are the some dom node, caculate the actual bookmark offset
			// If the position of the cursor is modified (turned into a link, etc.), no 
			// need to recover the cursor position
			if(isSameNode && (bmoff = bmoff - cost) <= 0){ return; }

			// We didn't update anything, so don't collapse selections.
			if(!linked) { return ; }
			try{
				// Try to recover the cursor position
				range.setStart(bm, 0);
				range.setEnd(bm, bmoff);
				selection.removeAllRanges();
				selection.addRange(range);
				dojo.withGlobal(ed.window, "collapse", dijit._editor.selection, []);
			}catch(e){}
		}
	},
	
	_inLink: function(/*DomNode*/ node){
		// summary:
		//		Check if the node is already embraced within a <a>...</a> tag.
		// node:
		//		The node to be examed.
		// tags:
		//		private
		var result = false, tagName;
		node = node.parentNode;
		while(node !== this.editor.editNode){
			tagName = node.tagName ? node.tagName.toLowerCase() : "";
			if(tagName == "a"){
				result = true;
				break;
			}
			node = node.parentNode;
		}
		return result;
	}
});

// Register this plugin.
dojo.subscribe(dijit._scopeName + ".Editor.getPlugin",null,function(o){
	if(o.plugin){ return; }
	var name = o.args.name.toLowerCase();
	if(name ===  "autourllink"){
		o.plugin = new dojox.editor.plugins.AutoUrlLink();
	}
});
