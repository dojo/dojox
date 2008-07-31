dojo.provide("dojox.form.FileInputOverlay");
dojo.require("dojo.io.iframe"); 
dojo.require("dojox.html.styles"); 

dojo.experimental("dojox.form.FileInputOverlay");

dojo.declare("dojox.form.FileInputOverlay", null, {
		//summary: 
		// 		Handles the basic tasks of a fileInput...
		//		Does NOT create a button, it transparently overlays a button passed to it. 
		//		This can be used for toolbar buttons for example.
		// 		Handles the file upload. Use an example PHP script included in resources.
		//
		// NOTE:
		//		This looks like it is duplicating efforts of the other FileInput files,
		//		but its actually seperating the lower-level functionality, and allowing
		//		for custom buttons.
		//
		// LIMITATIONS:
		//		Because of the nature of this "hack" - floating a zero-opacity fileInput
		//		over a "fake" button - this won't work in all circumstances. For instance
		//		you couldn't put a fileInput in a scrolling div. Some complicated CSS can 
		//		mess up the placement - or for that matter, some simple, but not expected
		//		CSS can mess up the placement. Being near the botton of a complex document
		//		can throw off the positioning.
		//
		//	OPERA USERS:
		//		Not much love from Opera on FileInput hacks.
		//
		//	ALSO: 
		//		Only works programmatically. Does not work in markup. Use the other
		//		other FileInput files for markup solutions.
		//
		//	USAGE:
		//		this.fileInput = new dojox.form.FileInputOverlay({button:this.button, uploadUrl:this.uploadUrl, uploadOnChange:true});
		//		dojo.connect(this.fileInput, "onChange", this, "handleChange");
		//		dojo.connect(this.fileInput, "onComplete", this, "onComplete");
	
	
		//	_fileInput: /* node */ 
		//	the fileInput form node (do not set)
		_fileInput:null,
		
		//	_fileInput: /* node */ 
		//	the form node (do not set)
		_formNode:null,
		
		//	uploadUrl: /* String */
		// The Url the file will be uploaded
		uploadUrl: "",			
		
		//	button: /* dijit.form.Button or a domNode */
		// REQUIRED: The button that will get the FileInput overlay
		button:null,			
		
		// uploadOnChange: /* Boolean */
		// if true, begins upload immediately
		// leave false if you wish to display the text of the selection
		//	and present an "upload" button
		uploadOnChange: false, 	
		
		//	fieldName: /* String */
		//	The form field attribute. This will be needed by the server to get the value.
		//	If using the ReceiveFile.php test, leave this as-is.
		fieldName:"uploadedfile",
		
		// id: /* String */
		// The attribute of the form field. Also accesses this object.
		id:"",
		
		// tweakX: /* Number */
		// positive or negative number to push the 
								
		constructor: function(options){
			this.button = options.button;
			this.uploadUrl = options.uploadUrl;
			this.uploadOnChange = options.uploadOnChange;
			this.id = options.id || dijit.getUniqueId("form");
			
			this._connects = [];
			
			if(dojo.isIE==6){
				// if we are create more than one FileInputOverlay,
				// IE6 needs a breather or it locks up
				setTimeout(dojo.hitch(this, "createFileInput"), 1);
			}else{
				this.createFileInput();
			}
			
		},
		
		onMouseOver: function(evt){
			// Can be connected to for manipulating hover state
			if(this.button.domNode){
				dojo.addClass(this.button.domNode, "dijitButtonHover dijitHover");
			}
		},
		
		onMouseOut: function(evt){
			// Can be connected to for manipulating hover state
			if(this.button.domNode){
				dojo.removeClass(this.button.domNode, "dijitButtonHover dijitHover");
			}
		},
		
		onChange: function(value){
			// summary
			//	Called after a system dialog selection has been made
			// stub to connect
			if(this.uploadOnChange) { this.upload(); }
		},
		
		upload: function(){
			// summary
			//	Tell form to upload
			dojo.io.iframe.send({
				url: this.uploadUrl,
				form: this._formNode,
				handleAs: "json",
				handle: dojo.hitch(this,"onComplete")
			});
		},
		
		onComplete: function(data,ioArgs,widgetRef){
			//stub to connect
		},
		
		
		createFileInput: function(){
			// summary
			// Create the fileInput overlay
			//
			
			if(!this.button.id) { this.button.id = dijit.getUniqueId("button"); }
			var domNode = (this.button.domNode) ? dojo.byId(this.button.id).parentNode.parentNode : this.button.parentNode;
			
			this._buildForm(domNode);
			
			this._buildFileInput(domNode);
			
			this.setPosition();	
			
			this._connectInput();
			
			// in some cases, mainly due to scrollbars, the buttons
			//	are initially misplaced
			setTimeout(dojo.hitch(this, "setPosition"), 500);
		},
		
		
		
		setPosition: function(){
			// summary
			//	Get size and location of the 'fake' node (the button)
			//	Resize, set position, and clip the 'real' button (the fileInput)	
			// 	setPosition will  fire on browser resize. The button may wrap to a different position
			//	and sometimes it just shifts slightly in the html, maybe because of the scrollbar.
			// May also call this externally, if there is a change in button positioning.
			//
			
			var fake = this._getFakeButtonSize();
			
			// could memoize this, but it at 2-5ms, doesn't seem quite worth it.
			var real = dojo.marginBox(this._fileInput);
			// Now we have an extremely large fileInput button and field.
			//	We mask the areas that extend passed the boundaries of the button.
			//	Thanks to quirksmode for this hack.
			var clip = "rect(0px "+real.w+"px "+fake.h+"px "+(real.w-fake.w)+"px)";
			this._fileInput.style.clip = clip;
			
			// absolutely position the fileInput.
			this._fileInput.style.left = (fake.x + fake.w - real.w) + "px";
			this._fileInput.style.top = fake.y + "px";
		},
		_getFakeButtonSize: function(){
			// summary
			//	Get the size and position of the Dijit Button or DOM node.
			//	This isn't easy. An awful lot has been accounted for, but a page full
			//	of cascading styles can be simply impossible to predict.
			// In these cases, it's reccomended that this function be 
			//	overwritten with more precise paramters
			//
			var fakeNode = (this.button.domNode) ? dojo.byId(this.button.id).parentNode : dojo.byId(this.button.id);
			
			// can't memoize this, because we need the location. And the size could possibly change anyway.
			var fake = dojo.coords(fakeNode);
			// if block, get the width from the style
			fake.w = (dojo.style(fakeNode, "display")=="block")? dojo.style(fakeNode, "width"): fake.w;
			
			//relative and absolute positioning are totally different
			var p = fakeNode.parentNode.parentNode;
			if(p && dojo.style(p, "position")=="relative"){
				fake.x = dojo.style(p, "left");
				fake.y = dojo.style(p, "top");
			}
			if(p && dojo.style(p, "position")=="absolute"){
				fake.x = 0;
				fake.y = 0;
			}
			
			//Tweaking the size of the fileInput to be just a little bigger
			var s = 3;
			fake.x -=s;
			fake.y -= s;
			fake.w+=s*2;
			fake.h+=s*2;
			
			return fake;
		},
		
		
		
		_buildFileInput: function(domNode){
			// summary
			//	Build the fileInput field
			//
			if(this._fileInput){
				this._formNode.removeChild(this._fileInput);
			}
			this._fileInput = document.createElement('input');
			this._fileInput.setAttribute("type","file");
			this._fileInput.setAttribute("id", this.id);
			// server will need to know this variable:
			this._fileInput.setAttribute("name",this.fieldName);
			dojo.addClass(this._fileInput,"dijitFileInputReal");
			this._formNode.appendChild(this._fileInput);
			
		},
			 
		_buildForm: function(domNode){
			// summary
			//	Build the form that holds the fileInput
			//	This form also holds the class that targets
			//	the input to change its size
			//
			if(this._formNode){
				this._formNode.parentNode.removeChild(this._formNode);
			}
			if(dojo.isIE){
				// just to reiterate, IE is a steaming pile of code. 
				this._formNode = document.createElement('<form enctype="multipart/form-data" method="post">');
				this._formNode.encoding = "multipart/form-data";
				
			}else{
				// this is how all other sane browsers do it
				this._formNode = document.createElement('form');
				this._formNode.setAttribute("enctype","multipart/form-data");
			}
			this._formNode.id = dijit.getUniqueId("form");
			domNode.appendChild(this._formNode);
			this._setFormStyle();
		},
		_connectInput: function(){
			this._disconnectInput();
			this._connects.push(dojo.connect(this._fileInput, "mouseover", this, function(evt){
				this.onMouseOver(evt);
			}));
			this._connects.push(dojo.connect(this._fileInput, "mouseout", this, function(evt){
				this.onMouseOut(evt);
			}));
			this._connects.push(dojo.connect(this._fileInput, "change", this, function(){
				this.onChange(this._fileInput.value);
			}));
			
			this._connects.push(dojo.connect(window, "resize", this, "setPosition"));
		},
		
		_disconnectInput: function(){
			dojo.forEach(this._connects, function(c){
				dojo.disconnect(c);									  
			});
		},
		
		_setFormStyle: function(){
			// summary
			//	Apply a dynamic style to the form and input
			//
			// YAY! IE makes us jump through more hoops!
			//	We want to make the fileInput's button large enough to cover our
			//	fake button, and we do this with fontSize=(x)em.
			// 	It seems that after you build a fileInput, it's too late to style it. IE 
			//	styles the input field, but not the button. 
			//	To style the button, we'll create a class that fits, apply it to the form, 
			//	then it will cascade down properly. Geez.
			//
			// If the fake button is bigger than the fileInput, we need to resize
			//	the fileInput. Due to browser security, the only consistent sizing 
			//	method is font EMs. We're using a rough formula here to determine 
			//	if the fake button is very tall or very wide, and resizing based
			//	on the result.
			// We want a minimum of 2em, because on a Mac, system buttons have 
			//	rounded corners. The larger size moves that corner out of position
			var fake = this._getFakeButtonSize();
			var size = Math.max(2,Math.max(Math.ceil(fake.w/60),Math.ceil(fake.h/15)));
			
			// Now create a style associated with the form ID
			dojox.html.insertCssRule("#"+this._formNode.id+" input", "font-size:"+size+"em");
		},
		
		destroy: function(){
			// summary
			//	Destroys the FileInputOverlay
			//	NOTE: Does not destroy the button or node to which it was 
			//	"attached". That will need to be destroyed seperately.
			this._disconnectInput();
			dojo._destroyElement(this._formNode);
		}
		
	}
);