dojo.provide("dojox.dtl._HtmlTemplated");
dojo.require("dijit._Templated");
dojo.require("dojox.dtl.html");
dojo.require("dojox.dtl.render.html");
dojo.require("dojox.dtl.contrib.dijit");

dojox.dtl._HtmlTemplated = {
	prototype: {
		_dijitTemplateCompat: false,
		buildRendering: function(){
			//	summary:
			//		Construct the UI for this widget, setting this.domNode.

			//render needs a domNode to work with
			this.domNode = this.srcNodeRef;

			if(!this._render){
				var ddcd = dojox.dtl.contrib.dijit;
				var old = ddcd.widgetsInTemplate;
				ddcd.widgetsInTemplate = this.widgetsInTemplate;
				this._template = this._getCachedTemplate(this.templatePath, this.templateString);
				this._render = new dojox.dtl.render.html.Render(this.domNode, this._template);
				ddcd.widgetsInTemplate = old;
			}
			this.preCreate();
			
			this.render();
			this.domNode = this._template.getRootNode();
 			if(this.srcNodeRef && this.srcNodeRef.parentNode){
 				dojo._destoryElement(this.srcNodeRef);
 			}
		},
		preCreate: function(){
			// summary:
			//		Stub function to setup any data required for rendering of this widget. This 
			//		is called before the first render call when the widget initializes
		},
		setTemplate: function(/*String|dojo._Url*/ template, /*dojox.dtl.Context?*/ context){
			// summary:
			//		Quickly switch between templated by location
			if(dojox.dtl.text._isTemplate(template)){
				this._template = this._getCachedTemplate(null, template);
			}else{
				this._template = this._getCachedTemplate(template);
			}
			this.render(context);
		},
		render: function(/*dojox.dtl.Context?*/ context, /*dojox.dtl.HtmlTemplate?*/ tpl){
			if(tpl){
				this._template = tpl;
			}
			this._render.render(this._getContext(context), this._template);
		},
		_getContext: function(context){
			if (!(context instanceof dojox.dtl.Context)) {
				context = false;
			}
			context = context || new dojox.dtl.Context(this);
			context.setThis(this);
			return context;
		},
		_getCachedTemplate: function(templatePath, templateString){
			if(!this._templates){
				this._templates = {};
			}
			var key = templateString || templatePath.toString();
			var tmplts = this._templates;
			if(tmplts[key]){
				return tmplts[key];
			}
			return (tmplts[key] = new dojox.dtl.HtmlTemplate(
				dijit._Templated.getCachedTemplate(
					templatePath,
					templateString,
					true
				)
			));
		}
	}
};