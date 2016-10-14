define([
	"dojo/_base/declare",
	"dojo/dom-style",
	"dojo/dom-class",
	"dojo/dom-construct",
	"dojo/sniff",
	"dojo/topic",
	"dojo/query",
	"dijit/_editor/_Plugin",
	"dojo/_base/window",
	"dojox/html/styles"

], function(declare, domStyle, domClass, domConstruct, has, topic, query, Plugin, windowUtil, css) {

	// The className assigned to imported Word content
	var MODIFIEDCLASS = "WordContent";
	// The attribute to tag nodes so they won't be modified
	var TAGGED = "dje";
	// Line height adjustment to help match Word
	var LINEHEIGHTADJUST = 1.3;
	// 133% zoom on Mac OS is equivalent to 100% zoom on Windows; use Windows sizing
	var FIXFONTSIZE = 96/72;
	// The font size to use if none is provided
	var DEFAULTFONTSIZE = 12 * FIXFONTSIZE;
	// Word's default bullet indent which we want to make a positive number
	var MSDEFAULTINDENT = -24;
	// RegExp for replacing pt font-sizes to px
	var fontSizeRegex = /(font[\-size]*)\:\s*(\d{1,4}\.*\d*)pt/gi;
	// RegExp for determining if numbered list or bullets
	var listRegex = /^[a-zA-Z0-9]{1,3}\.|\)/;

	var getText = function(node){
		// Gets all of the text from a node and children
		if(!node){ return ""; }
		var str;
		if(node.nodeType === 3){
			str = node.nodeValue; // IE8 needs this
		}else if(node.nodeType === 1){
			str = node.innerText || node.textContent || "";
		}else{
			str = "";
		}
		return str.replace(/^\s+/, '');// trim left;
	};

	var nodeIsEmpty = function(node){
		// Returns true if node or node tree has no text
		return !getText(node);
	};

	// map of roman characters
	var romanMap = {
		i:1,
		v:5,
		x:10,
		l:50,
		c:100
    };

	var convertRoman = function(str){
		// converts roman numerals into numbers
        var ar = str.toLowerCase().split(''),
            num = 0,
            last = 0;
        for(var i = 0; i < ar.length; i++){
            var n = romanMap[ar[i]];
            if(n > last){
                num = num + (n - last - last);
            }else{
                num += n;
            }
            last = n;
        }
        return num;
    };

	// map for list types
	var listTypeMap = {
		'upper-roman': /^[IVX]/,
		'lower-roman': /^[ivx]/,
		'upper-alpha': /^[A-Z]/,
		'lower-alpha': /^[a-z]/
	};



	var getSymbolNode = function(node){
		var bullet = query("[style='mso-list:Ignore'], [style='mso-list: Ignore']", node);
		bullet = bullet[0];
		if(!bullet){
			// IE9 does not expose non-standard styles
			var spans = query('span', node);
			for(var i = 0; i < spans.length; i++){
				if(/mso-list:\s*Ignore/.test(spans[i].outerHTML)){
					bullet = spans[i];
					break;
				}
			}
		}
		if(bullet.parentNode && bullet.parentNode.style.fontFamily === 'Symbol'){
			bullet = bullet.parentNode;
		}
		return bullet;
	};

	var isNumberedList = function(node){
		// Word doesn't give you any clues as to whether it is a numbered
		// or bullet list. The only way is to pull the first character and
		// see if it's a number. Returns false if not a numbered list.
		// Otherwise returns an object with the list-type and starting number.
		var text = getText(node);

		if(!listRegex.test(text)){
			return null;
		}
		if(text.charAt(0) === '('){
			text = text.slice(1);
		}

		var listType = 'decimal';
		var generalType = 'decimal';
		for(var type in listTypeMap){
			if(listTypeMap[type].test(text)){
				listType = type;
				generalType = type.split('-')[1];
				break;
			}
		}

		var period = text.indexOf('.'),
			paren = text.indexOf(')'),
			start = 1,
			idx =  period > 0 && period < 5 ? period : paren;
		text = text.substring(0, idx);

		if(generalType === "alpha"){
			// Converting letters to numbers. a = 97
			start = (text.toLowerCase().charCodeAt(0)) - 96;

		}else if(generalType === "roman"){
			start = convertRoman(text);
		}else{
			start = parseInt(text, 10);
		}

		start = start || 1;

		return {
			start: start,
			type: listType
		};
	};

	var fixListItemContent = function(node){
		//	Strips out the bullets and list numbers
		var n = getSymbolNode(node);
		if(n.parentNode.style.fontFamily === 'Symbol'){
			n = n.parentNode;
		}
		domConstruct.destroy(n);

		// Empty nodes can throw the font-size measurement off
		var child, next = node.firstChild;
		while(next){
			child = next;
			next = child.nextSibling;
			if(nodeIsEmpty(child)){
				//domConstruct.destroy(child);
			}
		}

		return node;
	};



var PasteFromWord = declare("dojox.editor.plugins.PasteFromWord", Plugin,{
	//	summary:
	//		PasteFromWord is a Dijit Editor plugin that helps format pasted Word content.
	//
	//		This plugin replaces the original PasteFromWord plugin that used a dialog
	//		for pasting the Word content.

	//	useWordBullets:Boolean
	//		When pasting bullets and numbered lists from Word, they come through
	//		as stylized paragraphs. This looks fine, but you can't insert or add
	//		lines to the list without breaking the formatting.
	//		By default, this plugin converts those paragraphs to editable lists.
	//		If you would like the lists to remain as paragraphs, set this to true.
	useWordBullets:false,

	// _filters: [protected] Array
	//		The filters is an array of regular expressions that try and strip out a lot
	//		of style data MS Word likes to insert when pasting into a contentEditable.
	//		The handier is a place to put a function for match handling.  In most cases,
	//		it just handles it as empty string.  But the option is there for more complex
	//		handling.
	_filters: [

		// In non-IE, nested quotes are not escaped which results which results in &quot;
		// being used. Replacing it with a single quote works and keeps the style from
		// breaking. Not a factor in IE8/9 which seems to handle quotes differently
		// NOTE: Needs to be done before other processes
		{regexp: /&quot;/gim, handler: "'"},

		// Remove meta tags, link tags, and prefixed tags
		{regexp: /(<meta\s*[^>]*\s*>)|(<\s*link\s* href="file:[^>]*\s*>)|(<\/?\s*\w+:[^>]*\s*>)/gi, handler: ""},

		// Remove scripts (if any)
		{regexp: /(<\s*script[^>]*>((.|\s)*?)<\\?\/\s*script\s*>)|(<\s*script\b([^<>]|\s)*>?)|(<[^>]*=(\s|)*[("|')]javascript:[^$1][(\s|.)]*[$1][^>]*>)/ig, handler: ""},

		// Remove style tags - unneeded.
		{regexp: /(?:<style([^>]*)>([\s\S]*?)<\/style>|<link\s+(?=[^>]*rel=['"]?stylesheet)([^>]*?href=(['"])([^>]*?)\4[^>\/]*)\/?>)/gi, handler: ""},

		// Webkit wraps list symbols in conditional comments. All other browsers use the
		// mso-list:Ignore style. This is obviously done before stripping comments.
		{regexp:/(<!--[\s\n]*\[if !supportLists\][\s\n]*-->)/gmi, handler:'<span style="mso-list:Ignore">'},
		{regexp:/(<!--[\s\n]*\[endif\][\s\n]*-->)/gmi, handler:'</span>'},

		// Remove comment tags - wraps unnecessary XML
		{regexp: /(<!--(.|\s){1,}?-->)/gi, handler: ""},

		// Convert font-size points to pixels because points causes a greater difference in size
		// between browsers
		{regexp:/font-size:\s*(\d{1,4}\.*\d*)pt/gi, handler:function(m, num){
			return 'font-size:' + (num * FIXFONTSIZE) + 'px';
		}},

		// Word forces 115% line-height everywhere. This overrides the browser default which
		// is more accurate.
		{regexp:/line-height:\s*(\d{1,4})%/gi, handler:function(m, num){
			if(+num === 115){ return ""; }
			return 'line-height:' + (num * 0.01 * LINEHEIGHTADJUST);
		}},

		// Remove blank p and font tags
		{regexp: /(<p[^>]*>\s*(\&nbsp;|\u00A0)*\s*<\/p[^>]*>)|(<p[^>]*>\s*<font[^>]*>\s*(\&nbsp;|\u00A0)*\s*<\/\s*font\s*>\s<\/p[^>]*>)/ig, handler: ""},

		// at least IE8/9 put extra font tags representing the root document style inside elements with inline styles.
		// the font tags end up overriding the intended style with the root document style
		{regexp: /<font[^>]*>|<\/\s*font\s*>/gi, handler: ""},

		// Chrome 22 and Safari 6 end up transforming classes to lowercase so the styles no longer
		// match; normalise this behaviour
		//{regexp: /\.Mso\S+/g, handler: function(className){
		//	return className.toLowerCase() + 'XXX';
		//}},

		// Remove Word 10 o:p tags.
		{regexp: /<(\/?)o\:p[^>]*>/gi, handler: ""}

	],

	_initPasteEvents: function(){
		//	Sets up various events, depending on the browser, to catch the paste
		//	event and the event that fires when the content changes
		//	Note that onpaste actually fires before content appears in the node.
		var
			timer,
			self = this,
			pasting = false,
			editor = this.editor,
			node = editor.editNode;

		// on before-paste (DOM not yet updated)
		var _onbeforepaste = function(event){
			editor.beginEditing();
			event.value = node.innerHTML;
			editor.onBeforePaste(event);
			self.tagExistingContent();
			pasting = true;
			if(timer){
				timer(event);
			}
		};

		// on after-paste (DOM modified)
		var _onafterpaste = function(event){
			if(!pasting){ return; }
			event.value = node.innerHTML;
			self.onpaste(event);
			pasting = false;
			editor.endEditing();
		};

		// on before-paste (paste event occurred)
		this.connect(node, 'paste', _onbeforepaste);

		if('oninput' in node && (!has('ie') || has('ie') > 9)){
			// the preferred method; connecting to the input event
			// IE9 says it has this event, but it doesn't fire.
			this.connect(node, 'input', _onafterpaste);

		}else{
			// all others use a setTimeout (older WebKit, FF, IE8)
			// This actually isn't too bad and seems to work very fast
			timer = function(event){
				setTimeout(function(){
					_onafterpaste(event);
				}, 0);
			};
		}


	},

	onpaste: function(event){
		//	summary:
		//		After a paste event, determines if there is any Word content
		//		to clean up.
		//	tags:
		//		protected
		var content = event.value;
		this.editor.onBeforePasteModified(event);
		// Testing for mso-* styles or Mso* classNames
		if(/mso-|Mso/.test(content)){
			this.applyWordCss();
			content = this.stripWordMarkup(this.editor.editNode.innerHTML);
			this.editor.replaceValue(content);
			this._addClassNames();
			// Apply Default CSS for Word content

		}
		event.value = content;
		this.editor.onPaste(event);
	},

	fixBullets:function(content){
		//	summary:
		//		This method converts Word lists to HTML lists.
		//		When pasting bullets and numbered lists from Word, they come through
		//		as stylized paragraphs. This looks fine, but you can't insert or add
		//		lines to the list without breaking the formatting.
		//	content: String
		//		The HTML content
		//

		if(!/mso-list/.test(content)){
			// no bullets
			return content;
		}
		// This content is HTML and needs to be DOM to work on it
		var parent = domConstruct.create('div', {innerHTML:content, style:{
			// applying a font-size to our tempNode helps Firefox
			// determine the correct size
			fontSize: DEFAULTFONTSIZE + 'px'
		}});

		function buildBullets(nodes){
			//	Actual conversion function
			if(!nodes.length){ return; }

			var
				// regexp checks styles for level'n'
				regexp = /level(\d)\slfo(\d)/,
				// result[1]: 1, 2, 3, etc levels deep of nesting
				tags = [],
				endTags = [],
				listNodes = [],
				html = '',
				level = -1,
				// Used to determine the largest font size item in a list and sets
				// the list to that size so the bullets/numbers will also be of that
				// size.
				minFont = 300,
				maxFont = DEFAULTFONTSIZE;

			for(var i = 0; i < nodes.length; i++){
				var n = nodes[i];
				result = regexp.exec(n.getAttribute('style'));
				if(result){
					listNodes.push(n);
				}else{
					return;
				}

				var lvl = +result[1];
				if(lvl > level){
					// start nested list
					var listProps = isNumberedList(n);
					if(listProps){
						tags = ['<ol class="'+MODIFIEDCLASS+'" style="list-style-type:'+listProps.type+'" start="'+listProps.start+'">', '</ol>'];
					}else{
						tags = ['<ul class="'+MODIFIEDCLASS+'" >', '</ul>'];
					}
					html += tags[0];
					endTags.push(tags[1]);
					level = lvl;
				}else if(lvl < level){
					while(lvl < level){
						// end nested list
						html += endTags.pop();
						level--;
					}
				}

				var child = fixListItemContent(n);
				var size = DEFAULTFONTSIZE;
				if(child.firstChild && child.firstChild.nodeType === 1){
					size = parseInt(domStyle.get(child.firstChild, 'fontSize'), 10);
					if(isNaN(size)){ size = DEFAULTFONTSIZE; }
				}

				minFont = Math.min(minFont, size);
				maxFont = Math.max(maxFont, size);

				// If the item has no size (is default) the overall list size
				// will override
				html += '<li style="font-size:'+size+'px;">'+child.innerHTML+'</li>';
			}

			// clean up and close any remaining tags
			while(endTags.length){
				html += endTags.pop();
			}

			// Insert the list before the first Word list item
			var listNode = domConstruct.place(html, nodes[0], 'before');
			// Fix Word's indent scheme
			var indent = parseInt(domStyle.get(nodes[0], 'textIndent'), 10);
			if(indent > MSDEFAULTINDENT){
				domStyle.set(listNode, 'marginLeft', (indent - MSDEFAULTINDENT) + 'px');
			}

			// IE8's lists seem to be missing the padding as in
			// other browsers
			// Can't go less than 30, because FF looks to be different too
			domStyle.set(listNode, 'paddingLeft', '30px');


			// now destroy the Word nodes
			for(i = 0; i < listNodes.length; i++){
				domConstruct.destroy(listNodes[i]);
			}
		}

		// Each line in a Word export is a paragraph. Find all the P nodes
		// and check if they are a bulleted item
		var paragraphs = query('p', parent),
			listNodes = [],
			last = /ListParagraphCxSpLast/;
		for(var i=0; i<paragraphs.length; i++){
			var p = paragraphs[i];
			if(p.getAttribute(TAGGED)){
				// tagged as do not modify
				continue;
			}
			if(p){
				var str = p.outerHTML;
				// first test that there is a list style
				// Sometimes Word allows empty bullets that mess up the determining of lists
				if(/mso-list/.test(str)){
					if(last.test(str)){
						listNodes.push(p);
						buildBullets(listNodes);
						listNodes = [];
					}else{
						listNodes.push(p);
					}
				}else{
					if(listNodes.length){
						buildBullets(listNodes);
						listNodes = [];
					}
				}
			}
		}
		buildBullets(listNodes);

		return parent.innerHTML;
	},

	_addClassNames: function(){
		// Add imported Word className to all Word P, UL, and OL
		// elements so default styling will apply.
		//
		var node = this.editor.editNode;
		var paragraphs = query('p,ul,ol', node);
		paragraphs.forEach(function(n){
			if(!n.getAttribute(TAGGED)){
				domClass.add(n, MODIFIEDCLASS);
				n.setAttribute(TAGGED, 1);
			}
		});
	},

	stripWordMarkup: function(content){
		//	summary:
		//		Passes the content through all of the filters
		//	content: String
		//		The stringified DOM content
		//

		// Apply HTML filters
		for(var i = 0; i < this._filters.length; i++){
			var filter  = this._filters[i];
			content = content.replace(filter.regexp, filter.handler);
		}

		// Make editable bullets
		if(!this.useWordBullets){
			content = this.fixBullets(content);
		}

		return content;
	},

	tagExistingContent: function(){
		// If the Editor is already has content,
		// tag it so they won't be touched when applying Word styles
		// and other modifications
		query('p,ul,ol', this.editor.editNode).forEach(function(n){
			if(!n.getAttribute(TAGGED)){
				n.setAttribute(TAGGED, 1);
			}
		});

	},

	applyWordCss: function(){
		//	summary:
		//		Default styling is usually not included with the pasted Word content.
		//		This assigns styles that associate with the default className on
		//		Word paragraphs
		//
		if(this.defaultWordCssApplied){ return; }
		this.defaultWordCssApplied = true;

		windowUtil.setContext(this.editor.window, this.editor.editNode.ownerDocument);
		// default font
		css.insertCssRule("."+MODIFIEDCLASS+", MsoNormal", 'font-family:Cambria; font-size:'+DEFAULTFONTSIZE+'px;');
		// default margins
		css.insertCssRule("p."+MODIFIEDCLASS+", ul."+MODIFIEDCLASS+", ol."+MODIFIEDCLASS+", p.MsoNormal, ul.MsoNormal, ol.MsoNormal", 'margin-top:.1em; margin-bottom:0.1em;');
		// get sub-lists to inherit font size
		css.insertCssRule("ol."+MODIFIEDCLASS+" ol, ul."+MODIFIEDCLASS+" ul, ol."+MODIFIEDCLASS+" ul", 'font-size:inherit;');
		windowUtil.setContext(window, document);
	},

	setEditor: function(editor){
		// summary:
		//		Override for the setting of the editor.
		// editor: Object
		//		The editor to configure for this plugin to use.

		// add stubs to the editor
		if(!editor.onBeforePaste){
			editor.onBeforePaste = function(event){};
		}
		if(!editor.onBeforePasteModified){
			editor.onBeforePasteModified = function(event){};
		}
		if(!editor.onPaste){
			editor.onPaste = function(event){};
		}

		this.editor = editor;
		var self = this;
		editor.onLoadDeferred.addCallback(function(){
			self._initPasteEvents();
		});
	}
});

// Register this plugin.
Plugin.registry.pasteFromWord = function(args){
	return new PasteFromWord({
		useWordBullets: ("useWordBullets" in args)?args.useWordBullets:false
	});
};

return PasteFromWord;


});
