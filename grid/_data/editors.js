dojo.provide("dojox.grid._data.editors");

dojo.declare("dojox.grid.editors.base", null, {
	constructor: function(inCell){
		// FIXME: ideally, an abstract controller
		this.cell = inCell;
	},
	//:private
	_valueProp: "value",
	_formatPending: false,
	//:public
	format: function(inDatum, inRowIndex){
	},
	//:protected
	needFormatNode: function(inDatum, inRowIndex){
		this._formatPending = true;
		dojox.grid.whenIdle(this, "_formatNode", inDatum, inRowIndex);
	},
	cancelFormatNode: function(){
		this._formatPending = false;
	},
	//:private
	_formatNode: function(inDatum, inRowIndex){
		if(this._formatPending){
			this._formatPending = false;
			this.formatNode(this.getNode(inRowIndex), inDatum, inRowIndex);
		}
	},
	//:protected
	getNode: function(inRowIndex){
		return (this.cell.getNode(inRowIndex) || 0).firstChild || 0;
	},
	formatNode: function(inNode, inDatum, inRowIndex){
		if(dojo.isIE){
			// IE sux bad
			dojox.grid.whenIdle(this, "focus", inRowIndex, inNode);
		}else{
			this.focus(inRowIndex, inNode);
		}
	},
	dispatchEvent: function(m, e){
		if(m in this){
			return this[m](e);
		}
	},
	//:public
	getValue: function(inRowIndex){
		return this.getNode(inRowIndex)[this._valueProp];
	},
	setValue: function(inRowIndex, inValue){
		var n = this.getNode(inRowIndex);
		if(n){
			n[this._valueProp] = inValue
		};
	},
	focus: function(inRowIndex, inNode){
		dojox.grid.focusSelectNode(inNode || this.getNode(inRowIndex));
	},
	save: function(inRowIndex){
		this.value = this.value || this.getValue(inRowIndex);
		//console.log("save", this.value, inCell.index, inRowIndex);
	},
	restore: function(inRowIndex){
		this.setValue(inRowIndex, this.value);
		//console.log("restore", this.value, inCell.index, inRowIndex);
	},
	//:protected
	_finish: function(inRowIndex){
		this.cancelFormatNode(this.cell);
	},
	//:public
	apply: function(inRowIndex){
		this.cell.applyEdit(this.getValue(inRowIndex), inRowIndex);
		this._finish(inRowIndex);
	},
	cancel: function(inRowIndex){
		this.cell.cancelEdit(inRowIndex);
		this._finish(inRowIndex);
	}
});

dojo.declare("dojox.grid.editors.input", dojox.grid.editors.base, {
	constructor: function(inCell){
		this.keyFilter = this.keyFilter || this.cell.keyFilter;
	},
	//$ optional regex for disallowing keypresses
	// TODO: explain that it operates on characters only (Steve: help Scott understand use case)
	keyFilter: null,
	format: function(inDatum, inRowIndex){
		this.needFormatNode(inDatum, inRowIndex);
		return '<input type="text" value="' + inDatum + '">';
	},
	formatNode: function(inNode, inDatum, inRowIndex){
		this.inherited(arguments);
		// FIXME: feels too specific for this interface
		this.cell.registerOnBlur(inNode, inRowIndex);
	},
	doKey: function(e){
		if(this.keyFilter){
			var key = String.fromCharCode(e.charCode);
			if(key.search(this.keyFilter) == -1){
				dojo.stopEvent(e);
			}
		}
	}
});

// options: text of each item
// values: value for each item
// returnIndex: editor returns only the index of the selected option and not the value
dojo.declare("dojox.grid.editors.select", dojox.grid.editors.input, {
	constructor: function(inCell){
		this.options = this.options || this.cell.options;
		this.values = this.values || this.cell.values || this.options;
	},
	format: function(inDatum, inRowIndex){
		this.needFormatNode(inDatum, inRowIndex);
		var h = [ '<select style="width:100%;">' ];
		for (var i=0, o, v; (o=this.options[i])&&(v=this.values[i]); i++){
			h.push("<option", (inDatum==o ? ' selected' : ''), /*' value="' + v + '"',*/ ">", o, "</option>");
		}
		h.push('</select>');
		return h.join('');
	},
	getValue: function(inRowIndex){
		var n = this.getNode(inRowIndex);
		if(n){
			var i = n.selectedIndex, o = n.options[i];
			return this.cell.returnIndex ? i : o.value || o.innerHTML;
		}
	}
});

dojo.declare("dojox.grid.editors.static", dojox.grid.editors.input, {
	"static": true,
	_formatNode: function(inDatum, inRowIndex){
		this.formatNode(this.getNode(inRowIndex), inDatum, inRowIndex);
	},
	applyStaticValue: function(inRowIndex){
		var e = this.cell.grid.edit;
		e.applyCellEdit(this.getValue(inRowIndex), this.cell, inRowIndex);
		e.start(this.cell, inRowIndex, true);
	}
});

dojo.declare("dojox.grid.editors.bool", dojox.grid.editors["static"], {
	_valueProp: "checked",
	format: function(inDatum, inRowIndex){
		return '<input type="checkbox"' + (inDatum ? ' checked="checked"' : '') + ' style="width: auto" />';
	},
	doclick: function(e){
		if(e.target.tagName == 'INPUT'){
			this.applyStaticValue(e.rowIndex);
		}
	}
});