dojo.provide("dojox.widget.Pager");
dojo.experimental("dojox.widget.Pager");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dojo.fx");

dojo.declare("dojox.widget.Pager", 
	[dijit._Widget, dijit._Templated], 
	{
	// summary: A Pager, displaying a list of sized nodes
	templatePath: dojo.moduleUrl("dojox.widget", "Pager/Pager.html"),
	
	iconPrevious: "",
	iconNext: "",
	iconPage: dojo.moduleUrl("dojox.widget", "Pager/images/pageInactive.png"),
	iconPageActive: dojo.moduleUrl("dojox.widget", "Pager/images/pageActive.png"),
	
	store: null, // data store for items
	
	orientation: "horizontal", // or vertical
	statusPos: "leading", // leading | trailing
	pagerPos: "center", 
	duration: 500,
	itemSpace: 2,
	resizeChildren: true,
	itemClass: "dojox.widget._PagerItem",
	itemsPage: 3, // displayed items per page
	_currentPage: 1,
	_totalPages: 0,
	
	postMixInProperties: function(){
		if(this.orientation == "horizontal"){	
			this.iconPrevious = dojo.moduleUrl("dojox.widget", "Pager/images/hPrevious.png");
			this.iconNext = dojo.moduleUrl("dojox.widget", "Pager/images/hNext.png");
			this.dirClass = "pagerHorizontal";
		}else{
			this.iconPrevious = dojo.moduleUrl("dojox.widget", "Pager/images/vPrevious.png");
			this.iconNext = dojo.moduleUrl("dojox.widget", "Pager/images/vNext.png");
			this.dirClass = "pagerVertical";
		}
	},
		
	postCreate: function(){
		this.inherited(arguments);
		//this.connect(this.domNode,"onkeypress","_handleKey");
		this.store.fetch({
			onComplete: dojo.hitch(this, "_init")
		});
		
	},
	
	_a11yStyle: function(e){
		// top level onfocus/onblur listen to set a class "pagerFocus" on some node
		// and remove it onblur
		dojo[(e.type == "focus" ? "addClass" : "removeClass")](e.target,"pagerFocus");
	},
	
	_handleKey: function(e){

		// summary: Handle keyboard navigation internally
		var dk = dojo.keys;
		var key = (e.charCode == dk.SPACE ? dk.SPACE : e.keyCode);
		switch(key){
			
			case dk.UP_ARROW:
			case dk.RIGHT_ARROW:
			case 110:
			case 78: // key "n"
				e.preventDefault();
				this._pagerNext();
				break;

			case dk.DOWN_ARROW:
			case dk.LEFT_ARROW:
			case 112: 
			case 80: // key "p"
				e.preventDefault();
				this._pagerPrevious();
				break;
			
			case dk.ENTER:
				switch(e.target){
					case this.pagerNext : this._pagerNext(); break;
					case this.pagerPrevious : this._pagerPrevious(); break;
				}
				break;
		}
	},
	
	_init: function(items) {
		this.items = items;
		this._renderPages();
		this._renderStatus();
		this._renderPager();
	},
	
	_renderPages: function(){
		if (this.orientation == "horizontal"){
			var pagerH = dojo.marginBox(this.pagerContainerPager).h;
			var statusH = dojo.marginBox(this.pagerContainerStatus).h;
			if (this.pagerPos != 'center'){
				var addonHeight = pagerH+statusH;
			}else{
				var addonHeight = statusH;
				var widthSub = this.pagerIconNext.width;
				var containerWidth = dojo.style(this.pagerContainerView, 'width');
				var newWidth = containerWidth-(2*widthSub);
				dojo.style(this.pagerContainerView, {
					width: newWidth+'px',
					marginLeft: this.pagerIconNext.width+'px',
					marginRight: this.pagerIconNext.width+'px'
				});
			}
			var totalH = dojo.style(this.pagerContainer, 'height')-addonHeight;
			dojo.style(this.pagerContainerView, 'height', totalH+'px');
			
			var itemSpace = Math.floor(dojo.style(this.pagerContainerView, 'width')/this.itemsPage);
			if (this.statusPos == 'trailing'){
				if (this.pagerPos != 'center'){
					dojo.style(this.pagerContainerView, 'marginTop', pagerH+'px');
				}
				dojo.style(this.pagerContainerView, 'marginBottom', statusH+'px');
			}else{
				dojo.style(this.pagerContainerView, 'marginTop', statusH+'px');
				if (this.pagerPos != 'center'){
					dojo.style(this.pagerContainerView, 'marginBottom', pagerH+'px');
				}
			}
			
		}else{
			var pagerW = dojo.marginBox(this.pagerContainerPager).w;
			var statusW = dojo.marginBox(this.pagerContainerStatus).w;
			var containerW = dojo.style(this.pagerContainer, 'width');
			if (this.pagerPos != 'center'){
				var addonWidth = pagerW+statusW;
			}else{
				var addonWidth = statusW;
				var heightSub = this.pagerIconNext.height;
				var containerHeight = dojo.style(this.pagerContainerView, 'height');
				var newHeight = containerHeight-(2*heightSub);
				dojo.style(this.pagerContainerView, {
										height: newHeight+'px',
										marginTop: this.pagerIconNext.height+'px',
										marginBottom: this.pagerIconNext.height+'px'});
			}
			var totalW = dojo.style(this.pagerContainer, 'width')-addonWidth;
			dojo.style(this.pagerContainerView, 'width', totalW+'px');
			
			var itemSpace = Math.floor(dojo.style(this.pagerContainerView, 'height')/this.itemsPage);
			if (this.statusPos == 'trailing'){
				if (this.pagerPos != 'center'){
					dojo.style(this.pagerContainerView, 'marginLeft', pagerW+'px');
				}
				dojo.style(this.pagerContainerView, 'marginRight', statusW+'px');
			}else{
				dojo.style(this.pagerContainerView, 'marginLeft', statusW+'px');
				if (this.pagerPos != 'center'){
					dojo.style(this.pagerContainerView, 'marginRight', pagerW+'px');
				}
			}
		}
		
		var _PagerItem = dojo.getObject(this.itemClass);
		dojo.forEach(this.items, function(item, cnt){
			var contentContainer = dojo.doc.createElement('div');
			contentContainer.innerHTML = item.content;
			
			var pagerItem = new _PagerItem({
				id: this.id + '-item-' + (cnt + 1)
			}, contentContainer);
			
			this.pagerItems.appendChild(pagerItem.domNode);
			// create correct dimensions
			if (this.orientation == 'horizontal'){
				dojo.style(pagerItem.containerNode, {	
					width: (itemSpace-this.itemSpace)+"px",
					height: dojo.style(this.pagerContainerView, "height")+"px"
				});
				var paddingLead = 'paddingLeft';
				var paddingTrail = 'paddingRight';
			}else{
				dojo.style(pagerItem.containerNode, {	
					height: (itemSpace-this.itemSpace)+"px",
					width: dojo.style(this.pagerContainerView, "width")+"px"
				});
				var paddingLead = 'paddingTop';
				var paddingTrail = 'paddingBottom';
			}
			if (this.resizeChildren){
				pagerItem.resizeChildren();
			}
			pagerItem.parseChildren();
			
			// only display amount of items as defined in itemsPage
			dojo.style(pagerItem.domNode, "position", "absolute");
			if (cnt < this.itemsPage){
				var pos = (cnt)*itemSpace;
				if (this.orientation == 'horizontal'){
					var trailingDir = 'left';
					var dir = 'top';
				}else{
					var trailingDir = 'top';
					var dir = 'left';
				}
			
				dojo.style(pagerItem.domNode, dir, "0px");
				dojo.style(pagerItem.domNode, trailingDir, pos+"px");
			}else{
				dojo.style(pagerItem.domNode, "top", "-1000px");
				dojo.style(pagerItem.domNode, "left", "-1000px");
			}
			dojo.style(pagerItem.domNode, paddingTrail, (this.itemSpace/2)+"px");
			dojo.style(pagerItem.domNode, paddingLead, (this.itemSpace/2)+"px");
			
		}, this);
	},
	
	_renderPager: function() {
		if (this.orientation == "horizontal"){
			if (this.statusPos == 'center'){
				
			}else if (this.statusPos == 'trailing'){
				dojo.style(this.pagerContainerPager, 'top', '0px');
			}else{
				dojo.style(this.pagerContainerPager, 'bottom', '0px');
			}
			dojo.style(this.pagerNext, 'right', '0px');
			dojo.style(this.pagerPrevious, 'left', '0px');
		}else{
			if (this.statusPos == 'trailing'){
				dojo.style(this.pagerContainerPager, 'left', '0px');
			}else{
				dojo.style(this.pagerContainerPager, 'right', '0px');
			}
			dojo.style(this.pagerNext, 'bottom', '0px');
			dojo.style(this.pagerPrevious, 'top', '0px');
		}
	},
	
	_renderStatus: function() {
		this._totalPages = Math.ceil(this.items.length / this.itemsPage);
		
		this.iconWidth = 0;
		this.iconHeight = 0;
		this.iconsLoaded = 0;
		this._iconConnects = [];
		
		for (var i=1; i<=this._totalPages; i++){
			var icon = new Image();
			
			var pointer = i;
			dojo.connect(icon, 'onclick', dojo.hitch(this, function(pointer) {
				this._pagerSkip(pointer);
			}, pointer));
			
			this._iconConnects[pointer] = dojo.connect(icon, 'onload', dojo.hitch(this,function(pointer){
				this.iconWidth += icon.width;
				this.iconHeight += icon.height;
				this.iconsLoaded++;

				if (this._totalPages == this.iconsLoaded){
					if (this.orientation == "horizontal"){
						if (this.statusPos == 'trailing'){
							if (this.pagerPos == 'center'){
								var containerHeight = dojo.style(this.pagerContainer, 'height');
								var statusHeight = dojo.style(this.pagerContainerStatus, 'height');
								dojo.style(this.pagerContainerPager, 'top', ((containerHeight/2)-(statusHeight/2))+'px');
							}
							dojo.style(this.pagerContainerStatus, 'bottom', '0px');
						}else{
							if (this.pagerPos == 'center'){
								var containerHeight = dojo.style(this.pagerContainer, 'height');
								var statusHeight = dojo.style(this.pagerContainerStatus, 'height');
								dojo.style(this.pagerContainerPager, 'bottom', ((containerHeight/2)-(statusHeight/2))+'px');
							}
							dojo.style(this.pagerContainerStatus, 'top', '0px');
						}
					
						var position = (dojo.style(this.pagerContainer, 'width')/2)-(this.iconWidth/2);
						dojo.style(this.pagerContainerStatus, 'paddingLeft', position+'px');
					}else{
						if (this.statusPos == 'trailing'){
							if (this.pagerPos == 'center'){
								var containerWidth = dojo.style(this.pagerContainer, 'width');
								var statusWidth = dojo.style(this.pagerContainerStatus, 'width');
								dojo.style(this.pagerContainerPager, 'left', ((containerWidth/2)-(statusWidth/2))+'px');
							}
							dojo.style(this.pagerContainerStatus, 'right', '0px');
						}else{
							if (this.pagerPos == 'center'){
								var containerWidth = dojo.style(this.pagerContainer, 'width');
								var statusWidth = dojo.style(this.pagerContainerStatus, 'width');
								dojo.style(this.pagerContainerPager, 'right', ((containerWidth/2)-(statusWidth/2))+'px');
							}
							dojo.style(this.pagerContainerStatus, 'left', '0px');
						}
						var position = (dojo.style(this.pagerContainer, 'height')/2)-(this.iconHeight/2);
						dojo.style(this.pagerContainerStatus, 'paddingTop', position+'px');
					}
				}	
				dojo.disconnect(this._iconConnects[pointer]);
			}, pointer));
			
			if (i==this._currentPage){
				icon.src=this.iconPageActive;
			}else{
				icon.src=this.iconPage;
			}
			var pointer = i;

			dojo.addClass(icon, this.orientation+'PagerIcon');
			dojo.attr(icon, 'id', this.id+'-status-'+i);
			this.pagerContainerStatus.appendChild(icon);
					
			if (this.orientation == "vertical"){
				dojo.style(icon, 'display', 'block');
			}
		}
	},
	
	_pagerSkip: function(page){
		if (this._currentPage == page){
			return;
		}else{
			// calculate whether to go left or right, take shortest way
			if (page < this._currentPage){
				var distanceP = this._currentPage-page;
				var distanceN = (this._totalPages+page)-this._currentPage;
			}else{
				var distanceP = (this._totalPages+this._currentPage)-page;
				var distanceN = page-this._currentPage;
			}
			
			if (distanceN > distanceP) {
				this._toScroll = distanceP;
				var connect = dojo.connect(this, 'onScrollEnd', dojo.hitch(this,function(){
					this._toScroll--;
					if (this._toScroll < 1) {
						dojo.disconnect(connect);
					}else{
						this._pagerPrevious();
					}
				}));
				this._pagerPrevious();
			}else{
				this._toScroll = distanceN;
				var connect = dojo.connect(this, 'onScrollEnd', dojo.hitch(this,function(){
					this._toScroll--;
					if (this._toScroll < 1) {
						dojo.disconnect(connect);
					}else{
						this._pagerNext();
					}
				}));
				this._pagerNext();
			}
		}
	},
	
	_pagerNext: function(){
		if(this._anim) return;

		/**
		 * fade slide out current items
		 * make sure that next items are ligned up nicely before sliding them in
		 */
		var _anims = [];
		for (var i=this._currentPage*this.itemsPage; i>(this._currentPage-1)*this.itemsPage; i--){
			if (!dojo.byId(this.id+'-item-'+i)) continue;
			
			var currentItem = dojo.byId(this.id+'-item-'+i);
			var marginBox = dojo.marginBox(currentItem);
			if (this.orientation == "horizontal") {
				var move = marginBox.l - (this.itemsPage * marginBox.w);
				_anims.push(dojo.fx.slideTo({node: currentItem, left: move, duration: this.duration}));
			}else{
				var move = marginBox.t - (this.itemsPage * marginBox.h);
				_anims.push(dojo.fx.slideTo({node: currentItem, top: move, duration: this.duration}));
			}

		}
		var previousPage = this._currentPage;
		if (this._currentPage == this._totalPages){
			this._currentPage = 1;
		}else{
			this._currentPage++;
		}
		
		cnt = this.itemsPage;
		for (var i=this._currentPage*this.itemsPage; i>(this._currentPage-1)*this.itemsPage; i--){
			if (dojo.byId(this.id+'-item-'+i)){
				var currentItem = dojo.byId(this.id+'-item-'+i);
				var marginBox = dojo.marginBox(currentItem);
				if (this.orientation == "horizontal") {
					newPos = (dojo.style(this.pagerContainerView, 'width')+((cnt-1)*marginBox.w))-1;
					dojo.style(currentItem, 'left', newPos+'px');
					dojo.style(currentItem, 'top', '0px');
					
					var move = newPos-(this.itemsPage*marginBox.w);
					_anims.push(dojo.fx.slideTo({node: currentItem, left: move, duration: this.duration}));
				}else{
					newPos = (dojo.style(this.pagerContainerView, 'height')+((cnt-1)*marginBox.h))-1;
					dojo.style(currentItem, 'top', newPos+'px');
					dojo.style(currentItem, 'left', '0px');
					
					var move = newPos-(this.itemsPage*marginBox.h);
					_anims.push(dojo.fx.slideTo({ node: currentItem, top: move, duration: this.duration}));
				}
			}
			cnt--;
		}
		
		this._anim = dojo.fx.combine(_anims);
		var animConnect = dojo.connect(this._anim, "onEnd", dojo.hitch(this, function(){ 
			delete this._anim; 
			this.onScrollEnd();
			dojo.disconnect(animConnect);
		}));
		this._anim.play();
		
		// set pager icons
		dojo.byId(this.id+'-status-'+previousPage).src = this.iconPage;
		dojo.byId(this.id+'-status-'+this._currentPage).src = this.iconPageActive;
	},
	
	_pagerPrevious: function(){
		if(this._anim) return;
		
		var _anims = [];
		for (var i=this._currentPage*this.itemsPage; i>(this._currentPage-1)*this.itemsPage; i--){
			if (!dojo.byId(this.id+'-item-'+i)) continue;
			
			var currentItem = dojo.byId(this.id+'-item-'+i);
			var marginBox = dojo.marginBox(currentItem);
			if (this.orientation == "horizontal") {
				var move = dojo.style(currentItem, 'left')+(this.itemsPage*marginBox.w);
				_anims.push(dojo.fx.slideTo({node: currentItem, left: move, duration: this.duration}));
			}else{
				var move = dojo.style(currentItem, 'top')+(this.itemsPage*marginBox.h);
				_anims.push(dojo.fx.slideTo({node: currentItem, top: move, duration: this.duration}));
			}
		}

		var previousPage = this._currentPage;
		if (this._currentPage == 1){
			this._currentPage = this._totalPages;
		}else{
			this._currentPage--;
		}
		
		cnt = this.itemsPage;
		var j=1;
		for (var i=this._currentPage*this.itemsPage; i>(this._currentPage-1)*this.itemsPage; i--){
			if(dojo.byId(this.id+'-item-'+i)){
				var currentItem = dojo.byId(this.id+'-item-'+i);
				var marginBox = dojo.marginBox(currentItem);
			
				if (this.orientation == "horizontal") {
					newPos = -(j * marginBox.w) + 1;
					dojo.style(currentItem, 'left', newPos+'px');
					dojo.style(currentItem, 'top', '0px');
					
					var move = ((cnt - 1) * marginBox.w);
					_anims.push(dojo.fx.slideTo({node: currentItem, left: move, duration: this.duration}));
					
					var move = newPos+(this.itemsPage * marginBox.w);
					_anims.push(dojo.fx.slideTo({node: currentItem, left: move, duration: this.duration}));
				}else{
					newPos = -((j * marginBox.h) + 1);
					dojo.style(currentItem, 'top', newPos+'px');
					dojo.style(currentItem, 'left', '0px');
					
					var move = ((cnt - 1) * marginBox.h);
					_anims.push(dojo.fx.slideTo({node: currentItem, top: move, duration: this.duration}));
				}
				
			}
			cnt--;
			j++;
		}
		
		this._anim = dojo.fx.combine(_anims);
		var animConnect = dojo.connect(this._anim, "onEnd", dojo.hitch(this, function(){ 
			delete this._anim; 
			this.onScrollEnd();
			dojo.disconnect(animConnect);
		}));
		this._anim.play();
		
		// set pager icons
		dojo.byId(this.id + '-status-' + previousPage).src = this.iconPage;
		dojo.byId(this.id + '-status-' + this._currentPage).src = this.iconPageActive;	
	},
	
	onScrollEnd: function(){
	}
});

dojo.declare("dojox.widget._PagerItem",
	[dijit._Widget, dijit._Templated], 
	{
	
	templateString: '<li class="pagerItem" dojoAttachPoint="containerNode"></li>',
	
	resizeChildren: function(){
		var box = dojo.marginBox(this.containerNode);
		dojo.style(this.containerNode.firstChild, {
			width: box.w +'px',
			height: box.h + 'px'
		});
	},
	
	parseChildren: function(){
		dojo.parser.parse(this.containerNode);
	}
});
