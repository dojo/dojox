dojo.provide("dojox.editor.plugins._SmileyPalette");

dojo.require("dijit.ColorPalette");
dojo.require("dojo.i18n");
dojo.requireLocalization("dojox.editor.plugins", "Smiley");

dojo.declare("dojox.editor.plugins.,SmileyPalette", dijit.ColorPalette, {
	// summary:
	//		A widget offering a choice of emoticons

	// _palettes: [protected] Map
	// 		This represents the value of the colors.
	//		The first level is a hashmap of the different arrays available
	//		The next two dimensions represent the columns and rows of colors.
	_palettes: {

		"7x10":	[["white", "seashell", "cornsilk", "lemonchiffon","lightyellow", "palegreen", "paleturquoise", "lightcyan",	"lavender", "plum"],
				["lightgray", "pink", "bisque", "moccasin", "khaki", "lightgreen", "lightseagreen", "lightskyblue", "cornflowerblue", "violet"],
				["silver", "lightcoral", "sandybrown", "orange", "palegoldenrod", "chartreuse", "mediumturquoise", 	"skyblue", "mediumslateblue","orchid"],
				["gray", "red", "orangered", "darkorange", "yellow", "limegreen", 	"darkseagreen", "royalblue", "slateblue", "mediumorchid"],
				["dimgray", "crimson", 	"chocolate", "coral", "gold", "forestgreen", "seagreen", "blue", "blueviolet", "darkorchid"],
				["darkslategray","firebrick","saddlebrown", "sienna", "olive", "green", "darkcyan", "mediumblue","darkslateblue", "darkmagenta" ],
				["black", "darkred", "maroon", "brown", "darkolivegreen", "darkgreen", "midnightblue", "navy", "indigo", 	"purple"]],

		"3x4": [["white", "lime", "green", "blue"],
			["silver", "yellow", "fuchsia", "navy"],
			["gray", "red", "purple", "black"]]	

	},

	// _imagePaths: [protected] Map
	//		This is stores the path to the palette images
	_imagePaths: {
		"7x10": dojo.moduleUrl("dijit.themes", "a11y/colors7x10.png"),
		"3x4": dojo.moduleUrl("dijit.themes", "a11y/colors3x4.png")
	},

	// _paletteCoords: [protected] Map
	//		This is a map that is used to calculate the coordinates of the
	//		images that make up the palette.
	_paletteCoords: {
		"leftOffset": 3, "topOffset": 3,
		"cWidth": 20, "cHeight": 20
		
	},

	// templatePath: String
	//		Path to the template of this widget.
	templatePath: dojo.moduleUrl("dijit", "templates/ColorPalette.html"),

	// _paletteDims: [protected] Object
	//		Size of the supported palettes for alignment purposes.
	_paletteDims: {
		"7x10": {"width": "206px", "height": "145px"},
		"3x4": {"width": "86px", "height": "64px"}
	},

	// templatePath: String
	//		Path to the template of this widget.
	templatePath: dojo.moduleUrl("dijit", "templates/ColorPalette.html"),

	// _paletteDims: [protected] Object
	//		Size of the supported palettes for alignment purposes.
	_paletteDims: {
		"7x10": {"width": "206px", "height": "145px"},
		"3x4": {"width": "86px", "height": "64px"}
	}
	
});
