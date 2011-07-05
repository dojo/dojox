define(["dojo/_base/kernel",
				"dojo/_base/declare",
				"dojo/date",
				"dojox/geo/openlayers/tests/sun/Sun",
				"dojox/geo/openlayers/widget/Map",
				"dojox/timing/_base",
				"dojox/geo/openlayers/GfxLayer",
				"dojox/geo/openlayers/GeometryFeature",
				"dojox/geo/openlayers/LineString",
				"dojox/geo/openlayers/Point",
				"dojox/geo/openlayers/JsonImport",
				"dijit/Tooltip"], function(dojo, declare){

	return dojo.declare("dojox.geo.openlayers.tests.sun.SunDemo", null, {
		now : true,

		constructor : function(div){

			var options = {
				name : "TheMap",
				touchHandler : true
			};

			var map = new dojox.geo.openlayers.widget.Map(options);
			dojo.place(map.domNode, div);
			map.startup();
			map.map.fitTo([-160, 70, 160, -70]);
			this.map = map;

			this.sun = new dojox.geo.openlayers.tests.sun.Sun();
			var layer = new dojox.geo.openlayers.GfxLayer();
			this.layer = layer;
			this.map.map.addLayer(layer);

			this.updateFeatures();

		},

		updateFeatures : function(){
			var l = this.layer;
			l.removeFeature(l.getFeatures());
			var f = this.twilightZone({
				x1 : -180,
				y1 : 85,
				x2 : 180,
				y2 : -85
			});
			l.addFeature(f);

			f = this.createStar();
			l.addFeature(f);

			f = this.createSun();
			l.addFeature(f);

			l.redraw();
		},

		getHour : function(date){
			if (!date)
				date = this.sun.getDate();
			return date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600;
		},

		getDay : function(date){
			if (!date)
				date = this.sun.getDate();
			var start = new Date(date.getFullYear(), 0, 1);
			var oneDay = 1000 * 60 * 60 * 24;
			var day = Math.floor((date.getTime() - start.getTime()) / oneDay);
			return day;
		},

		setDay : function(day){
			var now = this.sun.getDate();
			var year = now.getFullYear();
			var hours = now.getHours();
			var minutes = now.getMinutes();
			var seconds = now.getSeconds();
			var milliSeconds = now.getMilliseconds();
			var start = new Date(year, 0, 1, hours, minutes, seconds, milliSeconds);
			start = dojo.date.add(start, "day", day);
			this.setDate(start);
		},

		setTime : function(t){
			var date = this.sun.getDate();

			var year = date.getFullYear();
			var month = date.getMonth();
			var day = date.getDate();
			var hours = Math.floor(t);
			t = 60 * (t - hours);
			var minutes = Math.floor(t);
			t = 60 * (t - minutes);
			var seconds = Math.floor(t);
			date = new Date(year, month, day, hours, minutes, seconds, 0);

			this.setDate(date);
		},

		setDate : function(date){
			this.now = !date;
			this.sun.setDate(date);
			this.updateFeatures();
		},

		advance : function(ms){
			var date = this.sun.getDate();
			date = dojo.date.add(date, "millisecond", ms);
			this.setDate(date);
		},

		getTZone : function(){
			return this.tZone;
		},

		twilightZone : function(clip){
			var tz = this.sun.twilightZone(clip);
			var g = new dojox.geo.openlayers.LineString(tz);
			var gf = new dojox.geo.openlayers.GeometryFeature(g);
			gf.setStroke([248, 236, 56]);
			gf.setFill([252, 251, 45, 0.3]);
			this.tZone = gf;
			return gf;
		},

		makeStarShape : function(r1, r2, b){
			var TPI = Math.PI * 2;
			var di = TPI / b;
			var s = null;
			var start = Math.PI;
			var end = start + TPI;
			for ( var i = start; i < end; i += di) {
				var c1 = Math.cos(i);
				var s1 = Math.sin(i);
				var i2 = i + di / 2;
				var c2 = Math.cos(i2);
				var s2 = Math.sin(i2);
				if (s == null) {
					s = "M" + (s1 * r1).toFixed(2) + "," + (c1 * r1).toFixed(2) + " ";
				} else {
					s += "L" + (s1 * r1).toFixed(2) + "," + (c1 * r1).toFixed(2) + " ";
				}
				s += "L" + (s2 * r2).toFixed(2) + "," + (c2 * r2).toFixed(2) + " ";
			}
			s += "z";
			return s;
		},

		createStar : function(){
			var s = this.sun.sun();
			var geom = new dojox.geo.openlayers.Point(s);
			var gf = new dojox.geo.openlayers.GeometryFeature(geom);

			gf.createShape = dojo.hitch(this, function(/* Surface */s){
				var g = s.createGroup();

				var r1 = 30;
				var r2 = 10;
				var branches = 7;
				var star = this.makeStarShape(r1, r2, branches);
				var path = s.createPath();
				path.setShape({
					path : star
				});
				path.setStroke([0, 100, 0]);
				g.add(path);
				return g;
			});
			return gf;
		},

		makeCrossShape : function(r1, r2, b){
			var TPI = Math.PI * 2;
			var di = TPI / b;
			var s = "";
			for ( var i = 0; i < TPI; i += di) {
				var c1 = Math.cos(i);
				var s1 = Math.sin(i);
				var i2 = i + Math.PI;
				var c2 = Math.cos(i2);
				var s2 = Math.sin(i2);
				s += "M" + (s1 * r1).toFixed(2) + "," + (c1 * r1).toFixed(2) + " ";
				s += "L" + (s2 * r1).toFixed(2) + "," + (c2 * r1).toFixed(2) + " ";
			}

			return s;
		},

		createSun : function(){
			var s = this.sun.sun();
			var g = new dojox.geo.openlayers.Point({
				x : s.x,
				y : s.y
			});
			var gf = new dojox.geo.openlayers.GeometryFeature(g);

			gf.setShapeProperties({
				r : 15
			});
			gf.setStroke("");
			gf.setFill({
				type : "radial",
				r : 15,
				colors : [{
					offset : 0,
					color : [248, 236, 100]
				}, {
					offset : 1,
					color : [255, 255, 255, 0.4]
				}]
			});

			return gf;
		},

		_timer : null,

		startTimer : function(checked, time){
			var t = this._timer;
			if (!this._timer) {
				if (!time)
					time = 1000;

				t = this._timer = new dojox.timing.Timer(time);
				t.onTick = dojo.hitch(this, function(){
					if (this.now)
						this.setDate();
					else
						this.advance(time);
				});
				t.onStart = function(){

				};
				t.onStop = function(){

				};
			}
			if (checked)
				t.start();
			else
				t.stop();
		}

	});

});
