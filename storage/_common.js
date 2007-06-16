dojo.provide("dojox.storage._common");
dojo.require("dojox.storage.Provider");
dojo.require("dojox.storage.manager");

dojo.require("dojox.storage.GearsStorageProvider");

// commented out so that these don't get brought into
// Dojo Offline profile builds.
// FIXME: find a better way to keep these out of the Dojo Offline
// profile build
//dojo.requireIf(!dojo.isGears, "dojox.storage.FlashStorageProvider");
//dojo.requireIf(!dojo.isGears, "dojox.storage.WhatWGStorageProvider");

// now that we are loaded and registered tell the storage manager to
// initialize itself
dojox.storage.manager.initialize();
