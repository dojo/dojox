dojo.provide("dojox.storage._common");
dojo.require("dojox.storage.Provider");
dojo.require("dojox.storage.manager");

dojo.require("dojox.storage.GearsStorageProvider");

// FIXME: Find way to set isGears from offline.profile.js file; it didn't
// work for me
//dojo.requireIf(!dojo.isGears, "dojox.storage.FlashStorageProvider");
//dojo.requireIf(!dojo.isGears, "dojox.storage.WhatWGStorageProvider");

// now that we are loaded and registered tell the storage manager to
// initialize itself
dojox.storage.manager.initialize();
