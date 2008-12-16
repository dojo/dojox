dojo.provide("dojox.data.tests.ItemExplorer");
dojo.require("dijit.Tree");
dojo.require("dijit.Dialog");
dojo.require("dijit.Menu");
dojo.require("dijit.form.ValidationTextBox");
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
							modelNode.addNew ? (modelNode.parent instanceof Array ? "Add new value" : "Add new property") : 
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
		dojo.connect(this, "onClick", function(modelNode, treeNode){
			if(modelNode.addNew){
				if(modelNode.parent instanceof Array){
	            	modelNode.property = modelNode.parent.length; 
	                this._editProperty();
	            }else{
	                this.focusNode(treeNode.getParent());
	                this._addProperty();
	            }
                
                // i have moved this to an _addProperty function so it can be used from
                // the context menu.  it also makes use of the dialog now.
                
				/*var propName = prompt("What is the name of the property you wish to add?","");
				if(propName){
					var value = prompt("What value do you want for the property (as a JSON value like 3, true, \"a string\")?");
				}
				if(propName && value){
					self.store.setValue(modelNode.parent, propName, dojo.fromJson(value));
					self.model.getChildren(modelNode.parentNode, function(children){
						self.model.onChildrenChange(modelNode.parentNode, children);
					});
				}*/
			}else{
                this._editProperty();
            }
		});
        this._createContextMenu();		
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
           title: "Edit Property",
           execute: dojo.hitch(this, "_updateItem"),
           preload: true
        });
        this._editDialog.placeAt(dojo.body());  
        this._editDialog.startup();
        
        // handle for dialog content
        var pane = dojo.doc.createElement('div');
        
        // label for property
        var labelProp = dojo.doc.createElement('label');
        dojo.attr(labelProp, "for", "property");
        dojo.style(labelProp, "fontWeight", "bold");
        dojo.attr(labelProp, "innerHTML", "Property:")
        pane.appendChild(labelProp);

        // property name field
        var propName = new dijit.form.ValidationTextBox({
            name: "property",
            value: "",
            required: true,
            disabled: true
        }).placeAt(pane);
        
        pane.appendChild(dojo.doc.createElement("br"));
        pane.appendChild(dojo.doc.createElement("br"));
        
        // radio button for "value"
        var value = new dijit.form.RadioButton({
            name: "itemType",
            value: "value",
            onClick: dojo.hitch(this, function(){this._enableFields("value");})
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
            onClick: dojo.hitch(this, function(){this._enableFields("reference");})
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
        // this is a hack... since dijit.form.FilteringSelect doesn't reset to a blank
        // see http://bugs.dojotoolkit.org/ticket/8214
        dojo.connect(this._editDialog, "reset", refSelect, function(){this.attr("value", null);});
        pane.appendChild(dojo.doc.createElement("br"));
        pane.appendChild(dojo.doc.createElement("br"));
        
        // buttons
        var buttons = document.createElement('div');
        buttons.setAttribute("dir", "rtl");
        var cancelButton = new dijit.form.Button({type: "reset", label: "Cancel"}).placeAt(buttons);
        cancelButton.onClick = dojo.hitch(this._editDialog, "onCancel");
        var okButton = new dijit.form.Button({type: "submit", label: "OK"}).placeAt(buttons);
        pane.appendChild(buttons);
        
        this._editDialog.attr("content", pane);
    }, 
    _createContextMenu: function(){
        // TODO: we could add icons to this if we wanted
        this._contextMenu = new dijit.Menu({
            targetNodeIds: [this.rootNode.domNode], 
            id: "contextMenu"
            });
        dojo.connect(this._contextMenu, "_openMyself", this, function(e){
            var node = dijit.getEnclosingWidget(e.target);
            if(node){
                var item = node.item;
                if(this.store.isItem(item.value) && !item.parent){
                    this._contextMenu.getChildren().forEach(function(widget){
                        widget.attr("disabled", (widget.label != "Add"));
                    });
                    this.lastFocused = node;
                    // TODO: Root Node - allow Edit when mutli-value editing is possible
                } else if(item.value && typeof item.value == 'object' && !(item.value instanceof Date) 
                        && !this.store.isItem(item.value)){ // an object that's not an item or Date 
                    this._contextMenu.getChildren().forEach(function(widget){
                        widget.attr("disabled", (widget.label != "Add") && (widget.label != "Delete"));
                    });
                    this.lastFocused = node;
                    // TODO: Object - allow Edit when mutli-value editing is possible
                } else if(item.property && dojo.indexOf(this.store.getIdentityAttributes(), item.property) >= 0){ // id node
                    this.focusNode(node);
                    alert("Cannot modify an Identifier node.");
                } else if(item.addNew) {
                    this.focusNode(node);
                }else{
                    this._contextMenu.getChildren().forEach(function(widget){
                        widget.attr("disabled", false);
                    })
                    // this won't focus the node but gives us a way to reference the node
                    this.lastFocused = node;
                    // dojo.stopEvent(e);
                }
            }

        });
        this._contextMenu.addChild(new dijit.MenuItem({label: "Add", onClick: dojo.hitch(this, "_addProperty")}));
        this._contextMenu.addChild(new dijit.MenuItem({label: "Edit", onClick: dojo.hitch(this, "_editProperty")}));
        this._contextMenu.addChild(new dijit.MenuItem({label: "Delete", onClick: dojo.hitch(this, "_destroyProperty")}));
        this._contextMenu.startup();
    },
    _enableFields: function(selection){
        // enables/disables fields based on whether the value in this._editDialog is a reference or a primitive value
        switch(selection){
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
    _updateItem: function(vals){
        // a single execute function that handles adding and editing of values and references.
        var itemVal,editingItem = dojo.query("input[name='property']", this._editDialog.containerNode).map(dijit.getEnclosingWidget)[0].attr("disabled");
        if(this._editDialog.validate()){
            var node = this.lastFocused;
            if(node.item.addNew && !(node.item.parent instanceof Array)) {
                // the dialog refocused the Add new Property node!
                // except we don't refocus when the parent is an array (not sure why it is refocused otherwise)
                node = node.getParent();
            }
            var item = node.item;
            var val = null;
            switch(vals.itemType){
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
            var propPath;
            if(editingItem){
                // the while loop below is also used in _destroyProperty and
                // it might be tempting to put this in a _getPropPath but the rest of
                // the code depends on the item being changed and so this would need
                // to be taken into account if this is moved to a separate function
                while(!this.store.isItem(item.parent)  || item.parent instanceof Array){
                    node = node.getParent();
                    if(propPath){
                        propPath = item.property + '[' + propPath + ']';
                    }else{
                        propPath = item.property;
                    }
                    item = node.item;
                }
                if(!propPath){
                    // working with an item attribute already
                    this.store.setValue(item.parent, item.property, val);
                }else{
                    // need to work back down the item to the property
                    itemVal = this.store.getValues(item.parent, item.property);
                    if(itemVal instanceof Array){
                    	// create a copy for modification
                    	itemVal = itemVal.concat();
                    }
                    itemVal[propPath] = val;
                    this.store.setValue(item.parent, item.property, itemVal);
                }              
            }else{
                // adding a property
                if(this.store.isItem(item.value) && !(item.value instanceof Array)) {
                    // adding a top-level property to an item
                    this.store.setValue(item.value, propPath, val);
                }else{
                    // adding a property to a lower level in an item
                    while(!this.store.isItem(item.parent)  || (item.parent instanceof Array)){
                        node = node.getParent();
                        if(propPath){
                            propPath = item.property + '[' + propPath + ']';
                        }else{
                            propPath = item.property;
                        }
                        item = node.item;
                    }
                    itemVal = this.store.getValues(item.parent, item.property);
                    itemVal[propPath] = val;
                    this.store.setValue(item.parent, item.property, itemVal);
                }
            }
            dojo.query("input[name='property']", this._editDialog.containerNode).map(dijit.getEnclosingWidget)[0].attr("disabled", true);
        }else{
            // the form didn't validate - show it again.
            this._editDialog.show();
        }
    },
    _editProperty: function(){
        var item = this.lastFocused.item;
        // create the dialog or reset it if it already exists
        if(!this._editDialog){
            this._createEditDialog();
        }else{
            this._editDialog.reset();
        }
        var editingItem = dojo.query("input[name='property']", this._editDialog.containerNode).map(dijit.getEnclosingWidget)[0].attr("disabled");
        if(editingItem){
            // not allowed to edit an item's id - so check for that and stop it.
            if(dojo.indexOf(this.store.getIdentityAttributes(), item.property) >= 0){
                alert("Cannot Edit an Identifier!");
            }else{
                this._editDialog.attr("title", "Edit Property");
                if(this.store.isItem(item.value)){
                    // root node || Item reference
                    if(item.parent){
                        // Item reference
                        item.itemType = "reference";
                        this._enableFields(item.itemType);
                        item._reference = this.store.getIdentity(item.value);
                        this._editDialog.attr("value", item);
                        this._editDialog.show();
                    } // else root node
                }else{
                	// dojo.isObject is not correct, it returns true for a function (which should be treated as a primitive)
                    if(item.value && typeof item.value == 'object' && !(item.value instanceof Date)){
                        // item.value is an object but it's NOT an item from the store
                        // only allow editing on each property not on the node that represents the object/array
                    }else{
                        // this is a primitive
                        item.itemType = "value";
                        this._enableFields(item.itemType);
                        item.jsonVal = typeof item.value == 'function' ?
                        		// use the plain toString for functions, dojo.toJson doesn't support functions 
                        		item.value.toString() :
                        			item.value instanceof Date ?
                        				// A json-ish form of a date:
                        				'new Date("' + item.value + '")' : 
                        				dojo.toJson(item.value);
                        this._editDialog.attr("value", item);
                        this._editDialog.show();
                    }
                }
            }
        }else{
            // adding a property
            this._editDialog.attr("title", "Add Property");
            // default to a value type
            this._enableFields("value");
            this._editDialog.attr("value", {itemType: "value"});
            this._editDialog.show();
        }
    },
    _destroyProperty: function(){
        // something is not quite right...
        // the tree needs notification(?) for this to work properly.  when an array element is
        // deleted, the index (item.property) in the tree is not updated with the new indexes 
        // and so if an element has been deleted and the array has been re-indexed then the wrong 
        // element will be deleted on the next delete since the old index will be used to select 
        // which element to delete.
        // Also...
        // item attributes are shown in the tree as "undefined" after they have been deleted
        // and...
        // using explore_ItemFileWriteStore.html if you select "Africa" in the grid and delete the
        // "type" property of "Egypt" (ie the "type" property of Africa's children[0] element)
        // then the rest of the properties for "Egypt" disappear... this can also be seen by selecting
        // "Egypt" in the grid, deleting the "type" property and then selecting "Africa" in the grid
        // and look at Africa's children[0].
        var node = this.lastFocused;
        var item = node.item; // ??? - this is probably ok
        var itemTarget = item;
        var propPath = '';
        while(!this.store.isItem(item.parent) || item.parent instanceof Array){
            node = node.getParent();
            if(propPath){
                propPath = item.property + '[' + propPath + ']';
            }else{
                propPath = item.property;
            }
            item = node.item;
        }
        // we have to walk up the tree before we can know if we're working with the identifier
        // this will actually prevent the identifier from being changed in any way at all.
        if(dojo.indexOf(this.store.getIdentityAttributes(), item.property) >= 0){
            alert("Cannot Delete an Identifier!");
        }else{
            if(propPath){
                // not deleting a top-level property of an item so get the top-level store item to edit
                var itemVal = this.store.getValues(item.parent, item.property);
                if(dojo.isArray(itemTarget.parent)){ // ??? - this is probably ok
                    // the value being deleted represents the top-level of an array element
                    var index = parseInt(itemTarget.property); // ??? - this is probably ok
                    if(propPath.lastIndexOf("[") >= 0){
                        // remove the index from the property path
                        propPath = propPath.substring(0, propPath.lastIndexOf("["));
                        itemVal[propPath] = itemVal[propPath].concat().splice(index,1);
                    }else{
                        // the index is the only thing in the property path - so don't use the path at all
                        itemVal = itemVal.concat().splice(index,1);
                    }
                }else{
                    // delete the object property
                    delete itemVal[propPath];
                }
                // save it back to the store
                this.store.setValue(item.parent, item.property, itemVal);
            }else{
                // deleting an item property
                this.store.unsetAttribute(item.parent, item.property);
            }       
        }
    },
    _addProperty: function(){
        var item = this.lastFocused.item;
        if(item.property && dojo.indexOf(this.store.getIdentityAttributes(), item.property) >= 0) {
            alert("Cannot add properties to this node!");
        }else{
            if(!this._editDialog) {
                this._createEditDialog();
            }
            // enable the property TextBox
            dojo.query("input[name='property']", this._editDialog.containerNode).map(dijit.getEnclosingWidget)[0].attr("disabled", false);
            // call this._editProperty
            this._editProperty();
        }
    }
});
