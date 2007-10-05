dojo.provide("dojox.charting.Plot");

/**************************************************************************
 *	dojox.charting.Plot
 *
 *	An abstract object describing up to 3 axes (x, y, z)
 *	and a set of data series.
 *
 *	Series are created as keyword arguments, as opposed to
 *	using specific constructors.  The Plot will alter these
 *	objects and return references to the "fixed" versions.
 *
 *	Data series
 *	-----------------------------------------------------------------------
 *	Series are added to a plot through <plot>.add.  You can
 *	pass either an array (which will become the data of the
 *	series), or a keyword argument object:
 *
 *	{ data, title, bindings, color, marker, plotter, show }
 *	data (Array): 		the raw data used for the plot
 *	title (String): 	the title of the series
 *	bindings (Object):	A set of property maps
 *	color (dojo.Color):	the color used to render the series
 *	marker (String):	an SVG path string used for marker on a point
 *	plotter (Function):	the plotting function to be used to draw the data
 *	show (Boolean):		a switch to show or hide the series
 *
 *	All properties are optional when created, but you should probably fill
 *	out at least data, bindings, color and plotter.
 *
 *	When a series is added, a reference to the <plot>'s add method is 
 *	attached to the keyword argument, so that you can chain add calls:
 *
 *	myPlot.add(data0).add(data1).add(data2);
 *
 *	You will also be returned a reference to the object passed, if you
 *	want it:
 *
 *	var series0=myPlot.add(data0);
 *
 *	This way you can share series between different Plot objects.
 *
 *	Events
 *	-----------------------------------------------------------------------
 *	Plots fire off a number of mutation events that can be connected to
 *	from a rendering object, so that a change in a property can be reflected
 *	with a renderer (such as dojox.charting.Chart or dojox.charting.Sparkline).
 *	See the setter methods defined below to learn what methods are available.
 **************************************************************************/

(function(){
	var dxc=dojox.charting;
	var axes=["x","y","z"];
	var plotTypes={
		ZEROD:"zero-d",		//	pie charts mostly
		ONED:"one-d",		//	bar charts
		TWOD:"two-d",		//	normal
		THREED:"three-d"	//	3D charts
	};

	dxc.Plot=function(/* object */kwArgs){
		var self=this;
		this._key="dojoxChartingPlot"+dxc.Plot.count++;
		this.title=kwArgs.title||"";
		this.type=kwArgs.type||plotTypes.TWOD;
	
		//	set up the axes
		this.axes={ };
		dojo.forEach(axes, function(item){
			this.axes[item]=(kwArgs.axes&&kwArgs.axes[item] ? kwArgs.axes[item] : null);
		});

		//	set up the series
		this.series=[];
		if(kwArgs.series){
			dojo.forEach(kwArgs.series, function(item, i){
				//	let the kwArgs keep the altered series objects.
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

	dojo.extend(dxc.Plot, {
		//	setters.  Use these to trigger onSet events, a chart or sparkline may need that.
		setTitle: function(/* String */s){
			//	summary
			//	Set the title of the plot and fire an onSet event
			this.title=s;
			this.onSet(this, "title", s);
			return this;	//	dojox.charting.Plot
		},
		setAxis: function(/* string */which, /* dojox.charting.Axis */axis){
			//	summary
			//	Set <which> axis to the <axis> reference, and fire an onSet event.
			this.axes[which]=axis;

			//	TODO: more than 2 dimensions.
			//	TODO: deal with shared axes.
			dojo.connect(axis, "setOrigin", this, function(){
				var against=this.axes[(which=="x")?"y":"x"];
				if(against){
					axis._initOrigin(against);
				}
			});
			//	connect to axis events as a passthrough
			dojo.connect(axis, "onSet", this, function(axis, what, args){
				this.onAxisChange(this, which, axis, what, args);
			});

			this.onSet(this, "axis", { which: which, axis: axis });
			return this;	//	dojox.charting.Plot
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
		onSet: function(plot, what, obj){ },
		onAxisChange: function(plot, which, axis, what, args){ }
	});
})();
