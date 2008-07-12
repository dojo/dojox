dojo.provide("dojox.data.CouchDBRestStore");
dojo.require("dojox.data.JsonRestStore");

// A CouchDBRestStore is an extension of JsonRestStore to handle CouchDB's idiosyncrasies, special features,
// and deviations from standard HTTP Rest.
// NOTE: CouchDB is not designed to be run on a public facing network. There is no access control
// on database documents, and you should NOT rely on client side control to implement security.


dojo.declare("dojox.data.CouchDBRestStore",
	dojox.data.JsonRestStore,
	{
		onPostCommit: function(item){
			var prefix = this.service.serviceName + '/';
			item.__id = prefix + result.id; // update the object with the results of the post
			item._rev = result.rev;
			return result;
		},
		fetch: function(args){
			// summary:
			// 		This only differs from JsonRestStore in that it, will put the query string the query part of the URL and it handles start and count
			if(typeof args == 'string'){
				args = {query: '_all_docs?' + args};
			}else if(typeof args.query == 'string'){
				args.query = '_all_docs?' + args.query;
			}else{
				args.query =  '_all_docs?';
			}
			if(args.start){
				args.query = (args.query ? (args.query + '&') : '') + 'skip=' + args.start;
				delete args.start;
			}
			if(args.count){
				args.query = (args.query ? (args.query + '&') : '') + 'count=' + args.count;
				delete args.count;
			}
			var prefix = this.service.serviceName + '/';
			var oldOnComplete = args.onComplete;
			args.onComplete=function(results){
				if(results.rows){
					for(var i = 0; i < results.rows.length; i++){
						var row = results.rows[i];  // make it into a reference
						row.__id = prefix + (row.$ref = row.id);
					}
				}
				if(oldOnComplete){
					oldOnComplete.apply(this,arguments);
				}
			};
			return this.inherited(arguments);
		}
	}
);

//TODO:, it is not ncessary to generate an SMD, this should be changed to
// create a set of stores
dojox.data.CouchDBRestStore.generateSMD = function(couchServerUrl){
	var couchSMD = {contentType:"application/json",
		transport:"REST",
		envelope:"PATH",
		services:{},
		target: couchServerUrl
	};
	var def = dojo.xhrGet({
		url: couchServerUrl+"_all_dbs",
		handleAs: "json",
		sync: true
	});
	def.addCallback(function(dbs){
		for(var i = 0; i < dbs.length; i++){
			couchSMD.services[dbs[i]] = {
				target:dbs[i],
				returns:{},
				parameters:[{type:"string"}]
			};
		}
	});
	return couchSMD;
};
