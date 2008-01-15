dojo.provide("dojox.highlight.languages.rsl"); 

dojo.require("dojox.highlight._base");

//
// RenderMan Shading Language (c) Konstantin Evdokimenko <qewerty@gmail.com>
// Released BSD, contributed under CLA to the Dojo Foundation
//
(function(){
	var dh = dojox.highlight, dhc = dh.constants;
	dh.languages.rsl = {
		// summary: RenderMan Shading Langauge highlight definitions
		defaultMode: {
			lexems: [dhc.UNDERSCORE_IDENT_RE],
			illegal: '</',
			contains: [
				'comment', 'string', 'number', 'preprocessor', 'shader',
				'shading'
			],
			keywords: {
				'keyword': {
					'float': 1, 'color': 1, 'point': 1, 'normal': 1, 
					'vector': 1, 'matrix': 1, 'while': 1, 'for': 1, 'if': 1,
					'do': 1, 'return': 1, 'else': 1, 'break': 1, 'extern': 1,
					'continue': 1
				},
				'built_in': {
					'smoothstep': 1, 'calculatenormal': 1, 'faceforward': 1,
					'normalize': 1, 'ambient': 1, 'diffuse': 1, 'specular': 1,
					'visibility': 1
				}
			}
		},
		modes: [
			{
				className: 'shader',
				begin: 'surface |displacement |light |volume |imager ', 
				end: '\\(',
				lexems: [dhc.IDENT_RE],
				keywords: {
					'surface': 1, 'displacement': 1, 'light': 1, 'volume': 1,
					'imager': 1
				}
			},
			{
				className: 'shading',
				begin: 'illuminate|illuminance|gather', end: '\\(',
				lexems: [dhc.IDENT_RE],
				keywords: {'illuminate': 1, 'illuminance': 1, 'gather': 1}
			},
			dhc.C_LINE_COMMENT_MODE,
			dhc.C_BLOCK_COMMENT_MODE,
			dhc.C_NUMBER_MODE,
			dhc.QUOTE_STRING_MODE,
			dhc.APOS_STRING_MODE,
			dhc.BACKSLASH_ESCAPE,
			{
				className: 'preprocessor',
				begin: '#', end: '$'
			}
		]
	};
})();
