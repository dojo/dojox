dojo.provide("dojox.string.BidiComplex");
dojo.experimental("dojox.string.BidiComplex");

// summary:
//		BiDiComplex module handels complex expression issues known when using BiDi characters
//		in File Paths, URLs, E-mail Address, XPATH, etc. 
//		this module adds property listeners to the text fields to correct the text representation
//		in both static text and dynamic text during user input. 

dojox.string.BidiComplex.attachInput = function(/*DOMNode*/field, /*String*/pattern){
	// summary:
	//		Attach key listeners to the INPUT field to accomodate dynamic complex BiDi expressions 
	// field: INPUT DOM node
	// pattern: Complex Expression Pattern type. One of "FILE_PATH", "URL", "EMAIL", "XPATH"

	dojox.string.BidiComplex._ce_type = pattern; //FIXME: shared ref
	field.alt = dojox.string.BidiComplex._ce_type;
	if((document.dir == "rtl")||(document.body.dir == "rtl")){ //FIXME: use !dojo._isBodyLtr()?
		field.style.textAlign = "right";
	}

//FIXME: use dojo.connect
	if(dojo.isIE){
		field.onkeydown = new Function("dojox.string.BidiComplex._ceKeyDown(event);");
		field.onkeyup = new Function("dojox.string.BidiComplex._ceKeyUp(event);");
	}else{ 
		field.onkeyup = dojox.string.BidiComplex._ceKeyUp;
		field.onkeydown = dojox.string.BidiComplex._ceKeyDown;        
	}

//FIXME: use dojo.connect
	field.oncut = dojox.string.BidiComplex._fOnCut;
	field.oncopy = dojox.string.BidiComplex._fOnCopy;

	field.value = dojox.string.BidiComplex._insertMarkers(field.value, field.alt);    
};
	
dojox.string.BidiComplex.createDisplayString = function(/*String*/str, /*String*/pattern){
	// summary:
	//		Create the display string by adding the Unicode direction Markers 
	// pattern: Complex Expression Pattern type. One of "FILE_PATH", "URL", "EMAIL", "XPATH"

//FIXME: inline _insertMarkers
	return dojox.string.BidiComplex._insertMarkers(str, pattern);
};

dojox.string.BidiComplex.stripSpecialCharacters = function(str){
	// summary:
	//		removes all Unicode directional markers from the string

	return str.replace(/[\u200E\u200F\u202A-\u202E]/g, ""); // String
};

//FIXME: these statics are worrysome
dojox.string.BidiComplex._segmentsPointers = [];
dojox.string.BidiComplex._ce_type = null;
dojox.string.BidiComplex._PATH	= null;
dojox.string.BidiComplex._insertAlways = false;
dojox.string.BidiComplex._fOnCut = new Function("dojox.string.BidiComplex._ceCutText(this)");
dojox.string.BidiComplex._fOnCopy = new Function("dojox.string.BidiComplex._ceCopyText(this);");

dojox.string.BidiComplex._ceKeyDown = function(event){
	var elem = dojo.isIE ? event.srcElement : event.target;        
	//FIXME: global reference: str0
	str0 = elem.value;
};
			
dojox.string.BidiComplex._ceKeyUp = function(event){
	var LRM = '\u200E';
	var elem = dojo.isIE ? event.srcElement : event.target;
	//FIXME: str1 global reference
	str1 = elem.value;

	if(elem.alt != ""){
		dojox.string.BidiComplex._ce_type = elem.alt;
	}

	var ieKey = event.keyCode;

	if((ieKey == dojo.keys.HOME)
		|| (ieKey == dojo.keys.END)
		|| (ieKey == dojo.keys.SHIFT)){
		return;
	}

	var cursorStart, cursorEnd;
	var selection = dojox.string.BidiComplex._getCaretPos(event, elem);
	if(selection){
		cursorStart = selection[0];
		cursorEnd = selection[1];
	}

//Jump over a cursor processing
	if(dojo.isIE){
		var cursorStart1 = cursorStart, cursorEnd1 = cursorEnd;

		if(ieKey == dojo.keys.LEFT_ARROW){
			//FIXME: str1 global reference
			if((str1.charAt(cursorEnd-1) == LRM)
					&& (cursorStart == cursorEnd)){
				dojox.string.BidiComplex._setSelectedRange(elem,cursorStart - 1, cursorEnd - 1);
			}
			return;
		}

		if(ieKey == dojo.keys.RIGHT_ARROW){             
			if(str1.charAt(cursorEnd-1) == LRM){
				cursorEnd1 = cursorEnd + 1;
				if(cursorStart == cursorEnd){
					cursorStart1 = cursorStart + 1;
				}
			}

			dojox.string.BidiComplex._setSelectedRange(elem, cursorStart1, cursorEnd1);                        
			return;
		}                   
	}else{ //Firefox
		if(ieKey == dojo.keys.LEFT_ARROW){
			if(str1.charAt(cursorEnd-1) == LRM){
				dojox.string.BidiComplex._setSelectedRange(elem, cursorStart - 1, cursorEnd - 1);
			}
			return;
		}
		if(ieKey == dojo.keys.RIGHT_ARROW){
			if(str1.charAt(cursorEnd-1) == LRM){
				dojox.string.BidiComplex._setSelectedRange(elem, cursorStart + 1, cursorEnd + 1);
			}
			return;
		}
	}

	var str2 = dojox.string.BidiComplex._insertMarkers(str1, elem.alt);

	if(str1 != str2)
	{
		window.status = str1 + " c=" + cursorEnd;
		elem.value = str2;

		if((ieKey == dojo.keys.DELETE) && (str2.charAt(cursorEnd)==LRM)){
			elem.value = str2.substring(0, cursorEnd) + str2.substring(cursorEnd+2, str2.length);
		}

		if(ieKey == dojo.keys.DELETE){
			setSelectedRange(elem,cursorStart,cursorEnd);
		}else if(ieKey == dojo.keys.BACKSPACE){
			//FIXME: str0 global reference
			if(str0.charAt(cursorEnd-1)==LRM){
				dojox.string.BidiComplex._setSelectedRange(elem, cursorStart - 1, cursorEnd - 1);
			}else{
				dojox.string.BidiComplex._setSelectedRange(elem, cursorStart, cursorEnd);
			}
		}else if(elem.value.charAt(cursorEnd) != LRM){
			dojox.string.BidiComplex._setSelectedRange(elem, cursorStart + 1, cursorEnd + 1);
		}
	}
};

dojox.string.BidiComplex._processCopy = function(elem, text, isReverse){
	// summary:
	//		This function strips the unicode directional controls when the text copied to the Clipboard

	if(text == null){
		if(dojo.isIE){
			var range = document.selection.createRange();
			text = range.text;
		}else{
			text = elem.value.substring(elem.selectionStart, elem.selectionEnd);
		}
	}

	var textToClipboard = dojox.string.BidiComplex.stripSpecialCharacters(text);

	if(dojo.isIE){
		window.clipboardData.setData("Text", textToClipboard);
		return true;
	}else{
		try{
			return window.SignedJs.processCopy(textToClipboard); //FIXME: what's this?
		}catch(e){ return false; }
	}
};

dojox.string.BidiComplex._ceCopyText = function(elem){
	if(dojo.isIE){
		event.returnValue = false;
	}
	return dojox.string.BidiComplex._processCopy(elem, null, false);
};

dojox.string.BidiComplex._ceCutText = function(elem){

	var ret = dojox.string.BidiComplex._processCopy(elem, null, false);
	if(!ret){ 
		return false;
	}

	if(dojo.isIE){
//		curPos = elem.selectionStart; 
		var range = document.selection.clear(); // FIXME: unused variable?
	}else{
		var curPos = elem.selectionStart;
		elem.value = elem.value.substring(0, curPos) + elem.value.substring(elem.selectionEnd);
		elem.setSelectionRange(curPos, curPos);
	}

	return true;
};

// is there dijit code to do this?
dojox.string.BidiComplex._getCaretPos = function(event, elem){
	if(dojo.isIE){
		var position = 0,
			range = document.selection.createRange().duplicate(),
			range2 = range.duplicate(),
			rangeLength = range.text.length;

		if(elem.type == "textarea"){
			range2.moveToElementText(elem);
		}else{
			range2.expand('textedit');
		}

		while(range.compareEndPoints('StartToStart', range2) > 0){
			range.moveStart('character', -1);
			++position;
		}

		return [position, position + rangeLength];
	}

	return [event.target.selectionStart, event.target.selectionEnd];
};

// is there dijit code to do this?
dojox.string.BidiComplex._setSelectedRange = function(elem,selectionStart,selectionEnd){
	if(dojo.isIE){
		var range = elem.createTextRange();
		if(range){
			if(elem.type == "textarea"){
				range.moveToElementText(elem);
			}else{
				range.expand('textedit');
			}

			range.collapse();            
			range.moveEnd('character', selectionEnd);
			range.moveStart('character', selectionStart);
			range.select();
		}
	}else{        
		elem.selectionStart = selectionStart;
		elem.selectionEnd = selectionEnd;
	}
};

dojox.string.BidiComplex._isBidiChar = function(c){    
	return (c >= '\u0030' && c <= '\u0039') || (c > '\u00ff');
};

dojox.string.BidiComplex._isLatinChar = function(c){
	return (c >= '\u0041' && c <= '\u005A') || (c >= '\u0061' && c <= '\u007A');
};

dojox.string.BidiComplex._isCharBeforeBiDiChar = function(buffer, i, previous){
	if(dojox.string.BidiComplex._insertAlways){
		return true;
	}
	while(i > 0){    
		if(i == previous){
			return false;
		}
		i--;                        
		if(dojox.string.BidiComplex._isBidiChar(buffer.charAt(i))){
			return true;
		}
		if(dojox.string.BidiComplex._isLatinChar(buffer.charAt(i))){
			return false;
		}
	}
	return false;       
};


dojox.string.BidiComplex._parse = function(/*String*/str, /*String*/pattern){    
	var i,i1;
	var delimiters;
	var previous = -1;    
	//erase segmentsPointers
	if(dojox.string.BidiComplex._segmentsPointers != null){
		for(i=0; i<dojox.string.BidiComplex._segmentsPointers.length; i++){ // FIXME: just whack array?
			dojox.string.BidiComplex._segmentsPointers[i] = null;
		}
	}
	var sp_len = 0;

	if(pattern == "FILE_PATH"){
		delimiters = "/\\:."; // FIXME: use split?
		for(i = 0; i < str.length; i++){ //FIXME: dojo.forEach
			if((delimiters.indexOf(str.charAt(i)) >= 0) &&
					dojox.string.BidiComplex._isCharBeforeBiDiChar(str, i, previous)){
				previous = i;
				dojox.string.BidiComplex._segmentsPointers[sp_len++] = i;
			}
		}
	}else if(pattern == "URL"){
		var buffer_length = str.length;
			            
		// parse protocol, host, path
		delimiters = "/:.?=&#"; // FIXME: use split?
		for(i = 0; i < buffer_length; i++){ //FIXME: dojo.forEach
			if((delimiters.indexOf(str.charAt(i))  >= 0)  &&
					dojox.string.BidiComplex._isCharBeforeBiDiChar(str, i, previous)){
				previous = i;    
				dojox.string.BidiComplex._segmentsPointers[sp_len] = i;
				sp_len++;
			}
		}               
	}else if(pattern == "EMAIL"){
		delimiters = "<>@.,;"; // FIXME: use split?         
		var inQuotes = false;    
		
		for(i = 0; i < str.length; i++){ //FIXME: dojo.forEach         
			if(str.charAt(i) == '\"'){
				if(dojox.string.BidiComplex._isCharBeforeBiDiChar(str, i, previous)){
					previous = i;    
					dojox.string.BidiComplex._segmentsPointers[sp_len] = i;
					sp_len++;
				}                    
				i++;
				i1 = str.indexOf('\"', i);
				if(i1 >= i){
					i = i1;
				}
				if(dojox.string.BidiComplex._isCharBeforeBiDiChar(str, i, previous)){
					previous = i;    
					dojox.string.BidiComplex._segmentsPointers[sp_len] = i;
					sp_len++;
				}                                   
			}

			if((delimiters.indexOf(str.charAt(i)) >= 0) &&
					dojox.string.BidiComplex._isCharBeforeBiDiChar(str, i, previous)){
						previous = i;    
						dojox.string.BidiComplex._segmentsPointers[sp_len] = i;
						sp_len++;
			}                                            
		}                    
	}else if(pattern == "XPATH"){
		delimiters = "/\\:.<>=[]";         
		for (i = 0; i < str.length; i++){ //FIXME: dojo.forEach
			if((delimiters.indexOf(str.charAt(i)) >= 0) &&
					dojox.string.BidiComplex._isCharBeforeBiDiChar(str, i, previous)){
				previous = i;    
				dojox.string.BidiComplex._segmentsPointers[sp_len] = i;
				sp_len++;
			}        
		}
	}
	
	return dojox.string.BidiComplex._segmentsPointers;
};  

dojox.string.BidiComplex._insertMarkers = function(/*String*/str, /*String*/pattern){
	str = dojox.string.BidiComplex.stripSpecialCharacters(str);
	
	dojox.string.BidiComplex._segmentsPointers = dojox.string.BidiComplex._parse(str, pattern); // FIXME: shared ref
	
	var buf = '\u202A'/*LRE*/ + str;
	var shift = 1;                                           
	dojo.forEach(dojox.string.BidiComplex._segmentsPointers, function(n){
		if(n != null){
			var preStr = buf.substring(0, n + shift);
			var postStr = buf.substring(n + shift, buf.length);
			buf = preStr + '\u200E'/*LRM*/ + postStr;
			shift++;
		}
	});
	return buf;        
};
