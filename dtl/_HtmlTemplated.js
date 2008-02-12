dojo.provide("dojox.dtl._HtmlTemplated");
dojo.require("dijit._Templated");
dojo.require("dojox.dtl.html");
dojo.require("dojox.dtl.render.html");

dojox.dtl._HtmlTemplated = {
	prototype: {
		_dijitTemplateCompat: false,
		buildRendering: function(){
			this.domNode = this.srcNodeRef;

			if(!this._render){
				this._template = this.getCachedTemplate(this.templatePath, this.templateString, this._skipNodeCache);
				this._render = new dojox.dtl.render.html.Render(this.domNode, this._template);
			}

			this.render();
		},
		render: function(/*dojox.dtl.Context?*/ context){
			context = context || new dojox.dtl.Context(this);
			context.setThis(this);
			this._render.render(this._template, context);
		},
		_templateCache: {},
		getCachedTemplate: function(templatePath, templateString, alwaysUseString){
			var tmplts = this._templateCache;
			var key = templateString || templatePath;
			if(tmplts[key]){
				return tmplts[key];
			}

			templateString = dojo.string.trim(templateString || dijit._Templated._sanitizeTemplateString(dojo._getText(templatePath)));

			return (tmplts[key] = new dojox.dtl.HtmlTemplate(templateString));
		},
	}
};