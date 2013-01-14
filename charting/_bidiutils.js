  define ({
		reverseMatrix: function(plot, dim, offsets){
			//summary:
			//	reverse the underlying matrix of the plots to perform the mirroring behavior.
			//plot:
			//  the plot which has the matrix to be reversed.
			//dim:
			//  the dimension (width,height) of the chart.
			//offsets:
			//  the offsets of the chart
			var shift = offsets.l - offsets.r;
			var xx = -1;
			var xy = 0;
			var yx = 0;
			var yy = 1;
			var dx = dim.width + shift;
			var dy = 0;
			if(plot.matrix){
				xx = -Math.abs(plot.matrix.xx);
				yy = plot.matrix.yy;
				xy = plot.matrix.xy;
				yx = plot.matrix.yx;
				dy = plot.matrix.xy;
			}
			plot.setTransform({xx: xx, xy: xy, yx: yx, yy: yy, dx: dx, dy: dy});
 	}
 });
