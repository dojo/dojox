dojo.provide("dojox.storage._common");
dojo.require("dojox.storage.Provider");
dojo.require("dojox.storage.manager");
// FIXME: these requireIf's need to take into account the
// djConfig.forceStorageProvider flag to force a particular
// storage provider even if it may not be available
dojo.requireIf(dojo.isGears, "dojox.storage.GearsStorageProvider");
dojo.requireIf(!dojo.isGears, "dojox.storage.FlashStorageProvider");
dojo.requireIf(!dojo.isGears, "dojox.storage.WhatWGStorageProvider");

// now that we are loaded and registered tell the storage manager to
// initialize itself
dojox.storage.manager.initialize();
