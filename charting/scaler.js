dojo.provide("dojox.charting.scaler");

(function(){
	// valid steps for the scaler
	var steps = [1, 2, 5, 10];
	
	var isText = function(val, text){
		val = val.toLowerCase();
		for(var i = 0; i < text.length; ++i){
			if(val == text[i]){ return true; }
		}
		return false;
	};
	
	var calcTicks = function(min, max, kwArgs, unit, majorTick, minorTick){
		var lowerBound = isText(kwArgs.fixLower, ["major"]) ? 
				Math.floor(min / majorTick) * majorTick :
					isText(kwArgs.fixLower, ["minor"]) ? 
						Math.floor(min / minorTick) * minorTick :
							isText(kwArgs.fixLower, ["unit"]) ?
								Math.floor(min / unit) * unit :
								min,
			upperBound = isText(kwArgs.fixUpper, ["major"]) ? 
				Math.ceil(max / majorTick) * majorTick :
					isText(kwArgs.fixUpper, ["minor"]) ? 
						Math.ceil(max / minorTick) * minorTick :
							isText(kwArgs.fixUpper, ["unit"]) ?
								Math.ceil(max / unit) * unit :
								max,
			majorStart = isText(kwArgs.fixLower, ["major"]) ?
				lowerBound : Math.ceil(lowerBound / majorTick) * majorTick,
			minorStart = isText(kwArgs.fixLower, ["major", "minor"]) ?
				lowerBound : Math.ceil(lowerBound / minorTick) * minorTick,
			nMajorTicks = (isText(kwArgs.fixUpper, ["major"]) ?
				Math.round((upperBound - majorStart) / majorTick) :
				Math.floor((upperBound - majorStart) / majorTick)) + 1,
			nMinorTicks = (isText(kwArgs.fixUpper, ["major", "minor"]) ?
				Math.round((upperBound - minorStart) / minorTick) :
				Math.floor((upperBound - minorStart) / minorTick)) + 1,
			minorPerMajor  = Math.round(majorTick / minorTick),
			majorPrecision = Math.floor(Math.log(majorTick) / Math.LN10),
			minorPrecision = Math.floor(Math.log(minorTick) / Math.LN10);
		return {
			lowerBound:		lowerBound,
			upperBound:		upperBound,
			majorTick:		majorTick, 
			majorStart:		majorStart,
			nMajorTicks:	nMajorTicks,
			minorTick:		minorTick, 
			minorStart:		minorStart,
			nMinorTicks:	nMinorTicks,
			minorPerMajor:	minorPerMajor,
			majorPrecision:	Math.max(-majorPrecision, 0),
			minorPrecision:	Math.max(-minorPrecision, 0)
		};
	};

	dojox.charting.scaler = function(min, max, span, minMinorStep, kwArgs){
		var h = {fixUpper: "none", fixLower: "none"};
		if(kwArgs){
			if("fixUpper" in kwArgs){ h.fixUpper = String(kwArgs.fixUpper); }
			if("fixLower" in kwArgs){ h.fixLower = String(kwArgs.fixLower); }
		}
		
		var diff = max * min < 0 ? Math.max(max, -min) : max - min;
		
		// find the base and steps
		var unit = 1, step;
		if(diff > unit){
			// scale up
			var factor = steps[steps.length - 1];
			while(diff > unit){
				step = unit * factor;
				if(diff <= step){ break; }
				unit = step;
			}
			for(step = 1; step < steps.length; ++step){
				if(diff <= steps[step] * unit){ break; }
			}
		}else{
			// scale down
			var factor = steps[steps.length - 1];
			while(diff <= unit){
				unit /= factor;
				if(diff > step){ break; }
			}
			for(step = 1; step < steps.length; ++step){
				if(diff <= steps[step] * unit){ break; }
			}
		}
		
		// calculate ticks
		var majorStep = step - 1, majorTick = unit * steps[majorStep], ticks;
		for(var i = majorStep - steps.length; i < majorStep; ++i){
			if(i == -1){ continue; }
			var minorTick = i < 0 ? unit / steps[steps.length - 1] * steps[steps.length + i] : unit * steps[i];
			ticks = calcTicks(min, max, h, unit, majorTick, minorTick);
			ticks.scale = span / (ticks.upperBound - ticks.lowerBound);
			if(ticks.scale * ticks.minorTick >= minMinorStep){ break; }
		}
		return ticks;	// Object
	};
})();
