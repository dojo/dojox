dojo.provide("dojox.av.mediaStatus");

dojo.declare("dojox.av.mediaStatus", null, {
			 
	_initStatus: function(){
		this.status = "ready";
		dojo.connect(this, "onStart", this, function(){
			this._interval = setInterval(dojo.hitch(this, "_figureStatus"),this.statusReturnTime);								
		});
		dojo.connect(this, "onEnd", this, function(){
			clearInterval(this._interval);						 
		});
	},
			
	_figureStatus: function(){
		var pos = this.getTime();
		
		if(this.status=="stopping"){
			// stop was fired, need to fake pos==0
			this.status = "stopped";
			this.onStop(this._eventFactory());
		}else if(pos===0 ){//|| this.status == "stopped"
			if(this.status == "ready"){
				//never played	
			}else{
				//stopped
				this.status = "stopped";
				if(this._prevStatus != "stopped"){
					this.onStop(this._eventFactory());	
				}
			}
		}else{
			// pos > 0
			if(this.status == "ready"){
				//started
				this.status = "started";
				this.onStart(this._eventFactory());
				this.onPlay(this._eventFactory());
			
			}else if(this.status == "started" || (this.status == "playing" &&  pos != this._prevPos)){
				this.status = "playing";
				//this.onPosition(this._eventFactory());
			
			}else if(!this.isStopped && this.status == "playing" && pos == this._prevPos){
				this.status = "paused";
				if(this.status != this._prevStatus){
					this.onPause(this._eventFactory());	
				}
			
			}else if((this.status == "paused" ||this.status == "stopped") && pos != this._prevPos){
				this.status = "started";
				this.onPlay(this._eventFactory());
			}
		}

		this._prevPos = pos;
		this._prevStatus = this.status;
		this.onStatus(this.status);
	
	
	},
	_eventFactory: function(){
		var evt = {
			//position:this._channel.position,
			//seconds:this.toSeconds(this._channel.position*.001),
			//percentPlayed:this._getPercent(),
			status:this.status
		}
		return evt;
	}
});