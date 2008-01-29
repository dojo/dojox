dojo.provide("dojox.sketch.UndoStack");
dojo.require("dojox.xml.DomParser");

(function(){
	var ta=dojox.sketch;
	ta.CommandTypes={ Create:"Create", Move:"Move", Modify:"Modify", Delete:"Delete", Convert:"Convert"};

	ta.UndoStack=function(figure){
		var self=this;

		this.init=function(){
			this._steps=[];
			this._undoedSteps=[];
		};
		this.init();
		this.apply=function(state, from, to){
			//	the key here is to neutrally move from one state to another.
			//	we let the individual functions (i.e. undo and redo) actually
			//	determine the from and to; all we do here is implement it.

			//	check whether this is a fullText step
			if(!from && !to && state.fullText){
				figure.setValue(state.fullText);
				return;
			}

			var fromText=from.shapeText;
			var toText=to.shapeText;
			
			if(fromText.length==0&&toText.length==0){
				//	nothing to reapply?
				return;
			}
			if(fromText.length==0){
				//	We are creating.
				var o=dojox.xml.DomParser.parse(toText).documentElement;
				var a=figure._loadAnnotation(o);
				if(a) figure._add(a);
				return;
			}
			if(toText.length==0){
				//	we are deleting.
				var ann=figure.get(from.shapeId);
				figure._delete([ann],true);
				return;
			}
//			if(state.cmdname==ta.CommandTypes.Convert){
//				//	need a better way of doing this, but basically this means
//				//		run it through our figure's converter.
//				var ann=figure.get(from.shapeId);
//				var o=dojox.xml.DomParser.parse(toText).documentElement;
//				var t=o.getAttribute('annotation');
//				figure.convert(ann, t);
//				return;
//			}
			
			//	we can simply reinit and draw from the shape itself,
			//		regardless of the actual command.
			var nann=figure.get(to.shapeId);
			var no=dojox.xml.DomParser.parse(toText).documentElement;
			nann.draw(no);
			figure.select(nann);
			return;
		}

		//	stack methods.
		this.add=function(/*String*/cmd, /*ta.Annotation?*/ann, /*String?*/before){
			//var fullText=figure.serialize();
			var id=ann?ann.id:'';
			var bbox=ann?ann.getBBox():{};
			var after=ann?ann.serialize():"";
			if(cmd==ta.CommandTypes.Delete) after="";
			
			if(ann){
				//	fix the bbox x/y coords
				var t=ann.transform;
				bbox.x+=t.dx;
				bbox.y+=t.dy;
			}
			var state={
				cmdname:cmd,
				bbox:bbox,
//					fullText:fullText,
				before:{
					shapeId: id,
					shapeText:before||''
				},
				after:{
					shapeId: id,
					shapeText:after
				}
			};
			console.log('annotator history add',state);
			this._steps.push(state);
			this._undoedSteps=[];

//			onAdd(this,state);
		};
		this.destroy=function(){
//			store.removeEditor(figure);
		};
		this.getPosition=function(){ return position; };
		this.peek=function(){ return currentState; };
		this.undo=function(){
			var state=this._steps.pop();
			if(state){
				this._undoedSteps.push(state);
				this.apply(state,state.after,state.before);
			}
//			store.undo(figure);
//			if(position<0){ return; }
//			applyState(currentState, currentState.after, currentState.before);
//			onUndo(this,currentState);
//			currentState=states[--position];
		};
		this.redo=function(){
			var state=this._undoedSteps.pop();
			if(state){
				this._steps.push(state);
				this.apply(state,state.before,state.after);
			}
//			store.redo(figure);
//			if(position>=states.length){ return; }
//			var state=states[++position];
//			currentState=state;
//			applyState(state, state.before, state.after);
//			onRedo(this,state);
		};
	};
})();
