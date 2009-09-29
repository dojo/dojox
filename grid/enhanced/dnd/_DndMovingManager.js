dojo.provide("dojox.grid.enhanced.dnd._DndMovingManager");

dojo.require("dojox.grid.enhanced.dnd._DndSelectingManager");
dojo.require("dojo.dnd.move");

dojo.declare("dojox.grid.enhanced.dnd._DndMovingManager", dojox.grid.enhanced.dnd._DndSelectingManager, {
	//summary:
	//		_DndMovingManager is used to enable grid DND moving feature
	
	//exceptRowsTo: Integer
	//		the value to which that rows, that should not be moved, with index from the -1
	exceptRowsTo: -1,
	
	//exceptColumnsTo: Integer
	//		the value to which that columns, that should not be moved, with index from the -1
	exceptColumnsTo: -1,
	
	//coverDIVs: Array
	//		the list that keep the reference to all cover DIVs for DND moving
	coverDIVs: [],
	
	//movers: Array
	//		the list that keep the reference to all dnd movers for DND moving
	movers:[],
	
	constructor: function(inGrid){
		//summary:
		//		constructor, set the exceptColumnsTo value if the indirect selection feature is enabled 
		if(this.grid.indirectSelection){
			this.exceptColumnsTo = this.grid.pluginMgr.getFixedCellNumber() - 1;
		}
		this.coverDIVs = this.movers = [];
			
		dojo.subscribe("CTRL_KEY_DOWN", dojo.hitch(this,function(publisher, keyEvent){
			if(publisher == this.grid && publisher != this){
				this.keyboardMove(keyEvent);
			}
		}));
		
		dojo.forEach(this.grid.views.views, function(view){
			//fix the jumping issue of cover div when scrolled
			dojo.connect(view.scrollboxNode, 'onscroll', dojo.hitch(this, function(){
				this.clearDrugDivs();
			}));
		}, this);		
	},
	
	getGridWidth: function(){		
		//summary:
		//		get the width of the grid
		//return: Integer
		//		the width of the grid
		var scrollBarWidth = 0;
		dojo.forEach(this.grid.views.views, function(view, index){
			scrollBarWidth+= view.getScrollbarWidth();
		});
		return (dojo.coords(this.grid.domNode).w - Number(this.grid.views.views[0].getWidth().replace("px","")) - scrollBarWidth);
	}, 
	
	isColSelected: function(inColIndex){
		//summary:
		//		whether the specified column is selected
		//inColIndex: Integer
		//		the index value of the column
		//return: Boolean
		//		whether the specified column is selected
		return this.selectedColumns[inColIndex] && inColIndex > this.exceptColumnsTo;
	},
	
	getHScrollBarHeight: function(){
		//summary:
		//		get the horizontal sroll bar height
		//return: Integer
		//		 the horizontal sroll bar height
		if(!this.scrollbarHeight){
			this.scrollbarHeight = 0;
			dojo.forEach(this.grid.views.views, function(view, index){
				if(view.scrollboxNode){
					var thisbarHeight = view.scrollboxNode.offsetHeight - view.scrollboxNode.clientHeight;
					this.scrollbarHeight = thisbarHeight > this.scrollbarHeight ? thisbarHeight : this.scrollbarHeight;
				}
			}, this);
		}
		return this.scrollbarHeight;
	},
	
	getExceptColumnOffsetWidth: function(){
		//summary:
		//		get the width of all un-movable columns
		//return: Integer
		//		the width of all un-movable columns
		var offsetWidth = 0;
		dojo.forEach(this.getHeaderNodes(), function(node, index){
			if(index <= this.exceptColumnsTo){
				var coord = dojo.coords(node);
				offsetWidth += coord.w;
			}
		}, this);
		return offsetWidth;
	},
	
	getGridCoords: function(){
		//summary:
		//		get the coords values of the grid
		//return: Object
		//		the coords values of the grid
		if(!this.gridCoords){
			this.gridCoords = new Object();
			if(!this.headerHeight){
				this.headerHeight = dojo.coords(this.getHeaderNodes()[0]).h;
			}
			this.getHScrollBarHeight();
			
			var rowBarDomNodeCoords = dojo.coords(this.grid.views.views[0].domNode);
			
			var gridDomCoords = dojo.coords(this.grid.domNode);
			this.gridCoords.h = gridDomCoords.h - this.headerHeight - this.getHScrollBarHeight() ;
			this.gridCoords.t = gridDomCoords.y;
			this.gridCoords.l = gridDomCoords.x + rowBarDomNodeCoords.w;
			this.gridCoords.w = gridDomCoords.w - rowBarDomNodeCoords.w
		}
		return this.gridCoords;
	},
	
	createAvatar: function(width, height, left, top){
		// Summury:
		//		Create a avatar div to DND
		//width:
		//		width of avatar
		//height:
		//		height of avatar
		// left:
		//		left position of avatar
		// top:
		// 		top position of avatar
		// Return:
		//		the avatar DIV node
		this.gridCoords = null;
		var getGridCoords = this.getGridCoords();
		
		var avatar = dojo.doc.createElement("DIV");
		avatar.className = "dojoxGridSelectedDIV";
		avatar.id = "grid_dnd_cover_div_" + left + "_" + top;

		avatar.style.width = width + "px";
		
		var _docScroll = dojo._docScroll();
		
		var topDelta = top < getGridCoords.t + this.headerHeight
			? getGridCoords.t + this.headerHeight - top : 0;
		var gridBottom = getGridCoords.t + getGridCoords.h + this.headerHeight;
		
		var avatarTop = 0;
		if(top < getGridCoords.t+this.headerHeight){
			avatarTop = (getGridCoords.t+this.headerHeight) ;
		}else if(top > gridBottom){
			//avatar  should not be showed
			avatarTop = 10000;
		}else{
			avatarTop = top ;
		}
	
		avatar.style.top = avatarTop + _docScroll.y + "px";
		avatar.style.left = (left + _docScroll.x) + "px";
		
		var avatarBottom = avatarTop + height - topDelta;
		if(avatarBottom > gridBottom){
			avatarBottom = gridBottom;
		}
		
		avatar.style.height = ((avatarBottom - avatarTop) >= 0 ? (avatarBottom - avatarTop) : 0) + "px";
		
		dojo.doc.body.appendChild(avatar);
		avatar.connections = [];
		avatar.connections.push(dojo.connect(avatar, "onmouseout", this, function(){
			this.clearDrugDivs();
		}));
		
		avatar.connections.push(dojo.connect(avatar, "onclick", this, "avataDivClick"));
		avatar.connections.push(dojo.connect(avatar, "keydown", this, function(e){
			this.handleESC(e, this);
		}));
		this.coverDIVs.push(avatar);
		
		return avatar;
	},
	
	handleESC: function(e, select){
		//Summury:
		//		 handle the esc down event, stop DND operation
		//e: Event
		//		the keydown event
		//select: _DndSelectingManager
		//		the reference to the instance of _DndSelectingManager
		var dk = dojo.keys;
		switch(e.keyCode){
			case dk.ESCAPE:
				try{
					this.cancelDND();
				}catch(e){
					console.debug(e);
				}
			break;
		}
	}, 
	
	cancelDND: function(){
		//Summury:
		//		Stop the DND operation
		this.cleanAll();
		this.clearDrugDivs();
		if(this.mover){
			this.mover.destroy();
		}
		this.cleanAll();
	},
	
	createCoverMover: function(width, height, left, top, type){
		//Summury:
		//		Create the mover according to the avatar, 
		//		and set the move constraint box to make it move horizontally or vertically
		
		var gridCoords = this.getGridCoords();
		var box = {box: {l: (type=="row"?left: gridCoords.l) + dojo._docScroll().x, 
						 t: (type=="col"?top: gridCoords.t) + dojo._docScroll().y, 
						 w: type=="row"?1: gridCoords.w,					// keep the moving horizontally
						 h: type=="col"?1: gridCoords.h + this.headerHeight // keep the moving vertically
						 }};
		return new dojo.dnd.move.boxConstrainedMoveable(this.createAvatar(width, height, left, top), 
		box);
	},
	
	getBorderDiv: function(){
		//summary:
		//		get the border DIV that is used identify the moving position
		//return: Object
		//		 the border DIV that is used identify the moving position
		var borderDIV = dojo.byId("borderDIV" + this.grid.id);
		if(borderDIV == null){
			borderDIV = dojo.doc.createElement("DIV");
			borderDIV.id = "borderDIV" + this.grid.id;
			borderDIV.className = "dojoxGridBorderDIV";
			dojo.doc.body.appendChild(borderDIV);
		}
		return borderDIV;
	},
	
	setBorderDiv: function(width, height, left, top){
		//summary:
		//		set the position and shape of the border DIV that is used identify the moving position
		//width: Integer
		//height: Integer
		//left: Integer
		//top: Integer
		//		the position and shape of the border DIV		
		var borderDIV = this.getBorderDiv();
		dojo.style(borderDIV, {"height" : height + "px", "top" : top + "px", "width" : width + "px", "left" : left + "px"});
		return borderDIV;
	},
	
	removeOtherMovers: function(id){
		//summary:
		//		remove other movers than the specified one
		//id: Integer
		//		the id of the specified mover
		if(!this.coverDIVs.hasRemovedOtherMovers){
			var movingDIV;
			dojo.forEach(this.coverDIVs, function(div){
				if(div.id != id){
					dojo.doc.body.removeChild(div);
				}else{
					movingDIV = div;
				}
			}, this);
			this.coverDIVs = [movingDIV];
			this.coverDIVs.hasRemovedOtherMovers = true;
		}
	},
	
	addColMovers: function(){
		// Summury:
		//		Add DND movers for column DND
		var startSetDiv = -1;
		dojo.forEach(this.selectedColumns,function(col, index){
			if(this.isColSelected(index)){
				if(startSetDiv == -1){
					startSetDiv = index;
				}
				if(this.selectedColumns[index + 1] == null){
					this.addColMover(startSetDiv, index);
					startSetDiv = -1;
				}
			}
		}, this);
	},
	
	addColMover: function(leftBorderIndex, rightBorderIndex){
		// Summury:
		//		Add DND mover for column DND
		// from: 
		//		the first column index for mover to cover
		// to:
		//		the last column index for mover to cover
		//console.debug("add mover: " + this.lock + "  l=" + leftBorderIndex);
		if(this.lock){
			//console.debug("locked");
			return;
		}
		var leftPosition = (rightPosition = 0);
		var top = null,
			headerHeight = null;
		if(dojo._isBodyLtr()){
			dojo.forEach(this.getHeaderNodes(), function(node, index){
				var coord = dojo.coords(node);
				if(index == leftBorderIndex){
					leftPosition = coord.x;
					top = coord.y + coord.h;
					headerHeight = coord.h;
				}
				if(index == rightBorderIndex){
					rightPosition = coord.x + coord.w;
				}
			});
		}else{
			dojo.forEach(this.getHeaderNodes(), function(node, index){
				var coord = dojo.coords(node);
				if(index == leftBorderIndex){
					rightPosition = coord.x + coord.w;
					headerHeight = coord.h;
				}
				if(index == rightBorderIndex){
					leftPosition = coord.x;
					top = coord.y + coord.h;
				}
			});
		}
		
		var width = rightPosition - leftPosition;
		var colHeight = 0, view = this.grid.views.views[0];
		var viewheight = Number(dojo.style(view.domNode, 'height'));
		for(r in view.rowNodes){
			colHeight += dojo.coords(view.rowNodes[r].firstChild.rows[0]).h;
		};
		var height = colHeight < viewheight ? colHeight : viewheight;
		
		var coverMover = this.createCoverMover(width, height, leftPosition, top, "col");
		this.movers.push(coverMover);
		var borderDIV = this.setBorderDiv(3, height, -1000, top + dojo._docScroll().y);
			
		dojo.connect(coverMover, "onMoveStart", dojo.hitch(this, function(mover, leftTop){
			this.mover = mover;
			this.removeOtherMovers(mover.node.id);
		}));
		dojo.connect(coverMover, "onMove", dojo.hitch(this, function(mover, leftTop){
			if(mover.node == null || mover.node.parentNode == null){
				return;
			}
			this.isMoving = true;
			this.moveColBorder(mover, leftTop, borderDIV);
		}));
		dojo.connect(coverMover, "onMoveStop", dojo.hitch(this,function(mover){
			this.isMoving = false;
			this.mover = null;
			if(this.drugDestIndex == null){
				return;
			}
			this.startMoveCols();
			this.drugDestIndex = null;
		}));
	},
	
	moveColBorder: function(mover, leftTop, borderDIV){
		//Summury:
		//		Column border identify the dnd dest position. move the border according to avatar move
		
		if(dojo._isBodyLtr()){
			leftTop.l -= dojo._docScroll().x;
			dojo.forEach(this.getHeaderNodes(), dojo.hitch(this,function(node, index){
				if(index > this.exceptColumnsTo){
					var coord = dojo.coords(node);
					if(leftTop.l >= coord.x && leftTop.l <= coord.x + coord.w){
						if(!this.selectedColumns[index] || !this.selectedColumns[index - 1]){
							borderDIV.style.left = (coord.x +  dojo._docScroll().x) + "px";
							this.drugDestIndex = index;
							this.drugBefore = true;
						}
					}else if(this.getHeaderNodes()[index + 1] == null && leftTop.l > coord.x + coord.w){
							borderDIV.style.left = (coord.x + coord.w +  dojo._docScroll().x) + "px";
							this.drugDestIndex = index;
							this.drugBefore = false;
						}
				}
			}));
		}else{
			leftTop.l -= dojo._docScroll().x;
			var avaCoord = dojo.coords(mover.node);
			dojo.forEach(this.getHeaderNodes(), dojo.hitch(this,function(node, index){
				if(index > this.exceptColumnsTo){
					var coord = dojo.coords(node);
					if(leftTop.l + avaCoord.w >= coord.x && leftTop.l + avaCoord.w <= coord.x + coord.w){
						if(!this.selectedColumns[index] || !this.selectedColumns[index - 1]){
							borderDIV.style.left = (coord.x + coord.w + dojo._docScroll().x) + "px";
							this.drugDestIndex = index;
							this.drugBefore = true;
						}
					}else if(this.getHeaderNodes()[index + 1] == null && leftTop.l + avaCoord.w < coord.x){
							borderDIV.style.left = (coord.x + dojo._docScroll().x) + "px";
							this.drugDestIndex = index;
							this.drugBefore = false;
						}
				}
			}));
		}
	},
	
	avataDivClick: function(e){
		//Summury:
		//		handle click on avatar, hide the avatar
		this.cleanAll();
		this.clearDrugDivs();
	},
	
	startMoveCols: function(){
		// Summury:
		//		start to move the selected columns to target position		
		this.changeCursorState("wait");
		this.srcIndexdelta = 0;
		deltaColAmount = 0;
		dojo.forEach(this.selectedColumns, dojo.hitch(this, function(col, index){
			if(this.isColSelected(index)){				
				if(this.drugDestIndex > index){
					index -= deltaColAmount;
				}
				deltaColAmount += 1;
				var srcViewIndex = this.grid.layout.cells[index].view.idx;
				var destViewIndex = this.grid.layout.cells[this.drugDestIndex].view.idx;
				if(index != this.drugDestIndex)
					this.grid.layout.moveColumn(srcViewIndex,destViewIndex,index,this.drugDestIndex,this.drugBefore);
				
				if(this.drugDestIndex <= index){
					this.drugDestIndex += 1;
				}				
			}
		}));
		
		var dest = this.drugDestIndex + (this.drugBefore? 0:1);
		this.clearDrugDivs();
		this.cleanAll();
		this.resetCellIdx();
		this.drugSelectionStart.colIndex = dest - deltaColAmount;
		this.drugSelectColumn(this.drugSelectionStart.colIndex +  deltaColAmount - 1);		
	},
	
	changeCursorState: function(state){
		//summary:
		//		change the cursor state
		//state: String
		//		the state that the cursor will be changed to
		dojo.forEach(this.coverDIVs, function(div){
			div.style.cursor = "wait";
		});
	},	
	
	addRowMovers: function(){
		// Summury:
		//		Add DND movers for row DND
		var startSetDiv = -1;
		dojo.forEach(this.grid.selection.selected,function(row, index){
			var rowBarView = this.grid.views.views[0];
			if(row && rowBarView.rowNodes[index]/*row bar node with 'index' must exist*/){
				if(startSetDiv == -1){
					startSetDiv = index;
				}
				if(this.grid.selection.selected[index + 1] == null || !rowBarView.rowNodes[index + 1]){
					this.addRowMover(startSetDiv, index);
					startSetDiv = -1;
				}
			}
		}, this);
	},
	
	addRowMover: function(from, to){
		// Summury:
		//		Add DND mover for row DND
		// from: 
		//		the first row index for mover to cover
		// to:
		//		the last row index for mover to cover

		// scroll bar width sum, to fix the insufficient width of borderDIV/coverDIV for 2+ views
		var scrollBarWidthSum = 0, views = this.grid.views.views;
		dojo.forEach(views, function(view, index){
			scrollBarWidthSum += view.getScrollbarWidth();
		});
		var lastScrollBarWidth = views[views.length-1].getScrollbarWidth();
		var widthDelta = !dojo._isBodyLtr() ? (dojo.isIE ? scrollBarWidthSum - lastScrollBarWidth : scrollBarWidthSum) : 0;
		
		// get the width of grid including the scroll bar width
		var gridWidth = this.getGridWidth() + scrollBarWidthSum - lastScrollBarWidth;
		
		// use rowBar as row position identifier
		var rowBarView = this.grid.views.views[0];
		var startBarNode = rowBarView.rowNodes[from],
			endBarNode = rowBarView.rowNodes[to];			
			
		// get the start and end postion of selected area
		if(!startBarNode || !endBarNode){
			return; // row not loaded
		}
		var	startCoord = dojo.coords(startBarNode);
		var	endCoord = dojo.coords(endBarNode);
		
		var coverMover = this.createCoverMover(gridWidth - this.getExceptColumnOffsetWidth(), // width
											   (endCoord.y - startCoord.y + endCoord.h), // height
												dojo._isBodyLtr() ? (startCoord.x + startCoord.w + this.getExceptColumnOffsetWidth()) : (startCoord.x - gridWidth - widthDelta),
											    startCoord.y,
												"row"); // top
		var borderDIV = this.setBorderDiv(gridWidth, 3,  // width & height
									(dojo._isBodyLtr() ? (endCoord.x + endCoord.w) : (endCoord.x - gridWidth - widthDelta)) + dojo._docScroll().x, -100); // top
			
		var avaMoveStart = dojo.connect(coverMover, "onMoveStart", dojo.hitch(this, function(mover, leftTop){
			this.mover = mover;
			this.removeOtherMovers(mover.node.id);
		}));
		
        var avaMove = dojo.connect(coverMover, "onMove", dojo.hitch(this, function(mover, leftTop){
			if(mover.node == null || mover.node.parentNode == null){
				return;
			}
            this.isMoving = true;
            this.moveRowBorder(mover, leftTop, borderDIV);
        }));
		
		var avaMoveStop = dojo.connect(coverMover, "onMoveStop", dojo.hitch(this,function(mover){
			this.isMoving = false;
			this.mover = null;
			this.grid.select.outRangeY = false;
			this.grid.select.moveOutTop = false;
			if(this.avaOnRowIndex == null){
				return;
			}			
//			console.debug(this.avaOnRowIndex+" == "+from)
			if(this.avaOnRowIndex == from){
				return;
			}
			/*fix - blank Grid page when moving rows at bottom page, this only occurs the first time Grid get loaded*/		
			this.grid.scroller.findScrollTop(this.grid.scroller.page * this.grid.scroller.rowsPerPage);
			this.startMoveRows();
			this.avaOnRowIndex = null;
			delete coverMover;
			
		}));
		
//		var avaKEY = dojo.connect(coverMover.node, "keydown",  dojo.hitch(this,function(e){
//			var dk = dojo.keys;
//			switch(e.keyCode){
//				case dk.ESCAPE:
//					try{
//						this.cleanAll();
//						this.clearDrugDivs();
//						this.mover.destroy();
//						this.cleanAll();
//					}catch(e){
//						console.debug(e);
//					}
//					break;
//			}
//		}));
	},
	
	moveRowBorder: function(mover, leftTop, borderDIV){
		//summary:
		//		move the border DIV to specified position when moving row
		//mover: Object
		//		the reference to the dnd mover
		//leftTop: Object
		//		the leftTop position of the mover
		//borderDIV:Object
		//		reference to the borderDIV
		leftTop.t -= dojo._docScroll().y;
        if(leftTop.t - dojo.coords(this.grid.domNode).y/*this.grid.domNode.offsetTop*/ - this.grid.domNode.offsetHeight > 0){
	        if(!this.grid.select.outRangeY){
	                this.grid.select.outRangeY = true;
	                this.autoMoveToNextRow();
	            }
	        }else if(leftTop.t < this.getGridCoords().t + this.headerHeight){
				 if(!this.grid.select.moveOutTop){
	                this.grid.select.moveOutTop = true;
	                this.autoMoveToPreRow();
				 }
			}else{
	            this.grid.select.outRangeY = false;
				this.grid.select.moveOutTop = false;
	            // dojo.forEach(this.getViewRowNodes(this.grid.views.views[0].rowNodes), dojo.hitch(this, function(row, index){
				for(var index in this.grid.views.views[0].rowNodes){
					index = parseInt(index);
					if(isNaN(index)){continue;} 
					var row = this.grid.views.views[0].rowNodes[index];
					if(!row){/*row not loaded*/continue;}
					var coord = dojo.coords(row);
					if(leftTop.t > coord.y && leftTop.t < coord.y + coord.h - 2){ // 2 is the buffer size of the moving to make it not that sensitive
						if(!this.grid.selection.selected[index] || !this.grid.selection.selected[index - 1]){
							this.avaOnRowIndex = index;
							borderDIV.style.top = (coord.y + dojo._docScroll().y) + "px";
						}
					}
				}
				// }));
        }
	},
	
	autoMoveToPreRow: function(){
		//summary:
		//		auto move the mover to the previous row of the current one
		if(this.grid.select.moveOutTop ){	
			if(this.grid.scroller.firstVisibleRow > 0){
				this.grid.scrollToRow(this.grid.scroller.firstVisibleRow - 1);
				this.autoMoveBorderDivPre();
				setTimeout(dojo.hitch(this, 'autoMoveToPreRow'), this.autoScrollRate);
			}
		}
	},
	
	autoMoveBorderDivPre: function(){
		//summary:
		//		auto move the border DIV to the previous row of the current one
		this.avaOnRowIndex--;
		var borderDIV = this.getBorderDiv();
		borderDIV.style.top = dojo.coords(this.grid.views.views[0].rowNodes[this.avaOnRowIndex]).y + "px";
	},
	
	autoMoveToNextRow: function(){
		//summary:
		//		auto move the mover to the next row of the current one
		if(this.grid.select.outRangeY ){			
			this.grid.scrollToRow(this.grid.scroller.firstVisibleRow + 1);
			this.autoMoveBorderDiv();
			setTimeout(dojo.hitch(this, 'autoMoveToNextRow'), this.autoScrollRate);
		}
	},
	
	autoMoveBorderDiv: function(){
		//Summury:
		//		auto move the drop indicator to the next row when avatar is moved out of the grid bottom 
		this.avaOnRowIndex++;
		var borderDIV = this.getBorderDiv();
		borderDIV.style.top = dojo.coords(this.grid.views.views[0].rowNodes[this.avaOnRowIndex]).y + "px";
	},
	
	startMoveRows: function(){
		//summary:
		//		start to move the selected rows to target position
		var startSetDiv = -1;
		var deltaRowAmount = 0;
		dojo.forEach(this.grid.selection.selected,function(row, index){
			if(row){
				if(startSetDiv == -1){
					startSetDiv = index;
				}
				if(this.grid.selection.selected[index + 1] == null){
					deltaRowAmount = this.moveRows(startSetDiv, index, deltaRowAmount);
					startSetDiv = -1;
				}
			}
		}, this);
		try{
			
			this.clearDrugDivs();
			this.cleanAll();
			this.drugSelectionStart.rowIndex = this.avaOnRowIndex - deltaRowAmount;
			this.drugSelectRow(this.drugSelectionStart.rowIndex +  deltaRowAmount - 1);
			this.publishRowMove();
		}catch(e){
			console.debug(e);
		}
	},
	
	moveRows: function(start, end, deltaRowAmount){
		//summary:
		//		move the selected rows to target position
		//start:
		//		the first row of the selected area to move
		// end:
		//		the first row of the selected area to move deltaRowAmount
		if(this.avaOnRowIndex > end){
			start -= deltaRowAmount;
			end -= deltaRowAmount;
		}
		
		var selecteAmount = end - start + 1;
		deltaRowAmount += selecteAmount;
		
		var tempArray = [];
		
		for(var i = 0; i < selecteAmount; i++){
			tempArray[i] = this.grid._by_idx[start + i];
			this.grid._by_idx[start + i] = this.grid._by_idx[start + i + selecteAmount];
		} 
		
		if( this.avaOnRowIndex  > end){
			for(i = end + 1; i < this.avaOnRowIndex - selecteAmount; i++){
				this.grid._by_idx[i] = this.grid._by_idx[i + selecteAmount];
			}
			
			var insertPoint = this.avaOnRowIndex - selecteAmount;
			for(i = insertPoint; i < this.avaOnRowIndex; i++){
				this.grid._by_idx[i] = tempArray[i - insertPoint];
			}
			
			for(i = start; i < this.avaOnRowIndex; i++){
				this.grid.updateRow(i);
			}
		}else if(this.avaOnRowIndex  < end){
			for(i = end; i > this.avaOnRowIndex + selecteAmount - 1; i--){
				this.grid._by_idx[i] = this.grid._by_idx[i - selecteAmount];
			}
			for(i = this.avaOnRowIndex; i < this.avaOnRowIndex + selecteAmount; i++){
				this.grid._by_idx[i] = tempArray[i - this.avaOnRowIndex];
			}
			for(i = this.avaOnRowIndex; i <= end; i++){
				this.grid.updateRow(i);
			}
		}
		if(this.avaOnRowIndex <= start){
			this.avaOnRowIndex += selecteAmount;
		}
		return deltaRowAmount;
	},
	
	clearDrugDivs: function(){
		//summary:
		//		remove cover DIVs for dnd moving
		if(!this.isMoving){ 
			var borderDIV = this.getBorderDiv();
	        borderDIV.style.top = -100 + "px";
			borderDIV.style.height = "0px";
			borderDIV.style.left = -100 + "px";
			
	        dojo.forEach(this.coverDIVs, function(div){
//					console.debug("del id=" + div.id);
					dojo.forEach(div.connections, function(connection){
						dojo.disconnect(connection);
					});
	                dojo.doc.body.removeChild(div);
					delete div;
	        }, this);
	        this.coverDIVs = [];
		}
	},	
	
	setDrugCoverDivs: function(inColIndex, inRowIndex){
		// Summury:
		//		set the cover divs for DND
		if(!this.isMoving){
			if(this.isColSelected(inColIndex)){
				this.addColMovers();
			}else if( this.grid.selection.selected[inRowIndex]){
				this.addRowMovers();
			}else{
				this.clearDrugDivs();
			}
		}
	},
	
	resetCellIdx: function(){
		// Summury:
		//			reset the 'idx' attributes of cells' DOM node and structures
		var lastMax = 0;
		var thisMax = -1;
		dojo.forEach(this.grid.views.views, function(view, index){
			if(index == 0){
				return;
			}
			if(view.structure.cells && view.structure.cells[0]){
				dojo.forEach(view.structure.cells[0], function(cell, index){
					var marks = cell.markup[2].split(" ");
					var idx = lastMax + index;
					marks[1] = "idx=\"" + idx + "\"";
					cell.markup[2] = marks.join(" ");
				});
			}
			for(i in view.rowNodes){
				if(!view.rowNodes[i]){ return;/* row not loaded */}
				dojo.forEach(view.rowNodes[i].firstChild.rows[0].cells, function(cell, cellIndex){
					if(cell && cell.attributes ){
						if(cellIndex + lastMax > thisMax){
							thisMax = cellIndex + lastMax;
						}
						var idx = document.createAttribute("idx");
						idx.value = cellIndex + lastMax;
						cell.attributes.setNamedItem(idx);
					}
				});
			}
			lastMax = thisMax + 1;
		});
	},
	
	publishRowMove: function(){
		//summary:
		//		publish a topic to notify the row movement
		dojo.publish(this.grid.rowMovedTopic, [this]);
	},
	
	keyboardMove: function(keyEvent){
		//summary:
		//		handle keyboard dnd
		var inColSelection = this.selectedColumns.length > 0;
		var inRowSelection = dojo.hitch(this.grid.selection, dojox.grid.Selection.prototype['getFirstSelected'])() >= 0;
		var i, colAmount, dk = dojo.keys, keyCode = keyEvent.keyCode;
		if(!dojo._isBodyLtr()){
			keyCode = (keyEvent.keyCode == dk.LEFT_ARROW) ? dk.RIGHT_ARROW : (keyEvent.keyCode == dk.RIGHT_ARROW ? dk.LEFT_ARROW : keyCode);
		}
		switch(keyCode){
			case dk.LEFT_ARROW:
				if(!inColSelection){return;}
				colAmount = this.getHeaderNodes().length;
				for(i = 0; i < colAmount; i++){
					if(this.isColSelected(i)){
						this.drugDestIndex = i - 1;
						this.drugBefore = true;
						break;
					}
				}
				var minBoundary = this.grid.indirectSelection ? 1 : 0;
				(this.drugDestIndex >= minBoundary) ? this.startMoveCols() : (this.drugDestIndex = minBoundary);
			break;
			case dk.RIGHT_ARROW:
				if(!inColSelection){return;}
				colAmount = this.getHeaderNodes().length;
				this.drugBefore = true;
				for(i = 0; i < colAmount; i++){
					if(this.isColSelected(i) && !this.isColSelected(i + 1)){
						this.drugDestIndex = i + 2;
						if(this.drugDestIndex == colAmount){
							this.drugDestIndex--;
							this.drugBefore = false;
						}
						break;
					}
				}
				if(this.drugDestIndex < colAmount){
					this.startMoveCols();
				}
			break;
			case dk.UP_ARROW:
				if(!inRowSelection){return;}
				this.avaOnRowIndex = dojo.hitch(this.grid.selection, dojox.grid.Selection.prototype['getFirstSelected'])() - 1;
				if(this.avaOnRowIndex > -1){
					this.startMoveRows();
				}
			break;
			case dk.DOWN_ARROW:
				if(!inRowSelection){return;}
				for(i = 0; i < this.grid.rowCount; i++){
					if(this.grid.selection.selected[i] && !this.grid.selection.selected[i + 1]){
						this.avaOnRowIndex = i + 2;
						break;
					}
				}
				if(this.avaOnRowIndex <= this.grid.rowCount){
					this.startMoveRows();
				}
			break;
		}
	}
});
