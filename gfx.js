dojo.provide("dojox.gfx");

dojo.require("dojox.gfx.matrix");
dojo.require("dojox.gfx._base");

// include a renderer conditionally
dojo.requireIf(dojo.isIE == 0, "dojox.gfx.svg");
dojo.requireIf(dojo.isIE != 0, "dojox.gfx.vml");

