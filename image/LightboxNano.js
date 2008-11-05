dojo.provide("dojox.image.LightboxNano");
dojo.require("dojo.fx");

(function(d){

var getViewport = function(){
	//	summary: Returns the dimensions and scroll position of the viewable area of a browser window

	var _window = d.global,
		_document = d.doc,
		w = 0,
		h = 0,
		de = _document.documentElement;
		dew = de.clientWidth,
		deh = de.clientHeight,
		scroll = d._docScroll();

	if(d.isMozilla){
		var minw = dbw, minh = dbh, maxw = dew, maxh = deh, dbw = _document.body.clientWidth, dbh = _document.body.clientHeight;
		if(dbw > dew){
			minw = dew;
			maxw = dbw;
		}
		if(dbh > deh){
			minh = deh;
			maxh = dbh;
		}
		w = (maxw > _window.innerWidth) ? minw : maxw;
		h = (maxh > _window.innerHeight) ? minh : maxh;
	}else if(_window.innerWidth){
		w = _window.innerWidth;
		h = _window.innerHeight;
	}else if(d.isIE && de && deh){
		w = dew;
		h = deh;
	}else if(d.body().clientWidth){
		w = d.body().clientWidth;
		h = d.body().clientHeight;
	}

	return { w: w, h: h, l: scroll.x, t: scroll.y }; // object
};

d.declare("dojox.image.LightboxNano", null, {
	//	summary:
	//		A simple "nano" version of the lightbox. 
	//
	//	description:
	//		Very lightweight lightbox which only displays a larger image.  There is
	//		no support for a caption or description.  The lightbox can be closed by
	//		clicking any where or pressing any key.  This widget is intended to be
	//		used on <a> and <img> tags.  Upon creation, if the domNode is <img> tag,
	//		then it is wrapped in an <a> tag, then a <div class="enlarge"> is placed
	//		inside the <a> and can be styled to display an icon that the original
	//		can be enlarged.
	//
	//	example:
	//	|	<a dojoType="dojox.image.LightboxNano" href="/path/to/largeimage.jpg"><img src="/path/to/thumbnail.jpg"></a>
	//
	//	example:
	//	|	<img dojoType="dojox.image.LightboxNano" src="/path/to/thumbnail.jpg" href="/path/to/largeimage.jpg">

	//	href: string
	//		URL to the large image to show in the lightbox.
	href: "",

	//	duration: int
	//		The delay in milliseconds of the LightboxNano open and close animation.
	duration: 500,

	//	preloadDelay: int
	//		The delay in milliseconds after the LightboxNano is created before preloading the larger image.
	preloadDelay: 5000,

	//	_node: DomNode
	//		A reference the initial DOM node.
	_node: null,

	//	_start: Object
	//		Contains the top, left, width, and height dimensions of the original image.
	_start: null,

	//	_end: Object
	//		Contains the top, left, width, and height dimensions of the lightbox image.
	_end: null,

	//	_img: DomNode
	//		A reference the lightbox image DOM node.
	_img: null,

	//	_bg: DomNode
	//		A reference to the background DOM node.
	_bg: null,

	//	_onClickEvt: Event handle
	//		An event handle for the onclick event attached to the initial DOM node.
	_onClickEvt: null,

	//	_connects: Array
	//		An array of events that exist during the lifetime of the lightbox.
	_connects: null,

	//	_loading: boolean
	//		A flag that indicates that the large image is being loaded by the browser.
	_loading: false,

	//	_loadingNode: DomNode
	//		A reference to the animated loading DOM node.
	_loadingNode: null,

	constructor: function(p, n){
		// summary: Initializes the DOM node and connect onload event
		var _this = this;

		d.mixin(_this, p);
		n = dojo.byId(n);

		if(!/a/i.test(n.tagName)){
			var a = d.doc.createElement("a");
			a.href = _this.href;
			a.className = n.className;
			n.className = "";
			d.place(a, n, "after");
			a.appendChild(n);
			n = a;
		}

		d.style(n, {
			display: "block",
			position: "relative"
		});
		d.place(_this._createDiv("dojoxEnlarge"), n);

		_this._node = n;
		d.setSelectable(n, false);
		_this._onClickEvt = d.connect(n, "onclick", _this, "_load");

		setTimeout(function(){
			(new Image()).src = _this.href;
			_this._hideLoading();
		}, _this.preloadDelay);
	},

	destroy: function(){
		// summary: Destroys the LightboxNano and it's DOM node
		var a = this._connects || [];
		a.push(this._onClickEvt);
		d.forEach(a, function(e){ d.disconnect(e); });
		d._destroyElement(this._node);
	},

	_createDiv: function(/*String*/cssClass, /*boolean*/display){
		// summary: Creates a div for the enlarge icon and loading indicator layers
		var e = d.doc.createElement("div");
		e.className = cssClass;
		d.style(e, {
			position: "absolute",
			display: display ? "" : "none"
		});
		return e; // DomNode
	},
	
	_load: function(/*Event*/e){
		// summary: Creates the large image and begins to show it
		var _this = this;

		d.stopEvent(e);

		if(!_this._loading){
			_this._loading = true;
			_this._reset();

			var n = d.query("img", _this._node)[0],
				a = d._abs(n, true),
				c = d.contentBox(n),
				b = d._getBorderExtents(n),
				i = d.doc.createElement("img"),
				ln = _this._loadingNode;

			if(ln == null){
				_this._loadingNode = ln = _this._createDiv("dojoxLoading", true)
				d.place(ln, _this._node);
				var l = d.marginBox(ln);
				d.style(ln, {
					left: parseInt((c.w - l.w) / 2) + "px",
					top: parseInt((c.h - l.h) / 2) + "px"
				});
			}

			c.x = a.x - 10 + b.l;
			c.y = a.y - 10 + b.t;
			_this._start = c;

			_this._img = i;
			_this._connects = [d.connect(i, "onload", _this, "_show")];

			d.style(i, {
				visibility: "hidden",
				cursor: "pointer",
				position: "absolute",
				top: 0,
				left: 0,
				zIndex: 9999999
			});
			d.body().appendChild(i);

			i.src = _this.href;
		}
	},

	_hideLoading: function(){
		// summary: Hides the animated loading indicator
		if(this._loadingNode){
			d.style(this._loadingNode, "display", "none");
		}
		this._loadingNode = false;
	},

	_show: function(){
		// summary: The image is now loaded, calculate size and display
		var _this = this,
			vp = getViewport(),
			w = _this._img.width,
			h = _this._img.height,
			vpw = parseInt((vp.w - 20) * 0.9),
			vph = parseInt((vp.h - 20) * 0.9),
			dd = d.doc,
			bg = dd.createElement("div"),
			ln = _this._loadingNode;

		if(_this._loadingNode){
			_this._hideLoading();
		}
		d.style(_this._img, {
			border: "10px solid #fff",
			visibility: "visible"
		});
		d.style(_this._node, "visibility", "hidden");

		_this._loading = false;

		_this._connects = _this._connects.concat([
			d.connect(dd, "onmousedown", _this, "_hide"),
			d.connect(dd, "onkeypress", _this, "_key"),
			d.connect(window, "onresize", _this, "_sizeBg")
		]);

		if(w > vpw){
			h = h * vpw / w;
			w = vpw;
		}
		if(h > vph){
			w = w * vph / h;
			h = vph;
		}

		_this._end = {
			x: (vp.w - 20 - w) / 2 + vp.l,
			y: (vp.h - 20 - h) / 2 + vp.t,
			w: w,
			h: h
		};

		d.style(bg, {
			backgroundColor: "#000",
			opacity: 0.0,
			position: "absolute",
			zIndex: 9999998
		});
		d.body().appendChild(bg);
		_this._bg = bg;
		_this._sizeBg();

		d.fx.combine([
			_this._anim(_this._img, _this._coords(_this._start, _this._end)),
			_this._anim(bg, { opacity: 0.5 })
		]).play();
	},

	_sizeBg: function(){
		// summary: Resize the background to fill the page
		var dd = d.doc.documentElement;
		d.style(this._bg, {
			top: 0,
			left: 0,
			width: dd.scrollWidth + "px",
			height: dd.scrollHeight + "px"
		});
	},

	_key: function(/*Event*/e){
		// summary: A key was pressed, so hide the lightbox
		d.stopEvent(e);
		this._hide();
	},

	_coords: function(/*Object*/s, /*Object*/e){
		// summary: Returns animation parameters with the start and end coords
		return {
			left:	{ start: s.x, end: e.x },
			top:	{ start: s.y, end: e.y },
			width:	{ start: s.w, end: e.w },
			height:	{ start: s.h, end: e.h }
		}; // object
	},

	_hide: function(){
		// summary: Closes the lightbox
		var _this = this;
		d.forEach(_this._connects, function(e){ d.disconnect(e); });
		_this._connects = [];
		d.fx.combine([
			_this._anim(_this._img, _this._coords(_this._end, _this._start), "_reset"),
			_this._anim(_this._bg, {opacity:0})
		]).play();
	},

	_reset: function(){
		// summary: Destroys the lightbox
		d.style(this._node, "visibility", "visible");
		d.forEach([this._img, this._bg], function(n){
			d._destroyElement(n);
			n = null;
		});
		this._node.focus();
	},

	_anim: function(node, args, onEnd){
		// summary: Creates the lightbox open/close and background fadein/out animations
		return d.animateProperty({
			node: node,
			duration: this.duration,
			properties: args,
			onEnd: onEnd ? d.hitch(this, onEnd) : null
		}); // object
	}
});

})(dojo);
