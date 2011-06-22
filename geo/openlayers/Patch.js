define(["dojo/_base/kernel"], function(dojo){

	dojox.geo.openlayers.Patch = {

		destroyMap : function(){
			// if unloadDestroy is null, we've already been destroyed
			if (!this.unloadDestroy) {
				return false;
			}

			// make sure panning doesn't continue after destruction
			if (this.panTween) {
				this.panTween.stop();
				this.panTween = null;
			}

			// map has been destroyed. dont do it again!
			OpenLayers.Event.stopObserving(window, 'unload', this.unloadDestroy);
			this.unloadDestroy = null;

			if (this.updateSizeDestroy) {
				OpenLayers.Event.stopObserving(window, 'resize', this.updateSizeDestroy);
			} else {
				this.events.unregister("resize", this, this.updateSize);
			}

			this.paddingForPopups = null;

			if (this.controls != null) {
				for ( var i = this.controls.length - 1; i >= 0; --i) {
					this.controls[i].destroy();
				}
				this.controls = null;
			}
			if (this.layers != null) {
				for ( var i = this.layers.length - 1; i >= 0; --i) {
					// pass 'false' to destroy so that map wont try to set a new
					// baselayer after each baselayer is removed
					this.layers[i].destroy(false);
				}
				this.layers = null;
			}
			if (this.viewPortDiv) {
				var cond = this.div == this.viewPortDiv.parentNode;
				if (cond)
					this.div.removeChild(this.viewPortDiv);
				//        else {
				//          console.log("Patched remove child " + this.div + " "
				//              + this.viewPortDiv.parentNode);
				//        }
			}
			this.viewPortDiv = null;

			if (this.eventListeners) {
				this.events.un(this.eventListeners);
				this.eventListeners = null;
			}
			this.events.destroy();
			this.events = null;

		},

		removeLayerMap : function(layer, setNewBaseLayer){
			if (setNewBaseLayer == null) {
				setNewBaseLayer = true;
			}

			var cond;
			if (layer.isFixed) {
				cond = this.viewPortDiv == layer.div.parentNode;
				if (cond)
					this.viewPortDiv.removeChild(layer.div);
			} else {
				cond = this.layerContainerDiv == layer.div.parentNode;
				if (cond)
					this.layerContainerDiv.removeChild(layer.div);
				//        else {
				//          console.log("remove child " + this.layerContainerDiv + " " + layer.div.parentNode);
				//        }
			}
			OpenLayers.Util.removeItem(this.layers, layer);
			layer.removeMap(this);
			layer.map = null;

			// if we removed the base layer, need to set a new one
			if (this.baseLayer == layer) {
				this.baseLayer = null;
				if (setNewBaseLayer) {
					for ( var i = 0, len = this.layers.length; i < len; i++) {
						var iLayer = this.layers[i];
						if (iLayer.isBaseLayer || this.allOverlays) {
							this.setBaseLayer(iLayer);
							break;
						}
					}
				}
			}

			this.resetLayersZIndex();

			this.events.triggerEvent("removelayer", {
				layer : layer
			});
		},

		controlPanzoomRemoveButton : function(btn){
			OpenLayers.Event.stopObservingElement(btn);
			btn.map = null;
			btn.getSlideFactor = null;
			var cond = this.div == btn.parentNode;
			if (cond)
				this.div.removeChild(btn);
			//      else
			//        console.log("Patched removebutton " + this.div + " " + btn.parentNode);
			OpenLayers.Util.removeItem(this.buttons, btn);
		},

		layerGetResolution : function(){
			console.log("My getResolution");
			if (!this.map)
				return;
			var zoom = this.map.getZoom();
			return this.getResolutionForZoom(zoom);
		},

		patchOpenLayers : function(){

			if (dojo.isIE)
				dojo.extend(OpenLayers.Map, {
					removeLayer : this.removeLayerMap,
					destroy : this.destroyMap
				});
			if (dojo.isIE)
				dojo.extend(OpenLayers.Control.PanZoom, {
					_removeButton : this.controlPanzoomRemoveButton
				});
			dojo.extend(OpenLayers.Layer, {
				getResolution : this.layerGetResolution
			});

		}
	};
});
