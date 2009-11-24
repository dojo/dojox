dojo.provide("dojox.editor.plugins._SmileyPalette");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dojo.i18n");
dojo.requireLocalization("dojox.editor.plugins", "Smiley");

dojo.experimental("dojox.editor.plugins._SmileyPalette");
// Copied from dojox.editor.plugins.EntityPalette.  TODO: Should rebase both off dijit.ColorPalette, ideally

dojo.declare("dojox.editor.plugins._SmileyPalette",
	[dijit._Widget, dijit._Templated],
	{
	// summary:
	//		A keyboard accessible HTML entity-picking widget (for inserting symbol characters)
	// description:
	//		Grid showing various emoticons
	//		Can be used standalone, or as a popup.
	//
	// example:
	// |	<div dojoType="dojox.editor.plugins._SmileyPalette"></div>
	//
	// example:
	// |    var picker = new dojox.editor.plugins._SmileyPalette({ },srcNode);
	// |	picker.startup();

	// templateString: [protected] String
	//		The basic template used to render the palette.
	//		Should generally be over-ridden to define different classes.
	templateString: '<div class="dojoxEntityPalette">\n' +
						'<table>\n' +
							'<tbody>\n' +
								'<tr>\n' +
									'<td>\n' +
										'<table class="dojoxEntityPaletteTable"  waiRole="grid" tabIndex="${tabIndex}">\n' +
											'<tbody dojoAttachPoint="tableNode"></tbody>\n' +
										'</table>\n' +
									'</td>\n' +
								'</tr>\n' +
							'</tbody>\n' +
						'</table>\n' +
					'</div>',

	// defaultTimeout: [public] Number
	//		Number of milliseconds before a held key or button becomes typematic
	defaultTimeout: 500,

	// timeoutChangeRate: [public] Number
	//		Fraction of time used to change the typematic timer between events
	//		1.0 means that each typematic event fires at defaultTimeout intervals
	//		< 1.0 means that each typematic event fires at an increasing faster rate
	timeoutChangeRate: 0.90,
	
	// smileys: [public] String
	//		The symbol pallete to display.  The only current one is 'latin'.
	smileys: {
		emoticonSmile: ":-)",
		emoticonLaughing: "lol",
		emoticonWink: ";-)",
		emoticonGrin: ":-D",
		emoticonCool: "8-)",
		emoticonAngry: ":-@",
		emoticonHalf: ":-/",
		emoticonEyebrow: "/:)",
		emoticonFrown: ":-(",
		emoticonShy: ":-$",
		emoticonGoofy: ":-S",
		emoticonOops: ":-O",
		emoticonTongue: ":-P",
		emoticonIdea: "(i)",
		emoticonYes: "(y)",
		emoticonNo: "(n)",
		emoticonAngel: "0:-)",
		emoticonCrying: ":'("
	},

	// value: [public] String
	//		The value of the selected entity.
	value: null,

	// _currentFocus: [private] Integer
	//		Index of the currently focused entity.
	_currentFocus: 0,

	// _xDim: [protected] Integer
	//		This is the number of entity columns horizontally across.
	_xDim: null,

	// _yDim: [protected] Integer
	///		This is the number of entity rows down.
	_yDim: null,

	// tabIndex: [public] String
	//		Widget tab index.
	tabIndex: "0",

	// _created: [private] boolean
	//		Flag indicating the widget has initialized.
	_created: false,

	postCreate: function(){
		if(!this._created){
            this._created = true;
			// A name has to be given to the colorMap, this needs to be unique per Palette.
			this.domNode.style.position = "relative";
			this._cellNodes = [];
			var numChoices = 0;
			var entityKey;
			for(entityKey in this.smileys){numChoices++;}
			var choicesPerRow = Math.floor(Math.sqrt(numChoices)); 
			var numRows = choicesPerRow;
			var currChoiceIdx = 0;
			var rowNode = null;
			var cellNode;

			for(entityKey in this.smileys){
				var newRow = currChoiceIdx % numRows === 0;
				if(newRow){
					rowNode = dojo.create("tr", {
						tabIndex:"-1"//,
					});
				}

				var entityHtml = this.smileys[entityKey], //TODO: escapeHTML
					desc = dojo.i18n.getLocalization("dojox.editor.plugins", "Smiley")[entityKey];

				cellNode = dojo.create("td",{
						tabIndex: "-1",
						"class":"dojoxEntityPaletteCell"
					}, rowNode);

				var imgNode = dojo.create("img",{
						src: dojo.moduleUrl("dojox.editor.plugins", "resources/emoticons/" + entityKey + ".gif"), //this._blankGif, implement as sprites
						"class": "dojoxSmileyPaletteImg dojoxSmiley" + entityKey.charAt(0).toUpperCase() + entityKey.substring(1),
						title: desc,
						alt: desc
				}, cellNode);

				dojo.forEach(["Dijitclick", "MouseEnter", "Focus", "Blur"], function(handler){
					this.connect(cellNode, "on" + handler.toLowerCase(), "_onCell" + handler);
				}, this);

				if(newRow){dojo.place(rowNode, this.tableNode);}

				dijit.setWaiRole(cellNode, "gridcell");
				cellNode.index = this._cellNodes.length;
				this._cellNodes.push({node: cellNode, html: "<span class='" + entityKey + "'>" + this.smileys[entityKey] + "</span>"});  //TODO: escapeHTML
				currChoiceIdx++;
			}

			// We need to add in some dummy cells to fill out the remaining row (if there is any.
			var remainder = choicesPerRow - (numChoices % choicesPerRow);
			while(remainder > 0){
				cellNode = dojo.create("td",{
						innerHTML: "",
						tabIndex: "-1",
						"class": "dojoxEntityPaletteNullCell"
					}, rowNode);
				remainder--;
			}

			this._xDim = choicesPerRow;
			this._yDim = numRows;
			this.connect(this.tableNode, "onfocus", "_onTableNodeFocus");

			// Now set all events
			// The palette itself is navigated to with the tab key on the keyboard
			// Keyboard navigation within the Palette is with the arrow keys
			// Spacebar selects the color.
			// For the up key the index is changed by negative the x dimension.		
			var keyIncrementMap = {
				UP_ARROW: -this._xDim,
				// The down key the index is increase by the x dimension.	
				DOWN_ARROW: this._xDim,
				// Right and left move the index by 1.
				RIGHT_ARROW: 1,
				LEFT_ARROW: -1
			};
			for(var key in keyIncrementMap){
				this._connects.push(dijit.typematic.addKeyListener(this.domNode,
					{charOrCode:dojo.keys[key], ctrlKey:false, altKey:false, shiftKey:false},
					this,
					function(){
						var increment = keyIncrementMap[key];
						return function(count){ this._navigateByKey(increment, count); };
					}(),
					this.timeoutChangeRate, this.defaultTimeout));
			}
		}
	},

	focus: function(){
		// summary:
		//		Focus this EntityPalette.  Puts focus on the first swatch.
		this._focusFirst();
	},

	onChange: function(entity){
		// summary:
		//		Callback when a entity is selected.
		// entity: String
		//		Entity value corresponding to an html entity character.
	},

	_focusFirst: function(){
		// summary:
		//		Focus the first cell in the color picker,
		//		or the previously selected cell, if there is one
		// tags:
		//		private
		this._currentFocus = 0;
		var cellNode = this._cellNodes[this._currentFocus].node;
		setTimeout(function(){dijit.focus(cellNode);}, 25);
	},

	_onTableNodeFocus: function(evt){
		// summary:
		//		Handler for when focus goes to the EntityPalette itself.
		//		Shifts focus to the first entity or the previously selected
		//		color.
		// tags:
		//		private

		// focus bubbles on Firefox 2, so just make sure that focus has really
		// gone to the container
		if(evt.target === this.tableNode){
			this._focusFirst();
		}
	},

	_onFocus: function(){
		// summary:
		//		Handler for when the EntityPalette or a entity cell inside of it get focus
		// tags:
		//		protected

		// While focus is on the palette, set its tabIndex to -1 so that on a
		// shift-tab from a cell, the container is not in the tab order
		dojo.attr(this.tableNode, "tabIndex", "-1");
	},

	_onBlur: function(){
		// summary:
		//		Handler for when the palette and the cell inside of it lose focus
		// tags:
		//		protected

		this._removeCellHighlight(this._currentFocus);

		// when focus leaves the palette, restore its tabIndex, since it was
		// modified by _onFocus().
		dojo.attr(this.tableNode, "tabIndex", this.tabIndex);
	},

	_onCellDijitclick: function(/*Event*/ evt){
		// summary:
		//		Handler for click, enter key & space key. Selects the entity.
		// evt:
		//		The event.
		// tags:
		//		private

		var target = evt.currentTarget;
		if(this._currentFocus != target.index){
			this._currentFocus = target.index;
			setTimeout(function(){dijit.focus(target);}, 0);
		}
		this._selectEntity(target);
		dojo.stopEvent(evt);
	},

	_onCellMouseEnter: function(/*Event*/ evt){
		// summary:
		//		Handler for onMouseOver. Put focus on the entity under the mouse.
		// evt:
		//		The mouse event.
		// tags:
		//		private

		var target = evt.currentTarget;
		this._setCurrent(target);	// redundant, but needed per safari bug where onCellFocus never called
		setTimeout(function(){dijit.focus(target);}, 0);
	},

	_onCellFocus: function(/*Event*/ evt){
		// summary:
		//		Handler for onFocus of a cell. Removes highlight of
		//		the color that just lost focus, and highlights
		//		the new entity.
		// evt:
		//		The focus event.
		// tags:
		//		private

		this._setCurrent(evt.currentTarget);
	},

	_setCurrent: function(/*Node*/ node){
		// summary:
		//		Called when a entity is hovered or focused.
		// description:
		//		Removes highlight of the old entity, and highlights
		//		the new entity.
		// tags:
		//		protected
		this._removeCellHighlight(this._currentFocus);
		this._currentFocus = node.index;
		dojo.addClass(node, "dojoxEntityPaletteCellHighlight");
	},
	
	_onCellBlur: function(/*Event*/ evt){
		// summary:
		//		needed for Firefox 2 on Mac OS X
		// tags:
		//		private
		this._removeCellHighlight(this._currentFocus);
	},

	_removeCellHighlight: function(index){
		// summary:
		//		Removes the hover CSS class for the specified cell
		// tags:
		//		private
		dojo.removeClass(this._cellNodes[index].node, "dojoxEntityPaletteCellHighlight");
	},

	_selectEntity: function(selectNode){	
		// summary:
		// 		This selects an entity. It triggers the onChange event with the string representation of the selected
		//      entity.
		// area:
		//		The area node that covers the entity being selected.
		// tags:
		//		private		
		var selectNodeAssoc = dojo.filter(this._cellNodes, function(item){ return item.node == selectNode; });
		if(selectNodeAssoc.length > 0){
			this.onChange(this.value = selectNodeAssoc[0].html);
		}
	},

	_navigateByKey: function(increment, typeCount){
		// summary:
		// 	  	This is the callback for typematic.
		// 		It changes the focus and the highlighed entity.
		// increment:
		// 		How much the key is navigated.
		// typeCount:
		//		How many times typematic has fired.
		// tags:
		//		private

		// typecount == -1 means the key is released.
		if(typeCount == -1){ return; }

		var newFocusIndex = this._currentFocus + increment;
		if(newFocusIndex < this._cellNodes.length && newFocusIndex > -1)
		{
			var focusNode = this._cellNodes[newFocusIndex].node;
			focusNode.focus();
		}
	}
});
