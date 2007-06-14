// Taken from http://www.movable-type.co.uk/scripts/tea-block.html by
// Chris Veness (CLA signed); adapted for Dojo and Google Gears Worker Pool
// by Brad Neuberg, bkn3@columbia.edu

// TODO: FIXME: Have this DES class fit into the general dojox.crypto
// framework better, having similar calling conventions

dojo.provide("dojox.crypto.DES");

dojox.crypto.DES.encrypt = function(plaintext, password, callback){
	// summary:
	//	Use Corrected Block TEA to encrypt plaintext using password
	//	(note plaintext & password must be strings not string objects).
	//	Results will be returned to the 'callback' asychronously.
	var self = dojox.crypto.DES;
	
	self._initWorkerPool();
	
	var msg = {plaintext: plaintext, password: password};
	msg = dojo.toJson(msg);
	msg = "encr:" + String(msg);
	
	self._assignWork(msg, callback);
}

dojox.crypto.DES.decrypt = function(ciphertext, password, callback){
	// summary:
	//	Use Corrected Block TEA to decrypt ciphertext using password
	//	(note ciphertext & password must be strings not string objects).
	//	Results will be returned to the 'callback' asychronously.
	
	var self = dojox.crypto.DES;
	
	self._initWorkerPool();
	
	var msg = {ciphertext: ciphertext, password: password};
	msg = dojo.toJson(msg);
	msg = "decr:" + String(msg);
	
	self._assignWork(msg, callback);
}


// supporting functions

// _POOL_SIZE:
//	Size of worker pool to create to help with crypto
dojox.crypto.DES._POOL_SIZE = 20;

dojox.crypto.DES._initWorkerPool = function(){
	// bugs in Google Gears prevents us from dynamically creating
	// and destroying workers as we need them -- the worker
	// pool functionality stops working after a number of crypto
	// cycles (probably related to a memory leak in Google Gears).
	// this is too bad, since it results in much simpler code.
	
	// instead, we have to create a pool of workers and reuse them. we
	// keep a stack of 'unemployed' Worker IDs that are currently not working.
	// if a work request comes in, we pop off the 'unemployed' stack
	// and put them to work, storing them in an 'employed' hashtable,
	// keyed by their Worker ID with the value being the callback function
	// that wants the result. when an employed worker is done, we get
	// a message in our 'manager' which adds this worker back to the 
	// unemployed stack and routes the result to the callback that
	// wanted it. if all the workers were employed in the past but
	// more work needed to be done (i.e. it's a tight labor pool ;) 
	// then the work messages are pushed onto
	// a 'handleMessage' queue as an object tuple {msg: msg, callback: callback}
	
	if(!dojo.exists("dojox.crypto.DES._manager")){
		try{
			var self = dojox.crypto.DES;
			
			self._manager = google.gears.factory.create("beta.workerpool", "1.0");
			self._unemployed = [];
			self._employed = {};
			self._handleMessage = [];
			
			self._manager.onmessage = function(msg, sender){
				// get the callback necessary to serve this result
				var callback = self._employed["_" + sender];
				
				// make this worker unemployed
				self._employed["_" + sender] = undefined;
				self._unemployed.push("_" + sender);
				
				// see if we need to assign new work
				// that was queued up needing to be done
				if(self._handleMessage.length){
					var handleMe = self._handleMessage.shift();
					self._assignWork(handleMe.msg, handleMe.callback);
				}
				
				// return results
				callback(msg);
			}
			
			// workers can't access Dojo global namespaces, so we have to 'fake'
			// them with underscored function names to namespace these functions
			// in the worker pool area
			var code = String(_dojox_crypto_DES_workerInit) +
	                 	String(_dojox_crypto_DES_workerHandler) +
	                	"_dojox_crypto_DES_workerInit();";
	
			// create our worker pool
			for(var i = 0; i < self._POOL_SIZE; i++){
				self._unemployed.push("_" + self._manager.createWorker(code));
			}
		}catch(exp){
			throw exp.message||exp;
		}
	}
}

dojox.crypto.DES._assignWork = function(msg, callback){
	var self = dojox.crypto.DES;
	
	// can we immediately assign this work?
	if(!self._handleMessage.length && self._unemployed.length){
		// get an unemployed worker
		var workerID = self._unemployed.shift().substring(1); // remove _
		
		// list this worker as employed
		self._employed["_" + workerID] = callback;
		
		// do the worke
		self._manager.sendMessage(msg, workerID);
	}else{
		// we have to queue it up
		self._handleMessage = {msg: msg, callback: callback};
	}
}

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