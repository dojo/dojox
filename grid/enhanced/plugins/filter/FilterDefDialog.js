dojo.provide("dojox.grid.enhanced.plugins.filter.FilterDefDialog");

dojo.require("dijit.dijit");
dojo.require("dijit.Tooltip");
dojo.require("dijit.form.ComboBox");
dojo.require("dijit.form.Select");
dojo.require("dijit.form.TextBox");
dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.NumberTextBox");
dojo.require("dijit.form.DateTextBox");
dojo.require("dijit.form.TimeTextBox");
dojo.require("dijit.form.Button");
dojo.require("dijit.layout.AccordionContainer");
dojo.require("dijit.layout.ContentPane");
dojo.require("dojo.date.locale");
dojo.require("dojo.string");
dojo.require("dojox.grid.enhanced.plugins.filter.FilterBuilder");
dojo.require("dojox.grid.cells.dijit");
dojo.require("dojox.html.ellipsis");

(function(){
var fns = dojox.grid.enhanced.plugins.filter,
	_parseDecimal = function(v){
		return parseInt(v, 10);
	},
	_tabIdxes = {
		// summary:
		//		Define tabindexes for elements in the filter definition dialog
		relSelect: 60,
		accordionTitle: 70,
		removeCBoxBtn: 80,
		colSelect: 90,
		condSelect: 95,
		valueBox: 10,
		addCBoxBtn: 20,
		filterBtn: 30,
		clearBtn: 40,
		cancelBtn: 50
	};

dojo.declare("dojox.grid.enhanced.plugins.filter.FilterDefDialog",null,{
	// summary:
	//		Create the filter definition UI.
	curColIdx: -1,
	_relOpCls: "logicall",
	_savedCriterias: null,
	plugin: null,
	constructor: function(args){
		var plugin = this.plugin = args.plugin;
		this.builder = new fns.FilterBuilder();
		this._setupData();
		this._cboxes = [];
		this.defaultType = plugin.args.defaultType || "string";
		
		(this.filterDefPane = new fns.FilterDefPane({
			"dlg": this
		})).startup();
		(this._defPane = new dijit.Dialog({
			"title": plugin.nls.filterDefDialogTitle,
			"class": "dojoxGridFDTitlePane",
			"iconClass": "dojoxGridFDPaneIcon",
			"content": this.filterDefPane
		})).startup();
		
		this._defPane.connect(plugin.grid.store.layer('filter'), "filterDef", dojo.hitch(this, "_onSetFilter"));
		plugin.grid.setFilter = dojo.hitch(this, "setCriterias");
		plugin.grid.onFilterDefined = function(){};
	},
	destroy: function(){
		this._defPane.destroyRecursive();
		this._defPane = null;
		this.filterDefPane = null;
		this.plugin.grid.setFilter = null;
		this.plugin.grid.onFilterDefined = null;
		this.builder = null;
	},
	_setupData: function(){
		var nls = this.plugin.nls;
		this._dataTypeMap = {
		// summary:
		//		All supported data types
			"number":{
				valueBoxCls: {
					dft: dijit.form.NumberTextBox
				},
				conditions:[
					{label: nls.conditionEqual, value: "equalto", selected: true},
					{label: nls.conditionNotEqual, value: "notequalto"},
					{label: nls.conditionLess, value: "lessthan"},
					{label: nls.conditionLessEqual, value: "lessthanorequalto"},
					{label: nls.conditionLarger, value: "largerthan"},
					{label: nls.conditionLargerEqual, value: "largerthanorequalto"}
				]
			},
			"string":{
				valueBoxCls: {
					dft: dijit.form.TextBox,
					ac: dijit.form.ComboBox		//For autoComplete
				},
				conditions:[
					{label: nls.conditionContains, value: "contains", selected: true},
					{label: nls.conditionIs, value: "equalto"},
					{label: nls.conditionStartsWith, value: "startswith"},
					{label: nls.conditionEndWith, value: "endswith"},
					{label: nls.conditionNotContain, value: "notcontains"},
					{label: nls.conditionIsNot, value: "notequalto"},
					{label: nls.conditionNotStartWith, value: "notstartswith"},
					{label: nls.conditionNotEndWith, value: "notendswith"}
				]
			},
			"date":{
				valueBoxCls: {
					dft: dijit.form.DateTextBox
				},
				conditions:[
					{label: nls.conditionIs, value: "equalto", selected: true},
					{label: nls.conditionBefore, value: "lessthan"},
					{label: nls.conditionAfter, value: "largerthan"},
					{label: nls.conditionRange, value: "range"}
				]
			},
			"time":{
				valueBoxCls: {
					dft: dijit.form.TimeTextBox
				},
				conditions:[
					{label: nls.conditionIs, value: "equalto", selected: true},
					{label: nls.conditionBefore, value: "lessthan"},
					{label: nls.conditionAfter, value: "largerthan"},
					{label: nls.conditionRange, value: "range"}
				]
			},
			"boolean": {
				valueBoxCls: {
					dft: fns.BooleanValueBox
				},
				conditions: [
					{label: nls.conditionIs, value: "equalto", selected: true}
				]
			}
		};
	},
	getColumnLabelByValue: function(v){
		var nls = this.plugin.nls;
		if(v.toLowerCase() == "anycolumn"){
			return nls["anyColumnOption"];
		}else{
			var cell = this.plugin.grid.layout.cells[_parseDecimal(v)];
			return cell ? (cell.name || cell.field) : "";
		}
	},
	getConditionLabelByValue: function(type, c){
		var conditions = this._dataTypeMap[type].conditions;
		for(var i = conditions.length - 1; i >= 0; --i){
			var cond = conditions[i];
			if(cond.value == c.toLowerCase()){
				return cond.label;
			}
		}
		return "";
	},
	addCriteriaBoxes: function(/* int */cnt){
		// summary:
		//		Add *cnt* criteria boxes to the filter definition pane.
		//		Check overflow if necessary. 
		if(typeof cnt != "number" || cnt <= 0){
			return;
		}
		var cbs = this._cboxes,
			cc = this.filterDefPane.cboxContainer,
			total = this.plugin.args.ruleCount,
			len = cbs.length,
			h = 0, cbox, i;
		//If overflow, add to max rule count.
		cnt = len + cnt > total ? total - len : cnt;
		for(; cnt > 0; --cnt){
			cbox = new fns.CriteriaBox({
				dlg: this
			});
			cbox._pane = new dijit.layout.ContentPane({
				content: cbox
			});
			cbs.push(cbox);
			cc.addChild(cbox._pane);
		}
		//If there's no content box in it , AccordionContainer can not startup
		if(len === 0){
			cc.startup();
			if(_parseDecimal(dojo.isIE) == 7){
				//IE7 will fire a lot of "onresize" event during initialization.
				dojo.some(cc._connects, function(cnnt){
					if(cnnt[0][1] == "onresize"){
						cc.disconnect(cnnt);
						return true;
					}
				});
			}
		}
		//Hacking
		for(i = len; (cbox = cbs[i]); ++i){
			dojo.style(cbox._pane.domNode, "overflow", "hidden");
			cbox.setupTitleDom();
			this._hackTabIdxOfAccordionBtn(cbox._pane);
		}
		this._updatePane();
		this._updateCBoxTitles();
		if(!this._titleHeight){
			for(i = cbs.length - 1; i >= 0; --i){
				cbox = cbs[i];
				if(cc.selectedChildWidget != cbox._pane){
					this._titleHeight = dojo.marginBox(cbox._pane._buttonWidget.domNode.parentNode).h;
					break;
				}
			}
		}
		h = (cbs.length - len) * this._titleHeight;
		this._hackAccordionContainerHeight(true, h);
		//must hack before select
		cc.selectChild(cbs[cbs.length-1]._pane);
		for(i = len; (cbox = cbs[i]); ++i){
			cbox._removeCBoxBtn.placeAt(cbox._pane._buttonWidget.iconNode, "before");
		}
	},
	removeCriteriaBoxes: function(/* int|CriteriaBox|int[] */cnt,/* bool? */isIdx){
		// summary:
		//		Remove criteria boxes from the filter definition pane.
		var cbs = this._cboxes,
			cc = this.filterDefPane.cboxContainer,
			len = cbs.length,
			start = len - cnt,
			end = len - 1,
			h = 0, tmp, cbox,
			curIdx = dojo.indexOf(cbs, cc.selectedChildWidget.content);
		if(dojo.isArray(cnt)){
			var i, idxes = cnt;
			idxes.sort();
			cnt = idxes.length;
			//find a rule that's not deleted.
			//must find and focus the last one, or the hack will not work.
			for(i = len - 1;i >= 0; --i){
				if(dojo.indexOf(idxes,i) < 0){
					break;
				}
			}
			if(i >= 0){
				//must select before remove
				if(i != curIdx){
					cc.selectChild(cbs[i]._pane);
				}
				//idxes is sorted from small to large, 
				//so travel reversely won't need change index after delete from array.
				for(i = cnt-1; i >= 0; --i){
					if(idxes[i] >= 0 && idxes[i] < len){
						h += this._titleHeight;
						cc.removeChild(cbs[idxes[i]]._pane);
						cbs.splice(idxes[i],1);
					}
				}
			}
			start = cbs.length;
		}else{
			if(isIdx === true){
				if(cnt >= 0 && cnt < len){
					start = end = cnt;
					cnt = 1;
				}else{
					return;
				}
			}else{
				if(cnt instanceof fns.CriteriaBox){
					cbox = cnt;
					cnt = 1;
					start = end = dojo.indexOf(cbs, cbox);
				}else if(typeof cnt != "number" || cnt <= 0){
					return;
				}else if(cnt >= len){
					cnt = end;
					start = 1;
				}
			}
			if(end < start){
				return;
			}
			//must select before remove
			if(curIdx >= start && curIdx <= end){
				cc.selectChild(cbs[start ? start-1 : end+1]._pane);
			}
			for(; end >= start; --end){
				h += this._titleHeight;
				cc.removeChild(cbs[end]._pane);
			}
			cbs.splice(start, cnt);
		} 
		this._updatePane();
		this._updateCBoxTitles();
		//Hacking
		this._hackAccordionContainerHeight(false, h);	
	},
	getCriteria: function(/* int */idx){
		// summary:
		//		Get the *idx*-th criteria.
		if(typeof idx != "number"){
			return this._savedCriterias ? this._savedCriterias.length : 0;
		}
		if(this._savedCriterias && this._savedCriterias[idx]){
			return dojo.mixin({
				relation: this._relOpCls == "logicall" ? this.plugin.nls.and : this.plugin.nls.or
			},this._savedCriterias[idx]);
		}
		return null;
	},
	setCriterias: function(rules, noRefresh){
		rules = rules || [];
		if(!dojo.isArray(rules)){
			rules = [rules];
		}
		var func = function(){
			if(rules.length){
				this._savedCriterias = dojo.map(rules, function(rule){
					var type = rule.type || this.defaultType;
					return {
						"type": type,
						"column": String(rule.column),
						"condition": rule.condition,
						"value": rule.value,
						"colTxt": this.getColumnLabelByValue(String(rule.column)),
						"condTxt": this.getConditionLabelByValue(type, rule.condition),
						"formattedVal": rule.formattedVal || rule.value
					};
				}, this);
				this._criteriasChanged = true;
				var exprs = dojo.map(rules, this.getExprForCriteria, this);
				exprs = this.builder.buildExpression(exprs.length == 1 ? exprs[0] : {
					"op": this._relOpCls,
					"data": exprs
				});
				this.plugin.grid.store.layer("filter").filterDef(exprs);
				this.plugin.filterBar.toggleClearFilterBtn(false);
			}
			if(!noRefresh){
				this._closeDlgAndUpdateGrid();
			}
		};
		if(this._savedCriterias){
			this._clearWithoutRefresh = true;
			var handle = dojo.connect(this, "clearFilter", this, function(){
				dojo.disconnect(handle);
				this._clearWithoutRefresh = false;
				func.apply(this);
			});
			this.onClearFilter();
		}else{
			func.apply(this);
		}
	},
	getExprForCriteria: function(rule){
		if(rule.column == "anycolumn"){
			var cells = dojo.filter(this.plugin.grid.layout.cells, function(cell){
				return !(cell.filterable === false || cell.hidden);
			});
			return {
				"op": "logicany",
				"data": dojo.map(cells, function(cell){
					return this.getExprForColumn(rule.value, cell.index, rule.type, rule.condition);
				}, this)
			};
		}else{
			return this.getExprForColumn(rule.value, rule.column, rule.type, rule.condition);
		}
	},
	getExprForColumn: function(value, colIdx, type, condition){
		colIdx = _parseDecimal(colIdx);
		var cell = this.plugin.grid.layout.cells[colIdx],
			colName = cell.field || cell.name,
			obj = {
				"datatype": type || this.getColumnType(colIdx),
				"args": cell.dataTypeArgs,
				"isColumn": true
			},
			operands = [dojo.mixin({"data": this.plugin.args.isServerSide ? colName : cell}, obj)];
		obj.isColumn = false;
		if(condition == "range"){
			operands.push(dojo.mixin({"data": value.start}, obj), 
				dojo.mixin({"data": value.end}, obj));
		}else{
			operands.push(dojo.mixin({"data": value}, obj));
		}
		return {
			"op": condition,
			"data": operands
		};
	},
	getColumnType: function(/* int */colIndex){
		var cell = this.plugin.grid.layout.cells[_parseDecimal(colIndex)];
		if(!cell || !cell.datatype){
			return this.defaultType;
		}
		var type = String(cell.datatype).toLowerCase();
		return this._dataTypeMap[type] ? type : this.defaultType;
	},
	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	clearFilter: function(noRefresh){
		// summary:
		//		Clear filter definition.
		this._savedCriterias = null;
		this.plugin.grid.store.layer("filter").filterDef(null);
		try{
			this.plugin.filterBar.toggleClearFilterBtn(true);
			this.filterDefPane._clearFilterBtn.set("disabled", true);
			this.removeCriteriaBoxes(this._cboxes.length-1);
			this._cboxes[0].load({});
		}catch(e){
			//console.log("clearFilter",e);
			//Any error means the filter is defined outside this plugin.
		}
		if(noRefresh){
			this.closeDialog();
		}else{
			this._closeDlgAndUpdateGrid();
		}
	},
	showDialog: function(/* int */colIndex){
		// summary:
		//		Show the filter defintion dialog.
		var p = this.plugin,
			s = p.grid.store;
		this._defPane.show();
		p.filterStatusTip.closeDialog();
		var len = s.layer();
		this._layerStates = {};
		for(var i = 0; i < len; ++i){
			this._layerStates[i] = s.layer(i).enabled();
			s.layer(i).enabled(false);
		}
		//For auto-complete, enable unique layer.
		s.layer("unique").enabled(true);
		s.layer("sort").enabled(true);
		this._prepareDialog(colIndex);
	},
	closeDialog: function(){
		// summary:
		//		Close the filter definition dialog.
		this._defPane.hide();
		if(this._layerStates){
			var s = this.plugin.grid.store;
			var len = s.layer();
			for(var i = 0; i < len; ++i){
				s.layer(i).enabled(this._layerStates[i]);
			}
			s.layer("sort").enabled(false);
			s.layer("unique").enabled(false);
		}
	},
	onFilter: function(e){
		// summary:
		//		Triggered when the "Filter" button is clicked.
		if(this.canFilter()){
			this._defineFilter();
			this._closeDlgAndUpdateGrid();
			this.plugin.filterBar.toggleClearFilterBtn(false);	
		}
	},
	onClearFilter: function(e){
		// summary:
		//		Triggered when the "Clear" button is clicked.
		if(this._savedCriterias){
			if(this._savedCriterias.length > 1){
				this.plugin.clearFilterDialog.show();
			}else{
				this.clearFilter(this._clearWithoutRefresh);
			}
		}
	},
	onCancel: function(e){
		// summary:
		//		Triggered when the "Cancel" buttton is clicked.
		var sc = this._savedCriterias;
		if(sc){
			var cbs = this._cboxes;
			this.addCriteriaBoxes(sc.length - cbs.length);
			this.removeCriteriaBoxes(cbs.length - sc.length);
			dojo.forEach(sc, function(c, i){
				cbs[i].load(c);
			});
		}
		this.closeDialog();
	},
	onRendered: function(cbox){
		// summary:
		//		Triggered when the rendering of the filter definition dialog is completely finished.
		// cbox:
		//		Current visible criteria box
		if(!dojo.isFF){
			var elems = dijit._getTabNavigable(dojo.byId(cbox.domNode));
			dijit.focus(elems.lowest || elems.first);
		}else{
			var dp = this._defPane;
			dp._getFocusItems(dp.domNode);
			dijit.focus(dp._firstFocusItem);
		}
	},
	_onSetFilter: function(filterDef){
		// summary:
		//		If someone clear the filter def in the store directly, we must clear it in the UI.
		//		If someone defines a filter, don't know how to handle it!
		if(filterDef === null && this._savedCriterias){
			this.clearFilter();
		}
	},
	_prepareDialog: function(/* int */colIndex){
		var sc = this._savedCriterias,
			cbs = this._cboxes,
			columnChanged = this.curColIdx != colIndex;
		this.curColIdx = colIndex;
		if(!sc){
			if(cbs.length === 0){
				this.addCriteriaBoxes(1);
			}else if(columnChanged){
				dojo.forEach(cbs, function(cbox){
					cbox.changeCurrentColumn();
				});
			}
		}else if(this._criteriasChanged){
			this._criteriasChanged = false;
			var needNewCBox = sc.length > cbs.length;
			this.addCriteriaBoxes(sc.length - cbs.length);
			this.removeCriteriaBoxes(cbs.length - sc.length);
			this.filterDefPane._clearFilterBtn.set("disabled", false);
			if(needNewCBox){
				dojo.forEach(sc, function(c, i){
					var handle = dojo.connect(this, "onRendered", function(cbox){
						if(cbox == cbs[i]){
							dojo.disconnect(handle);
							cbox.load(c);
						}
					});
				}, this);
			}else{
				dojo.forEach(sc, function(c, i){
					cbs[i].load(c);
				});
			}
		}
		//Since we're allowed to remove cboxes when the definition pane is not shown,
		//we have to resize the container to have a correct _verticalSpace.
		this.filterDefPane.cboxContainer.resize();
	},
	_defineFilter: function(){
		var cbs = this._cboxes,
			filterCboxes = function(method){
				return dojo.filter(dojo.map(cbs, function(cbox){
					return cbox[method]();
				}), function(result){
					return !!result;
				});
			},
			exprs = filterCboxes("getExpr");
		this._savedCriterias = filterCboxes("save");
		exprs = exprs.length == 1 ? exprs[0] : {
			"op": this._relOpCls,
			"data": exprs
		};
		exprs = this.builder.buildExpression(exprs);
		
		this.plugin.grid.store.layer("filter").filterDef(exprs);
		this.filterDefPane._clearFilterBtn.set("disabled", false);
		this.plugin.grid.onFilterDefined(this._savedCriterias);
	},
	_updateCBoxTitles: function(){
		for(var cbs = this._cboxes, i = cbs.length; i > 0; --i){
			cbs[i - 1].updateRuleIndex(i);
			cbs[i - 1].setAriaInfo(i);
		}
	},
	_updatePane: function(){
		var cbs = this._cboxes,
			defPane = this.filterDefPane;
		cbs[0].toggleRemoveCBoxBtn(cbs.length == 1);
		defPane.toggleAddCBoxBtn(cbs.length == this.plugin.args.ruleCount);
		defPane._filterBtn.set("disabled", !this.canFilter());
	},
	canFilter: function(){
		return dojo.filter(this._cboxes, function(cbox){
			return !cbox.isEmpty();
		}).length > 0;
	},
	_closeDlgAndUpdateGrid: function(){
		this.closeDialog();
		var g = this.plugin.grid;
		g.showMessage(g.loadingMessage);
		setTimeout(dojo.hitch(g, g._refresh), 0);
	},
	_hackTabIdxOfAccordionBtn: function(/* int */cboxPane){
		cboxPane._buttonWidget.connect(cboxPane._buttonWidget, "_setSelectedAttr", function(){
			this.focusNode.setAttribute("tabIndex", this.selected ? _tabIdxes.accordionTitle : "-1");
		});
		this._cboxes.length == 1 && cboxPane._buttonWidget.set("selected", true);
	},
	_hackAccordionContainerHeight: function(/* bool */toGrow,/* int */heightDif){
		var cbs = this._cboxes,
			cc = this.filterDefPane.cboxContainer,
			dn = cc.domNode,
			h = dojo.style(dn, "height");
		if(!toGrow){
			dn.style.height = (h - heightDif) + 'px';
		}else if(cbs.length > 1){
			dn.style.height = (h + heightDif) + 'px';
		}else{
			//Only one rule, no need to do anything.
			return;
		}
		cc.resize();
	}
});
dojo.declare("dojox.grid.enhanced.plugins.filter.FilterDefPane",[dijit._Widget,dijit._Templated],{
	templateString: dojo.cache("dojox.grid","enhanced/templates/FilterDefPane.html"),
	widgetsInTemplate: true,
	dlg: null,
	postMixInProperties: function(){
		this.plugin = this.dlg.plugin;
		var nls = this.plugin.nls;
		this._addRuleBtnLabel = nls.addRuleButton;
		this._cancelBtnLabel = nls.cancelButton;
		this._clearBtnLabel = nls.clearButton;
		this._filterBtnLabel = nls.filterButton;
		this._relAll = nls.relationAll;
		this._relAny = nls.relationAny;
		this._relMsgFront = nls.relationMsgFront;
		this._relMsgTail = nls.relationMsgTail;
	},
	postCreate: function(){
		this.inherited(arguments);
		this.connect(this.domNode, "onkeypress", "_onKey");
		(this.cboxContainer = new dijit.layout.AccordionContainer({})).placeAt(this.criteriaPane);
		
		this._relSelect.set("tabIndex", _tabIdxes.relSelect);
		this._addCBoxBtn.set("tabIndex", _tabIdxes.addCBoxBtn);
		this._cancelBtn.set("tabIndex", _tabIdxes.cancelBtn);
		this._clearFilterBtn.set("tabIndex", _tabIdxes.clearBtn);
		this._filterBtn.set("tabIndex", _tabIdxes.filterBtn);
		
		var nls = this.plugin.nls;
		dijit.setWaiState(this._relSelect.domNode, "label", nls.waiRelAll);
		dijit.setWaiState(this._addCBoxBtn.domNode, "label", nls.waiAddRuleButton);
		dijit.setWaiState(this._cancelBtn.domNode, "label", nls.waiCancelButton);
		dijit.setWaiState(this._clearFilterBtn.domNode, "label", nls.waiClearButton);
		dijit.setWaiState(this._filterBtn.domNode, "label", nls.waiFilterButton);
	},
	uninitialize: function(){
		this.cboxContainer.destroyRecursive();
		this.plugin = null;
		this.dlg = null;
	},
	_onRelSelectChange: function(val){
		this.dlg._relOpCls = val == "0" ? "logicall" : "logicany";
		dijit.setWaiState(this._relSelect.domNode,"label", this.plugin.nls[val == "0" ? "waiRelAll" : "waiRelAny"]);
	},
	_onAddCBox: function(){
		this.dlg.addCriteriaBoxes(1);
	},
	_onCancel: function(){
		this.dlg.onCancel();
	},
	_onClearFilter: function(){
		this.dlg.onClearFilter();
	},
	_onFilter: function(){
		this.dlg.onFilter();
	},
	toggleAddCBoxBtn: function(/* bool */toHide){
		this._addCBoxBtn.set("disabled", toHide);
	},
	_onKey: function(e){
		if(e.keyCode == dojo.keys.ENTER){
			this.dlg.onFilter();
		}
	}
});
dojo.declare("dojox.grid.enhanced.plugins.filter.CriteriaBox",[dijit._Widget,dijit._Templated],{
	templateString: dojo.cache("dojox.grid","enhanced/templates/CriteriaBox.html"),
	widgetsInTemplate: true,
	dlg: null,
	postMixInProperties: function(){
		this.plugin = this.dlg.plugin;
		this._removeCBoxBtn = null;
		this._curValueBox = null;
		
		var nls = this.plugin.nls;
		this._colSelectLabel = nls.columnSelectLabel;
		this._condSelectLabel = nls.conditionSelectLabel;
		this._valueBoxLabel = nls.valueBoxLabel;
		this._anyColumnOption = nls.anyColumnOption;
	},
	postCreate: function(){
		var dlg = this.dlg;
			g = this.plugin.grid;
		//Remove Criteria Button
		this._removeCBoxBtn = new dijit.form.Button({
			label: this.plugin.nls.removeRuleButton,
			showLabel: false,
			iconClass: "dojoxGridFCBoxRemoveCBoxBtnIcon",
			tabIndex: _tabIdxes.removeCBoxBtn,
			onClick: dojo.hitch(dlg, "removeCriteriaBoxes", this)
		});
		//Select Column
		this._colSelect.set("tabIndex", _tabIdxes.colSelect);
		var colIdx = dlg.curColIdx >= 0 ? String(dlg.curColIdx) : "anycolumn";
		this._colSelect.addOption([
			{label: this.plugin.nls.anyColumnOption, value: "anycolumn", selected: colIdx == "anycolumn"},
			{value: ""}
		].concat(dojo.map(dojo.filter(g.layout.cells, function(cell){
			return !(cell.filterable === false || cell.hidden);
		}), function(cell){
			return {
				label: cell.name || cell.field,
				value: String(cell.index),
				selected: colIdx == String(cell.index)
			};
		})));
		//Select Condition
		this._condSelect.set("tabIndex", _tabIdxes.condSelect);
		this._condSelect.addOption(this._getUsableConditions(dlg.getColumnType(dlg.curColIdx)));
		this._showSelectOrLabel(this._condSelect, this._condSelectAlt);
	},
	uninitialize: function(){
		this._removeCBoxBtn.destroyRecursive();
		this._removeCBoxBtn = null;
		this.plugin = null;
		this.dlg = null;
	},
	_showSelectOrLabel: function(sel, alt){
		var options = sel.getOptions();
		if(options.length == 1){
			alt.innerHTML = options[0].label;
			dojo.style(sel.domNode, "display", "none");
			dojo.style(alt, "display", "");
		}else{
			dojo.style(sel.domNode, "display", "");
			dojo.style(alt, "display", "none");
		}
	},
	_onChangeColumn: function(val){
		try{
			var g = this.plugin.grid,
				cell = g.layout.cells[_parseDecimal(val)],
				fieldName = cell.field || cell.name;
			g.store.layer("unique").uniqueColumns([fieldName]);
			g.store.layer("sort").sortColumns([{
				"attribute": fieldName
			}]);
		}catch(e){
			//Any exception means 'anycolumn' is selected instead of a specific column;
		}
		this._checkValidCriteria();
		var type = this.dlg.getColumnType(val);
		this._setConditionsByType(type);
		this._setValueBoxByType(type);
	},
	_onChangeCondition: function(val){
		this._checkValidCriteria();
		var f = (val == "range");
		if(f ^ this._isRange){
			this._isRange = f;
			this._setValueBoxByType(this.dlg.getColumnType(this._colSelect.get("value")));
		}
	},
	_checkValidCriteria: function(){
		// summary:
		//		Check whether the given criteria box is completed. If it is, mark it.
		setTimeout(dojo.hitch(this, function(){
			this.updateRuleTitle();
			//this.updateToolTip();
			this.dlg._updatePane();
		}),0);
	},
	_createValueBox: function(/* widget constructor */cls,/* object */arg){
		// summary:
		//		Create a value input box with given class and arguments
		//cls: widget constructor
		//arg: object
		var func = dojo.hitch(arg.cbox, "_checkValidCriteria");
		return new cls(dojo.mixin(arg,{
			tabIndex: _tabIdxes.valueBox,
			onKeyPress: func,
			onChange: func,
			"class": "dojoxGridFCBoxValueBox"
		}));
	},
	_createRangeBox: function(/* widget constructor */cls,/* object */arg){
		// summary:
		//		Create a DIV containing 2 input widgets, which represents a range, with the given class and arguments
		//cls: widget constructor
		//arg: object
		var func = function(){
			arg.cbox._checkValidCriteria();
		};
		dojo.mixin(arg,{
			tabIndex: _tabIdxes.valueBox,
			onKeyPress: func,
			onChange: func
		});
		var div = dojo.create("div", {"class": "dojoxGridFCBoxValueBox"}),
			start = new cls(arg),
			txt = dojo.create("span", {"class": "dojoxGridFCBoxRangeValueTxt", "innerHTML": this.plugin.nls.rangeTo}),
			end = new cls(arg);
		dojo.addClass(start.domNode, "dojoxGridFCBoxStartValue");
		dojo.addClass(end.domNode, "dojoxGridFCBoxEndValue");
		div.appendChild(start.domNode);
		div.appendChild(txt);
		div.appendChild(end.domNode);
		div.domNode = div;
		//Mock functions for set and get (in place of the old attr function)
		div.set = function(dummy, args){
			if(dojo.isObject(args)){
				start.set("value", args.start);
				end.set("value", args.end);
			}
		};
		div.get = function(){
			var s = start.get("value"),
				e = end.get("value");
			return s && e ? {start: s, end: e} : "";
		};
		return div;
	},
	toggleRemoveCBoxBtn: function(/* bool */toHide){
		dojo.toggleClass(this._removeCBoxBtn.domNode, "dojoxGridFCBoxRemoveCBoxBtnHiden", toHide);
	},
	changeCurrentColumn: function(/* bool */selectCurCol){
		var colIdx = this.dlg.curColIdx;
		this._colSelect.set('value', colIdx >= 0 ? String(colIdx) : "anycolumn");
		this.updateRuleTitle(true);
	},
	curColumn: function(){
		return this._colSelect.getOptions(this._colSelect.get("value")).label;
	},
	curCondition: function(){
		return this._condSelect.getOptions(this._condSelect.get("value")).label;
	},
	curValue: function(){
		return this._curValueBox ? this._curValueBox.get("value") : "";
	},
	save: function(){
		if(this.isEmpty()){
			return null;
		}
		var colIdx = this._colSelect.get("value"),
			type = this.dlg.getColumnType(colIdx),
			value = this.curValue(),
			cond = this._condSelect.get("value");
		return {
			"column": colIdx,
			"condition": cond,
			"value": value,
			"formattedVal": this.formatValue(type, cond, value),
			"type": type,
			"colTxt": this.curColumn(),
			"condTxt": this.curCondition()
		};
	},
	load: function(obj){
		var tmp = [
			this._onChangeColumn,
			this._onChangeCondition
		];
		this._onChangeColumn = this._onChangeCondition = function(){};
		obj.column && this._colSelect.set("value", obj.column);
		obj.condition && this._condSelect.set("value", obj.condition);
		obj.type && this._setValueBoxByType(obj.type);
		this._curValueBox.set("value", obj.value || "");
		setTimeout(dojo.hitch(this, function(){
			this._onChangeColumn = tmp[0];
			this._onChangeCondition = tmp[1];
		}), 0);
	},
	getExpr: function(){
		if(this.isEmpty()){
			return null;
		}
		var colval = this._colSelect.get("value");
		return this.dlg.getExprForCriteria({
			"type": this.dlg.getColumnType(colval),
			"column": colval,
			"condition": this._condSelect.get("value"),
			"value": this.curValue()
		});
	},
	isEmpty: function(){
		var v = this.curValue();
		return v === "" || v === null || typeof v == "undefined" || (typeof v == "number" && isNaN(v)); 
	},
	setupTitleDom: function(){
		var cb = dojo.contentBox(this._pane._buttonWidget.titleNode);
		dojo.style(this._pane._buttonWidget.titleTextNode, "width", (cb.w - 16) + "px");
	},
	updateRuleTitle: function(isEmpty){
		var node = this._pane._buttonWidget.titleTextNode;
		var title = [
			"<div class='dojoxEllipsis'>"
		];
		if(isEmpty || this.isEmpty()){
			node.title = dojo.string.substitute(this.plugin.nls.ruleTitleTemplate, [this._ruleIndex || 1]);
			title.push(node.title);
		}else{
			var type = this.dlg.getColumnType(this._colSelect.get("value"));
			var column = this.curColumn();
			var condition = this.curCondition();
			var value = this.formatValue(type, this._condSelect.get("value"), this.curValue());
			title.push(
				column,
				"&nbsp;<span class='dojoxGridRuleTitleCondition'>",
				condition,
				"</span>&nbsp;",
				value
			);
			node.title = [column, " ", condition, " ", value].join('');
		}
		node.innerHTML = title.join('');
		if(dojo.isMoz){
			var tt = dojo.create("div", {
				"style": "width: 100%; height: 100%; position: absolute; top: 0; left: 0; z-index: 9999;"
			}, node);
			tt.title = node.title;
		}
	},
	updateRuleIndex: function(index){
		if(this._ruleIndex != index){
			this._ruleIndex = index;
			if(this.isEmpty()){
				this.updateRuleTitle();
			}
		}
	},
	setAriaInfo: function(idx){
		var dss = dojo.string.substitute,
			nls = this.plugin.nls;
		dijit.setWaiState(this._colSelect.domNode,"label", dss(nls.waiColumnSelectTemplate, [idx]));
		dijit.setWaiState(this._condSelect.domNode,"label", dss(nls.waiConditionSelectTemplate, [idx]));
		dijit.setWaiState(this._removeCBoxBtn.domNode,"label", dss(nls.waiRemoveRuleButtonTemplate, [idx]));
		this._index = idx;
	},
	_getUsableConditions: function(type){
		var conditions = this.dlg._dataTypeMap[type].conditions;
		var typeDisabledConds = (this.plugin.args.disabledConditions || {})[type];
		var colIdx = _parseDecimal(this._colSelect.get("value"));
		var colDisabledConds = isNaN(colIdx) ?
			(this.plugin.args.disabledConditions || {})["anycolumn"] :
			this.plugin.grid.layout.cells[colIdx].disabledConditions;
		if(!dojo.isArray(typeDisabledConds)){
			typeDisabledConds = [];
		}
		if(!dojo.isArray(colDisabledConds)){
			colDisabledConds = [];
		}
		var arr = typeDisabledConds.concat(colDisabledConds);
		if(arr.length){
			var disabledConds = {};
			dojo.forEach(arr, function(c){
				if(dojo.isString(c)){
					disabledConds[c.toLowerCase()] = true;
				} 
			});
			return dojo.filter(conditions, function(condOption){
				return !(condOption.value in disabledConds);
			});
		}
		return conditions;
	},
	_setConditionsByType: function(/* string */type){
		var condSelect = this._condSelect,
			preCond = this.curCondition();
		condSelect.removeOption(condSelect.options);
		condSelect.addOption(this._getUsableConditions(type));
		this._showSelectOrLabel(this._condSelect, this._condSelectAlt);
	},
	_setValueBoxByType: function(/* string */type){
		if(this._curValueBox){
			this.valueNode.removeChild(this._curValueBox.domNode);
			try{
				this._curValueBox.destroyRecursive();
			}catch(e){}
			delete this._curValueBox;
		}
		//value box class
		var vbcls = this.dlg._dataTypeMap[type].valueBoxCls[this._getValueBoxClsInfo(this._colSelect.get("value"), type)],
			vboxArg = this._getValueBoxArgByType(type);
		this._curValueBox = this[this._isRange ? "_createRangeBox" : "_createValueBox"](vbcls, vboxArg);
		this.valueNode.appendChild(this._curValueBox.domNode);
		this._hackValueBox();
		
		//Can not move to setAriaInfo, 'cause the value box is created after the defpane is loaded.
		dijit.setWaiState(this._curValueBox.domNode, "label", dojo.string.substitute(this.plugin.nls.waiValueBoxTemplate,[this._index]));
		//Now our cbox is completely ready
		this.dlg.onRendered(this);
	},
	_hackValueBox: function(){
		if(this._curValueBox && this._curValueBox instanceof dijit.form.ComboBox){
			var oldOnKey = this._curValueBox._onKey;
			this._curValueBox._onKey = dojo.hitch(this, function(evt){
				if(evt.charOrCode === dojo.keys.ENTER && this._curValueBox._opened){
					dojo.stopEvent(evt);
				}
				oldOnKey.call(this._curValueBox, evt);
			});
		}
	},
	
	//--------------------------UI Configuration--------------------------------------
	_getValueBoxArgByType: function(/* string */type){
		// summary:
		//		Get the arguments for the value box construction.
		var g = this.plugin.grid,
			cell = g.layout.cells[_parseDecimal(this._colSelect.get("value"))],
			res = {
				cbox: this
			};
		if(type == "string"){
			if(cell && cell.autoComplete){
				dojo.mixin(res, {
					store: g.store,
					searchAttr: cell.field || cell.name
				});
			}
		}else if(type == "boolean"){
			dojo.mixin(res, this.dlg.builder.defaultArgs["boolean"]);
			if(cell && cell.dataTypeArgs){
				dojo.mixin(res, cell.dataTypeArgs);
			}
		}
		return res;
	},
	formatValue: function(type, cond, v){
		// summary:
		//		Format the value to be shown in tooltip.
		if(type == "date" || type == "time"){
			var opt = {selector: type},
				fmt = dojo.date.locale.format;
			if(cond == "range"){
				return dojo.string.substitute(this.plugin.nls.rangeTemplate, [fmt(v.start, opt), fmt(v.end, opt)]);
			}
			return fmt(v, opt);
		}else if(type == "boolean"){
			return v ? this._curValueBox._lblTrue : this._curValueBox._lblFalse;
		}
		return v;
	},
	_getValueBoxClsInfo: function(/* int|string */colIndex, /* string */type){
		// summary:
		//		Decide which value box to use given data type and column index. 
		var cell = this.plugin.grid.layout.cells[_parseDecimal(colIndex)];
		//Now we only need to handle string. But maybe we need to handle more types here in the future.
		if(type == "string"){
			return (cell && cell.autoComplete) ? "ac" : "dft";
		}
		return "dft";
	}
});
dojo.declare("dojox.grid.enhanced.plugins.filter.BooleanValueBox", [dijit._Widget, dijit._Templated], {
	templateString: dojo.cache("dojox.grid","enhanced/templates/FilterBoolValueBox.html"),
	widgetsInTemplate: true,
	_baseId: "",
	_lblTrue: "",
	_lblFalse: "",
	constructor: function(args){
		var nls = args.cbox.plugin.nls;
		this._baseId = args.cbox.id;
		this._lblTrue = args.trueLabel || nls.trueLabel;
		this._lblFalse = args.falseLabel || nls.falseLabel;
		this.args = args;
	},
	postCreate: function(){
		this.onChange();
	},
	onChange: function(){
		
	},
	get: function(prop){
		return this.rbTrue.get("checked");
	},
	set: function(prop, v){
		this.inherited(arguments);
		if(prop == "value"){
			this.rbTrue.set("checked", !!v);
			this.rbFalse.set("checked", !v);
		}
	}
});
})();
