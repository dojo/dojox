dojo.provide("dojox.widget.DataPresentation");
dojo.experimental("dojox.widget.DataPresentation");

dojo.require("dojox.grid.DataGrid");
dojo.require("dojox.charting.Chart2D");
dojo.require("dojox.charting.widget.Legend");
dojo.require("dojox.charting.action2d.Tooltip");
dojo.require("dojox.charting.action2d.Highlight");
dojo.require("dojo.colors");		
dojo.require("dojo.data.ItemFileWriteStore");

(function(){
	
	// FIXME use themes for setting the fill and stroke colors
	var defaultFillColors = {
			"default": ["#497c91","#59a0bd","#9dc7d9","#c7e0e9","#7b78a4","#8d88c7","#ada9d6","#c9c6e4","#768b4e","#677e13","#a8c179","#c0d0a0","#b7b35c","#e8e667","#eeea99","#f0eebb","#b39c53","#e9c756","#ebcf81","#efdeb0","#956649","#b17044","#c28b69","#cfb09b","#815454","#a05a5a","#c99999","#ddc0c0","#868686","#a5a5a5","#bebebe","#d8d8d8"],
	        "alternative-1": ["#497c91","#ada9d6","#768b4e","#eeea99","#b39c53","#c28b69","#815454","#bebebe","#59a0bd","#c9c6e4","#677e13","#f0eebb","#e9c756","#cfb09b","#a05a5a","#d8d8d8","#9dc7d9","#7b78a4","#a8c179","#b7b35c","#ebcf81","#956649","#c99999","#868686","#c7e0e9","#8d88c7","#c0d0a0","#e8e667","#efdeb0","#b17044","#ddc0c0","#a5a5a5"],
	        "alternative-2": ["#497c91","#59a0bd","#dc7d90","#c7e0e9","#7b78a4","#8d88c7","#ada9d6","#c9c6e4","#768b4e","#677e13","#a8c179","#c0d0a0","#b7b35c","#e8e667","#eeea99","#f0eebb","#b39c53","#e9c756","#ebcf81","#efdeb0","#956649","#b17044","#c28b69","#cfb09b","#815454","#a05a5a","#c99999","#ddc0c0","#868686","#a5a5a5","#bebebe","#d8d8d8"]
	};
	
	var defaultStrokeColors = {
			"default": ["#22627d","#1a80a8","#71b2cb","#a6cedd","#5e5996","#6d66b9","#8a84c5","#b1add8","#5b6b1f","#85a54a","#88aa47","#a2bb6b","#918e38","#c8c548","#d4cf76","#dddb9d","#947b30","#cfab39","#cdb360","#d2c086","#74482e","#8c4f29","#a96e47","#b7927a","#572828","#7f3333","#ab6d6d","#cca0a0","#535353","#7f7f7f","#a2a2a2","#c7c7c7" ],
			"alternative-1": ["#22627d","#8a84c5","#5b6b1f","#d4cf76","#947b30","#a96e47","#572828","#a2a2a2","#1a80a8","#b1add8","#85a54a","#dddb9d","#cfab39","#b7927a","#7f3333","#c7c7c7","#71b2cb","#5e5996","#88aa47","#918e38","#cdb360","#74482e","#ab6d6d","#535353","#a6cedd","#6d66b9","#a2bb6b","#c8c548","#d2c086","#8c4f29","#cca0a0","#7f7f7f"],
			"alternative-2": ["#22627d","#1a80a8","#71b2cb","#a6cedd","#5e5996","#6d66b9","#8a84c5","#b1add8","#5b6b1f","#85a54a","#88aa47","#a2bb6b","#918e38","#c8c548","#d4cf76","#dddb9d","#947b30","#cfab39","#cdb360","#d2c086","#74482e","#8c4f29","#a96e47","#b7927a","#572828","#7f3333","#ab6d6d","#cca0a0","#535353","#7f7f7f","#a2a2a2","#c7c7c7"]
	};

	// set up a chart presentation
	var setupChart = function(/*DomNode*/domNode, /*Object?*/chart, /*String*/type, /*Boolean*/reverse, /*Integer*/labelMod, /*String*/scheme, /*Object?*/store, /*String?*/query, /*String?*/queryOptions){
		var _chart = chart;
		
		if(!_chart){
			domNode.innerHTML = "";  // any other content in the node disrupts the chart rendering
			_chart = new dojox.charting.Chart2D(domNode);
		}
		
		// prepare labels for the independent axis
		var labels = [], labelmod = labelMod;
		// add empty label, hack
		labels[0] = {value: 0, text: ''};

		var range = store.series_data[0].slice(0);
			
		// reverse the labels if requested
		if(reverse){
			range.reverse();
		}
			
		var nlabels = range.length;

	    // auto-set labelmod for horizontal charts if the labels will otherwise collide
	    switch(type.toLowerCase()){
	    	case 'hybrid':
	    	case 'clusteredcolumns':
	    	case 'areas':
	    	case 'stackedcolumns':
	    	case 'stackedareas':
	    	case 'lines':
	    		var cwid = domNode.offsetWidth;
	    		var tmp = range[0].length * range.length * 7; // *assume* 7 pixels width per character ( was 9 )
	    	  
	    		if(labelmod == 1){
	    			for(var z = 1; z < 500; ++z){
	    				if((tmp / z) < cwid){
	    					break;
	    				}
	    				++labelmod;
	    			}
	    		}
	    		
	    		break;
	    }

		// now set the labels
		for(var i = 0; i < nlabels; i++){
			//sparse labels
			if(i % labelmod == 0){
				labels.push({value: (i+1), text: range[i]});
			}else{
				labels.push({value: (i+1), text: "" });
			}
		}
		// add empty label again, hack
		labels.push({value:(nlabels + 1),text:''});

		// used for hybrid charts
		_chart.addPlot("misc", {type: "Lines", markers: true, shadows: {dx: 2, dy: 2, dw: 2}});			

		// maximum data value and minimum value
		var maxval = 0;
		var minval = 10000000;
		tnum = 0;

		// set x values & max data value
		var nseries = store.series_name.length;
		for(var i = 0; i < nseries; i++){
			// only include series with chart=true and with some data values in
			if(store.series_chart[i] && (store.series_data[i].length > 0)){
				var xvals = [];
				var valen = store.series_data[i].length;
				for(var j = 0; j < valen; j++){
					var val = store.series_data[i][j];
					xvals.push(val);
					if(val > maxval){
						maxval = val;
					}
					if(val < minval){
						minval = val;
					}
					++tnum;
				}
				var legend = store.series_name[i];
					
				// reverse the values if requested
				if(reverse){
					xvals.reverse();
				}
					
				if(type == 'hybrid' && (store.series_charttype[i] == 'line')){
					   _chart.addSeries(legend, xvals, { plot: "misc", stroke: { color: defaultStrokeColors[scheme][i] }, fill: defaultFillColors[scheme][i] });
				}else{
					   _chart.addSeries(legend, xvals, { stroke: { color: defaultStrokeColors[scheme][i] }, fill: defaultFillColors[scheme][i] });
				}
			}
		}

		// determine the majortickstep to use based on the maximum value found
		var mts = 10;
		if(maxval > 50000){
			mts = 10000;
		}else if(maxval > 5000){
			mts = 1000;
		}else if(maxval > 500){
			mts = 100;
		}else if(maxval > 100){
			mts = 20;
		}

		// check chart type
		switch(type.toLowerCase()){
			case 'hybrid':
			case 'clusteredcolumns':
				_chart.addAxis("y",{vertical:true,fixLower:"major",fixUpper:"major",natural:true,min:0});
				_chart.addAxis("x",{vertical:false,labels:labels,min:0,max:range.length+1,majorTickStep:1,minorTickStep:1});
				_chart.addPlot("default",{type:"ClusteredColumns",gap:4});
				break;
			case 'clusteredbars':
				//log('uxd_chart => drawing ClusteredBars chart');
				_chart.addAxis("x",{fixLower:"major",fixUpper:"major",natural:true,min:0});
				_chart.addAxis("y",{vertical:true,labels:labels,min:0,max:range.length+1,majorTickStep:1,minorTickStep:1});
				_chart.addPlot("default",{type:"ClusteredBars",gap:4});
				break;
			case 'areas':
				//log('uxd_chart => drawing Areas chart');
				_chart.addAxis("y",{vertical:true,fixLower:"major",fixUpper:"major",max:maxval,min:minval,majorTickStep:mts});
				_chart.addAxis("x",{vertical:false,labels:labels,min:1,max:range.length,majorTickStep:1,minorTickStep:1});
				_chart.addPlot("default",{type:"Areas",lines:true,areas:true,markers:false});
				break;
			case 'stackedcolumns':
				_chart.addAxis("y",{vertical:true,fixLower:"major",fixUpper:"major"});
				_chart.addAxis("x",{vertical:false,labels:labels,min:0,max:range.length+1,majorTickStep:1,minorTickStep:1});
				_chart.addPlot("default",{type:"StackedColumns",gap:4});
				break;
			case 'stackedbars':
				_chart.addAxis("x",{fixLower:"major",fixUpper:"major",natural:true,min:0});
				_chart.addAxis("y",{vertical:true,labels:labels,min:0,max:range.length+1,majorTickStep:1,minorTickStep:1});
				_chart.addPlot("default",{type:"StackedBars",gap:4});
				break;
			case 'stackedareas':
				_chart.addAxis("y",{vertical:true,fixLower:"major",fixUpper:"major"});
				_chart.addAxis("x",{vertical:false,labels:labels,min:1,max:range.length,majorTickStep:1,minorTickStep:1});
				_chart.addPlot("default",{type:"StackedAreas",lines:true,areas:true,markers:false});
				break;
			case 'lines':
				_chart.addAxis("y",{vertical:true,fixLower:"major",fixUpper:"major",max:maxval,min:minval,majorTickStep:mts});
				_chart.addAxis("x",{vertical:false,labels:labels,min:1,max:range.length,majorTickStep:1,minorTickStep:1});
				_chart.addPlot("default",{type:"Lines",markers:true});
				break;
		}		
		
		// create tooltips
		var htip = new dojox.charting.action2d.Tooltip(_chart,"misc");
		var dtip = new dojox.charting.action2d.Tooltip(_chart,"default");
		var hl = new dojox.charting.action2d.Highlight(_chart,"default");

		_chart.render();
		return _chart;
	};		

	// set up a legend presentation
	var setupLegend = function(/*DomNode*/domNode, /*Legend*/legend, /*Chart2D*/chart, /*Boolean*/vertical){
		// destroy any existing legend and recreate
		var _legend = legend;
		
		if(!_legend){
			if(vertical){
				_legend = new dojox.charting.widget.Legend({ chart: chart, horizontal: false }, domNode);
			}else{
				_legend = new dojox.charting.widget.Legend({ chart: chart, vertical: false }, domNode);
			}
		}
		
		return _legend;
	};
	
	// set up a grid presentation
	var setupGrid = function(/*DomNode*/domNode, /*Object?*/grid, /*Object?*/store, /*String?*/query, /*String?*/queryOptions){
		var _grid = grid || new dojox.grid.DataGrid({}, domNode);		
		_grid.startup();		
		_grid.setStore(store, query, queryOptions);
		
		var structure = [];
		for(var ser = 0; ser < store.series_name.length; ser++){
			// only include series with grid=true and with some data values in
			if(store.series_grid[ser] && (store.series_data[ser].length > 0)){
				structure.push({ field: "data." + ser, name: store.series_name[ser], width: "auto", formatter: store.series_gridformatter[ser] });
			}
		}
		
		_grid.setStructure(structure);
		_grid.render();
		
		return _grid;
	};
	
	// set up a title presentation
	var setupTitle = function(/*DomNode*/domNode, /*object*/store){
		if(store.title){
			domNode.innerHTML = store.title;
		}
	};
	
	// set up a footer presentation
	var setupFooter = function(/*DomNode*/domNode, /*object*/store){
		if(store.footer){
			domNode.innerHTML = store.footer;
		}
	};
	
	// obtain a subfield from a field specifier which may contain
	// multiple levels (eg, "child.foo[36].manacle")
	var getSubfield = function(/*Object*/object, /*String*/field){
		var result = object;
		
		if(field){			
			var fragments = field.split(/[.\[\]]+/);
			for(var frag in fragments){
				if(result){
					result = result[fragments[frag]];
				}
			}
		}
		
		return result;
	};
	
	dojo.declare("dojox.widget.DataPresentation", null, {
		//	summary:
		//
		//		DataPresentation
		//
		//		A widget that connects to a data store in a simple manner,
		//      and also provides some additional convenience mechanisms
		//      for connecting to common data sources without needing to
		//      explicitly construct a Dojo data store. The widget can then
		//      present the data in several forms: as a graphical chart,
		//      as a tabular grid, or as display panels presenting meta-data
		//      (title, creation information, etc) from the data. The
		//      widget can also create and manage several of these forms
		//      in one simple construction.
		//
		//      Note: this is a first experimental draft and any/all details
		//      are subject to substantial change in later drafts.
		//
		//	example:
		//
		//	 	var pres = new dojox.data.DataPresentation("myChartNode", {
		//	 		type: "chart",
		//	 		url: "/data/mydata",
		//          gridNode: "myGridNode"
		//	 	});
		//
		//	properties:
		//
		//  store: Object
		//      Dojo data store used to supply data to be presented. This may
		//      be supplied on construction or created implicitly based on
		//      other construction parameters ('data', 'url').
		//
		//  query: String
		//      Query to apply to the Dojo data store used to supply data to
		//      be presented.
		//
		//  queryOptions: String
		//      Query options to apply to the Dojo data store used to supply
		//      data to be presented.
		//
		//  data: Object
		//      Data to be presented. If supplied on construction this property
		//      will override any value supplied for the 'store' property.
		//
		//  url: String
		//      URL to fetch data from in JSON format. If supplied on
		//      construction this property will override any values supplied
		//      for the 'store' and/or 'data' properties.
		//
		//  refresh: Number
		//      the time interval in milliseconds after which the data supplied
		//      via the 'data' property or fetched from a URL via the 'url'
		//      property should be regularly refreshed. This property is
		//      ignored if neither the 'data' nor 'url' property has been
		//      supplied. If the refresh is zero, no regular refresh is done.
		//
		//  refreshInterval:
		//      the JavaScript set interval currently in progress, if any
		//
		//  series: Array
		//      an array of objects describing the data series to be included
		//      in the data presentation. Each object may contain the 
		//      following fields:
		//			datapoints: the name of the field from the source data which
		//				contains an array of the data points for this data series.
		//				If not supplied, the source data is assumed to be an array
		//				of data points to be used.
		//			field: the name of the field within each data point which
		//				contains the data for this data series. If not supplied,
		//				each data point is assumed to be the value for the series.
        //      	name: a name for the series, used in the legend and grid headings
		//          namefield: the name of the field from the source data which
		//              contains the name the series, used in the legend and grid
		//              headings. If both name and namefield are supplied, name takes
		//              precedence. If neither are supplied, a default name is used.
		//			chart: true if the series should be included in a chart presentation (default: true)
		//          charttype: the type of presentation of the series in the chart, which can be
		//				"range", "line", "bar" (default: "bar")
        //			grid: true if the series should be included in a data grid presentation (default: true)
        //			gridformatter: an optional formatter to use for this series in the data grid
		//
	    //      a call-back function may alternatively be supplied. The function takes
		//      a single parameter, which will be the data (from the 'data' field or
		//      loaded from the value in the 'url' field), and should return the array
		//      of objects describing the data series to be included in the data
		//      presentation. This enables the series structures to be built dynamically
		//      after data load, and rebuilt if necessary on data refresh. The call-back
		//      function will be called each time new data is set, loaded or refreshed.
		//      A call-back function cannot be used if the data is supplied directly
		//      from a Dojo data store.
		//
		//  type: String
		//      the type of presentation to be applied at the DOM attach point.
		//      This can be 'chart', 'legend', 'grid', 'title', 'footer'. The
		//      default type is 'chart'.
		type: "chart",
		//
		//  chartType: String
		//      the type of chart to display. This can be 'clusteredbars',
		//      'areas', 'stackedcolumns', 'stackedbars', 'stackedareas',
		//      'lines', 'hybrid'. The default type is 'bar'.
		chartType: "clusteredBars",
		//
		//  reverse: Boolean
		//      true if the chart independant axis should be reversed.
		reverse: false,
		//
		//  labelMod: Integer
		//      the frequency of label annotations to be included on the
		//      independent axis. 1=every label. The default is 1.
		labelMod: 1,
		//
		//  legendVertical: Boolean
		//      true if the legend should be rendered vertically. The default
		//      is false (legend rendered horizontally).
		legendVertical: false,
		//
		//  scheme: String
		//      the name of a colour scheme to use. Valid names are "default",
		//      "alternative-1" and "alternative-2". The default is "default".
		scheme: "default",
		//
		//  chartNode: String|DomNode
		//      an optional DOM node or the id of a DOM node to receive a
		//      chart presentation of the data. Supply only when a chart is
		//      required and the type is not 'chart'; when the type is
		//      'chart' this property will be set to the widget attach point.
		//
		//  legendNode: String|DomNode
		//      an optional DOM node or the id of a DOM node to receive a
		//      chart legend for the data. Supply only when a legend is
		//      required and the type is not 'legend'; when the type is
		//      'legend' this property will be set to the widget attach point.
		//
		//  gridNode: String|DomNode
		//      an optional DOM node or the id of a DOM node to receive a
		//      grid presentation of the data. Supply only when a grid is
		//      required and the type is not 'grid'; when the type is
		//      'grid' this property will be set to the widget attach point.
		//
		//  titleNode: String|DomNode
		//      an optional DOM node or the id of a DOM node to receive a
		//      title for the data. Supply only when a title is
		//      required and the type is not 'title'; when the type is
		//      'title' this property will be set to the widget attach point.
		//
		//  footerNode: String|DomNode
		//      an optional DOM node or the id of a DOM node to receive a
		//      footer presentation of the data. Supply only when a footer is
		//      required and the type is not 'footer'; when the type is
		//      'footer' this property will be set to the widget attach point.
		//
		//  chartWidget: Object
		//      the chart widget, if any
		//
		//  legendWidget: Object
		//      the legend widget, if any
		//
		//  gridWidget: Object
		//      the grid widget, if any
		
		constructor: function(node, args){
			// summary:
			//		Set up properties and initialize.
			//
			//	arguments:
			//		node: DomNode
			//			The node to attach the data presentation to.
			//		kwArgs:	Object
			//			store: Object
			//				optional data store (see above)
			//			url: Object
			//				optional URL to fetch data from (see above)
			
			// apply arguments directly
			dojo.mixin(this, args);

			// store our DOM attach point
			this.domNode = dojo.byId(node);
			
			// also apply the DOM attach point as the node for the presentation type
			this[this.type + "Node"] = this.domNode;
			
			// resolve any the nodes that were supplied as ids
			this.chartNode = dojo.byId(this.chartNode);
			this.legendNode = dojo.byId(this.legendNode);
			this.gridNode = dojo.byId(this.gridNode);
			this.titleNode = dojo.byId(this.titleNode);
			this.footerNode = dojo.byId(this.footerNode);
			
			if(this.url){
				this.setURL(null, this.refresh);
			}
			else{
				if(this.data){
					this.setData(null, this.refresh);
				}
				else{
					this.setStore();
				}
			}
		},
		
		setURL: function(/*String?*/url, /*Number?*/refresh){
			// summary:
			//      Sets the URL to fetch data from, and an optional
			//      refresh interval in milliseconds (0=no refresh)
			if(refresh && this.refreshInterval){
				// cancel any existing refresh if a new interval is supplied
				clearInterval(this.refreshInterval);
				this.refreshInterval = undefined;
			}
			
			this.url = url || this.url;
			this.refresh = refresh || this.refresh;
			
			var me = this;
			
			dojo.xhrGet({
				url: this.url,
				handleAs: 'json',
				load: function(response, ioArgs){
					me.setData(response);
				},
				error: function(xhr, ioArgs){
					log("oops");
				}
			});
			
			if(refresh && (this.refresh > 0)){
				this.refreshInterval = setInterval(function(){
					me.setURL();
				}, this.refresh);
			}
		},
		
		setData: function(/*Object?*/data, /*Number?*/refresh){
			// summary:
			//      Sets the data to be presented, and an optional
			//      refresh interval in milliseconds (0=no refresh)
			if(refresh && this.refreshInterval){
				// cancel any existing refresh if a new interval is supplied
				clearInterval(this.refreshInterval);
				this.refreshInterval = undefined;
			}
			
			this.data = data || this.data;
			this.refresh = refresh || this.refresh;
			
			// TODO if no 'series' property was provided, build one intelligently here
			// (until that is done, a 'series' property must be supplied)
			
			var _series = (typeof this.series == 'function') ? this.series(this.data) : this.series;

			var datasets = [];
			var series_data = [];
			var series_name = [];
			var series_chart = [];
			var series_charttype = [];
			var series_grid = [];
			var series_gridformatter = [];
			var maxlen = 0;
			
			// identify the dataset arrays in which series values can be found
			for(var ser = 0; ser < _series.length; ser++){
				datasets[ser] = getSubfield(this.data, _series[ser].datapoints);
				if(datasets[ser] && (datasets[ser].length > maxlen)){
					maxlen = datasets[ser].length;
				}
				
				series_data[ser] = [];
				// name can be specified in series structure, or by field in series structure, otherwise use a default
				series_name[ser] = _series[ser].name || (_series[ser].namefield ? getSubfield(this.data, _series[ser].namefield) : null) || ("series " + ser);
				series_chart[ser] = (_series[ser].chart !== false);
				series_charttype[ser] = _series[ser].charttype || "bar";
				series_grid[ser] = (_series[ser].grid !== false);
				series_gridformatter[ser] = _series[ser].gridformatter;
			}
		
			// create an array of data points by sampling the series
			// and an array of series arrays by collecting the series
			// each data point has an 'index' item containing a sequence number
			// and items named "data.0", "data.1", ... containing the series samples
			// and the first data point also has items named "name.0", "name.1", ... containing the series names
			// and items named "series.0", "series.1", ... containing arrays with the complete series in
			var point, datapoint, datavalue, fdatavalue;
			var datapoints = [];
			
			for(point = 0; point < maxlen; point++){
				datapoint = { index: point };
				for(ser = 0; ser < _series.length; ser++){
					if(datasets[ser] && (datasets[ser].length > point)){
						datavalue = getSubfield(datasets[ser][point], _series[ser].field);
						
						// convert the data value to a float if possible
						fdatavalue = parseFloat(datavalue);						
						if(!isNaN(fdatavalue)){
							datavalue = fdatavalue;
						}
						
						datapoint["data." + ser] = datavalue;
						series_data[ser].push(datavalue);
					}
				}
				datapoints.push(datapoint);
			}

			if(maxlen <= 0){
				datapoints.push({index: 0});
			}
		
			// now build a prepared store from the data points we've constructed
			var store = new dojo.data.ItemFileWriteStore({ data: { identifier: 'index', items: datapoints }});
			if(this.data.title){
				store.title = this.data.title;
			}
			if(this.data.footer){
				store.footer = this.data.footer;
			}
			
			store.series_data = series_data;
			store.series_name = series_name; 
			store.series_chart = series_chart; 
			store.series_charttype = series_charttype; 
			store.series_grid = series_grid; 
			store.series_gridformatter = series_gridformatter;
			
			this.setPreparedStore(store);			
			
			if(refresh && (this.refresh > 0)){
				var me = this;
				this.refreshInterval = setInterval(function(){
					me.setData();
				}, this.refresh);
			}
		},
	
		setStore: function(/*Object?*/store, /*String?*/query, /*Object?*/queryOptions){
			// FIXME build a prepared store properly -- this requires too tight a convention to be followed to be useful
			this.setPreparedStore(store, query, queryOptions);
		},
		
		setPreparedStore: function(/*Object?*/store, /*String?*/query, /*Object?*/queryOptions){
			// summary:
			//		Sets the store and query.
			//
			this.preparedstore = store || this.store;
			this.query = query || this.query;
			this.queryOptions = queryOptions || this.queryOptions;
			
			if(this.preparedstore){
				if(this.chartNode){
					this.chartWidget = setupChart(this.chartNode, this.chartWidget, this.chartType, this.reverse, this.labelMod, this.scheme, this.preparedstore, this.query, this,queryOptions);
				}
				if(this.legendNode){
					this.legendWidget = setupLegend(this.legendNode, this.legendWidget, this.chartWidget, this.legendVertical);
				}
				if(this.gridNode){
					this.gridWidget = setupGrid(this.gridNode, this.gridWidget, this.preparedstore, this.query, this.queryOptions);
				}
				if(this.titleNode){
					setupTitle(this.titleNode, this.preparedstore);
				}
				if(this.footerNode){
					setupFooter(this.footerNode, this.preparedstore);
				}
			}
		},
		
		getChartWidget: function(){
			// summary:
			//      Returns the chart widget (if any) created if the type
			//      is "chart" or the "chartNode" property was supplied.
			return this.chartWidget;
		},
		
		getGridWidget: function(){
			// summary:
			//      Returns the grid widget (if any) created if the type
			//      is "grid" or the "gridNode" property was supplied.
			return this.gridWidget;
		}
		
	});
		
})();
