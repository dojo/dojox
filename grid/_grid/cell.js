dojo.provide("dojox.grid._grid.cell");

dojo.declare("dojox.grid.cell", null, {
	styles: '',
	constructor: function(inProps){
		dojo.mixin(this, inProps);
		if(this.editor){this.editor = new this.editor(this);}
	},
	// data source
	format: function(inRowIndex){
		var f, i=this.grid.edit.info, d=this.get ? this.get(inRowIndex) : this.value;
		if(this.editor && (this.editor.static || (i.rowIndex==inRowIndex && i.cell==this))){
			return this.editor.format(d, inRowIndex);
		}else{
			return (f = this.formatter) ? f.call(this, d, inRowIndex) : d;
		}
	},
	// utility
	getNode: function(inRowIndex){
		return this.view.getCellNode(inRowIndex, this.index);
	},
	/*
	getContentNode: function(inRowIndex) { 
		return this.getCellNode(inRowIndex);
	},
	*/
	isFlex: function(){
		var uw = this.unitWidth;
		return uw && (uw=='auto' || uw.slice(-1)=='%');
	},
	// edit support
	applyEdit: function(inValue, inRowIndex){
		this.grid.edit.applyCellEdit(inValue, this, inRowIndex);
	},
	cancelEdit: function(inRowIndex){
		this.grid.doCancelEdit(inRowIndex);
	},
	_onEditBlur: function(inRowIndex){
		if(this.grid.edit.isEditCell(inRowIndex, this.index)){
			//console.log('editor onblur', e);
			this.grid.edit.apply();
		}
	},
	registerOnBlur: function(inNode, inRowIndex){
		if(this.commitOnBlur){
			dojo.connect(inNode, "onblur", function(e){
				// hack: if editor still thinks this editor is current some ms after it blurs, assume we've focused away from grid
				setTimeout(dojo.hitch(this, "_onEditBlur", inRowIndex), 250);
			});
		}
	}
});