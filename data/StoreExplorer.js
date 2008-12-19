dojo.provide("dojox.data.StoreExplorer");
dojo.require("dojox.grid.DataGrid");
dojo.require("dojox.data.ItemExplorer");
dojo.require("dijit.layout.BorderContainer");
dojo.require("dijit.layout.ContentPane");

dojo.declare("dojox.data.StoreExplorer", dijit.layout.BorderContainer, {
	constructor: function(options){
		dojo.mixin(this, options);
	},
	store: null,
	stringQueries: false,
	postCreate: function(){
		var self = this;
		this.inherited(arguments);
		var contentPane = new dijit.layout.ContentPane({
			region:'top'			
		});
		this.addChild(contentPane);
		function addButton(name, action){
			var button = new dijit.form.Button({label: name}).placeAt(contentPane.domNode);
			button.onClick = action;
			return button;
		}
		var queryText = contentPane.domNode.appendChild(document.createElement("span"));
		queryText.innerHTML = "Enter query: &nbsp;";
		queryText.id = "queryText";
		var queryTextBox = contentPane.domNode.appendChild(document.createElement("input"));
		queryTextBox.type = "text";
		queryTextBox.id = "queryTextBox";
		addButton("Query",function(){
			var query = queryTextBox.value;
			self.setQuery(self.stringQueries ? query : dojo.fromJson(query));
		});
		contentPane.domNode.appendChild(document.createElement("span")).innerHTML = "&nbsp;&nbsp;&nbsp;";
		var createNewButton = addButton("Create New", dojo.hitch(this, "createNew"));
		var deleteButton = addButton("Delete",function(){
			var items = grid.selection.getSelected();
			for (var i = 0; i < items.length; i++){
				self.store.deleteItem(items[i]);
			}
		});
		this.setItemName = function(name){
			createNewButton.attr('label',"<img style='width:12px; height:12px' src='" + dojo.moduleUrl("dijit.themes.tundra.images","dndCopy.png") + "' /> Create New " + name);
			deleteButton.attr('label',"Delete " + name);
		}
		addButton("Save",function(){
			self.store.save();
		});
		addButton("Revert",function(){
			self.store.revert();
		});
		addButton("Add Column", function(){
			var columnName = prompt("Enter column name:","property");
			if(columnName){
				self.gridLayout.push({
						field: columnName, 
						name: columnName, 
						formatter: dojo.hitch(self,"_formatCell"), 
						editable: true
					});
				self.grid.setStructure(self.gridLayout);
			}
		});
		var grid = this.grid = new dojox.grid.DataGrid(
				{store: this.store, region: 'center', splitter: true}, 
				this.domNode.appendChild(document.createElement("div"))
			);
		grid.canEdit = function(inCell, inRowIndex){
			var value = this._copyAttr(inRowIndex, inCell.field);
			return !(value && typeof value == 'object') || value instanceof Date; 
		}
		this.addChild(grid);
		grid.startup();
		
		var tree = this.tree = new dojox.data.ItemExplorer({
			region: 'trailing', 
			splitter: true, 
			style: "width: 300px",
			store: this.store},
				this.domNode.appendChild(document.createElement("div"))
			);
		
		dojo.connect(grid, "onCellClick", function(){
			var selected = grid.selection.getSelected()[0];
			tree.setItem(selected);
		});

		this.gridOnFetchComplete = grid._onFetchComplete;
		this.addChild(tree);
		this.setStore(this.store);
		tree.startup();
	},
	setQuery: function(query){
		this.grid.setQuery(query);
	},
	_formatCell: function(value){
		if(this.store.isItem(value)){
			return this.store.getLabel(value) || this.store.getIdentity(value);
		}
		return value;
	},
	setStore: function(store){
		this.store = store;
		var self = this;
		var grid = this.grid;
		grid._pending_requests[0] = false;
		function formatCell(value){
			return self._formatCell(value);
		}
		var defaultOnComplete = this.gridOnFetchComplete;
		grid._onFetchComplete = function(items, req){
			var layout = self.gridLayout = [];
			var column, key, item, i, j, k, idAttributes = store.getIdentityAttributes();
			for(i = 0; i < idAttributes.length; i++){
				key = idAttributes[i];
				layout.push({
					field: key, 
					name: key, 
					_score: 100, 
					formatter: formatCell, 
					editable: false
				});
				
			}
			for(i=0; item = items[i++];){
				var keys = store.getAttributes(item);
				for(k=0; key = keys[k++];){
					var found = false;
					for(j=0; column = layout[j++];){
						if(column.field == key){
							column._score++;
							found = true;
							break;
						}
					}
					if(!found){
						layout.push({
							field: key, 
							name: key, 
							_score: 1, 
							formatter: formatCell, 
							editable: true
						});
					}
				}					
			}
			layout = layout.sort(function(a, b){
				return a._score > b._score ? -1 : 1;
			});
			for(j=0; column = layout[j]; j++){
				if(column._score < items.length/40 * j){
					layout.splice(j,layout.length-j);
					break;
				}
			}
			for(j=0; column = layout[j++];){
				column.width=Math.round(100/layout.length) + '%';
			}
			grid._onFetchComplete = defaultOnComplete; 
			grid.setStructure(layout);
			var retValue = defaultOnComplete.apply(this, arguments);
			
		}
 		grid.setStore(store);
		this.tree.setStore(store);
	},
	createNew: function(){
		this.store.newItem(dojo.fromJson(
				prompt("Enter any properties to put in the new item (in JSON literal form):","{ }")));
	}
});