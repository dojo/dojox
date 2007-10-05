dojo.provide("dojox.charting.Axis");

(function(){
	var dxc=dojox.charting;
	var scaleTypes={
		LINEAR: "linear",
		LOG: "log"
	};
	
	dxc.Axis=function(/* Object */kwArgs){
		if(!kwArgs){
			kwArgs={};
		}
		this._key="dojoxChartingAxis"+dxc.Axis.count++;
		this.title=kwArgs.title||"";
		this.labels=kwArgs.labels||[];
		this.origin=kwArgs.origin||"min";
		this.range=kwArgs.range||{ upper:100, lower:0 };
		this.scale=kwArgs.scale||scaleTypes.LINEAR;
		this.show={
			lines:true,
			ticksMajor:true,
			ticksMinor:false,
			labels:true,
			title:true,
			axis:true
		};
		if(kwArgs.show){
			dojo.mixin(this.show, kwArgs.show);
		}
	};
	dxc.Axis.count=0;

	dojo.extend(dxc.Axis, {
		_initLabels:function(){
			this._labels=[];
			if(this.labels[0].label&&this.labels[0].value!=null){
				this._labels=this.labels.slice(0);
			}
			else if(!isNaN(this.labels[0])){
				dojo.forEach(this.labels, function(item){
					this._labels.push({ label: item, value: item });
				});
			}
			else {
				// clone me
				var a=this.labels.slice(0);

				//	do the bottom one.
				var s=a.shift();
				this._labels.push({ label:s, value: this.range.lower });

				//	do the top one.
				if(a.length>0){
					var s=a.pop();
					this._labels.push({ label:s, value: this.range.upper });
				}
				//	do the rest.
				if(a.length>0){
					var range=this.range.upper-this.range.lower;
					var step=range/(this.labels.length-1);
					for(var i=1; i<=a.length; i++){
						this._labels.push({
							label:a[i-1],
							value:this.range.lower+(step*i)
						});
					}
				}
			}
		},

		// TODO: dimensions other than 2.
		_initOrigin: function(/* dojox.charting.Axis */against){
			//	plane is the axis against which we determine the origin
			var n=this.origin;
			if(isNaN(n)){
				if(n=="min"){
					n=against.range.lower;
				} else if(n=="max"){
					n=against.range.upper;
				} else {
					n=0;
				}
			}
			this._origin=n;
		},

		//	setters.  Always set values through these methods, so that onSet
		//		events can be handled by those listening to them.
		setTitle: function(/* String */s){
			//	summary
			//	Set the title of this axis
			this.title=s;
			this.onSet(this, "title", s);
			return this;	//	dojox.charting.Axis
		},
		setLabels: function(/* Array */a){
			//	summary
			//	Set the labels on the axis, and re-initialize them
			this.labels=a;
			this._initLabels();
			this.onSet(this, "labels", a);
			return this;	//	dojox.charting.Axis
		},
		setOrigin: function(/* string || number */val){
			//	summary
			//	Set the origin point of the axis.
			//	Plots should be listening to onSet, and fire _initOrigin as a response.
			this.origin=val;
			this.onSet(this, "origin", val);
			return this;	//	dojox.charting.Axis
		},
		setRange: function(/* object||number */lower, /* number? */upper){
			//	summary
			//	Set the range on this axis.  Can take a keyword object
			//	{ lower, upper } or two numbers; the method will figure out
			//	which is lower and which is upper.
			if(dojo.isObject(lower)){
				this.range.lower=Math.min(lower.lower, lower.upper);
				this.range.upper=Math.max(lower.lower, lower.upper);
			} else {
				this.range.lower=Math.min(lower,upper);
				this.range.upper=Math.max(lower,upper);
			}
			this.onSet(this, "range", this.range);
			return this;	//	dojox.charting.Axis
		},
		setScale: function(/* String */scale){
			//	summary
			//	set the scaling on this axis (linear or log)
			this.scale=scale;
			this.onSet(this, "scale", scale);
			return this;	//	dojox.charting.Axis
		},
		setVisibility: function(/* string */what, /* boolean */show){
			//	summary
			//	Set the visibility on the aspect of the axis in question.
			//	<what> is a property of the show object.
			if(what in this.show){
				this.show[what]=show;
				this.onSet(this, "show", { what: what, value: show });
			}
			return this;	//	dojox.charting.Axis
		},

		//	event stubs
		onSet: function(axis, what, args){ }
	});
})();
