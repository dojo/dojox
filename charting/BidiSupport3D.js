define(["dojo/_base/lang", "dojo/dom-style", "./Chart3D","dojo/dom-attr","./_bidiutils"], 
	function(lang, domStyle, Chart3D, domAttr,utils){

	// chart mirroring start

	lang.extend(Chart3D ,{
		// summary:
		//		Add support for Chart Mirroring to dojox/charting/plot3D classes.
		
		// direction: String
		//		Mirroring support,	the main variable which is responsible for the direction of the chart.
		//
		//		Allowed values:
		//		1. "ltr"
		//		2. "rtl"
		//
		//		By default is ltr.
		direction: "",
		
		postscript: function(node, lights, camera, theme, direction){
			// summary:
			//		The keyword arguments that can be passed in a Chart constructor.
			//
			// node: Node
			//		The DOM node to construct the chart on.
			// lights:
			//		Lighting properties for the 3d scene
			// camera: Object
			//		Camera properties describing the viewing camera position.
			// theme: Object
			//		Charting theme to use for coloring chart elements.
			// direction:String
			//		the direction used to render the chart values[rtl/ltr]
			var chartDir = "ltr";
			if(domAttr.has(node, "direction")){
				chartDir = domAttr.get(node, "direction");
			}
			this.chartBaseDirection = direction ? direction : chartDir;
		},
		applyMirroring: function(plot, dim, offsets){
			// summary:
			//		apply the mirroring operation to the current chart plots.
			//
			if(this.isRightToLeft()){
				utils.reverseMatrix(plot, dim, offsets);
			}
			//force the direction of the node to be ltr to properly render the axes and the plots labels.
			domStyle.set(this.node, "direction", "ltr");
			return this;
		},
		setDir: function(/*String*/dir){
			// summary:
			//		Setter for the chartBaseDirection attribute.
			// description:
			//		Allows dynamically set the chartBaseDirection attribute, which will used to  
			//		updates the chart rendering direction.
			//	dir : the desired chart direction [rtl: for right to left ,ltr: for left to right]
			if(dir == "rtl" || dir == "ltr"){
					this.dir = dir;
				}
			return this; 
		},
		isRightToLeft: function(){
			// summary:
			//		check the Direction of the chart.
			// description:
			//		check the chartBaseDirection attribute to determine the rendering direction
			//		of the chart.
			return this.dir == "rtl";
        }
		
	}); //Chart3D extension end

	return Chart3D;
		
});
