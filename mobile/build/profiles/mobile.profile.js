dependencies = {
	stripConsole: "normal",
	layers: [
		{
			name: "dojo.js",
			dependencies: [
				"dijit._Widget",
			]
		},
		{
			name: "../dojox/mobile.js",
			dependencies: [
				"dojox.mobile"
			]
		},
		{
			name: "../dojox/mobile/compat.js",
			dependencies: [
				"dojox.mobile.compat"
			]
		}
	],

	prefixes: [
		[ "dijit", "../dijit" ],
		[ "dojox", "../dojox" ]
	]
}
