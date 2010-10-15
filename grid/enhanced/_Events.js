dojo.provide("dojox.grid.enhanced._Events");

dojo.declare("dojox.grid.enhanced._Events", null, {
	// summary:
	//		Overwrite some default events of DataGrid
	//		
	// description: 
	//		Methods are copied or replaced for overwriting, this might be refined once 
	//		an overall plugin architecture is set up for DataGrid.

	//_events: Object
	//		Method map cached from dojox.grid._Events().
	_events: null,

	//headerCellActiveClass: String
	// 		css class to apply to grid header cells when activated(mouse down)
	headerCellActiveClass: 'dojoxGridHeaderActive',
	
	//cellActiveClass: String
	// 		css class to apply to grid content cells when activated(mouse down)
	cellActiveClass: 'dojoxGridCellActive',
	
	//rowActiveClass: String
	// 		css class to apply to grid rows when activated(mouse down)
	rowActiveClass: 'dojoxGridRowActive',		

	//selectRegionHoverClass: String
	// 		css class to apply to select regions in header cells when mouse over
	selectRegionHoverClass: 'dojoxGridSelectRegionHover',	

	constructor: function(inGrid){
		//get the default Grid events
		this._events = new dojox.grid._Events();
		//for methods that won't be overwritten, copy them to "this" scope
		for(p in this._events){
			if(!this[p]){
				this.p = this._events.p;
			}
		}
		//mixin "this" to Grid
		inGrid.mixin(inGrid, this);
	},

	dokeyup: function(e){
		// summary:
		// 		Grid key up event handler.
		// e: Event
		//		Un-decorated event object
		this.focus.keyup(e);
	},
	
	onKeyDown: function(e){
		// summary:
		// 		Overwritten, see dojox.grid._Events.onKeyDown();
		if(e.altKey || e.metaKey){ return; }
		var executed = false;
		var dk = dojo.keys;
		switch(e.keyCode){
			case dk.TAB:
				executed = true;
				this.focus.tab(e.shiftKey ? -1:1,e);
				break;
			default:
				executed = true;
				this.focus.keydown(e);
				break;
			case dk.UP_ARROW:
			case dk.DOWN_ARROW:
				executed = true;
				this.focus.move(e.keyCode == dk.UP_ARROW ? -1 : 1, 0, e);
				break;
			case dk.LEFT_ARROW:
			case dk.RIGHT_ARROW:
				executed = true;
				var offset = (e.keyCode == dk.LEFT_ARROW) ? 1 : -1;
				if(dojo._isBodyLtr()){ offset *= -1; }
				this.focus.move(0, offset, e);
				break;
		}
		//invoke dojox.grid._Events.onKeyDown()
		!executed && (dojo.hitch(this, this._events.onKeyDown)(e));
	},
	
	onMouseUp: function(e){
		// summary:
		//		New - Event fired when mouse is up inside grid.
		// e: Event
		//		Decorated event object that contains reference to grid, cell, and rowIndex
		e.rowIndex == -1 ? this.onHeaderCellMouseUp(e) : this.onCellMouseUp(e);
	},
	
	onCellMouseOver: function(e){
		// summary:
		//		Overwritten, see dojox.grid._Events.onCellMouseOver()
		
		//invoke dojox.grid._Events.onCellMouseOver()
		dojo.hitch(this, this._events.onCellMouseOver)(e);
		//var inIndirectSelectionMode = this.pluginMgr.isFixedCell(e.cell) || this.rowSelectCell && this.rowSelectCell.inIndirectSelectionMode();
		//TODO - need to handle conflict  DnD and indirect selection
	},
	
	onCellMouseOut: function(e){
		// summary:
		//		Overwritten, see dojox.grid._Events.onCellMouseOut()
		
		//invoke dojox.grid._Events.onCellMouseOut()
		dojo.hitch(this, this._events.onCellMouseOut)(e);	
		this.doubleAffordance && e.cellNode && dojo.removeClass(e.cellNode, this.cellActiveClass);
	},
	
	onCellMouseDown: function(e){
		// summary:
		//		Overwritten, see dojox.grid._Events.onCellMouseDown()
		dojo.addClass(e.cellNode, this.cellActiveClass);
		dojo.addClass(e.rowNode, this.rowActiveClass);
	},
	
	onCellMouseUp: function(e){
		// summary:
		//		New - Event fired when mouse is up inside content cell.
		// e: Event
		//		Decorated event object that contains reference to grid, cell, and rowIndex
		dojo.removeClass(e.cellNode, this.cellActiveClass);
		dojo.removeClass(e.rowNode, this.rowActiveClass);
	},

	onCellClick: function(e){
		// summary:
		//		Overwritten, see dojox.grid._Events.onCellClick()

		//invoke dojox.grid._Events.onCellClick()
		dojo.hitch(this, this._events.onCellClick)(e);
		
		//move mouse events to the focus manager.
		this.focus.contentMouseEvent(e);//TODO
	},

	onCellDblClick: function(e){
		// summary:
		//		Overwritten, see dojox.grid._Events.onCellDblClick()
		if(this.pluginMgr.isFixedCell(e.cell)){ return; }
		this._click.length > 1 && (!this._click[0] || !this._click[1]) && (this._click[0] = this._click[1] = e);
		//invoke dojox.grid._Events.onCellDblClick()
		dojo.hitch(this, this._events.onCellDblClick)(e);
		//now focus.setFocusCell need isEditing info, so call it after that is set. 
		this.focus.setFocusCell(e.cell, e.rowIndex);
	},

	onRowClick: function(e){
		// summary:
		//		Overwritten, see dojox.grid._Events.onRowClick()
		this.edit.rowClick(e);
		!this.indirectSelection && this.selection.clickSelectEvent(e);
	},

	onRowContextMenu: function(e){
		// summary:
		//		Overwritten, see dojox.grid._Events.onRowContextMenu()
		!this.edit.isEditing() && this.menus && this.showMenu(e);
		//dojo.stopEvent(e);
	},
	
	onSelectedRegionContextMenu: function(e){
		// summary:
		//		New - Event fired when a selected region context menu is accessed via mouse right click.
		// e: Event
		//		Decorated event object which contains reference to grid and info of selected 
		//		regions(selection type - row|column, selected index - [...])
		if(this.selectedRegionMenu){
			this.selectedRegionMenu._openMyself({
				target: e.target,
				coords: "pageX" in e ? {
					x: e.pageX,
					y: e.pageY
				} : null
			});
			dojo.stopEvent(e);
		}
	},

	onHeaderCellMouseOver: function(e){
		// summary:
		//		Overwritten, see dojox.grid._Events.onHeaderCellMouseOver()
		if(e.cellNode){
			dojo.addClass(e.cellNode, this.cellOverClass);
			if(this.nestedSorting && !this._inResize(e.sourceView) && !this.pluginMgr.isFixedCell(e.cell)/* TODO - conflict? && !(this.isDndSelectEnable && this.select.isInSelectingMode("col"))*/){
				this.addHoverSortTip(e);
			}			
		}
	},

	onHeaderCellMouseOut: function(e){
		// summary:
		//		Overwritten, see dojox.grid._Events.onHeaderCellMouseOut()
		if(e.cellNode){
			dojo.removeClass(e.cellNode, this.cellOverClass);
			dojo.removeClass(e.cellNode, this.headerCellActiveClass);
			if(this.nestedSorting && !this.pluginMgr.isFixedCell(e.cell)){
				//now using the new focus manager.
				if(this.headerCellInFocus(e.cellIndex)){
					this._toggleHighlight(e.sourceView, e, true);
				}else{
					this.removeHoverSortTip(e);					
				}
			}
		}
	},
	
	onHeaderCellMouseDown: function(e){
		// summary:
		//		Overwritten, see dojox.grid._Events.onHeaderCellMouseDown()
		var node = !this.nestedSorting ? e.cellNode : this._getChoiceRegion(e.cellNode, e/*also contains choice info*/);//TODO conflict?
		node && dojo.addClass(node, this.headerCellActiveClass);
		//if(this.nestedSorting && !e.selectChoice){ return; } TODO - conflict?
	},
	
	onHeaderCellMouseUp: function(e){
		// summary:
		//		Overwritten, see dojox.grid._Events.onHeaderCellMouseUp()
		var node = !this.nestedSorting ? e.cellNode : this._getChoiceRegion(e.cellNode, e/*also contains choice info*/);
		if(node){
			dojo.removeClass(node, this.headerCellActiveClass);
			e.selectChoice && dojo.addClass(node, this.selectRegionHoverClass);
		}
	},

	onHeaderCellClick: function(e){
		// summary:
		//		Overwritten, see dojox.grid._Events.onHeaderCellClick()
		if(this.nestedSorting){
			if((e.unarySortChoice || e.nestedSortChoice) && !this._inResize(e.sourceView)){
				this.setSortIndex(e.cell.index, null, e);//nested sorting
			}else{
				//To update nestedSorting's status.
				this._onFocusSelectRegion();
			}
		}else if(!(this.indirectSelection && e.cell && e.cell.isRowSelector)){
			this.setSortIndex(e.cell.index);//single sorting
		}
		//Have to move focus to header.
		this.focus.currentArea("header");
		//invoke dojox.grid._Events.onHeaderClick()
		dojo.hitch(this, this._events.onHeaderClick)(e);
		// try to move mouse events to the focus manager.
		this.focus.headerMouseEvent(e);
	},
	
	onHeaderContextMenu: function(e){
		// summary:
		//		Overwritten, see dojox.grid._Events.onHeaderContextMenu()
		if(this.nestedSorting && this.headerMenu){
			this._toggleHighlight(e.sourceView, e, true);
		}
		//invoke dojox.grid._Events.onHeaderContextMenu()		
		dojo.hitch(this, this._events.onHeaderContextMenu)(e);
	},
	
	//TODO - make the following events more reasonalble - e.g. more accurate conditions
	//events for row selectors
	domousedown: function(e){		
		if(!e.cellNode){
			this.onRowSelectorMouseDown(e);
		}
	},
	domouseup: function(e){		
		if(!e.cellNode){
			this.onRowSelectorMouseUp(e);
		}
	},
	onRowSelectorMouseDown: function(e) {
		this.focus.focusArea("rowHeader",e);
	},
	onRowSelectorMouseUp: function(e){
		
	},
	//triggered in _View, see Selector plugin
	onMouseUpRow: function(e){
		if(e.rowIndex != -1){
			this.onRowMouseUp(e);
		}
	},
	onRowMouseUp: function(e){
		
	}
});
