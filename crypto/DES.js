// Taken from http://www.movable-type.co.uk/scripts/tea-block.html by
// Chris Veness (CLA signed); adapted for Dojo and Google Gears Worker Pool
// by Brad Neuberg, bkn3@columbia.edu

// TODO: FIXME: Have this DES class fit into the general dojox.crypto
// framework better, having similar calling conventions

dojo.provide("dojox.crypto.DES");

dojox.crypto.DES.encrypt = function(plaintext, password, callback){
	// summary:
	//	Use Corrected Block TEA to encrypt plaintext using password
	//	(note plaintext & password must be strings not string objects)
	// returns:
	//	Return encrypted text as string
	
	// FIXME: Create a synchronous version of this that doesn't 
	// depend on Gears if the callback is not present
	
	var workerPool = google.gears.factory.create("beta.workerpool", "1.0");

	workerPool.onmessage = function(msg, sender){
		callback(msg);
	}
	var workerCode = 
						String(_dojox_crypto_DES_workerInit) + " " +
                 		String(_dojox_crypto_DES_workerHandler) + " " +
                 		"_dojox_crypto_DES_workerInit();";
	var workerID;
	try{
		workerID = workerPool.createWorker(workerCode);
	}catch(exp){
		if(exp.message){
			throw exp.message;
		}else{
			throw exp;
		}
	}
	
	var args = {plaintext: plaintext, password: password};
	args = dojo.toJson(args);
	
	workerPool.sendMessage("encr:" + String(args), workerID);
}

dojox.crypto.DES.decrypt = function(ciphertext, password, callback){
	var workerPool = google.gears.factory.create("beta.workerpool", "1.0");
	workerPool.onmessage = function(msg, sender){
		callback(msg);
	}
	var workerCode = 
						String(_dojox_crypto_DES_workerInit) +
                 			String(_dojox_crypto_DES_workerHandler) +
                 			"_dojox_crypto_DES_workerInit();";
	var workerID = workerPool.createWorker(workerCode);
	var args = {ciphertext: ciphertext, password: password};
	args = dojo.toJson(args);
	workerPool.sendMessage("decr:" + String(args), workerID);
}


// supporting functions

function _dojox_crypto_DES_workerInit() {
	gearsWorkerPool.onmessage = _dojox_crypto_DES_workerHandler;
}

function _dojox_crypto_DES_workerHandler(msg, sender){
	var cmd = msg.substr(0,4);
	var arg = msg.substr(5);
	if(cmd == "encr"){
		arg = eval("(" + arg + ")");
		var plaintext = arg.plaintext;
		var password = arg.password;
		var results = encrypt(plaintext, password);
		gearsWorkerPool.sendMessage(String(results), sender);
	}else if(cmd == "decr"){
		arg = eval("(" + arg + ")");
		var ciphertext = arg.ciphertext;
		var password = arg.password;
		var results = decrypt(ciphertext, password);
		gearsWorkerPool.sendMessage(String(results), sender);
	}

	function encrypt(plaintext, password){
		if (plaintext.length == 0) return('');  // nothing to encrypt
	    // 'escape' plaintext so chars outside ISO-8859-1 work in single-byte packing, but keep
	    // spaces as spaces (not '%20') so encrypted text doesn't grow too long (quick & dirty)
	    var asciitext = escape(plaintext).replace(/%20/gm,' ');
	    var v = strToLongs(asciitext);  // convert string to array of longs
	    if (v.length <= 1) v[1] = 0;  // algorithm doesn't work for n<2 so fudge by adding a null
	    var k = strToLongs(password.slice(0,16));  // simply convert first 16 chars of password as key
	    var n = v.length;

	    var z = v[n-1], y = v[0], delta = 0x9E3779B9;
	    var mx, e, q = Math.floor(6 + 52/n), sum = 0;

	    while (q-- > 0) {  // 6 + 52/n operations gives between 6 & 32 mixes on each word
	        sum += delta;
	        e = sum>>>2 & 3;
	        for (var p = 0; p < n; p++) {
	            y = v[(p+1)%n];
	            mx = (z>>>5 ^ y<<2) + (y>>>3 ^ z<<4) ^ (sum^y) + (k[p&3 ^ e] ^ z);
	            z = v[p] += mx;
	        }
	    }

	    var ciphertext = longsToStr(v);

	    return escCtrlCh(ciphertext);
	}

	function decrypt(ciphertext, password){
		if (ciphertext.length == 0) return('');
	    var v = strToLongs(unescCtrlCh(ciphertext));
	    var k = strToLongs(password.slice(0,16)); 
	    var n = v.length;
	    var z = v[n-1], y = v[0], delta = 0x9E3779B9;
	    var mx, e, q = Math.floor(6 + 52/n), sum = q*delta;
	
	    while (sum != 0) {
	        e = sum>>>2 & 3;
	        for (var p = n-1; p >= 0; p--) {
	            z = v[p>0 ? p-1 : n-1];
	            mx = (z>>>5 ^ y<<2) + (y>>>3 ^ z<<4) ^ (sum^y) + (k[p&3 ^ e] ^ z);
	            y = v[p] -= mx;
	        }
	        sum -= delta;
	    }

	    var plaintext = longsToStr(v);

	    // strip trailing null chars resulting from filling 4-char blocks:
	    plaintext = plaintext.replace(/\0+$/,'');

	    return unescape(plaintext);
	}

	function strToLongs(s) {  // convert string to array of longs, each containing 4 chars
	    // note chars must be within ISO-8859-1 (with Unicode code-point < 256) to fit 4/long
	    var l = new Array(Math.ceil(s.length/4));
	    for (var i=0; i<l.length; i++) {
	        // note little-endian encoding - endianness is irrelevant as long as 
	        // it is the same in longsToStr() 
	        l[i] = s.charCodeAt(i*4) + (s.charCodeAt(i*4+1)<<8) + 
	               (s.charCodeAt(i*4+2)<<16) + (s.charCodeAt(i*4+3)<<24);
	    }
	    return l;  // note running off the end of the string generates nulls since 
	}              // bitwise operators treat NaN as 0

	function longsToStr(l) {  // convert array of longs back to string
	    var a = new Array(l.length);
	    for (var i=0; i<l.length; i++) {
	        a[i] = String.fromCharCode(l[i] & 0xFF, l[i]>>>8 & 0xFF, 
	                                   l[i]>>>16 & 0xFF, l[i]>>>24 & 0xFF);
	    }
	    return a.join('');  // use Array.join() rather than repeated string appends for efficiency
	}

	function escCtrlCh(str) {  // escape control chars etc which might cause problems with encrypted texts
	    return str.replace(/[\0\t\n\v\f\r\xa0'"!]/gm, function(c) { return '!' + c.charCodeAt(0) + '!'; });
	}

	function unescCtrlCh(str) {  // unescape potentially problematic nulls and control characters
	    return str.replace(/!\d\d?\d?!/gm, function(c) { return String.fromCharCode(c.slice(1,-1)); });
	}
}