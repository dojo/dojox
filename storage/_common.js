dojo.provide("dojox.storage._common");
dojo.require("dojox.storage.Provider");
dojo.require("dojox.storage.manager");
dojo.requireIf(dojo.isGears, "dojox.storage.GearsStorageProvider");
//dojo.requireIf(!dojo.isGears, "dojox.storage.FlashStorageProvider");
//dojo.requireIf(!dojo.isGears, "dojox.storage.WhatWGStorageProvider");

// now that we are loaded and registered tell the storage manager to
// initialize itself
dojox.storage.manager.initialize();
