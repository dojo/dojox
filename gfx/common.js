dojo.provide("dojox.gfx.common");

dojo.require("dojox.gfx.matrix");
dojo.require("dojox.gfx.util");

// include a renderer conditionally
dojo.requireIf(!dojo.isIE, "dojox.gfx.svg");
dojo.requireIf(dojo.isIE, "dojox.gfx.vml");
