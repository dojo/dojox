dojo.provide("dojox.charting.action2d.Shake");

dojo.require("dojox.charting.action2d.Base");
dojo.require("dojox.gfx.matrix");

(function(){
	var DEFAULT_SHIFT = 3,
		m = dojox.gfx.matrix,
		gf = dojox.gfx.fx;
	
	dojo.declare("dojox.charting.action2d.Shake", dojox.charting.action2d.Base, {
		constructor: function(chart, plot, kwargs){
			// process optional named parameters
			this.shiftX = kwargs && "shiftX" in kwargs ? kwargs.shiftX : DEFAULT_SHIFT;
			this.shiftY = kwargs && "shiftY" in kwargs ? kwargs.shiftY : DEFAULT_SHIFT;
			
			this.connect();
		},
		
		process: function(o){
			if(!o.shape || !(o.type in this.overOutEvents)){ return; }
			
			var runName = o.run.name, index = o.index, vector = [], anim, 
				shiftX = o.type == "onmouseover" ? this.shiftX : -this.shiftX,
				shiftY = o.type == "onmouseover" ? this.shiftY : -this.shiftY;
	
			if(runName in this.anim){
				anim = this.anim[runName][index];
			}else{
				this.anim[runName] = {};
			}
			
			if(anim){
				anim.action.stop(true);
			}else{
				this.anim[runName][index] = anim = {};
			}
			
			var kwargs = {
				shape:     o.shape,
				duration:  this.duration,
				easing:    this.easing,
				transform: [
					{name: "translate", start: [this.shiftX, this.shiftY], end: [0, 0]},
					m.identity
				]
			};
			if(o.shape){
				vector.push(gf.animateTransform(kwargs));
			}
			if(o.oultine){
				kwargs.shape = o.outline;
				vector.push(gf.animateTransform(kwargs));
			}
			if(o.shadow){
				kwargs.shape = o.shadow;
				vector.push(gf.animateTransform(kwargs));
			}
			
			if(!vector.length){
				delete this.anim[runName][index];
				return;
			}
			
			anim.action = dojo.fx.combine(vector);
			if(o.type == "onmouseout"){
				dojo.connect(anim.action, "onEnd", this, function(){
					if(this.anim[runName]){
						delete this.anim[runName][index];
					}
				});
			}
			anim.action.play();
		}
	});
})();