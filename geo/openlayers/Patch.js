define(["dojo/_base/kernel", "dojox/gfx", "dojox/gfx/shape"], function(dojo){

	dojox.geo.openlayers.Patch = {

		patchMethod : function(/*Object*/type, /*String*/method, /*Function*/execBefore, /*Function*/
		execAfter){
			//	summary:
			//		Patches the specified method of the given type so that the 'execBefore' (resp. 'execAfter') function is 
			//		called before (resp. after) invoking the legacy implementation.
			//	description:
			//		The execBefore function is invoked with the following parameter:
			//		execBefore(method, arguments) where 'method' is the patched method name and 'arguments' the arguments received
			//		by the legacy implementation.
			//		The execAfter function is invoked with the following parameter:
			//		execBefore(method, returnValue, arguments) where 'method' is the patched method name, 'returnValue' the value
			//		returned by the legacy implementation and 'arguments' the arguments received by the legacy implementation.
			//	type: Object: the type to patch.
			//	method: String: the method name.
			//	execBefore: Function: the function to execute before the legacy implementation. 
			//	execAfter: Function: the function to execute after the legacy implementation.
			//	tags:
			//		private
			var old = type.prototype[method];
			type.prototype[method] = function(){
				var callee = method;
				if (execBefore)
					execBefore.call(this, callee, arguments);
				var ret = old.apply(this, arguments);
				if (execAfter)
					ret = execAfter.call(this, callee, ret, arguments) || ret;
				return ret;
			};
		},

		patchGFX : function(){

			var vmlFixRawNodePath = function(){
				if (!this.rawNode.path)
					this.rawNode.path = {};
			};

			var vmlFixFillColors = function() {
				if(this.rawNode.fill && !this.rawNode.fill.colors)
					this.rawNode.fill.colors = {};
			};
			
			if (dojo.isIE <= 8) {
				
				dojox.geo.openlayers.Patch.patchMethod(dojox.gfx.Line, "setShape", vmlFixRawNodePath, null);
				dojox.geo.openlayers.Patch.patchMethod(dojox.gfx.Polyline, "setShape", vmlFixRawNodePath, null);
				dojox.geo.openlayers.Patch.patchMethod(dojox.gfx.Path, "setShape", vmlFixRawNodePath, null);
				
				dojox.geo.openlayers.Patch.patchMethod(dojox.gfx.shape.Shape, "setFill", vmlFixFillColors, null);
			}
		}
/*		,
		OpenLayersMapRemoveLayer : function() {
		},
		OpenLayersMapDestroyMap : function() {
		},
		OpenLayersControlPanZoom_removeButton : function() {
		},
		OpenLayersLayerGetResolution : function() {
		},
		patchOpenLayers : function() {
		if (dojo.isIE)
				dojo.extend(OpenLayers.Map, {
					removeLayer : this.OpenLayersMapRemoveLayer,
					destroy : this.OpenLayersMapDestroyMap
				});
			if (dojo.isIE)
				dojo.extend(OpenLayers.Control.PanZoom, {
					_removeButton : this.OpenLayersControlPanZoom_removeButton
				});
			dojo.extend(OpenLayers.Layer, {
				getResolution : this.OpenLayersLayerGetResolution
			});
		}
*/		
	};
});
