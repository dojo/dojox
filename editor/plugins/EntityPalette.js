dojo.provide("dojox.editor.plugins.EntityPalette");

dojo.require("dijit._Widget");
dojo.require("dijit._Templated");
dojo.require("dijit._PaletteMixin");
dojo.require("dojo.i18n");

dojo.requireLocalization("dojox.editor.plugins", "latinEntities");

dojo.experimental("dojox.editor.plugins.EntityPalette");

dojo.declare("dojox.editor.plugins.EntityPalette",
	[dijit._Widget, dijit._Templated, dijit._PaletteMixin],
	{
	// summary:
	//		A keyboard accessible HTML entity-picking widget (for inserting symbol characters)
	// description:
	//		Grid showing various entities, so the user can pick a certain entity.
	//		Can be used standalone, or as a popup.
	//
	// example:
	// |	<div dojoType="dojox.editor.plugins.EntityPalette"></div>
	//
	// example:
	// |	var picker = new dojox.editor.plugins.EntityPalette({ },srcNode);
	// |	picker.startup();

	// templateString: [protected] String
	//		The basic template used to render the palette.
	//		Should generally be over-ridden to define different classes.
	templateString: '<div class="dojoxEntityPalette">\n' +
					'	<table>\n' +
					'		<tbody>\n' +
					'			<tr>\n' +
					'				<td>\n' +
					'					<table class="dijitPaletteTable">\n' +
					'						<tbody dojoAttachPoint="gridNode"></tbody>\n' +
					'				   </table>\n' +
					'				</td>\n' +
					'			</tr>\n' +
					'			<tr>\n' +
					'				<td>\n'+
					'					<table dojoAttachPoint="previewPane" class="dojoxEntityPalettePreviewTable">\n' +
					'						<tbody>\n' +
					'							<tr>\n' +
					'								<th class="dojoxEntityPalettePreviewHeader">Preview</th>\n' +
					'								<th class="dojoxEntityPalettePreviewHeader" dojoAttachPoint="codeHeader">Code</th>\n' +
					'								<th class="dojoxEntityPalettePreviewHeader" dojoAttachPoint="entityHeader">Name</th>\n' +
					'								<th class="dojoxEntityPalettePreviewHeader">Description</th>\n' +
					'							</tr>\n' +
					'							<tr>\n' +
					'								<td class="dojoxEntityPalettePreviewDetailEntity" dojoAttachPoint="previewNode"></td>\n' +
					'								<td class="dojoxEntityPalettePreviewDetail" dojoAttachPoint="codeNode"></td>\n' +
					'								<td class="dojoxEntityPalettePreviewDetail" dojoAttachPoint="entityNode"></td>\n' +
					'								<td class="dojoxEntityPalettePreviewDetail" dojoAttachPoint="descNode"></td>\n' +
					'							</tr>\n' +
					'						</tbody>\n' +
					'					</table>\n' +
					'				</td>\n' +
					'			</tr>\n' +
					'		</tbody>\n' +
					'	</table>\n' +
					'</div>',


	baseClass: "dojoxEntityPalette",

	// showPreview: [public] Boolean
	//	  Whether the preview pane will be displayed, to show details about the selected entity.
	showPreview: true,

	// showCode: [public] boolean
	//		Show the character code for the entity.
	showCode: false,

	// showentityName: [public] boolean
	//		Show the entity name for the entity.
	showEntityName: false,

	// palette: [public] String
	//		The symbol pallete to display.  The only current one is 'latin'.
	palette: "latin",

	dyeClass: 'dojox.editor.plugins.LatinEntity',

	// domNodeClass [protected] String
	paletteClass: 'editorLatinEntityPalette',

	cellClass: "dojoxEntityPaletteCell",
	highlightClass: "dojoxEntityPaletteCellHighlight",

	postMixInProperties: function(){
		// Convert hash of entities into two-dimensional rows/columns table (array of arrays)
		var choices = dojo.i18n.getLocalization("dojox.editor.plugins", "latinEntities");
		var numChoices = 0;
		var entityKey;
		for(entityKey in choices){numChoices++;}
		var choicesPerRow = Math.floor(Math.sqrt(numChoices));
		var numRows = choicesPerRow;
		var currChoiceIdx = 0;
		var rows = [];
		var row = [];
		for(entityKey in choices){
			currChoiceIdx++;
			row.push(entityKey);
			if(currChoiceIdx % numRows === 0){
				rows.push(row);
				row = [];
			}
		}
		if(row.length > 0){
			rows.push(row);
		}
		this._palette = rows;
	},

	buildRendering: function(){
		// Instantiate the template, which makes a skeleton table which we'll insert the entities
		this.inherited(arguments);

		var i18n = dojo.i18n.getLocalization("dojox.editor.plugins", "latinEntities");

		this._preparePalette(
			this._palette,
			i18n
		);

		// Link up the event to display the description.
		var cells = dojo.query(".dojoxEntityPaletteCell", this.gridNode);
		dojo.forEach(cells, function(cellNode){
			dojo.forEach(["MouseEnter", "MouseLeave"], function(handler){
				this.connect(cellNode, "on" + handler.toLowerCase(), "_onCell" + handler);
			}, this);
		}, this);
	},

	postCreate: function(){
		this.inherited(arguments);

		// Show the code and entity name (if enabled to do so.)
		dojo.style(this.codeHeader, "display", this.showCode?"":"none");
		dojo.style(this.codeNode, "display", this.showCode?"":"none");
		dojo.style(this.entityHeader, "display", this.showEntityName?"":"none");
		dojo.style(this.entityNode, "display", this.showEntityName?"":"none");

		if(!this.showPreview){
			dojo.style(this.previewNode,"display","none");
		}
	},

	_onCellMouseEnter: function(/*Event*/ evt){ 
		this.inherited(arguments);
		this._setCurrent(evt.currentTarget);
		if(this.showPreview){
			this._displayDetails(evt.target);
		}
	},

	_onCellMouseLeave: function(/*Event*/ evt){
		// summary:
		//		Handler for onMouseLeave event on a cell. Remove highlight on the color under the mouse.
		// evt:
		//		The mouse event.
		// tags:
		//		private
		dojo.removeClass(this._currentFocus, "dojoxEntityPaletteCellHighlight");
	},

	_onCellFocus: function(/*Event*/ evt){
		// summary:
		//		Handler for onFocus of a cell.
		// description:
		//		Removes highlight of the color that just lost focus, and highlights
		//		the new color.  Also moves the tabIndex setting to the new cell.
		//		
		// evt:
		//		The focus event.
		// tags:
		//		private
		this._setCurrent(evt.currentTarget);
	},

	_setCurrent: function(/*DOMNode*/ node){
		// summary:
		//		Called when a entity is hovered or focused.
		// description:
		//		Removes highlight of the old entity, and highlights
		//		the new entity.
		// tags:
		//		protected
		if(this._currentFocus) { dojo.removeClass(this._currentFocus, "dojoxEntityPaletteCellHighlight"); }
		this.inherited(arguments);
		if(this.showPreview){
			this._displayDetails(node);
		}
		if(this._currentFocus) { dojo.addClass(this._currentFocus, "dojoxEntityPaletteCellHighlight"); }
	},

	_displayDetails: function(/*DOMNode*/ cell){
		// summary:
		//	  Display the details of the currently focused entity in the preview pane
		var dye = this._getDye(cell);
		if(dye){
			var ehtml = dye.getValue();
			var ename = dye._alias;
			this.previewNode.innerHTML=ehtml;
			this.codeNode.innerHTML="&amp;#"+parseInt(ehtml.charCodeAt(0), 10)+";";
			this.entityNode.innerHTML="&amp;"+ename+";";
			var i18n = dojo.i18n.getLocalization("dojox.editor.plugins", "latinEntities");
			this.descNode.innerHTML=i18n[ename].replace("\n", "<br>");

		}else{
			this.previewNode.innerHTML="";
			this.codeNode.innerHTML="";
			this.entityNode.innerHTML="";
			this.descNode.innerHTML="";
		}
	}
});

dojo.declare("dojox.editor.plugins.LatinEntity",
	null,
	{
		// summary:
		//		Represents a character.
		//		Initialized using an alias for the character (like cent) rather
		//		than with the character itself.

 		constructor: function(/*String*/ alias){
			// summary:
			//	 Construct JS object representing an entity (associated w/a cell
			//		in the palette)
			// value: String
			//		alias name: 'cent', 'pound' ..
			
			this._alias = alias;
		},

		getValue: function(){
			// summary:
			//   Returns HTML representing the character, like &amp;
			//
			return "&" + this._alias + ";";
		},

		fillCell: function(/*DOMNode*/ cell){
			// Deal with entities that have keys which are reserved words.
			cell.innerHTML = this.getValue();
		}
});
