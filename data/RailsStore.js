dojo.provide("dojox.data.RailsStore");
dojo.require("dojox.data.JsonRestStore");
// Contains code donated by Travis Tilley under CLA 


dojo.declare("dojox.data.RailsStore", dojox.data.JsonRestStore, {
	constructor: function(){
		//	summary:
		//		RailsStore is a data store for interacting with RESTful Rails controllers
	},
	preamble: function(options){
		if(typeof options.target == 'string' && !options.service){
			var target = options.target.replace(/\/$/g, '');

			// Special getRequest handler for handling content type negotiation via
			// the Rails format extension, as well as properly setting the ID param
			// in the URL.
			var getRequest = function(id, args){
				args = args || {};
				var url = target;
				var query;
				var ident;

				if(dojo.isObject(id)){
					ident = '';
					query = '?' + dojo.objectToQuery(id);
				}else if(args.query && args.query.indexOf('?') != -1){
					ident = args.query.replace(/\?.*/, '');
					query = args.query.replace(/[^?]*\?/g, '?');
				}else{
					ident = id || '';
					query = '';
				}
				
				if(ident.indexOf('=') != -1){
					query = ident;
					ident = '';
				}
				
				if(ident){
					url = url + '/' + ident + '.json' + query;
				}else{
					url = url + '.json' + query;
				}

				return {
					url : url,
					handleAs : 'json',
					contentType : 'application/json',
					sync : dojox.rpc._sync,
					headers : {
						Accept : 'application/json,application/javascript'
					}
				};
			};

			options.service = dojox.rpc.Rest(this.target, true, null,
					getRequest);
		}
	},
	fetch: function(args){
		args = args || {};
		
		function addToQuery(obj) {
			if(args.query == null){
				args.query = '?';
			}else if (dojo.isObject(args.query)){
				args.query = '?' + dojo.objectToQuery(args.query) + '&';
			}else if (args.query.indexOf('?') == -1){
				args.query = args.query + '?';
			}

			args.query = args.query + dojo.objectToQuery(obj);
		}
		if(args.start || args.count){
			// in addition to the content range headers, also provide query parameters for use
			// with the will_paginate plugin if so desired.
			if((args.start || 0) % args.count){
				throw new Error("The start parameter must be a multiple of a the count parameter");
			}
			addToQuery({
				page: (args.start || 0) / args.count,
				per_page: args.count 
			});
		}
		if(args.sort){
			// make the sort into query parameters
			var queryObj = {
				sortBy : [],
				sortDir : []
			};

			dojo.forEach(args.sort, function(item) {
				queryObj.sortBy.push(item.attribute);
				queryObj.sortDir.push(!!item.descending ? 'DESC' : 'ASC');
			});

			addToQuery(queryObj);
			delete args.sort;
		}

		return this.inherited(arguments);
	}
});
