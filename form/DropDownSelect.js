dojo.provide("dojox.form.DropDownSelect");

dojo.require("dijit.form.Button");
dojo.require("dijit.Menu");

dojo.require("dojo.data.ItemFileWriteStore");

dojo.declare("dojox.form.DropDownSelect", dijit.form.DropDownButton, {
	// summary:
	//		This is a "Styleable" select box - it is basically a DropDownButton which
	//		can take as its input a <select>.

	baseClass: "dojoxDropDownSelect",

	// store: 
	//		A store to keep track of our options internally
	store: null,
	
	// emptyLabel: string
	//		What to display in an "empty" dropdown
	emptyLabel: "",
	
	// _isPopulated: boolean
	//		Whether or not we have been populated
	_isPopulated: false,

	// _numSeps: number
	//		The number of separator we have added (to ensure uniqueness)
	_numSeps: 0,

	_addMenuItem: function(/* item */ item){
		// summary:
		//		For the given datastore item, add a menu item to our dropdown
		//		If the item doesn't have a label (or if the label is an empty
		//		string), then a separator is added in that place.
		var store = this.store, menu = this.dropDown;

		// Check that our item is loaded
		if(!store.isItemLoaded(item)){
			store.loadItem({item: item, 
							onComplete: function(i){
										this._addMenuItem(i);
							},
							onError: function(e){throw e;},
							scope: this});
			return;
		}
		if(!store.getLabel(item)){
			// We are a separator (no label set for it)
			menu.addChild(new dijit.MenuSeparator());
		}else{
			// Just a regular menu item
			var click = dojo.hitch(this, function(){this._setValue(item);});
			menu.addChild(new dijit.MenuItem({
									id: this.id + "_item_" + store.getIdentity(item),
									label: store.getLabel(item),
									onClick: click}));
		}
	},

	_resetMenu: function(){
		// summary:
		//		Resets the menu for whatever reason - making it "populatable" 
		//		again on the next click.
		var dropDown = this.dropDown;
		dojo.forEach(dropDown.getChildren(), function(i){
			i.destroyRecursive();
		});
		this._isPopulated = false;
	},

	_initializeDropdown: function(/* item or string, optional */ selected){
		// summary:
		//		Initializes the dropdown after a store has been set (or on 
		//		postcreate)
		this._setValue(selected);
		this.store.fetch({onComplete: function(items){
							var len = items.length;
							this.setAttribute("readOnly", (len === 1));
							this.setAttribute("disabled", (len === 0));
						},
						scope: this});
	},

	_updateSelectedState: function(){
		// summary:
		//		Sets the "selected" class on the item for styling purposes
		var val = this.value;
		if(val){
			var testId = this.id + "_item_" + val;
			dojo.forEach(this.dropDown.getChildren(), function(i){
				dojo[i.id === testId ? "addClass" : "removeClass"](i.domNode,
														this.baseClass + "SelectedOption");
			}, this);
		}
	},
	
	addOption: function(/* string? */ value, /* string? */ label){
		// summary:
		//		Adds an option to the end of the select.  If either value or 
		//		label are empty or missing, a separator is created instead.
		var store = this.store;
		if(!store.getFeatures()["dojo.data.api.Write"]){
			throw new Error("Cannot add or remove options from a non-writeable store");
		}
		if(!value || !label){
			// create a separator
			this._numSeps++;
			store.newItem({value: ("_separator-" + this._numSeps), name: ""});
		}else{
			store.newItem({value: value, name: label});
		}
	},
	
	removeOption: function(/* string or number */ valueOrIdx){
		// summary:
		//		Removes an option at the given value (if valueOrIndex is a 
		//		string) or at the given index in the menu (if valueOrIndex is
		//		a number)
		var store = this.store;
		if(!store.getFeatures()["dojo.data.api.Write"]){
			throw new Error("Cannot add or remove options from a non-writeable store");
		}
		var allItems = function(items){
			if(items[valueOrIdx]){
				store.deleteItem(items[valueOrIdx]);
			}
		};
		if(typeof valueOrIdx === "number"){
			// Remove by index
			store.fetch({onComplete: allItems});
		}else if(typeof valueOrIdx === "string") {
			// Remove by id
			store.fetchItemByIdentity({identity: valueOrIdx, 
									onItem: store.deleteItem,
									scope: store});
		}else{
			// Try to just remove it (in case we happened to be passed an 
			// item
			store.deleteItem(valueOrIdx);
		}		
	},

	_setValue: function(/* item or string, optional */ value){
		// summary:
		var store = this.store;
		
		// If a string is passed, then we set our value from looking it up
		// as the identity
		if(typeof value == "string" && value){
			store.fetchItemByIdentity({identity: value, 
									onItem: this._setValue, 
									scope: this});
			return;
		}
		
		// If we don't have a value, try to show the first item
		if(!value){
			var cb = function(items){
				if(items.length){
					this._setValue(items[0]);
				}else{
					this.value = "";
					this._handleOnChange(this.value);
					this.setLabel(this.emptyLabel || "&nbsp;");
				}
			};
			store.fetch({onComplete: cb, scope: this});
			return;
		}
		
		// We have a value, and we're an item - so load it and set from
		//  that.
		var onItem = dojo.hitch(this, function(i){
			this.value = store.getIdentity(i);
			this._handleOnChange(this.value);
			this.setLabel(store.getLabel(i));
		});
		if(store.isItem(value) && store.isItemLoaded(value)){
			onItem(value);
		}else if(store.isItem(value)) {
			store.loadItem({item: value, onItem: onItem});
		}
	},
	
	setAttribute: function(attr, value){
		// summary: sometime we get called to set our value - we need to 
		//			make sure and route those requests through _setValue()
		//			instead.
		if(attr === "value"){
			this._setValue(value);
			return;
		}
		this.inherited(arguments);
	},
	
	postMixInProperties: function(){
		// summary:  Loads our store and sets up our dropdown correctly

		if(!this.store){
			var items = this.srcNodeRef ? dojo.query(">", 
						this.srcNodeRef).map(function(i){
							if(i.getAttribute("type") === "separator"){
								this._numSeps++;
								return { value: ("_separator-" + this._numSeps),
										name: "" };
							}
							return { value: i.getAttribute("value"),
									name: String(i.innerHTML) };
						}, this) : [];
			this.store = new dojo.data.ItemFileWriteStore({data: {
															identifier: "value",
															label: "name",
															items: items}});

			// Set the value to be the first, or the selected index
			if(items && items.length && !this.value){
				var si = this.srcNodeRef.selectedIndex;
				this.value = items[si != -1 ? si : 0].value;
			}
		}
		this.inherited(arguments);
		dojo.place(dojo.doc.createElement("span"), this.srcNodeRef, "first");
	},

	postCreate: function(){
		// summary: sets up our event handling that we need for functioning
		//		as a select

		this._initializeDropdown(this.value);
		this.inherited(arguments);

		// Validate our store and make our notification connections
		var store = this.store;
		if(!store.getFeatures()["dojo.data.api.Identity"]){
			throw new Error ("dojox.form.DropDownSelect requires an Identity store");
		}
		if(store.getFeatures()["dojo.data.api.Notification"]){
			this.connect(store, "onNew", "_onNewItem");
			this.connect(store, "onDelete", "_onDeleteItem");
			this.connect(store, "onSet", "_onSetItem");
		}
		var fx = function(){
			dojo[this._opened ? "addClass" : "removeClass"](this.focusNode,
														this.baseClass + "ButtonOpened");
		};
		this.connect(this, "_openDropDown", fx);
		this.connect(this, "_closeDropDown", fx);
		this.connect(this, "onChange", "_updateSelectedState");
		
		// Create the dropDown widget
		this.dropDown = new dijit.Menu();
	},

	_populate: function(/* function */ callback){
		// summary: populates the menu (and does the callback, if passed)
		
		var dropDown = this.dropDown;
		
		// Re-fetch (or fetch) our items, and create MenuItems for them
		this.store.fetch({
			onItem: this._addMenuItem, 
			onComplete: function(){
				// Flag as populated and call the callback (if needed)
				this._updateSelectedState();
				dojo.addClass(this.dropDown.domNode, this.baseClass + "Menu");
				this._isPopulated = true;
				if(callback){ callback.call(this); }
			},
			scope: this
		});
	},
	
	_onNewItem: function(/* item */ item, /* Object? */ parentInfo){
		// summary: Called when a new item is added to our store
		this._resetMenu();
		this._initializeDropdown(this.value);
	},
	
	_onSetItem: function(/* item */ item){
		// summary: Called when an item has been set
		this._resetMenu();
		if(this.store.getIdentity(item) === this.value){
			this.setLabel(this.store.getLabel(item));
		}
	},
	
	_onDeleteItem: function(/* item */ item){
		// summary: Called when an item has been deleted from our store
		this._resetMenu();
		if(this.store.getIdentity(item) === this.value){
			this._initializeDropdown("");
		}
	},
	
	_toggleDropDown: function(){
		// summary: Overrides DropDownButton's toggle function to make sure 
		//			that the values are correctly populated.
		var dropDown = this.dropDown, store = this.store;
		if(dropDown && !dropDown.isShowingNow && !this._isPopulated){
			this._populate(dojox.form.DropDownSelect.superclass._toggleDropDown);
		}else{
			this.inherited(arguments);
		}
	}
});
