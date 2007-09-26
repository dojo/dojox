dojo.provide("dojox.charting.Plot");

(function(){
	var dxc=dojox.charting;
	var axes=["x","y","z"];
	var plotTypes={
		ZEROD:"zero-d",		//	pie charts mostly
		ONED:"one-d",		//	bar charts
		TWOD:"two-d",		//	normal
		RADAR:"radar",		//	normal on a repeated basis
		THREED:"three-d"	//	three axis charts (like surface)
	};
	var scaleTypes={
		LINEAR: "linear",
		LOG: "log"
	};
	
	dxc.Plot=function(/* object */kwArgs){
		var self=this;
		this._key="dojoxChartingPlot"+dxc.Plot.count++;
		this.title=kwArgs.title||"";
		this.type=kwArgs.type||plotTypes.TWOD;
	
		//	set up the axes
		this.axes={ };
		dojo.forEach(axes, function(item){
			this.axes[item]=kwArgs.axes&&kwArgs.axes[item]?kwArgs.axes[item]:null;
			if(this.axes[item]){
				this._initLabels(item, this.axes[item]);
			}
		});

		//	set up the series
		this.series=[];
		if(kwArgs.series){
			dojo.forEach(kwArgs.series, function(item, i){
				kwArgs.series[i]=self.add(item);
			});
		}

		//	we do this using the closure to allow for dual use in the passed
		//	reference.  The return object is the altered arg, but a reference
		//	to this.add method is made on it to allow chaining.
		this.add=function(/* object||array */arg){
			if(dojo.isArray(arg)){
				arg={ data: arg };
			}
			self.series.push(arg);
			
			//	TODO: set defaults
			dojo.mixin({
				data:null,
				title:"Series "+self.series.length,
				bindings:null,
				color:null,
				marker:null,
				plotter:null,
				show: true
			}, arg);	//	last one wins

			arg.add=self.add;
			self.onAdd(self, arg);
			return arg;		//	object
		}
	};
	dxc.Plot.count=0;
	dxc.Plot.axes={ count:0 };

	dojo.extend(dxc.Plot, {
		//	TODO: set and initialize axis origin points.
		_initLabels:function(/* string */which, /* object */axis){
			axis._labels=[];
			if(axis.labels[0].label&&axis.labels[0].value!=null){
				axis._labels=axis.labels.slice(0);
			}
			else if(!isNaN(axis.labels[0])){
				dojo.forEach(axis.labels, function(item){
					axis._labels.push({ label: item, value: item });
				});
			}
			else {
				// clone me
				var a=axis.labels.slice(0);

				//	do the bottom one.
				var s=a.shift();
				axis._labels.push({ label:s, value: axis.range.lower });

				//	do the top one.
				if(a.length>0){
					var s=a.pop();
					axis._labels.push({ label:s, value: axis.range.upper });
				}
				//	do the rest.
				if(a.length>0){
					var range=axis.range.upper-axis.range.lower;
					var step=range/(axis.labels.length-1);
					for(var i=1; i<=a.length; i++){
						axis._labels.push({
							label:a[i-1],
							value:axis.range.lower+(step*i)
						});
					}
				}
			}

			//	now process values for use in coords
			//	TODO: dimensions other than 2.
			dojo.forEach(axis._labels, function(item){
				item[which]=item.value;
				item[(which=="x"?"y":"x")]=axis._origin;
			});
		},
		_initOrigin: function(which, axis){
			var o=axis.origin;
			if(isNaN(o)){
				//	TODO: dimensions other than 2
				var plane=(which=="x"?"y":"x");
				if(o=="min"){
					o=this.axes[plane].range.lower;
				} else if(o=="max"){
					o=this.axes[plane].range.upper;
				} else {
					o=0;
				}
			}
			axis._origin=o;
		},

		//	setters.  Use these to trigger onSet events, a chart or sparkline may need that.
		setTitle: function(s){
			this.title=s;
			this.onSet(this, "plot-title", s);
		},
		setOrigin: function(which, val){
			if(this.axes[which]){
				this.axes[which].origin=val;
				this._initOrigin(which, this.axes[which]);
				this.onSet(this, "axis-origin", { which: which, axis: this.axes[which] });
			}
		},
		setAxisTitle: function(which, s){
			if(this.axes[which]){
				this.axes[which].title=s;
				this.onSet(this, "axis-title", { which: which, axis: this.axes[which] });
			}
		},
		setLabels: function(which, obj){
			if(this.axes[which]){
				this.axes[which].labels=obj;
				this._initLabels(which, this.axes[which]);
				this.onSet(this, "axis-labels", { which: which, axis: this.axes[which] });
			}
		},
		setRanges: function(which, obj){
			if(this.axes[which]){
				this.axes[which].range=obj;
				this._initOrigin(which, this.axes[which]);
				this._initLabels(which, this.axes[which]);
				this.onSet(this, "axis-ranges", { which: which, axis: this.axes[which] });
			}
		},
		setVisibility: function(type, which, val){
			//	type: lines, ticksMajor, ticksMinor, labels, title, axis, series
			if(type=="series"){
				//	which is the series and not a string.
				which.show=val;
				this.onSet(this, "series-visibility", { series: which });
			} else {
				if(this.axes[which]&&(type in this.axes[which].show)){
					this.axes[which].show[type]=val;
					this.onSet(this, "axis-visibility", { which: which, axis: this.axes[which], attr: type });
				}
			}
		},
		setScaling: function(which, scale){
			if(this.axes[which]){
				this.axes[which].scale=scale;
				this.onSet(this, "axis-scale", { which: which, axis: this.axes[which] });
			}
		},
		setAxis: function(/* string */which, /* object */kwArgs){
			kwArgs=dojo.mixin({
				_key: "dojoxChartingAxis"+dxc.Plot.axes.count++,
				title: which.toUpperCase()+" Axis",
				labels:[],
				_labels:[],
				origin:"min",
				_origin:0,
				range:{ upper: 100, lower:0 },
				scale:scaleTypes.LINEAR,
				show:{
					lines:false,
					ticksMajor: false, 
					ticksMinor: false,
					labels: true,
					title: true,
					axis: true
				}
			}, kwArgs);
			this.axes[which]=kwArgs;
			this._initOrigin(which, this.axes[which]);
			this._initLabels(which, this.axes[which]);

			this.onSet("axis", { which: which, axis: kwArgs });

			//	for chaining
			return this;	//	dojox.charting.Plot
		},

		coords: function(/* object */item, /* object */rect){
			//	returns the coordinates of the item for drawing
			//	item is the data object returned from evaluate, with matching
			//	values for the axes on this plot.
			//	rect: { x, y, width, height }
			var point={};

			//	TODO: log scaling.
			var map={
				x: function(val, rect){
					var offset=0-this.axes["x"].range.lower;
					var min=this.axes["x"].range.lower+offset;
					var max=this.axes["x"].range.upper+offset;
					val+=offset;
					return (val*(rect.width/max))+rect.x;	//	float
				},
				y: function(val, rect){
					var max=this.axes["y"].range.upper;
					var min=this.axes["y"].range.lower;
					var offset=0;
					if(min<0){
						offset+=Math.abs(min);
					}
					max+=offset; min+=offset; val+=offset;
					return ((rect.height/(max-min))*(max-val))+rect.y;
				}
			};
			map._def=map.y;

			for(var p in item){
				if(this.axes[p]&&map[p]){
					point[p]=map[p](item[p], rect);
				} else {
					point[p]=map._def(item[p], rect);
				}
			}
			return point;
		},
		evaluate: function(/* object */series, /* object? */kwArgs){
			//	summary
			//	evaluate the passed series.
			if(!series.show) return [];

			var ret=[];
			var l=series.data.length;
			var start=0;
			var end=l;
			
			/*	Allow for ranges.  Can be done in one of three ways:
			 *	1. { from, to } as 0-based indices
			 *	2. { length } as num of data points to get; a negative
			 *		value will start from the end of the data set.
			 *	3. { between:{ low, high, field } } will search the data
			 *		set for values of field between low and high, and
			 *		return those.
			 *	No kwArg object means the full data set will be evaluated
			 *		and returned.
			 */
			if(kwArgs){
				if(kwArgs.between){
					//	a little ugly, but we will use this as a shortcut
					//	and return the evaluation from here.
					for(var i=0; i<l; i++){
						var field=series.data[i][kwArgs.between.field];
						if(fld>=kwArgs.between.low && fld<=kwArgs.between.high){
							var o={ src: series.data[i], series:series };
							for(var p in series.bindings){
								o[p]=series.data[i][series.bindings[p]];
							}
							ret.push(o);
						}
					}
				}
				else if(kwArgs.from||kwArgs.length){
					if(kwArgs.from){ 
						start=Math.max(kwArgs.from,0);
						if(kwArgs.to){ 
							end=Math.min(kwArgs.to, end);
						}
					} else {
						if(kwArgs.length<0){
							//	length points from end
							start=Math.max((end+length),0);
						} else {
							end=Math.min((start+length),end);
						}
					}
					for(var i=start; i<end; i++){
						var o={ src: series.data[i], series:series };
						for(var p in series.bindings){
							o[p]=series.data[i][series.bindings[p]];
						}
						ret.push(o);
					}
				}
			} else {
				for(var i=start; i<end; i++){
					var o={ src: series.data[i], series:series };
					for(var p in series.bindings){
						o[p]=series.data[i][series.bindings[p]];
					}
					ret.push(o);
				}
			}

			//	sort by the x axis, if available.
			if(ret.length>0 && typeof(ret[0].x)!="undefined"){
				ret.sort(function(a,b){
					if(a.x>b.x) return 1;
					if(a.x<b.x) return -1;
					return 0;
				});
			}

			this.onEvaluate(ret, series, kwArgs);
			return ret;	//	array
		},

		//	event stubs
		onAdd: function(plot, series){ },
		onEvaluate: function(data, series, kwArgs){ },
		onSet: function(plot, what, obj){ }
	});
})();
