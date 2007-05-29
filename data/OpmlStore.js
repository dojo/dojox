dojo.provide("dojox.data.OpmlStore");

dojo.require("dojo.data.util.filter");
dojo.require("dojo.data.util.simpleFetch");

dojo.declare("dojox.data.OpmlStore",
	null,
	function(/* Object */ keywordParameters){
		// summary: initializer
		// keywordParameters: {url: String}
		this._xmlData = null;
		this._arrayOfTopLevelItems = [];
		this._metadataNodes = null;
		this._loadFinished = false;
		this._opmlFileUrl = keywordParameters.url;
		this._opmlData = keywordParameters.data;  // XML DOM Document
	},{
	/* summary:
	 *   The OpmlStore implements the dojo.data.api.Read API.  
	 */
	 
	/* examples:
	 *   var opmlStore = new dojo.data.OpmlStore({url:"geography.xml"});
	 *   var opmlStore = new dojo.data.OpmlStore({url:"http://example.com/geography.xml"});
	 */
	_assertIsItem: function(/* item */ item){
		if(!this.isItem(item)){ 
			throw new Error("dojo.data.OpmlStore: a function was passed an item argument that was not an item");
		}
	},
	
	_assertIsAttribute: function(/* item || String */ attribute){
		//	summary:
		//      This function tests whether the item passed in is indeed a valid 'attribute' like type for the store.
		//	attribute: 
		//		The attribute to test for being contained by the store.
		if(!dojo.isString(attribute)){
			throw new Error("dojox.data.OpmlStore: a function was passed an attribute argument that was not an attribute object nor an attribute name string");
		}
	},
	
	_removeChildNodesThatAreNotElementNodes: function(/* node */ node, /* boolean */ recursive){
		var childNodes = node.childNodes;
		if(childNodes.length == 0){
			return;
		}
		var nodesToRemove = [];
		var i, childNode;
		for(i = 0; i < childNodes.length; ++i){
			childNode = childNodes[i];
			if(childNode.nodeType != 1){ 
				nodesToRemove.push(childNode); 
			}
		};
		for(i = 0; i < nodesToRemove.length; ++i){
			childNode = nodesToRemove[i];
			node.removeChild(childNode);
		}
		if(recursive){
			for(i = 0; i < childNodes.length; ++i){
				childNode = childNodes[i];
				this._removeChildNodesThatAreNotElementNodes(childNode, recursive);
			}
		}
	},
	
	_processRawXmlTree: function(/* xmlDoc */ rawXmlTree){
		this._loadFinished = true;
		this._xmlData = rawXmlTree;
		var headNodes = rawXmlTree.getElementsByTagName('head');
		var headNode = headNodes[0];
		if(headNode){
			this._removeChildNodesThatAreNotElementNodes(headNode);
			this._metadataNodes = headNode.childNodes;
		}
		var bodyNodes = rawXmlTree.getElementsByTagName('body');
		var bodyNode = bodyNodes[0];
		if(bodyNode){
			this._removeChildNodesThatAreNotElementNodes(bodyNode, true);
			
			var bodyChildNodes = bodyNodes[0].childNodes;
			for(var i = 0; i < bodyChildNodes.length; ++i){
				var node = bodyChildNodes[i];
				if(node.tagName == 'outline'){
					this._arrayOfTopLevelItems.push(node);
				}
			}
		}
	},

/***************************************
     dojo.data.api.Read API
***************************************/
	getValue: function( /* item */ item,
						/* attribute || attribute-name-string */ attribute,
						/* value? */ defaultValue){
		//	summary: 
		//      See dojo.data.api.Read.getValue()
		this._assertIsItem(item);
		this._assertIsAttribute(attribute);
		if(attribute == 'children'){
			return (item.firstChild || defaultValue); //Object
		} else {
			var value = item.getAttribute(attribute);
			return (value != undefined) ? value : defaultValue; //Object
		}
	},
	
	getValues: function(/* item */ item,
						/* attribute || attribute-name-string */ attribute){
		//	summary: 
		//		See dojo.data.api.Read.getValues()
		this._assertIsItem(item);
		this._assertIsAttribute(attribute);
		var array = [];
		if(attribute == 'children'){
			for(var i = 0; i < item.childNodes.length; ++i){
				array.push(item.childNodes[i]);
			}
		} else if(item.getAttribute(attribute) !== null){
				array.push(item.getAttribute(attribute));
		}
		return array; // Array
	},
	
	getAttributes: function(/* item */ item){
		//	summary: 
		//		See dojo.data.api.Read.getAttributes()
		this._assertIsItem(item);
		var attributes = [];
		var xmlNode = item;
		var xmlAttributes = xmlNode.attributes;
		for(var i = 0; i < xmlAttributes.length; ++i){
			var xmlAttribute = xmlAttributes.item(i);
			attributes.push(xmlAttribute.nodeName);
		}
		if(xmlNode.childNodes.length > 0){
			attributes.push('children');
		}
		return attributes; //Array
	},
	
	hasAttribute: function( /* item */ item,
							/* attribute || attribute-name-string */ attribute){
		//	summary: 
		//		See dojo.data.api.Read.hasAttribute()
		return (this.getValues(item, attribute).length > 0); //Boolean
	},
	
	containsValue: function(/* item */ item, 
							/* attribute || attribute-name-string */ attribute, 
							/* anything */ value){
		//	summary: 
		//		See dojo.data.api.Read.containsValue()
		return this._containsValue(item,attribute,value,false); //Boolean
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
		
		var values = this.getValues(item, attribute);
		for(var i = 0; i < values.length; ++i){		
			var possibleValue = values[i];
			if(typeof value === "string" && typeof possibleValue === "string"){
				return (possibleValue.match(dojo.data.util.filter.patternToRegExp(value, ignoreCase)) !== null); //Boolean
			}else if(possibleValue === value){
				return true; //Boolean
			}
		}
		return false; //Boolean
	},
			
	isItem: function(/* anything */ something){
		//	summary: 
		//		See dojo.data.api.Read.isItem()
		//	description:
		//		Four things are verified to ensure that "something" is an item:
		//		something can not be null, the nodeType must be an XML Element,
		//		the tagName must be "outline", and the node must be a member of
		//		XML document for this datastore. 
		return (something && 
				something.nodeType == 1 && 
				something.tagName == 'outline' &&
				something.ownerDocument === this._xmlData); //Boolean
	},
	
	isItemLoaded: function(/* anything */ something){
		//	summary: 
		//		See dojo.data.api.Read.isItemLoaded()
		// 		OpmlStore loads every item, so if it's an item, then it's loaded.
		return this.isItem(something); //Boolean
	},
	
	loadItem: function(/* item */ item){
		//	summary: 
		//		See dojo.data.api.Read.loadItem()
		//	description:
		//		The OpmlStore always loads all items, so if it's an item, then it's loaded.
		//		From the dojo.data.api.Read.loadItem docs:
		//			If a call to isItemLoaded() returns true before loadItem() is even called,
		//			then loadItem() need not do any work at all and will not even invoke the callback handlers.
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
		var filter = function(requestArgs, arrayOfItems){
			var items = null;
			if(requestArgs.query){
				items = [];
				var ignoreCase = requestArgs.queryOptions ? requestArgs.queryOptions.ignoreCase : false; 
				for(var i = 0; i < arrayOfItems.length; ++i){
					var match = true;
					var candidateItem = arrayOfItems[i];
					for(var key in requestArgs.query){
						var value = requestArgs.query[key];
						if(!self._containsValue(candidateItem, key, value, ignoreCase)){
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
				if(arrayOfItems.length> 0){
					items = arrayOfItems.slice(0,arrayOfItems.length); 
				}
			}
			findCallback(items, requestArgs);
		};

		if(this._loadFinished){
			filter(keywordArgs, this._arrayOfTopLevelItems);
		}else{
			if(this._opmlFileUrl){
				var getArgs = {
						url: self._opmlFileUrl, 
						handleAs: "xml"
					};
				var getHandler = dojo.xhrGet(getArgs);
				getHandler.addCallback(function(data){
					self._processRawXmlTree(data);
					filter(keywordArgs, self._arrayOfTopLevelItems);
				});
				getHandler.addErrback(function(error){
					throw error;
				});
			}else if(this._opmlData){
				this._processRawXmlTree(this._opmlData);
				this._opmlData = null;
				filter(keywordArgs, this._arrayOfTopLevelItems);
			}else{
				throw new Error("dojox.data.OpmlStore: No OPML source data was provided as either URL or XML data input.");
			}
		}
	},
	
	getFeatures: function(){
		// summary: See dojo.data.api.Read.getFeatures()
		 var features = {
			 'dojo.data.api.Read': true
		 };
		 return features; //Object
	},

	close: function(/*dojo.data.api.Request || keywordArgs || null */ request){
		 //	summary: 
		 //		See dojo.data.api.Read.close()
	}
});
//Mix in the simple fetch implementation to this class.
dojo.extend(dojox.data.OpmlStore,dojo.data.util.simpleFetch);
	
