dojo.provide("dojox.charting.widget.SelectableLegend");

dojo.require("dojox.charting.widget.Legend");
dojo.require("dijit.form.CheckBox");
dojo.require("dojox.charting.action2d.Highlight");

(function(){
	var df = dojox.lang.functional;
	
	dojo.declare("dojox.charting.widget.SelectableLegend", [dojox.charting.widget.Legend], {
		//	summary: 
		//		An enhanced chart legend supporting interactive events on data series
		
		//	theme component
		outline:			false,	//	outline of vanished data series
		transitionFill:		null,	//	fill of deselected data series 
		transitionStroke:	null,	//	stroke of deselected data series 
		
		postCreate: function(){
			this.legends = [];
			this.legendAnim = {};
			this.inherited(arguments);
		},
		refresh: function(){
			this.inherited(arguments);
			this._applyEvents();
		},
		_addLabel: function(dyn, label){
			this.inherited(arguments);
			//	create checkbox
			var labelNodes = dojo.query("td", this.legendBody);
			var currentLabelNode = labelNodes[labelNodes.length - 1];
			this.legends.push(currentLabelNode);
			var checkbox = new dijit.form.CheckBox({checked: true});
			dojo.place(checkbox.domNode, currentLabelNode, "first");
		},
		_applyEvents: function(){
			// summary: 
			//		Apply click-event on checkbox and hover-event on legend icon, 
			//		highlight data series or toggle it.
			
			dojo.forEach(this.legends, function(legend, i){
				var targetData, shapes = [], plotName, seriesName;
				if(this._isPie()){
					targetData = this.chart.stack[0];
					shapes.push(targetData.group.children[i]);
					plotName = targetData.name;
					seriesName = this.chart.series[0].name;
				}else{
					targetData = this.chart.series[i];
					shapes = targetData.group.children;
					plotName = targetData.plot;
					seriesName = targetData.name;
				}
				var originalDyn = {
					fills : df.map(shapes, "x.getFill()"),
					strokes: df.map(shapes, "x.getStroke()")
				};
				//	toggle action
				var legendCheckBox = dojo.query(".dijitCheckBox", legend)[0];
				dojo.connect(legendCheckBox, "onclick", this, function(){
					this._toggle(shapes, i, legend.vanished, originalDyn, seriesName, plotName);
					legend.vanished = !legend.vanished;
				});
				
				//	highlight action
				var legendIcon = dojo.query(".dojoxLegendIcon", legend)[0],
					iconShape = this._getFilledShape(this._surfaces[i].children);
				dojo.forEach(["onmouseenter", "onmouseleave"], function(event){
					dojo.connect(legendIcon, event, this, function(e){
						this._highlight(e, iconShape, shapes, i, legend.vanished, originalDyn, seriesName, plotName);
					});
				}, this);
			},this);
		},
		_toggle: function(shapes, index, isOff, dyn, seriesName, plotName){
			dojo.forEach(shapes, function(shape, i){
				var startFill = dyn.fills[i], 
					endFill = this._getTransitionFill(plotName),
					startStroke = dyn.strokes[i],
					endStroke = this.transitionStroke;
				if(startFill){
					if(endFill && (typeof startFill == "string" || startFill instanceof dojo.Color)){
						dojox.gfx.fx.animateFill({
							shape: shape,
							color: {
								start: isOff ? endFill : startFill,
								end: isOff ? startFill : endFill
							}
						}).play();
					}else{
						shape.setFill(isOff ? startFill : endFill);
					}
				}
				if(startStroke && !this.outline){
					shape.setStroke(isOff ? startStroke : endStroke);
				}
			}, this);
		},
		_highlight: function(e, iconShape, shapes, index, isOff, dyn, seriesName, plotName){
			if(!isOff){
				var anim = this._getAnim(plotName),
					isPie = this._isPie(),
					type = formatEventType(e.type);
				//	highlight the label icon, 
				var label = {
					shape: iconShape,
					index: isPie ? "legend" + index : "legend",
					run: {name: seriesName},
					type: type
				};
				anim.process(label);
				//	highlight the data items
				dojo.forEach(shapes, function(shape, i){
					shape.setFill(dyn.fills[i]);
					var o = {
						shape: shape,
						index: isPie ? index : i,
						run: {name: seriesName},
						type: type
					};
					anim.process(o);
				});
			}
		},
		_getAnim: function(plotName){
			if(!this.legendAnim[plotName]){
				this.legendAnim[plotName] = new dojox.charting.action2d.Highlight(this.chart, plotName);
			}
			return this.legendAnim[plotName];
		},
		_getTransitionFill: function(plotName){
			// Since series of stacked charts all start from the base line,
			// fill the "front" series with plotarea color to make it disappear .
			if(this.chart.stack[this.chart.plots[plotName]].declaredClass.indexOf("dojox.charting.plot2d.Stacked") != -1){
				return this.chart.theme.plotarea.fill;
			}
			return null;
		},
		_getFilledShape: function(shapes){
			//	summary:
			//		Get filled shape in legend icon which would be highlighted when hovered
			var i = 0;
			while(shapes[i]){
				if(shapes[i].getFill())return shapes[i];
				i++;
			}
		},
		_isPie: function(){
			return this.chart.stack[0].declaredClass == "dojox.charting.plot2d.Pie";
		}
	});
	function formatEventType(type){
		if(type == "mouseenter")return "onmouseover";
		if(type == "mouseleave")return "onmouseout";
		return "on" + type;
	}
})();
