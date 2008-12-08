dojo.provide("dojox.data.tests.ItemExplorer");
dojo.require("dijit.Tree");
dojo.require("dijit.Dialog");
//dojo.require("dijit.TooltipDialog");
dojo.require("dijit.form.Textarea");
dojo.require("dijit.form.Button");
dojo.require("dijit.form.CheckBox");
dojo.require("dijit.form.FilteringSelect");
dojo.require("dijit.dijit");

dojo.declare("dojox.data.tests.ItemExplorer", dijit.Tree, {
	constructor: function(options){
		var self = this;
		var root = this.rootModelNode = {value:{}};
		var modelNodeIndex = this._modelNodeIndex = {};
		this.model = {
			getRoot: function(onItem){
				onItem(root);
			},
			mayHaveChildren: function(modelNode){
				return modelNode.value && typeof modelNode.value == 'object' && !(modelNode.value instanceof Date);
			},
			getChildren: function(parentModelNode, onComplete, onError){
				var keys, item = parentModelNode.value;
				var children = [];
				var isItem = self.store && self.store.isItem(item);
				if(isItem){
					// get the properties through the dojo data API
					keys = self.store.getAttributes(item);
				}else if(item && typeof item == 'object'){
					keys = [];
					// also we want to be able to drill down into plain JS objects/arrays
					for(var i in item){
						if(item.hasOwnProperty(i) && i != '__id' && i != '__clientId'){
							keys.push(i);
						}
					}
				}
				if(keys){
					for(var key, k=0; key = keys[k++];){
						if(isItem){
							var value = self.store.getValues(item, key);
							if(value.length < 2){
								value = self.store.getValue(item, key);
							}
						}else{
							value = item[key];
						}
						
						if(self.store.isItem(value) && !self.store.isItemLoaded(value)){
							self.store.loadItem({item:value});
						}
						children.push({property:key, value: value, parent:  item});
					}
					children.push({addNew:true, parent: item, parentNode : parentModelNode});
				}
				onComplete(children);
			},
			getIdentity: function(modelNode){
				var identity = modelNode === root ? "root" : 
						(modelNode.value && self.store.isItem(modelNode.value) && self.store.getIdentity(modelNode.value)) || 
							(((self.store && self.store.getIdentity(modelNode.parent)) || Math.random()) + "." + modelNode.property);
				modelNodeIndex[identity] = modelNode;
				return identity;
			},
			getLabel: function(modelNode){
				return modelNode === root ?
						"Object Properties" : 
							modelNode.addNew ? "Add new property" : 
								modelNode.property + ": " + modelNode.value;
			},
			onChildrenChange: function(modelNode){
			},
			onChange: function(modelNode){
			}
		};
	},
	postCreate: function(){
		
		this.inherited(arguments);
		var self = this;
		// handle the clicking on the "add new property item"
		dojo.connect(this, "onClick", function(modelNode){
			if(modelNode.addNew){
				var propName = prompt("What is the name of the property you wish to add?","");
				if(propName){
					var value = prompt("What value do you want for the property (as a JSON value like 3, true, \"a string\")?");
				}
				if(propName && value){
					self.store.setValue(modelNode.parent, propName, dojo.fromJson(value));
					self.model.getChildren(modelNode.parentNode, function(children){
						self.model.onChildrenChange(modelNode.parentNode, children);
					});
				}
			}else{
                // single-click edit
                this._editItem(modelNode);
            }
		});
		//dojo.connect(this, "onDblClick", this, "_editItem");		
	},
	store: null,
	setStore: function(store){
		this.store = store;
		var self = this;
		dojo.connect(store, "onSet", function(item, attribute, oldValue, newValue){
			var propertyNode, identity = self.store.getIdentity(item);
			if(oldValue === undefined || newValue === undefined){
				propertyNode = self._modelNodeIndex[identity];
				if(propertyNode){
					self.model.onChildrenChange(self._modelNodeIndex[identity]);
				}
			}
			propertyNode = self._modelNodeIndex[identity + "." + attribute];
			if(propertyNode){
				propertyNode.value = newValue;
				if(oldValue instanceof Array || newValue instanceof Array){
					self.model.getChildren(propertyNode, function(children){
						self.model.onChildrenChange(propertyNode, children);
					});
				}
				self.model.onChange(propertyNode);
			}
		});
		this.rootNode.setChildItems([]);
	},
	setItem: function(item){
		// this is called to show a different item
		this.rootModelNode.value = item;
		var self = this;
		this.model.getChildren(this.rootModelNode, function(children){
			self.rootNode.setChildItems(children);
		});
		
	},
    _createEditDialog: function(){
    	this._editDialog = new dijit.Dialog({
        // Using dijit.TooltipDialog this way is not officially supported
    	//this._editDialog = new dijit.TooltipDialog({
           title: "Edit Property",
           execute: dojo.hitch(this, "_updateItem"),
           preload: true
        });
        this._editDialog.placeAt(dojo.body());  
        this._editDialog.startup();
        
        // handle for dialog content
        var pane = dojo.doc.createElement('div');
        
        // label for property
        var labelProp = dojo.doc.createElement('h2');
        dojo.attr(labelProp, "for", "itemType");
        pane.appendChild(labelProp);
        pane.appendChild(dojo.doc.createElement("br"));
        pane.appendChild(dojo.doc.createElement("br"));
        
        // radio button for "value"
        var value = new dijit.form.RadioButton({
            name: "itemType",
            value: "value",
            onClick: dojo.hitch(this, function(){this._showFields("value");})
        }).placeAt(pane);
        
        // label for value
        var labelVal = dojo.doc.createElement('label');
        dojo.attr(labelVal, "for", "value");
        dojo.attr(labelVal, "innerHTML", "Value (JSON):")
        pane.appendChild(labelVal);
       
         // container for value fields
        var valueDiv = dojo.doc.createElement("div");
        dojo.addClass(valueDiv, "value");
             
        // textarea
        var textarea = new dijit.form.Textarea({
            name: "jsonVal",
            value: null,
        }).placeAt(valueDiv);
        pane.appendChild(valueDiv);
        
        // radio button for "reference"
        var reference = new dijit.form.RadioButton({
            name: "itemType",
            value: "reference",
            onClick: dojo.hitch(this, function(){this._showFields("reference");})
        }).placeAt(pane);
        
        // label for reference
        var labelRef = dojo.doc.createElement('label');
        dojo.attr(labelRef, "for", "_reference");
        dojo.attr(labelRef, "innerHTML", "Reference:")
        pane.appendChild(labelRef);
        pane.appendChild(dojo.doc.createElement("br"));
        
        // container for reference fields
        var refDiv = dojo.doc.createElement("div");
        dojo.addClass(refDiv, "reference");
        
        // filteringselect
        // TODO: see if there is a way to sort the items in this list
        var refSelect = new dijit.form.FilteringSelect({
            name: "_reference",
            store: this.store,
            searchAttr: this.store.getIdentityAttributes()[0],
            required: false,
            pageSize: 10
        }).placeAt(refDiv);
        pane.appendChild(refDiv);
        // this is a hack... since dijit.form.FilteringSelect doesn't reset properly
        // see http://bugs.dojotoolkit.org/ticket/8214
        dojo.connect(this._editDialog, "reset", refSelect, function(){this.attr("value", null);});
        pane.appendChild(dojo.doc.createElement("br"));
        pane.appendChild(dojo.doc.createElement("br"));
        
        // buttons
        var buttons = document.createElement('div');
        buttons.setAttribute("dir", "rtl");
        var cancelButton = new dijit.form.Button({type: "reset", label: "Cancel"}).placeAt(buttons);
        cancelButton.onClick = dojo.hitch(this._editDialog, "hide");
        //cancelButton.onClick = dojo.hitch(this, function(){dijit.popup.close(this._editDialog);});
        var okButton = new dijit.form.Button({type: "submit", label: "OK"}).placeAt(buttons);
        pane.appendChild(buttons);
        
        this._editDialog.attr("content", pane);
    },  
    _showFields: function(selection){
        switch (selection){
            case "reference":
                dojo.query(".value [widgetId]", this._editDialog.containerNode).map(dijit.byNode).attr("disabled","disabled");
                dojo.query(".reference [widgetId]", this._editDialog.containerNode).map(dijit.byNode).attr("disabled","");
                break;
            case "value":
                dojo.query(".value [widgetId]", this._editDialog.containerNode).map(dijit.byNode).attr("disabled","");
                dojo.query(".reference [widgetId]", this._editDialog.containerNode).map(dijit.byNode).attr("disabled","disabled");
                break;
        }
    },
    _updateItem: function(){
        // a single execute function that figures out what to do with a reference or a value.
        var node = this.lastFocused;
        var item = node.item;
        var propPath = '';
        var vals = this._editDialog.attr("value");
        var val = null;
        switch (vals.itemType){
            case "reference":
                val = this.store._getItemByIdentity(vals._reference);
                break;
            case "value":
            	var jsonVal = vals.jsonVal;
                val = dojo.fromJson(jsonVal);
                // if it is a function we want to preserve the source (comments, et al)
                if(typeof val == 'function'){
                	val.toString = function(){
                		return jsonVal;
                	}
                }
                break;
        }
        while (!this.store.isItem(item.parent)){
            node = node.getParent();
            if(propPath){
                propPath = item.property + '[' + propPath + ']';
            }else{
                propPath = item.property;
            }
            item = node.item;
        }
        if(propPath){
            var itemVal = this.store.getValues(item.parent, item.property);
            itemVal[propPath] = val;
            this.store.setValue(item.parent, item.property, itemVal);
        }else{
            this.store.setValue(item.parent, item.property, val);
        }
        //dijit.popup.close(this._editDialog);
    },
    _editItem: function(item){
        //var item = dojo.delegate(dijit.getEnclosingWidget(e.target).item);       
        // not allowed to edit an item's id - so check for that and stop it.
        if(dojo.indexOf(this.store.getIdentityAttributes(), item.property) >= 0){
            alert("Cannot Edit an Identifier!");
            return;
        }
        
        if(!this._editDialog){
            this._createEditDialog();
        }else{
            this._editDialog.reset();
        }    
        
        if(this.store.isItem(item.value)){
            // root node || Item reference
            if(item.parent){
                // Item reference
                item.itemType = "reference";
                this._showFields(item.itemType);
                dojo.attr(dojo.query("h2", this._editDialog.containerNode)[0], "innerHTML", 'Reference (' + item.property + '):');
                item._reference = this.store.getIdentity(item.value);
                this._editDialog.attr("value", item);
                this._editDialog.show();
                //dijit.popup.open({popup: this._editDialog, around: e.target});
            } // else root node
        }else{
        	// dojo.isObject is not correct, it returns true for a function (which should be treated as a primitive)
            if(item.value && typeof item.value == 'object' && !(item.value instanceof Date)){
                // item.value is an object but it's NOT an item from the store
                // object - only allow editing on each property not on the node that represents the object/array
                // should anything happen? an alert perhaps?
            }else{
                // this is a primitive
                item.itemType = "value";
                this._showFields(item.itemType);
                item.jsonVal = typeof item.value == 'function' ?
                		// use the plain toString for functions, dojo.toJson doesn't support functions 
                		item.value.toString() :
                			item.value instanceof Date ?
                				// A json-ish form of a date:
                				'new Date("' + item.value + '")' : 
                				dojo.toJson(item.value);
                dojo.attr(dojo.query("h2", this._editDialog.containerNode)[0], "innerHTML", 'Property (' + item.property + '):');
                this._editDialog.attr("value", item);
                this._editDialog.show();
                //dijit.popup.open({popup: this._editDialog, around: e.target});
            }
        }
    }
});