dojo.provide("dojox.rails");
dojo.require("dojo.NodeList-traverse");

dojo.ready((function(d, dr, dg) {
	return function() {
		var q = d.query;
		
		var live = function(selector, evtName, fn) {
			d.connect(d.body(), evtName, function(evt) {
				var nl = q(evt.target).closest(selector);
				if (nl.length){
					fn.call(nl[0], evt);
				}
			});
		};
		
		var handleConfirm = function(evt) {
			var proceed = dg.confirm(d.attr(evt.target, "data-confirm"));
			if (!proceed){
				evt.preventDefault();
				return false;
			}
			return true;
		};
		
		var handleRemote = function(evt) {
			evt.preventDefault();

			var method, url, content;
			var el = evt.target;
			
			if (el.tagName.toLowerCase() == "form") {
				url = d.attr(el, "action");
				method = (d.attr(el, "method") || "POST").toUpperCase();
				content = d.formToObject(el);
			}else{
				url = d.attr(el, "href");
				method = (d.attr(el, "data-method") || "GET").toUpperCase();
				content = {};
			}
      
      // data-type is toolkit specific, rails doesn't actually spit this out unless specifically included
			var type = d.attr(el, "data-type") || "javascript";

			// TODO: Implement ajax:loading, ajax:loaded, and ajax:interactive as dojo.Deferred callbacks
      d.publish("ajax:before", [el]);
			var deferred = d.xhr(method, {
				url: url,
				handleAs: type,
				content: content,
				load:		function(response, ioArgs) { d.publish("ajax:success",  [el, response, ioArgs]); },
				error:	function(response, ioArgs) { d.publish("ajax:failure",  [el, response, ioArgs]); },
				handle: function(response, ioArgs) { d.publish("ajax:complete", [el, response, ioArgs]); }
			});
      d.publish("ajax:after", [el]);
		};

    var disable = function(elements){
      d.forEach(elements, function(node) {
        if (!d.attr(node, "disabled")){
          console.debug("doing it");
          var attr = node.tagName.toLowerCase() == "input" ? "value" : "innerHTML";
          var message = d.attr(node, "data-disable-with");
          var originalValue = d.attr(node, attr);
          d.attr(node, "disabled", true);
          d.attr(node, "data-original-value", originalValue);
          d.attr(node, attr, message);
        };
      });
    };
		
		var handleDisable = function(evt) {
      var el = evt.target;
      if (d.hasAttr(el, "data-disable-with")){
        disable([el]);
      }else{
        disable(q("*[data-disable-with][disabled=false]", el));
      }
    };

		var handleEnable  = function(el) {
      q("*[data-disable-with][disabled]", el).forEach(function(node){
        console.debug("found node", node);
        var attr = node.tagName.toLowerCase() == "input" ? "value" : "innerHTML";
        var value = d.attr(node, "data-original-value");
        d.attr(node, "disabled", false);
        d.attr(node, "data-original-value", null);
        d.attr(node, attr, value);
      });
    };

    var handleFormSubmit = function(evt){
      var el = evt.target;
      var disableElements = q("*[data-disable-with]");
      if (disableElements.length){ disable(el); }
      if (d.attr("data-remote")){
        evt.preventDefault();
        handleRemote(evt);
      }else{
        el.submit();
      }
    };
		
		// Register data-{action} elements.	 Order is important since the return values
		// from previously called functions in the connect chain influence whether
		// or not the next function in the chain is called.
		
		// Register data-confirm elements
		live("*[data-confirm]", "click", handleConfirm);
		
    // data-disable-with only applies to forms
    // live("*[data-disable-with]", "click", handleDisable);
    // live("form", "submit", handleDisable);
    d.subscribe("ajax:complete", handleEnable);

		// Register data-remote elements
		live("a[data-remote]", "click", handleRemote);
		// live("form[data-remote]", "submit", handleRemote);

    // Handle form submits
    live("form", "submit", handleFormSubmit);
	};
})(dojo, dojox.rails, dojo.global));
