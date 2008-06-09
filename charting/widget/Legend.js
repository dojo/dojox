dojo.provide("dojox.charting.widget.Legend");
dojo.provide("dojox.charting.widget.LegendItem");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit._Container");

dojo.declare("dojox.charting.widget.Legend", [dijit._Widget, dijit._Templated, dijit._Container], {
	// summary: A legend for a chart. A legend contains summary labels for 
	// each series of data contained in the chart.
	//
	// Set the boolean horizontal attribute to false to layout legend labels vertically.
	//
	// (Line or Scatter charts (colored lines with shape symbols) )
	// -o- Series1		-X- Series2		-v- Series3
	//
	// (Area/Bar/Pie charts (letters represent colors))
	// [a] Series1		[b] Series2		[c] Series3
	
	chartRef:   "",
	horizontal: true,
	
	templateString: "<div dojoAttachPoint='legendNode' class='dojoxLegendNode'></div>",
	
	legendNode: null,
	
	postCreate: function(){
		var s = null;
		if(!this.chart){
			if(!this.chartRef){ return; }
			this.chart = dijit.byId(this.chartRef);
			if(!this.chart){
				var node = dojo.byId(this.chartRef);
				if(node){
					this.chart = dijit.byNode(node);
				}else{
					console.log("Could not find chart instance with id: " + this.chartRef);
					return;
				}
			}
			s = this.chart.chart.series;
		}else{
			s = this.chart.series;
		}
		if(s.length == 1 && s[0].chart.stack[0].declaredClass == "dojox.charting.plot2d.Pie"){
			var t = s[0].chart.stack[0];
			dojo.forEach(
				s[0].data, 
				typeof s[0].data[0] == "number" ?
					function(x, i){
						this._addLabel(t.dyn[i], x);
					} :
					function(x, i){
						this._addLabel(t.dyn[i], x.text || x.y);
					},
				this);
		}else{
			dojo.forEach(s, function(x){
				this._addLabel(x.dyn, x.name);
			}, this);
		}	
	},
	_addLabel: function(dyn, label){
		this.addChild(new dojox.charting.widget.LegendItem({horizontal: this.horizontal, dyn: dyn, label: String(label)}));
	}
});

dojo.declare("dojox.charting.widget.LegendItem", [dijit._Widget, dijit._Templated], {
	// summary: A legend item is a summary that describes a Series
	// Ex.
	// [  ] Label
	// {Color} {Series Label}

	horizontal: true,

	templateString: "<div class='dojoxLegendItem' style='margin:2 2 2 2'>" +
		"<span dojoAttachPoint='labelIcon' style='width:20px;height:20px'></span>&nbsp;" +
		"<span dojoAttachPoint='labelText'></span>" +
		"</div>",

	labelIcon: null,
	labelText: null,
	
	postCreate: function(){
		var d = this.dyn;
		this.labelText.innerHTML = this.label;
		var mb = {h:14, w:14};
		var surface = dojox.gfx.createSurface(this.labelIcon, mb.w, mb.h);
		if (d.fill){
			// regions
			surface.createRect({x: 2, y: 2, width: mb.w - 4, height: mb.h - 4}).
				setFill(d.fill).setStroke(d.stroke);
		}else{
			// draw line
			var line = {x1: 0, y1: mb.h / 2, x2: mb.w, y2: mb.h / 2};
			if(d.stroke){
				surface.createLine(line).setStroke(d.stroke);
			}
			if(d.marker){
				// draw marker on top
				var c = {x: mb.w / 2, y: mb.h / 2};
				if(d.stroke){
					surface.createPath({path: "M" + c.x + " " + c.y + " " + d.marker}).
						setFill(d.stroke.color).setStroke(d.stroke);
				}else{
					surface.createPath({path: "M" + c.x + " " + c.y + " " + d.marker}).
						setFill(d.color).setStroke(d.color);
				}
			}
		}
		if(this.horizontal){
			this.domNode.style.display = "inline";
		}
	}
});
