dojo.provide("dojox.presentation.fx");
dojo.require("dojo.fx");

dojox.fx = {};

// summary: convenience map for unity against core and base dojo.fx functions

dojox.fx.fadeIn = dojo.fadeIn;
dojox.fx.fadeOut = dojo.fadeOut;

dojox.fx.slideIn = dojo.fx.slideIn;
dojox.fx.slideOut = dojo.fx.slideOut;

dojox.fx.wipeIn = dojo.fx.slideIn;
dojox.fx.wipeOut = dojo.fx.slideOut; 

// add custom dojox.fx.*[In/Out] functions here. be generic.
// old 0.4: explode, slide
// new ideas: scale, fly, space [like letterSpacing], grow [lineHeight]
