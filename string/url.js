dojo.provide("dojox.string.url");

dojox.string.url.resolveUrl = function(baseUrl, relativeUrl) {
	// summary:
	// This takes a base url and a relative url and resolves the target url.
	// For example:
	// resolveUrl("http://www.domain.com/path1/path2","../path3") ->"http://www.domain.com/path1/path3"  
	//
	if (relativeUrl.match(/\w+:\/\//))
		return relativeUrl;
	if (relativeUrl.charAt(0)=='/') {
		baseUrl = baseUrl.match(/.*\/\/[^\/]*/)
		return (baseUrl ? baseUrl[0] : '') + relativeUrl;
	}	
		//TODO: handle protocol relative urls:  ://www.domain.com
	baseUrl = baseUrl.substring(0,baseUrl.length - baseUrl.match(/[^\/]*$/)[0].length);// clean off the trailing path
	if (relativeUrl == '.')
		return baseUrl;	
	while (relativeUrl.substring(0,3) == '../') {
		baseUrl = baseUrl.substring(0,baseUrl.length - baseUrl.match(/[^\/]*\/$/)[0].length);
		relativeUrl = relativeUrl.substring(3);
	}
	return baseUrl + relativeUrl;	
}
