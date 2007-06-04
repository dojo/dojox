dojo.provide("dojox.storage._common");
dojo.require("dojox.storage.Provider");
dojo.require("dojox.storage.manager");
dojo.requireIf(dojo.isGears, "dojox.storage.GearsStorageProvider");
dojo.requireIf(!!globalStorage, "dojox.storage.WhatWGStorageProvider");
dojo.requireIf(!globalStorage, "dojox.storage.FlashStorageProvider");
