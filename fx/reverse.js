dojo.provide("dojo.fx.reverse");
dojo.require("dojo.fx.easing");
			
(function(){
	
	dojo.extend(dojo.Animation, {
		
		_reversed: false,
		reverse: function(/*Boolean*/playIfPaused, /*Function*/reverseEase){
			var playing = this.status() == "playing";
			this.pause();
			this._reversed = !this._reversed;
			
			var d = this.duration,
				sofar = d * this._percent,
				togo = d - sofar,
				curr = new Date().valueOf(),
				cp = this.curve._properties,
				p = this.properties
			;
			this._endTime = curr + sofar;
			this._startTime = curr - togo;
			
			if(playing){
				this.gotoPercent(togo / d)
			}
			for(var nm in p){
				var tmp = p[nm].start;
				p[nm].start = cp[nm].start = p[nm].end;
				p[nm].end = cp[nm].end = tmp;
			}
			
			if(this._reversed){
				if(!this.reverseEase){
					this.forwardEase = this.easing;
					if(reverseEase){
						this.reverseEase = this.reverseEase;
					}else{
						//this.forwardEase = this.easing;
						var de = dojo.fx.easing, found, nm, eName;
						for(nm in de){
							if(this.easing == de[nm]){
								found = nm; break;
							}
						}
						
						if(found){
							if(/InOut/.test(nm) || !/In|Out/i.test(nm)){
								this.reverseEase = this.easing;
							}else if(/In/.test(nm)){
								eName = nm.replace("In", "Out");
							}else{
								eName = nm.replace("Out", "In");
							}
							if(eName){
								this.reverseEase = dojo.fx.easing[eName];
							}
						}else{
							console.info("ease function to reverse not found");
							this.reverseEase = this.easing;
						}
					}
					
					this.easing = this.reverseEase;
				}
			}else{
				this.easing = this.forwardEase;
			}
			
			
			if(playIfPaused && this.status() != "playing"){
				this.play();
			}
			
			return this;
		}
	});
	
	if(dojo.fx.chain){
		var d = dojo;
		dojo.extend(dojo.fx._chain, {
			_reversed:false,
			_onEnd: function(){
				d.disconnect(this._onAnimateCtx);
				d.disconnect(this._onEndCtx);
				this._onAnimateCtx = this._onEndCtx = null;
				if(this._reversed){
					if(this._index - 1 == -1){
						this._fire("onEnd");
						return;
					}else{
						this._current = this._animations[--this._index];
					}
				}else{
					if(this._index + 1 == this._animations.length){
						this._fire("onEnd");
						return;
					}else{
						// switch animations
						this._current = this._animations[++this._index];
					}
				}
				this._onAnimateCtx = d.connect(this._current, "onAnimate", this, "_onAnimate");
				this._onEndCtx = d.connect(this._current, "onEnd", this, "_onEnd");
				this._current.play(0, true);
			},
			reverse: function(){
				this._reversed = !this._reversed;
				dojo.forEach(this._animations, function(ani){
					ani.reverse();
				})
			}	
		})
		
		dojo.extend(dojo.fx._combine, {
			_reversed:false,
			reverse: function(){
				this._reversed = !this._reversed;
				dojo.forEach(this._animations, function(ani){
					ani.reverse();
				})
			}
		})
	}
	
})();