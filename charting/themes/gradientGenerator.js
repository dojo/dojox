dojo.provide("dojox.charting.themes.gradientGenerator");
dojo.require("dojox.charting.Theme");

dojox.charting.themes.gradientGenerator.generateFills = function(colors, fillPattern, lumFrom, lumTo){
	//	summary:
	//		generates 2-color gradients using pure colors, a fill pattern, and two luminance values
	//	colors: Array:
	//		Array of colors to generate gradients for each.
	//	fillPattern: Object:
	//		Gradient fill descriptor which colors list will be generated.
	//	lumFrom: Number:
	//		Initial luminance value (0-100).
	//	lumTo: Number:
	//		Final luminance value (0-100).
	var Theme = dojox.charting.Theme;
	return dojo.map(colors, function(c){	// Array
		return Theme.generateHslGradient(c, fillPattern, lumFrom, lumTo);
	});
};

dojox.charting.themes.gradientGenerator.updateFills = function(themes, fillPattern, lumFrom, lumTo){
	//	summary:
	//		transforms solid color fills into 2-color gradients using a fill pattern, and two luminance values
	//	themes: Array:
	//		Array of mini-themes (usually series themes or marker themes), which fill will be transformed.
	//	fillPattern: Object:
	//		Gradient fill descriptor which colors list will be generated.
	//	lumFrom: Number:
	//		Initial luminance value (0-100).
	//	lumTo: Number:
	//		Final luminance value (0-100).
	var Theme = dojox.charting.Theme;
	dojo.forEach(themes, function(t){
		if(t.fill && !t.fill.type){
			t.fill = Theme.generateHslGradient(t.fill, fillPattern, lumFrom, lumTo);
		}
	});
};

dojox.charting.themes.gradientGenerator.generateMiniTheme = function(colors, fillPattern, lumFrom, lumTo, lumStroke){
	//	summary:
	//		generates mini-themes with 2-color gradients using colors, a fill pattern, and three luminance values
	//	colors: Array:
	//		Array of colors to generate gradients for each.
	//	fillPattern: Object:
	//		Gradient fill descriptor which colors list will be generated.
	//	lumFrom: Number:
	//		Initial luminance value (0-100).
	//	lumTo: Number:
	//		Final luminance value (0-100).
	//	lumStroke: Number:
	//		Stroke luminance value (0-100).
	var Theme = dojox.charting.Theme;
	return dojo.map(colors, function(c){	// Array
		c = new dojox.color.Color(c);
		return {
			fill:   Theme.generateHslGradient(c, fillPattern, lumFrom, lumTo),
			stroke: {color: Theme.generateHslColor(c, lumStroke)}
		}
	});
};
