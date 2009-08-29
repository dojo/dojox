dojo.provide("dojox.drawing.ui.Toolbar");
dojo.require("dojox.drawing.library.icons");

dojo.declare("dojox.drawing.ui.Toolbar", [], {
	// summary:
	//		A Toolbar used for holding buttons; typically representing the Stencils
	//		used for a DojoX Drawing.
	// description:
	//		Creates a GFX-based toobar that holds GFX-based buttons. Can be either created
	//		within the actual drawing or within a seperate DOM element. When within the
	//		drawing, the toolbar will cover a portion of the drawing; hence the option.
	//
	//		A Toolbar can be created programmtically or in markup. Currently markup is as
	//		a separate DOM element and programmtic is within the drawing.
	// examples:
	//		|	dojo.connect(myDrawing, "onSurfaceReady", function(){
	//		|		new dojox.drawing.ui.Toolbar({
	//		|			drawing:myDrawing,
	//		|			tools:"all",
	//		|			plugs:"all",
	//		|			selected:"ellipse"
	//		|		});
	//		|	});
	//
	//		| <div dojoType="dojox.drawing.ui.Toolbar" id="gfxToolbarNode" drawingId="drawingNode"
	//		|		class="gfxToolbar" tools="all" plugs="all" selected="ellipse"></div>
	//
	//
	constructor: function(props, node){
		//console.warn("GFX Toolbar:", props, node)
		this.util = dojox.drawing.util.common;
		if(props.drawing){
			this.toolDrawing = props.drawing;
			this.drawing = this.toolDrawing;
			this.width = this.toolDrawing.width;
			this.height = this.toolDrawing.height;
			this.strSelected = props.selected;
			this.strTools = props.tools;
			this.strPlugs = props.plugs;
			this.addBack()
		}else{
			var box = dojo.marginBox(node);
			this.width = box.w;
			this.height = box.h;
			this.strSelected = dojo.attr(node, "selected");
			this.strTools = dojo.attr(node, "tools");
			this.strPlugs = dojo.attr(node, "plugs");
			this.toolDrawing = new dojox.drawing.Drawing({mode:"ui"}, node);
		}
		
		if(this.toolDrawing.ready){
			this.makeButtons();
		}else{
			var c = dojo.connect(this.toolDrawing, "onSurfaceReady", this, function(){
				dojo.disconnect(c);
				this.drawing = dojox.drawing.getRegistered("drawing", dojo.attr(node, "drawingId")); // 
				this.makeButtons();
			});
		}
	},
	
	// padding:Number
	//		The amount of spce between the top and left of the toolbar and the buttons.
	padding:10,
	// margin: Number
	//		The space between each button.
	margin:5,
	// size: Number
	//		The width and height of the button
	size:30,
	// radius: Number
	//		The size of the button's rounded corner
	radius:3,
	//	strSlelected | selected: String
	//		The button that should be selected at startup.
	strSlelected:"",
	//	strTools | tools: String
	//		A comma delineated list of the Stencil-tools to include in the Toolbar.
	//		If "all" is used, all registered tools are included.
	strTools:"",
	//	strPlugs | plugs: String
	//		A comma delineated list of the plugins to include in the Toolbar.
	//		If "all" is used, all registered plugins are included.
	strPlugs:"",
	
	makeButtons: function(){
		// summary:
		//		Internal. create buttons.
		this.buttons = [];
		this.plugins = [];
	
		var x = this.padding, y = this.padding, w = this.size, h = this.size, r = this.radius, g = this.margin,
				 sym = dojox.drawing.library.icons,
				 s = {place:"BR", size:2, mult:4};
				 
		if(this.strTools){
			var toolAr = [];
			if(this.strTools=="all"){
				for(var nm in dojox.drawing.getRegistered("tool")){
					toolAr.push(this.util.abbr(nm));
				}
			}else{
				toolAr = this.strTools.split(",");
				dojo.map(toolAr, function(t){ return dojo.trim(t); });
			}
			
			dojo.forEach(toolAr, function(t){
				t = dojo.trim(t);
				this.buttons.push(this.toolDrawing.addUI("button", {data:{x:x, y:y, width:w, height:h, r:r}, toolType:t, icon:sym[t], shadow:s, scope:this, callback:"onToolClick"}));
				if(this.strSlelected==t){
					this.buttons[this.buttons.length-1].select();
				}
				x += w + g;
				
			}, this);
		}
		
		if(this.strPlugs){
			var plugAr = [];
			if(this.strPlugs=="all"){
				for(var nm in dojox.drawing.getRegistered("plugin")){
					plugAr.push(this.util.abbr(nm));
				}
			}else{
				plugAr = this.strPlugs.split(",")
				dojo.map(plugAr, function(p){ return dojo.trim(p); });
			}
			
			
			dojo.forEach(plugAr, function(p){
				t = dojo.trim(p);
				console.log("   PLUG", this.drawing.stencilTypeMap[t],t);
				var btn = this.toolDrawing.addUI("button", {data:{x:x, y:y, width:w, height:h, r:r}, toolType:t, icon:sym[t], shadow:s, scope:this, callback:"onPlugClick"})
				this.plugins.push(btn);
				x += w + g;
				console.log("butt plug:", btn)
				this.drawing.addPlugin({name:this.drawing.stencilTypeMap[p], options:{button:btn}});
			}, this);
		}
	},
	addBack: function(){
		// summary:
		//		Internal. Adds the back, behind the toolbar.
		this.toolDrawing.addUI("rect", {data:{x:0, y:0, width:this.width, height:this.size + (this.padding*2), fill:"#ffffff", borderWidth:0}});
	},
	onToolClick: function(/*Object*/button){
		// summary:
		//		Tool click event. May be connected to.
		//
		console.log("click:", button.toolType, button);
		dojo.forEach(this.buttons, function(b){
			if(b.id==button.id){
				b.select();
				this.drawing.setTool(button.toolType)
			}else{
				b.deselect();
			}
		},this)
	},
	
	onPlugClick: function(/*Object*/button){
		// summary:
		//		Plugin click event. May be connected to.
	},
	
	buildButton: function(tool, selected){
		// summary:
		//		Internal. Build a button.
		//
		var s = {place:"BR", size:2, mult:4};
		var sym = dojox.drawing.library.icons;
		var btn0 = gfxToolbar.addStencil("button", {data:{x:10, y:10, width:30, height:30, r:5}, icon:sym.ellipse, shadow:s});
				
	}
	
});