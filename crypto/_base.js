dojo.provide("dojox.crypto._base");

dojo.require("dojox.encoding.crypto._base");
dojo.require("dojox.encoding.digests._base");

console.warn("dojox.crypto._base: DojoX Crypto has been merged into DojoX Encoding, please see DojoX Encoding for more information.  Will be removed with the next release.");

//	unfortunately there's no way of pointing at two files with an alias, particularly 
//	when both have similarly named things; but we'll try anyways.
dojox.crypto._base=dojo.mixin(dojox.encoding.crypto._base, dojox.encoding.digests._base);
