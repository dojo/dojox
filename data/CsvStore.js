dojo.provide("dojox.data.CsvStore");

dojo.require("dojo.data.util.filter");
dojo.require("dojo.data.util.simpleFetch");

dojo.declare("dojox.data.CsvStore",
	null,
	function(/* Object */ keywordParameters){
		// summary: initializer
		// keywordParameters: {url: String}
		// keywordParameters: {data: String}
		
		this._attributes = [];			// e.g. ["Title", "Year", "Producer"]
		this._attributeIndexes = {};	// e.g. {Title: 0, Year: 1, Producer: 2}
 		this._dataArray = [];			// e.g. [[<Item0>],[<Item1>],[<Item2>]]
 		this._arrayOfAllItems = [];		// e.g. [{_csvId:0,_csvStore:store},...]
		this._loadFinished = false;
		this._csvFileUrl = keywordParameters.url;
		this._csvData = keywordParameters.data;
		this._storeProp = "_csvStore";	// Property name for the store reference on every item.
		this._idProp = "_csvId"; 		// Property name for the Item Id on every item.
		this._features = {	'dojo.data.api.Read': true,
							'dojo.data.api.Identity': true };
	},{
	//	summary:
	//		The CsvStore implements the dojo.data.api.Read API and reads
	//		data from files in CSV (Comma Separated Values) format.
	//		All values are simple string values. References to other items
	//		are not supported as attribute values in this datastore.
	//
	//		Example data file:
	//		name, color, age, tagline
	//		Kermit, green, 12, "Hi, I'm Kermit the Frog."
	//		Fozzie Bear, orange, 10, "Wakka Wakka Wakka!"
	//		Miss Piggy, pink, 11, "Kermie!"
	//
	//		Note that values containing a comma must be enclosed with quotes ("")
	//		Also note that values containing quotes must be escaped with two consecutive quotes (""quoted"")
	
	/* examples:
	 *   var csvStore = new dojox.data.CsvStore({url:"movies.csv");
	 *   var csvStore = new dojox.data.CsvStore({url:"http://example.com/movies.csv");
	 */

	_assertIsItem: function(/* item */ item){
		//	summary:
		//      This function tests whether the item passed in is indeed an item in the store.
		//	item: 
		//		The item to test for being contained by the store.
		if(!this.isItem(item)){ 
			throw new Error("dojox.data.CsvStore: a function was passed an item argument that was not an item");
		}
	},
	
	_assertIsAttribute: function(/* item || String */ attribute){
		//	summary:
		//      This function tests whether the item passed in is indeed a valid 'attribute' like type for the store.
		//	attribute: 
		//		The attribute to test for being contained by the store.
		if(!dojo.isString(attribute)){ 
			throw new Error("dojox.data.CsvStore: a function was passed an attribute argument that was not an attribute object nor an attribute name string");
		}
	},
	

/***************************************
     dojo.data.api.Read API
***************************************/
	getValue: function(	/* item */ item, 
						/* attribute || attribute-name-string */ attribute, 
						/* value? */ defaultValue){
		//	summary: 
		//      See dojo.data.api.Read.getValue()
		//		Note that for the CsvStore, an empty string value is the same as no value, 
		// 		so the defaultValue would be returned instead of an empty string.
		this._assertIsItem(item);
		this._assertIsAttribute(attribute);
		var itemValue = defaultValue;
		if(this.hasAttribute(item, attribute)){
			var itemData = this._dataArray[this.getIdentity(item)];
			itemValue = itemData[this._attributeIndexes[attribute]];
		}
		return itemValue; //String
	},

	getValues: function(/* item */ item, 
						/* attribute || attribute-name-string */ attribute){
		//	summary: 
		//		See dojo.data.api.Read.getValues()
		// 		CSV syntax does not support multi-valued attributes, so this is just a
		// 		wrapper function for getValue().
		var value = this.getValue(item, attribute);
		return (value ? [value] : []); //Array
	},

	getAttributes: function(/* item */ item){
		//	summary: 
		//		See dojo.data.api.Read.getAttributes()
		this._assertIsItem(item);
		var attributes = [];
		var itemData = this._dataArray[this.getIdentity(item)];
		for(var i=0; i<itemData.length; i++){
			// Check for empty string values. CsvStore treats empty strings as no value.
			if(itemData[i] != ""){
				attributes.push(this._attributes[i]);
			}
		}
		return attributes; //Array
	},

	hasAttribute: function(	/* item */ item,
							/* attribute || attribute-name-string */ attribute){
		//	summary: 
		//		See dojo.data.api.Read.hasAttribute()
		// 		The hasAttribute test is true if attribute has an index number within the item's array length
		// 		AND if the item has a value for that attribute. Note that for the CsvStore, an
		// 		empty string value is the same as no value.
		this._assertIsItem(item);
		this._assertIsAttribute(attribute);
		var attributeIndex = this._attributeIndexes[attribute];
		var itemData = this._dataArray[this.getIdentity(item)];
		return (typeof attributeIndex != "undefined" && attributeIndex < itemData.length && itemData[attributeIndex] != ""); //Boolean
	},

	containsValue: function(/* item */ item, 
							/* attribute || attribute-name-string */ attribute, 
							/* anything */ value){
		//	summary: 
		//		See dojo.data.api.Read.containsValue()
		return this._containsValue(item,attribute,value,false); //boolean
	},

	_containsValue: function(	/* item */ item, 
								/* attribute || attribute-name-string */ attribute, 
								/* anything */ value,
								/* boolean */ ignoreCase){
		//	summary: 
		//		Internal function for looking at the values contained by the item.
		//	description: 
		//		Internal function for looking at the values contained by the item.  This 
		//		function allows for denoting if the comparison should be case sensitive for
		//		strings or not (for handling filtering cases where string case should not matter)
		//	
		//	item:
		//		The data item to examine for attribute values.
		//	attribute:
		//		The attribute to inspect.
		//	value:	
		//		The value to match, strings may contain wildcard items like * and ?.
		//	ignoreCase:
		//		Flag to denote that if items are a string type, should case be used for comparison or not.
		var possibleValue = this.getValue(item, attribute);
		if(typeof value === "string" && typeof possibleValue != "undefined"){
			return (possibleValue.match(dojo.data.util.filter.patternToRegExp(value, ignoreCase)) !== null); //Boolean
		}
		return false; // Boolean
	},

	isItem: function(/* anything */ something){
		//	summary: 
		//		See dojo.data.api.Read.isItem()
		if(something && something[this._storeProp] === this){
			var identity = something[this._idProp];
			if(identity >= 0 && identity < this._dataArray.length){
				return true; //Boolean
			}
		}
		return false; //Boolean
	},

	isItemLoaded: function(/* anything */ something){
		//	summary: 
		//		See dojo.data.api.Read.isItemLoaded()
		//		The CsvStore always loads all items, so if it's an item, then it's loaded.
		return this.isItem(something); //Boolean
	},

	loadItem: function(/* item */ item){
		//	summary: 
		//		See dojo.data.api.Read.loadItem()
		//	description:
		//		The CsvStore always loads all items, so if it's an item, then it's loaded.
		//		From the dojo.data.api.Read.loadItem docs:
		//			If a call to isItemLoaded() returns true before loadItem() is even called,
		//			then loadItem() need not do any work at all and will not even invoke
		//			the callback handlers.
	},

	getFeatures: function(){
		//	summary: 
		//		See dojo.data.api.Read.getFeatures()
		return this._features; //Object
	},

	// The dojo.data.api.Read.fetch() function is implemented as
	// a mixin from dojo.data.util.simpleFetch.
	// That mixin requires us to define _fetchItems().
	_fetchItems: function(	/* Object */ keywordArgs, 
							/* Function */ findCallback, 
							/* Function */ errorCallback){
		//	summary: 
		//		See dojo.data.util.simpleFetch.fetch()
		
		var self = this;
		var filter = function(requestArgs, arrayOfAllItems){
			var items = null;
			if(requestArgs.query){
				items = [];
				for(var i = 0; i < arrayOfAllItems.length; ++i){
					var match = true;
					var candidateItem = arrayOfAllItems[i];
					for(var key in requestArgs.query){
						var value = requestArgs.query[key];
						if(!self._containsValue(candidateItem, key, value, requestArgs.queryIgnoreCase)){
							match = false;
						}
					}
					if(match){
						items.push(candidateItem);
					}
				}
			}else{
				// We want a copy to pass back in case the parent wishes to sort the array.  We shouldn't allow resort 
				// of the internal list so that multiple callers can get lists and sort without affecting each other.
				if(arrayOfAllItems.length> 0){
					items = arrayOfAllItems.slice(0,arrayOfAllItems.length); 
				}
			}
			findCallback(items, requestArgs);
		};

		if(this._loadFinished){
			filter(keywordArgs, this._dataArray);
		}else{
			if(this._csvFileUrl){
				var getArgs = {
						url: self._csvFileUrl, 
						handleAs: "text"
					};
				var getHandler = dojo.xhrGet(getArgs);
				getHandler.addCallback(function(data){
					self._processData(data);
					filter(keywordArgs, self._arrayOfAllItems);
				});
				getHandler.addErrback(function(error){
					throw error;
				});
			}else if(this._csvData){
				this._processData(this._csvData);
				this._csvData = null;
				filter(keywordArgs, this._arrayOfAllItems);
			}else{
				throw new Error("dojox.data.CsvStore: No CSV source data was provided as either URL or String data input.");
			}
		}
	},
	
	close: function(/*dojo.data.api.Request || keywordArgs || null */ request){
		 //	summary: 
		 //		See dojo.data.api.Read.close()
	},
	
	
	// -------------------------------------------------------------------
	// Private methods
	_getArrayOfArraysFromCsvFileContents: function(/* string */ csvFileContents){
		/* summary:
		 *   Parses a string of CSV records into a nested array structure.
		 * description:
		 *   Given a string containing CSV records, this method parses
		 *   the string and returns a data structure containing the parsed
		 *   content.  The data structure we return is an array of length
		 *   R, where R is the number of rows (lines) in the CSV data.  The 
		 *   return array contains one sub-array for each CSV line, and each 
		 *   sub-array contains C string values, where C is the number of 
		 *   columns in the CSV data.
		 */
		 
		/* example:
		 *   For example, given this CSV string as input:
		 *     "Title, Year, Producer \n Alien, 1979, Ridley Scott \n Blade Runner, 1982, Ridley Scott"
		 *   this._dataArray will be set to:
		 *     [["Alien", "1979", "Ridley Scott"],
		 *      ["Blade Runner", "1982", "Ridley Scott"]]
		 *   And this._attributes will be set to:
		 *     ["Title", "Year", "Producer"]
		 *   And this._attributeIndexes will be set to:
		 *     { "Title":0, "Year":1, "Producer":2 }
		 */
		if(dojo.isString(csvFileContents)){
			var lineEndingCharacters = new RegExp("\r\n|\n|\r");
			var leadingWhiteSpaceCharacters = new RegExp("^\\s+",'g');
			var trailingWhiteSpaceCharacters = new RegExp("\\s+$",'g');
			var doubleQuotes = new RegExp('""','g');
			var arrayOfOutputRecords = [];
			
			var arrayOfInputLines = csvFileContents.split(lineEndingCharacters);
			for(var i = 0; i < arrayOfInputLines.length; ++i){
				var singleLine = arrayOfInputLines[i];
				if(singleLine.length > 0){
					var listOfFields = singleLine.split(',');
					var j = 0;
					while(j < listOfFields.length){
						var space_field_space = listOfFields[j];
						var field_space = space_field_space.replace(leadingWhiteSpaceCharacters, ''); // trim leading whitespace
						var field = field_space.replace(trailingWhiteSpaceCharacters, ''); // trim trailing whitespace
						var firstChar = field.charAt(0);
						var lastChar = field.charAt(field.length - 1);
						var secondToLastChar = field.charAt(field.length - 2);
						var thirdToLastChar = field.charAt(field.length - 3);
						if((firstChar == '"') && 
								((lastChar != '"') || 
								 ((lastChar == '"') && (secondToLastChar == '"') && (thirdToLastChar != '"')))){
							if(j+1 === listOfFields.length){
								// alert("The last field in record " + i + " is corrupted:\n" + field);
								return null; //null
							}
							var nextField = listOfFields[j+1];
							listOfFields[j] = field_space + ',' + nextField;
							listOfFields.splice(j+1, 1); // delete element [j+1] from the list
						}else{
							if((firstChar == '"') && (lastChar == '"')){
								field = field.slice(1, (field.length - 1)); // trim the " characters off the ends
								field = field.replace(doubleQuotes, '"');   // replace "" with "
							}
							listOfFields[j] = field;
							j += 1;
						}
					}
					arrayOfOutputRecords.push(listOfFields);
				}
			}
			
			// The first item of the array must be the header row with attribute names.
			this._attributes = arrayOfOutputRecords.shift();
			for(var i=0; i<this._attributes.length; i++){
				// Store the index of each attribute 
				this._attributeIndexes[this._attributes[i]] = i;
			}
			this._dataArray = arrayOfOutputRecords; //Array
		}
	},
	
	_processData: function(/* String */ data){
		this._loadFinished = true;
		this._getArrayOfArraysFromCsvFileContents(data);
		this._arrayOfAllItems = [];
		for(var i=0; i<this._dataArray.length; i++){
			this._arrayOfAllItems.push(this._createItemFromIdentity(i));
		}
	},
	
	_createItemFromIdentity: function(/* String */ identity){
		var item = {};
		item[this._storeProp] = this;
		item[this._idProp] = identity;
		return item; //Object
	},
	
	
/***************************************
     dojo.data.api.Identity API
***************************************/
	getIdentity: function(/* item */ item){
		//	summary: 
		//		See dojo.data.api.Identity.getIdentity()
		if(this.isItem(item)){
			return item[this._idProp]; //String
		}
		return null; //null
	},

	getItemByIdentity: function(/* String */ identity){
		//	summary: 
		//		See dojo.data.api.Identity.getItemByIdentity()

		// Force a sync'ed load if it hasn't occurred yet
		if(!this._loadFinished){
			this._forceLoad();
		}
		// First create an item from the identity, then make sure
		// that the identity is part of this datastore.
		var item = this._createItemFromIdentity(identity);
		if(this.isItem(item)){
			return item; //Object
		}
		return null; //null
	},

	_forceLoad: function(){
		//	summary: 
		//		Internal function to force a load of the store if it hasn't occurred yet.  This is required
		//		for specific functions to work properly.  See dojo.data.api.Identity.getItemByIdentity()
		var self = this;
		if(this._csvFileUrl){
			var getArgs = {
					url: self._csvFileUrl, 
					handleAs: "text",
					sync: true
				};
			var getHandler = dojo.xhrGet(getArgs);
			getHandler.addCallback(function(data){
				self._processData(data);
			});
			getHandler.addErrback(function(error){
				throw error;
			});
		}else if(this._csvData){
			self._processData(data);
			self._csvData = null;
		} 
	}
});
//Mix in the simple fetch implementation to this class.
dojo.extend(dojox.data.CsvStore,dojo.data.util.simpleFetch);
