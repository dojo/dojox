define([
	"dojo/_base/declare",
	"dojo/_base/lang",
	"./_base",
	"./shape",
	"./svg"
], function(declare, lang, gfx, gfxShape, svg){

	/*=====
	return {
		// summary:
		//		An svg-specific module that adds SVG mask support to the gfx api.
		//		You may require this module when your application specifically targets the SVG renderer.
	}
	=====*/

	/*=====
	declare("dojox.gfx.svg_mask.__MaskArgs", null, {
		// summary:
		//		The mask arguments passed to the dojox/gfx/svg_mask/Surface.createMask method.
		// description:
		//		An object defining the properties of an SVG mask. 
		//
		// example:
		//		A mask where content coordinates are fractions of the bounding box
		//		of the object using the mask
		//	|	{
		//	|		maskContentUnits: 'objectBoundingBox'
		//	|	}	
		//
		// example:
		//		A mask with dimensions in user coordinates of element referring to mask
		//	|	{
		//	|		maskUnits: 'userSpaceOnUse'
		//	|	}

		// id: String?
		//		The mask identifier. If none is provided, a generated id will be used.
		id: null,

		// x: Number?
		//		The x coordinate of one corner of the mask
		x: 0,

		// y: Number?
		//		The y coordinate of one corner of the mask
		y: 0,

		// width: Number?
		//		The width of the mask. Defaults to 1 which is 100% of the bounding
		//		box width of the object applying the mask.
		width: 1,

		// height: Number?
		//		The height of the mask. Defaults to 1 which is 100% of the bounding
		//		box height of the object applying the mask.

		// maskUnits: String?
		//		The coordinate system of the filter. Default is "objectBoundingBox".
		maskUnits: "objectBoundingBox",

		// maskContentUnits: String?
		//		The coordinate system of the filter. Default is "userSpaceOnUse".
		maskContentUnits: "userSpaceOnUse",
	});
	=====*/

	lang.extend(svg.Shape, {
		mask: null,
		setMask: function (/*dojox.gfx.svg.Mask*/mask){
			// summary:
			//		Sets a mask object (SVG)
			// mask:
			//		The mask object

			var rawNode = this.rawNode;
			if(mask){
				rawNode.setAttribute("mask", "url(#"+mask.shape.id+")");
				this.mask = mask;
			}else{
				rawNode.removeAttribute("mask");
				this.mask = null;
			}

			return this;
		},
		getMask: function(){
			// summary:
			//		Returns the current mask object or null
			return this.mask;
		}
	});

	var Mask = svg.Mask = declare("dojox.gfx.svg.Mask", svg.Shape, {
		// summary:
		//		An SVG mask object

		constructor: function (shape){
			gfxShape.Container._init.call(this);
			this.shape = Mask.defaultShape;
		},

		setRawNode: function(rawNode){
			this.rawNode = rawNode;
		},

		setShape: function(shape){
			if(!shape.id){
				shape = lang.mixin({ id: gfx._base._getUniqueId() }, shape);
			}
			this.inherited(arguments, [shape]);
		}
	});
	Mask.nodeType = 'mask';
	Mask.defaultShape = {
		id: null,
		x: 0,
		y: 0,
		width: 1,
		height: 1,
		maskUnits: 'objectBoundingBox',
		maskContentUnits: 'userSpaceOnUse'
	};

	lang.extend(Mask, svg.Container);
	lang.extend(Mask, gfxShape.Creator);
	lang.extend(Mask, svg.Creator);

	var Surface = svg.Surface,
		surfaceAdd = Surface.prototype.add,
		surfaceRemove = Surface.prototype.remove
	lang.extend(Surface, {
		createMask: function(/*dojox.gfx.svg_mask.__MaskArgs*/mask){
			// summary:
			//		Creates a mask object
			// returns: dojox.gfx.svg.Mask
			//		The new mask object
			return this.createObject(Mask, mask);
		},
		add: function(shape){
			if(shape instanceof Mask){
				this.defNode.appendChild(shape.rawNode);
				shape.parent = this;
			}else{
				surfaceAdd.apply(this, arguments);
			}
			return this;
		},
		remove: function(shape, silently){
			if(shape instanceof Mask && this.defNode == shape.rawNode.parentNode){
				this.defNode.removeChild(shape.rawNode);
				shape.parent = null;
			}else{
				surfaceRemove.apply(this, arguments);
			}
			return this;
		}
	});
});
