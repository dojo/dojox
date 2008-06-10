dojo.provide("dojox.charting.widget.Legend");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");

dojo.require("dojox.lang.functional.array");
dojo.require("dojox.lang.functional.fold");

dojo.declare("dojox.charting.widget.Legend", [dijit._Widget, dijit._Templated], {
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
	
	templateString: "<table dojoAttachPoint='legendNode' class='dojoxLegendNode'><tbody dojoAttachPoint='legendBody'></tbody></table>",
	
	legendNode: null,
	legendBody: null,
	
	postCreate: function(){
		var s, df = dojox.lang.functional;
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
		
		if(this.horizontal){
			dojo.addClass(this.legendNode, "dojoxLegendHorizontal");
			// make a container <tr>
			this._tr = dojo.doc.createElement("tr");
			this.legendBody.appendChild(this._tr);
		}
		
		if(s.length == 1 && s[0].chart.stack[0].declaredClass == "dojox.charting.plot2d.Pie"){
			var t = s[0].chart.stack[0];
			if(typeof s[0].data[0] == "number"){
				var slices = df.map(s[0].data, "/ this", df.foldl1(s[0].data, "+"));
				dojo.forEach(slices, function(x, i){
					this._addLabel(t.dyn[i], t._getLabel(x * 100) + "%");
				}, this);
			}else{
				dojo.forEach(s[0].data, function(x, i){
					this._addLabel(t.dyn[i], x.legend || x.text || x.y);
				}, this);
			}
		}else{
			dojo.forEach(s, function(x){
				this._addLabel(x.dyn, x.legend || x.name);
			}, this);
		}	
	},
	_addLabel: function(dyn, label){
		// create necessary elements
		var icon = dojo.doc.createElement("td"),
			text = dojo.doc.createElement("td"),
			div  = dojo.doc.createElement("div");
		dojo.addClass(icon, "dojoxLegendIcon");
		dojo.addClass(text, "dojoxLegendText");
		div.style.width  = "20px";
		div.style.height = "20px";
		icon.appendChild(div);
		
		// create a skeleton
		if(this._tr){
			// horizontal
			this._tr.appendChild(icon);
			this._tr.appendChild(text);
		}else{
			// vertical
			var tr = dojo.doc.createElement("tr");
			this.legendBody.appendChild(tr);
			tr.appendChild(icon);
			tr.appendChild(text);
		}
		
		// populate the skeleton
		this._makeIcon(div, dyn);
		text.innerHTML = String(label);
	},
	_makeIcon: function(div, dyn){
		var mb = {h: 14, w: 14};
		var surface = dojox.gfx.createSurface(div, mb.w, mb.h);
		if(dyn.fill){
			// regions
			surface.createRect({x: 2, y: 2, width: mb.w - 4, height: mb.h - 4}).
				setFill(dyn.fill).setStroke(dyn.stroke);
		}else{
			// draw line
			var line = {x1: 0, y1: mb.h / 2, x2: mb.w, y2: mb.h / 2};
			if(dyn.stroke){
				surface.createLine(line).setStroke(dyn.stroke);
			}
			if(dyn.marker){
				// draw marker on top
				var c = {x: mb.w / 2, y: mb.h / 2};
				if(dyn.stroke){
					surface.createPath({path: "M" + c.x + " " + c.y + " " + dyn.marker}).
						setFill(dyn.stroke.color).setStroke(dyn.stroke);
				}else{
					surface.createPath({path: "M" + c.x + " " + c.y + " " + dyn.marker}).
						setFill(dyn.color).setStroke(dyn.color);
				}
			}
		}
	}
});
