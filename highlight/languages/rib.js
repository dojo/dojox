dojo.provide("dojox.highlight.languages.rib"); 

dojo.require("dojox.highlight._base");

//
// RenderMan Interface Bytestream (c) Konstantin Evdokimenko <qewerty@gmail.com>
// Released BSD, Contributed under CLA to the Dojo Foundation
//
(function(){
	var dh = dojox.highlight, dhc = dh.constants;
	dh.languages.rib = {
		// summary: RenderMan Inferface Bytestream highlight definitions
		defaultMode: {
			lexems: [dhc.UNDERSCORE_IDENT_RE],
			illegal: '</',
			contains: ['comment', 'string', 'number'],
			keywords: {
			'keyword': {
				'ReadArchive': 1, 'FrameBegin': 1, 'FrameEnd': 1, 
				'WorldBegin': 1, 'WorldEnd': 1, 'Attribute': 1, 'Display': 1,
				'Option': 1, 'Format': 1, 'ShadingRate': 1, 'PixelFilter': 1,
				'PixelSamples': 1, 'Projection': 1, 'Scale': 1,
				'ConcatTransform': 1, 'Transform': 1, 'Translate': 1, 
				'Rotate': 1, 'Surface': 1, 'Displacement': 1, 'Atmosphere': 1,
				'Interior': 1, 'Exterior': 1
			},
			'commands': { 
				'WorldBegin': 1, 'WorldEnd': 1, 'FrameBegin': 1, 'FrameEnd': 1,
				'ReadArchive': 1, 'ShadingRate': 1}
			}
		},
		modes: [
			dhc.HASH_COMMENT_MODE,
			dhc.C_NUMBER_MODE,
			dhc.APOS_STRING_MODE,
			dhc.QUOTE_STRING_MODE,
			dhc.BACKSLASH_ESCAPE
		]
	};
})();
