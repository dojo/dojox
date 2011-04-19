dojo.provide('dojox.gauges.BarCircleIndicator');
dojo.require('dojox.gauges.BarGauge');

dojo.experimental("dojox.gauges.BarCircleIndicator");

dojo.declare("dojox.gauges.BarCircleIndicator", [dojox.gauges.BarLineIndicator], {
	// summary:
	//		An indicator for the BarGauge that draws a circle.
	//
	
	_getShapes: function(group){
		// summary: 
		//		Override of dojox.gauges.BarLineIndicator._getShapes
		var color = this.color ? this.color : 'black';
		var strokeColor = this.strokeColor ? this.strokeColor : color;
		var stroke = {
			color: strokeColor,
			width: 1
		};
		if (this.color.type && !this.strokeColor){
			stroke.color = this.color.colors[0].color;
		}
		var y = this._gauge.dataY + this.offset + this.length / 2;
		var v = this.value;
		if (v < this._gauge.min){
			v = this._gauge.min;
		}
		if (v > this._gauge.max){
			v = this._gauge.max;
		}
		var pos = this._gauge._getPosition(v);
		
		var shapes = [group.createCircle({
			cx: 0,
			cy: y,
			r: this.length / 2
		}).setFill(color).setStroke(stroke)];
		
		shapes[0].setTransform(dojox.gfx.matrix.translate(pos, 0));
		return shapes;
	}
});
