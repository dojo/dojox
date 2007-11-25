dojo.provide("dojox.lang.highlight");
dojo.experimental("dojox.lang.highlight");
//
//	dojox.lang.Highlight - syntax highlighting with language auto-detection
//	released under CLA by the Dojo Toolkit - (c) ... ....
//	orig BSD release available from: http://softwaremaniacs.org/soft/highlight/
//

dojox.lang.highlight = {};

// FIXME: Half of this is global, half of it is private. decide direction
// and implement. 

// FIXME: these need not be global, but are common in all dojox.lang.LANGUAGES
var IDENT_RE = '[a-zA-Z][a-zA-Z0-9_]*';
var UNDERSCORE_IDENT_RE = '[a-zA-Z_][a-zA-Z0-9_]*';
var NUMBER_RE = '\\b\\d+(\\.\\d+)?';
var C_NUMBER_RE = '\\b(0x[A-Za-z0-9]+|\\d+(\\.\\d+)?)';
// Common modes
var APOS_STRING_MODE = {
  className: 'string',
  begin: '\'', end: '\'',
  illegal: '\\n',
  contains: ['escape'],
  relevance: 0
};
var QUOTE_STRING_MODE = {
	className: 'string',
	begin: '"', 
	end: '"',
	illegal: '\\n',
	contains: ['escape'],
	relevance: 0
};
var BACKSLASH_ESCAPE = {
  className: 'escape',
  begin: '\\\\.', end: '^',
  relevance: 0
};
var C_LINE_COMMENT_MODE = {
  className: 'comment',
  begin: '//', end: '$',
  relevance: 0
};
var C_BLOCK_COMMENT_MODE = {
  className: 'comment',
  begin: '/\\*', end: '\\*/'
};
var HASH_COMMENT_MODE = {
  className: 'comment',
  begin: '#', end: '$'
};
var C_NUMBER_MODE = {
  className: 'number',
  begin: C_NUMBER_RE, end: '^',
  relevance: 0
};

// FIXME: so far, all supported languages use this, minus a few extra global
// common shared CONSTANTS in xml and css definitions
dojox.lang.LANGUAGES = {};

// the attempt the make most of this private, still needs work and decisions made.
(function(){ 

    // var LANGUAGES = dojox.lang.LANGUAGES;

    function Highlighter(language_name,value){
	// methods:
    	function subMode(lexem) {
    		if(!modes[modes.length - 1].contains){ return null; }
    	    	for(var i in modes[modes.length - 1].contains){
    	      		var className = modes[modes.length - 1].contains[i];
	      		for (var key in language.modes)
				if (language.modes[key].className == className && language.modes[key].beginRe.test(lexem))
		  			return language.modes[key];
	    	}//for
	    	return null;
  	}//subMode
  
  	function endOfMode(mode_index, lexem){
    		if (modes[mode_index].end && modes[mode_index].endRe.test(lexem)){ return 1; }
    		if (modes[mode_index].endsWithParent) {
      			var level = endOfMode(mode_index - 1, lexem);
      			return level ? level + 1 : 0;
    		}//if
    		return 0;
  	}//endOfMode
  
  	function isIllegal(lexem){
    		if (!modes[modes.length - 1].illegalRe){ return false; }
    		return modes[modes.length - 1].illegalRe.test(lexem);
  	}//isIllegal

  	function eatModeChunk(value, index){
    		if(!modes[modes.length - 1].terminators){
      			var terminators = [];
      			if (modes[modes.length - 1].contains)
        			for (var key in language.modes){
          				if (contains(modes[modes.length - 1].contains, language.modes[key].className) &&
              					!contains(terminators, language.modes[key].begin)){
            					terminators[terminators.length] = language.modes[key].begin;
					}
        			}//for

      			var mode_index = modes.length - 1;
      			do {
        			if (modes[mode_index].end && !contains(terminators, modes[mode_index].end)){
          				terminators[terminators.length] = modes[mode_index].end;
				}
        			mode_index--;
      			} while(modes[mode_index + 1].endsWithParent);

      			if (modes[modes.length - 1].illegal)
        			if (!contains(terminators, modes[modes.length - 1].illegal))
          				terminators[terminators.length] = modes[modes.length - 1].illegal;

			var terminator_re = '(' + terminators[0];
			for (var i = 0; i < terminators.length; i++)
				terminator_re += '|' + terminators[i];
			terminator_re += ')';
			modes[modes.length - 1].terminators = langRe(language, terminator_re);
		}//if

    		value = value.substr(index);
    		var match = modes[modes.length - 1].terminators.exec(value);
    		if (!match) 
      			return [value, '', true];
    		if (match.index == 0)
      			return ['', match[0], false];
    		else
      			return [value.substr(0, match.index), match[0], false];
  	}//eatModeChunk
  
  	function escape(value) {
    		return value.replace(/&/gm, '&amp;').replace(/</gm, '&lt;').replace(/>/gm, '&gt;');
  	}//escape
  
  	function keywordMatch(mode, match) {
    		var match_str = language.case_insensitive ? match[0].toLowerCase() : match[0]
    		for (var className in mode.keywordGroups) {
      			var value = mode.keywordGroups[className].hasOwnProperty(match_str);
      			if (value)
        			return [className, value];
    		}//for
    		return false;
  	}//keywordMatch
  
  	function processKeywords(buffer) {
    		var mode = modes[modes.length - 1];
    		if (!mode.keywords || !mode.lexems)
      			return escape(buffer);
    		if (!mode.lexemsRe) {
      			var lexems = [];
      			for (var key in mode.lexems)
        			if (!contains(lexems, mode.lexems[key]))
          				lexems[lexems.length] = mode.lexems[key];
      			var lexems_re = '(' + lexems[0];
      			for (var i = 1; i < lexems.length; i++)
        			lexems_re += '|' + lexems[i];
      			lexems_re += ')';
      			mode.lexemsRe = langRe(language, lexems_re, true);
    		}//if
    		var result = '';
    		var last_index = 0;
    		mode.lexemsRe.lastIndex = 0;
    		var match = mode.lexemsRe.exec(buffer);
    		while (match) {
      			result += escape(buffer.substr(last_index, match.index - last_index));
      			keyword_match = keywordMatch(mode, match);
      			if (keyword_match) {
        			keyword_count += keyword_match[1];
        			result += '<span class="'+ keyword_match[0] +'">' + escape(match[0]) + '</span>';
      			} else {
        			result += escape(match[0]);
      			}//if
      			last_index = mode.lexemsRe.lastIndex;
      			match = mode.lexemsRe.exec(buffer);
    		}//while
    		result += escape(buffer.substr(last_index, buffer.length - last_index));
    		return result;
  	}//processKeywords
  
  	function processModeInfo(buffer, lexem, end) {
    		if (end) {
      			result += processKeywords(modes[modes.length - 1].buffer + buffer);
      			return;
    		}//if
    		if (isIllegal(lexem))
      			throw 'Illegal';
    		var new_mode = subMode(lexem);
    		if (new_mode) {
      			modes[modes.length - 1].buffer += buffer;
      			result += processKeywords(modes[modes.length - 1].buffer);
      			if (new_mode.excludeBegin) {
        			result += lexem + '<span class="' + new_mode.className + '">';
        			new_mode.buffer = '';
      			} else {
        			result += '<span class="' + new_mode.className + '">';
        			new_mode.buffer = lexem;
      			}//if
      			modes[modes.length] = new_mode;
      			relevance += modes[modes.length - 1].relevance != undefined ? modes[modes.length - 1].relevance : 1;
      			return;
    		}//if
    		var end_level = endOfMode(modes.length - 1, lexem);
    		if (end_level) {
      			modes[modes.length - 1].buffer += buffer;
      			if (modes[modes.length - 1].excludeEnd) {
        			result += processKeywords(modes[modes.length - 1].buffer) + '</span>' + lexem;
      			} else {
        			result += processKeywords(modes[modes.length - 1].buffer + lexem) + '</span>';
      			}
      			while (end_level > 1) {
        			result += '</span>';
        			end_level--;
        			modes.length--;
      			}//while
      			modes.length--;
      			modes[modes.length - 1].buffer = '';
      			return;
    		}//if
  	}//processModeInfo

  	function highlight(value) {
    		var index = 0;
    		language.defaultMode.buffer = '';
    		do {
      			var mode_info = eatModeChunk(value, index);
      			processModeInfo(mode_info[0], mode_info[1], mode_info[2]);
      			index += mode_info[0].length + mode_info[1].length;
    		} while(!mode_info[2]); 
    		if(modes.length > 1){
      			throw 'Illegal';
		}
  	}//highlight
  

	// constructor like:
  	this.language_name = language_name;
  	var language = dojox.lang.LANGUAGES[language_name];
  	var modes = [language.defaultMode];
  	var relevance = 0;
  	var keyword_count = 0;
  	var result = '';
  	try{
    		highlight(value);
    		this.relevance = relevance;
    		this.keyword_count = keyword_count;
    		this.result = result;
  	} catch(e){
    		if(e == 'Illegal'){
      			this.relevance = 0;
      			this.keyword_count = 0;
      			this.result = escape(value);
    		}else{
      			throw e;
    		}//if
  	}//try
    }
    
    function contains(array, item){
	// assist function. FIXME: dojo.inArray()? 
    	if (!array){ return false; }
	for (var key in array){
		if (array[key] == item){ return true; }
	}
	return false; // Boolean
    }

    function blockText(block){
	var result = '';
	for (var i = 0; i < block.childNodes.length; i++){
		if (block.childNodes[i].nodeType == 3){
			result += block.childNodes[i].nodeValue;
		}else if(block.childNodes[i].nodeName == 'BR'){
			result += '\n';
		}else{
			throw 'Complex markup';
		}
	}
	return result;
    }//blockText

    dojox.lang.highlight.init = function(/* DomNode */block){
	// summary: the main (only required) public API. highlight a node.
	if(dojo.hasClass(block,"no-highlight")){ return; }
  	try { blockText(block);
  	}catch (e){
    		if (e == 'Complex markup'){ return; }
  	}

  	var classes = block.className.split(/\s+/);
  	for (var i = 0; i < classes.length; i++) {
    		if (dojox.lang.LANGUAGES[classes[i]]) {
      			highlightLanguage(block, classes[i]);
      			return;
    		}//if
  	}//for
  	highlightAuto(block);
    }

    function highlightLanguage(block, language) {
	var highlight = new Highlighter(language, blockText(block));
	// See these 4 lines? This is IE's notion of "block.innerHTML = result". Love this browser :-/
	var container = document.createElement('div');
	container.innerHTML = '<pre><code class="' + block.className + '">' + highlight.result + '</code></pre>';
	var environment = block.parentNode.parentNode;
	environment.replaceChild(container.firstChild, block.parentNode);
    }
    
    function highlightAuto(block){
	var result = null;
	var language = '';
	var max_relevance = 2;
	var relevance = 0;
	var block_text = blockText(block);
    
	for (var key in dojox.lang.LANGUAGES){
		var highlight = new Highlighter(key, block_text);
		relevance = highlight.keyword_count + highlight.relevance;
		if (relevance > max_relevance){
	      		max_relevance = relevance;
	      		result = highlight;
	    	}//if
	}//for
	  
	if(result){
	    // See these 4 lines? This is IE's notion of "block.innerHTML = result". Love this browser :-/
	    var container = document.createElement('div');
	    container.innerHTML = '<pre><code class="' + result.language_name + '">' + result.result + '</code></pre>';
	    var environment = block.parentNode.parentNode;
	    environment.replaceChild(container.firstChild, block.parentNode);
	}//if
    }//highlightAuto

    function langRe(language, value, global){
	var mode =  'm' + (language.case_insensitive ? 'i' : '') + (global ? 'g' : '');
	return new RegExp(value, mode);
    }//langRe

    dojox.lang.highlight.compileRes = function(){
	for (var i in dojox.lang.LANGUAGES){
		var language = dojox.lang.LANGUAGES[i];
		for (var key in language.modes){
			if (language.modes[key].begin){
        			language.modes[key].beginRe = langRe(language, '^' + language.modes[key].begin);
			}
			if (language.modes[key].end){
        			language.modes[key].endRe = langRe(language, '^' + language.modes[key].end);
			}
			if (language.modes[key].illegal){
        			language.modes[key].illegalRe = langRe(language, '^(?:' + language.modes[key].illegal + ')');
			}
			language.defaultMode.illegalRe = langRe(language, '^(?:' + language.defaultMode.illegal + ')');
		}//for
	}//for
    }//compileRes

    dojox.lang.highlight.compileKeywords = function(){

	var modeWords = function(mode){
    		if (!mode.keywordGroups){
      			for (var key in mode.keywords){
        			if (mode.keywords[key] instanceof Object){ mode.keywordGroups = mode.keywords;
				}else{ mode.keywordGroups = { keyword: mode.keywords }; }
				break;
      			}//for
    		}//if
  	};
  
	for (var i in dojox.lang.LANGUAGES){
		var lang = dojox.lang.LANGUAGES[i];
		if(!lang.defaultMode || !lang.modes){ return; }
		modeWords(lang.defaultMode);
		for (var key in lang.modes){
      			modeWords(lang.modes[key]);
    		}//for
    	}// ); 
    };

})();

if(djConfig && djConfig.parseOnLoad){
	// summary: deprecate initHighlightingOnLoad, and parse if parseOnLoad = true
	//		this is our own mini-parser extension? FIXME: use dojoType="" and
	//		declared classes? or just a function to wrap that. a single public
	//		api: dojox.lang.highlight(node) or a string even?
	dojo.addOnLoad(function(){
		var d = dojox.lang.highlight;
		d.compileRes();
		d.compileKeywords();
    		dojo.query("pre > code").forEach(d.init);		
	});
}