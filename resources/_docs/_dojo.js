// supplemental summaries for those hard-to-doc places your conventional doc parser can't reach.
// do not ever, ever include this file if you are not a javascript-doc-parsing-php-script. really.
//
// this is "package level documentation"
//

// namespaced:
dojo.back = {
	// summary: Browser history management resources
};

dojo.cldr = { // FIXME:
};

dojo.colors = { 
	// summary: Dojo color-related resources. see the dojo.Color class for named colors.
};

dojo.currency = { // FIXME: 
};

dojo.data = {
	// summary: Dojo Data API
};

dojo.date = { // FIXME:
};

dojo.dnd = {
	// summary: Drag and Drop resources
};

dojo.fx = {
	// summary: Effect library on top of Base animations
};

dojo.i18n = {
	// summary: Internationalization (i18n) resources
};

dojo.io = {
	// summary: Additional I/O transports (Ajax)
};

dojo.keys = {
	// summary: Key contants and definitions for common key values
};

dojo.nls = { // FIXME:	
};

dojo["NodeList-fx"] = {
	// summary: Adds dojo.fx animation support to dojo.query()
};

dojo.number = { // FIXME:
};

dojo.OpenAjax = { // FIXME:
};

dojo.rexep = {
	// summary: Regular expressions and Builder resources
};

dojo.rpc = {
	// summary: Dojo remote-procedure-call resources
};

dojo.string = { 
	// summary: String utilities for Dojo
};

dojo.tests = {
	// summary: D.O.H. Test files for Dojo unit testing.
};

// "variables"

dojo.baseUrl = {
	// summary: The root relative path to dojo.js (as a string)
	// example: 
	//	if(typeof dojo != "undefined"){ console.log(dojo.baseUrl); }
};

dojo.doc = {
	// summary: Alias for the current document.
	// example:
	// 	n.appendChild(dojo.doc.createElement('div'));
};

dojo.global = {
	// summary: Alias for the global scope
};

dojo.isBrowser = {
	// summary: True if the client is a web-browser
	// example:
	//	if(dojo.isBrowser){ /* do something */ }
};

dojo.isFF = {
	// summary: True if client is using FireFox browser. False otherwise.
	// example:
	//	if(dojo.isFF && dojo.isFF > 1){ /* do something */ }
};

dojo.isGears = {
	// summary: True is client is using Google Gears
};

dojo.isIE = {
	// summary: The major version if client it using Internet Explorer (or false) 
	// example:
	//	if(dojo.isIE && dojo.isIE > 6){ /* we are ie7 */ }
};

dojo.isKhtml = {
	// summary: True if client is  using Khtml browsers (konqueror, et al)
};

dojo.isMozilla = {
	// summary: True if client is using a Mozilla-based browser. 
};

dojo.isOpera = {
	// summary: True if client is using the Opera web browser
};

dojo.isSafari = {
	// summary: True if client is using the Safari web browser
	// example:
	// 	|	if(dojo.isSafari){ /* do it */}
	//
	// example: 
	//	Detect iPhone:
	//	|	if(dojo.isSafari && (navigator.userAgent.indexOf("iPhone") < 0)){ 
	//	|		/* we are iPhone. iPod touch reports "iPod" above */
	//	|	}
};

dojo.isSpidermonkey = {
	// summary: Detect spidermonkey 
};

dojo.locale = {
	// summary: The locale to use for i18n
};

// "methods"

dojo.body = function(){
	// summary: Return the body element of the document
	// example:
	// 	dojo.body().appendChild(dojo.doc.createElement('div'));
};

dojo.byId = function(/* String|DomNode */){
	// summary: Return a node by Id. An alias to document.getElementById()
};

dojo.deprecated = function(/* String */){
	// summary: Method to indicate a package will be removed during it's deprecation cycle.
};

dojo.experimental = function(){
	// summary: A method to warn a resource's API is subject to change, or otherwise ill-prepared for
	// 	production use.
};

dojo.parser = {
	// summary: The Dom/Widget parsing package
};

dojo.provide = {
	// summary: Used to tell the build and package systems which module is being provided
};

dojo.query = {
	// summary: A fast Dom parsing CSS3 Selector query engine.
};
