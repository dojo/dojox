dojo.provide("dojox.gfx3d.lighting");
dojo.require("dojox.gfx._base");

dojo.mixin(dojox.gfx3d.lighting, {
	// color utilities
	black: function(){
		return {r: 0, g: 0, b: 0, a: 1};
	},
	white: function(){
		return {r: 1, g: 1, b: 1, a: 1};
	},
	toStdColor: function(c){
		c = dojox.gfx.normalizeColor(c);
		return {r: c.r / 255, g: c.g / 255, b: c.b / 255, a: c.a};
	},
	fromStdColor: function(c){
		return new dojo.Color([Math.round(255 * c.r), Math.round(255 * c.g), Math.round(255 * c.b), c.a]);
	},
	scaleColor: function(s, c){
		return {r: s * c.r, g: s * c.g, b: s * c.b, a: s * c.a};
	},
	addColor: function(a, b){
		return {r: a.r + b.r, g: a.g + b.g, b: a.b + b.b, a: a.a + b.a};
	},
	multiplyColor: function(a, b){
		return {r: a.r * b.r, g: a.g * b.g, b: a.b * b.b, a: a.a * b.a};
	},
	saturateColor: function(c){
		return {
			r: c.r < 0 ? 0 : c.r > 1 ? 1 : c.r,
			g: c.g < 0 ? 0 : c.g > 1 ? 1 : c.g,
			b: c.b < 0 ? 0 : c.b > 1 ? 1 : c.b,
			a: c.a < 0 ? 0 : c.a > 1 ? 1 : c.a
		};
	},
	mixColor: function(c1, c2, s){
		var p = dojox.gfx3d.lighting;
		return p.addColor(p.scaleColor(s, c1), p.scaleColor(1 - s, c2));
	},
	diff2Color: function(c1, c2){
		var r = c1.r - c2.r;
		var g = c1.g - c2.g;
		var b = c1.b - c2.b;
		var a = c1.a - c2.a;
		return r * r + g * g + b * b + a * a;
	},
	length2Color: function(c){
		return c.r * c.r + c.g * c.g + c.b * c.b + c.a * c.a;
	},
	
	// vector utilities
	dot: function(a, b){
		return a.x * b.x + a.y * b.y + a.z * b.z;
	},
	scale: function(s, v){
		return {x: s * v.x, y: s * v.y, z: s * v.z};
	},
	add: function(a, b){
		return {x: a.x + b.x, y: a.y + b.y, z: a.z + b.z};
	},
	saturate: function(v){
		return Math.min(Math.max(v, 0), 1);
	},
	length: function(v){
		return Math.sqrt(dojox.gfx3d.lighting.dot(v, v));
	},
	normalize: function(v){
		var p = dojox.gfx3d.lighting;
		return p.scale(1 / p.length(v), v);
	},
	faceforward: function(n, i){
		var p = dojox.gfx3d.lighting;
		var s = p.dot(i, n) < 0 ? 1 : -1;
		return p.scale(s, n);
	},
	reflect: function(i, n){
		var p = dojox.gfx3d.lighting;
		return p.add(i, p.scale(-2 * p.dot(i, n), n));
	},
	
	// lighting utilities
	diffuse: function(normal, lights){
		var p = dojox.gfx3d.lighting;
		var c = p.black();
		for(var i = 0; i < lights.length; ++i){
			var l = lights[i];
			var d = p.dot(p.normalize(l.direction), normal);
			c = p.addColor(c, p.scaleColor(d, l.color));
		}
		return p.saturateColor(c);
	},
	specular: function(normal, v, roughness, lights){
		var p = dojox.gfx3d.lighting;
		var c = p.black();
		for(var i = 0; i < lights.length; ++i){
			var l = lights[i];
			var h = p.normalize(p.add(p.normalize(l.direction), v));
			var s = Math.pow(Math.max(0, p.dot(normal, h)), 1 / roughness);
			c = p.addColor(c, p.scaleColor(s, l.color));
		}
		return p.saturateColor(c);
	},
	phong: function(normal, v, size, lights){
		var p = dojox.gfx3d.lighting;
		normal = p.normalize(normal);
		var c = p.black();
		for(var i = 0; i < lights.length; ++i){
			var l = lights[i];
			var r = p.reflect(p.scale(-1, p.normalize(v)), normal);
			var s = Math.pow(Math.max(0, p.dot(r, p.normalize(l.direction))), size);
			c = p.addColor(c, p.scaleColor(s, l.color));
		}
		return p.saturateColor(c);
	}
});

// this lighting model is derived from RenderMan Interface Specification Version 3.2

dojo.declare("dojox.gfx3d.lighting.Model", null, {
	constructor: function(incident, lights, ambient, specular){
		var p = dojox.gfx3d.lighting;
		this.incident = p.normalize(incident);
		this.lights = [];
		for(var i = 0; i < lights.length; ++i){
			var l = lights[i];
			this.lights.push({direction: p.normalize(l.direction), color: p.toStdColor(l.color)});
		}
		this.ambient = p.toStdColor(ambient.color ? ambient.color : "white");
		console.debug('ambient = ', this.ambient);
		this.ambient = p.scaleColor(ambient.intensity, this.ambient);
		this.ambient = p.scaleColor(this.ambient.a, this.ambient);
		this.ambient.a = 1;
		this.specular = p.toStdColor(specular ? specular : "white");
		this.specular = p.scaleColor(this.specular.a, this.specular);
		this.specular.a = 1;
		this.npr_cool = {r: 0,   g: 0,   b: 0.4, a: 1};
		this.npr_warm = {r: 0.4, g: 0.4, b: 0.2, a: 1};
		this.npr_alpha = 0.2;
		this.npr_beta  = 0.6;
		this.npr_scale = 0.6;
	},
	constant: function(normal, finish, pigment){
		var p = dojox.gfx3d.lighting;
		pigment   = p.toStdColor(pigment);
		var alpha = pigment.a;
		var color = p.scaleColor(alpha, pigment);
		color.a   = alpha;
		return p.fromStdColor(p.saturateColor(color));
	},
	matte: function(normal, finish, pigment){
		var p = dojox.gfx3d.lighting;
		pigment = p.toStdColor(pigment);
		normal  = p.faceforward(p.normalize(normal), this.incident);
		var ambient = p.scaleColor(finish.Ka, this.ambient);
		var shadow  = p.saturate(-4 * p.dot(normal, this.incident));
		var diffuse = p.scaleColor(shadow * finish.Kd, p.diffuse(normal, this.lights));
		var color   = p.scaleColor(pigment.a, p.multiplyColor(pigment, p.addColor(ambient, diffuse)));
		color.a = pigment.a;
		return p.fromStdColor(p.saturateColor(color));
	},
	metal: function(normal, finish, pigment){
		var p = dojox.gfx3d.lighting;
		pigment = p.toStdColor(pigment);
		normal  = p.faceforward(p.normalize(normal), this.incident);
		var v = p.scale(-1, this.incident);
		var ambient  = p.scaleColor(finish.Ka, this.ambient);
		var shadow   = p.saturate(-4 * p.dot(normal, this.incident));
		var specular;
		if("phong" in finish){
			specular = p.scaleColor(shadow * finish.Ks * finish.phong, p.phong(normal, v, finish.phong_size, this.lights));
		}else{
			specular = p.scaleColor(shadow * finish.Ks, p.specular(normal, v, finish.roughness, this.lights));
		}
		var color = p.scaleColor(pigment.a, p.addColor(p.multiplyColor(pigment, ambient), p.multiplyColor(this.specular, specular)));
		color.a = pigment.a;
		return p.fromStdColor(p.saturateColor(color));
	},
	plastic: function(normal, finish, pigment){
		var p = dojox.gfx3d.lighting;
		pigment = p.toStdColor(pigment);
		normal  = p.faceforward(p.normalize(normal), this.incident);
		var v = p.scale(-1, this.incident);
		var ambient  = p.scaleColor(finish.Ka, this.ambient);
		var shadow   = p.saturate(-4 * p.dot(normal, this.incident));
		var diffuse  = p.scaleColor(shadow * finish.Kd, p.diffuse(normal, this.lights));
		var specular;
		if("phong" in finish){
			specular = p.scaleColor(shadow * finish.Ks * finish.phong, p.phong(normal, v, finish.phong_size, this.lights));
		}else{
			specular = p.scaleColor(shadow * finish.Ks, p.specular(normal, v, finish.roughness, this.lights));
		}
		var color = p.scaleColor(pigment.a, p.addColor(p.multiplyColor(pigment, p.addColor(ambient, diffuse)), p.multiplyColor(this.specular, specular)));
		color.a = pigment.a;
		return p.fromStdColor(p.saturateColor(color));
	},
	npr: function(normal, finish, pigment){
		var p = dojox.gfx3d.lighting;
		pigment = p.toStdColor(pigment);
		normal  = p.faceforward(p.normalize(normal), this.incident);
		var ambient  = p.scaleColor(finish.Ka, this.ambient);
		var shadow   = p.saturate(-4 * p.dot(normal, this.incident));
		var diffuse  = p.scaleColor(shadow * finish.Kd, p.diffuse(normal, this.lights));
		var color = p.scaleColor(pigment.a, p.multiplyColor(pigment, p.addColor(ambient, diffuse)));
		var cool = p.addColor(this.npr_cool, p.scaleColor(this.npr_alpha, color));
		var warm = p.addColor(this.npr_warm, p.scaleColor(this.npr_beta,  color));
		var d = (1 + p.dot(this.incident, normal)) / 2;
		var color = p.scaleColor(this.npr_scale, p.addColor(color, p.mixColor(cool, warm, d)));
		color.a = pigment.a;
		return p.fromStdColor(p.saturateColor(color));
	}
});

// POV-Ray basic finishes

dojox.gfx3d.lighting.finish = {

	// Default
	
	defaults: {Ka: 0.1, Kd: 0.6, Ks: 0.0, roughness: 0.05},
	
	dull:     {Ka: 0.1, Kd: 0.6, Ks: 0.5, roughness: 0.15},
	shiny:    {Ka: 0.1, Kd: 0.6, Ks: 1.0, roughness: 0.001},
	glossy:   {Ka: 0.1, Kd: 0.6, Ks: 1.0, roughness: 0.0001},
	
	phong_dull:   {Ka: 0.1, Kd: 0.6, Ks: 0.5, phong: 0.5, phong_size: 1},
	phong_shiny:  {Ka: 0.1, Kd: 0.6, Ks: 1.0, phong: 1.0, phong_size: 200},
	phong_glossy: {Ka: 0.1, Kd: 0.6, Ks: 1.0, phong: 1.0, phong_size: 300},

	luminous: {Ka: 1.0, Kd: 0.0, Ks: 0.0, roughness: 0.05},

	// Metals

	// very soft and dull
	metalA: {Ka: 0.35, Kd: 0.3, Ks: 0.8, roughness: 1/20},
	// fairly soft and dull
	metalB: {Ka: 0.30, Kd: 0.4, Ks: 0.7, roughness: 1/60},
	// medium reflectivity, holds color well
	metalC: {Ka: 0.25, Kd: 0.5, Ks: 0.8, roughness: 1/80},
	// highly hard and polished, high reflectivity
	metalD: {Ka: 0.15, Kd: 0.6, Ks: 0.8, roughness: 1/100},
	// very highly polished and reflective
	metalE: {Ka: 0.10, Kd: 0.7, Ks: 0.8, roughness: 1/120}
};
