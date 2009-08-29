dojo.provide("dojox.drawing._base");
dojo.experimental("dojox.drawing");

(function(){
	
	var _registered = {
		tool:{},
		stencil:{},
		drawing:{},
		plugin:{}
	};
	
	dojox.drawing.register = function(item, type){
		if(type=="drawing"){
			_registered.drawing[item.id] = item;
		}else if(type=="tool"){
			_registered.tool[item.name] = item;	
		}else if(type=="stencil"){
			_registered.stencil[item.name] = item;	
		}else if(type=="plugin"){
			_registered.plugin[item.name] = item;	
		}
	};
	
	dojox.drawing.getRegistered = function(type, id){
		return id ? _registered[type][id] : _registered[type];
	}
	
})();

dojo.require("dojox.gfx");
dojo.require("dojox.drawing.Drawing");
dojo.require("dojox.drawing.util.oo");
dojo.require("dojox.drawing.util.common");
dojo.require("dojox.drawing.defaults");
dojo.require("dojox.drawing.manager.Canvas");

// interactive managers
dojo.require("dojox.drawing.manager.Undo");
dojo.require("dojox.drawing.manager.keys");
dojo.require("dojox.drawing.manager.Mouse");
dojo.require("dojox.drawing.manager.Stencil");
dojo.require("dojox.drawing.manager.StencilUI"); // plugin? or as a require? good here? in toolbar?
dojo.require("dojox.drawing.manager.Anchors");

// standard stencils
dojo.require("dojox.drawing.stencil._Base");
dojo.require("dojox.drawing.stencil.Line");
dojo.require("dojox.drawing.stencil.Rect");
dojo.require("dojox.drawing.stencil.Ellipse");
dojo.require("dojox.drawing.stencil.Path");
dojo.require("dojox.drawing.stencil.Text");
dojo.require("dojox.drawing.stencil.Image");