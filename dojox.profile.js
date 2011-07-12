(function(){
	var testResourceRe = /\/tests\//,

		copyOnly = function(mid){
			var list = {
				"dojox/dojox.profile":1,
				"dojox/package.json":1,
				"dojox/mobile/themes/common/compile":1
			};
			return (mid in list) || /^dojox\/resources\//.test(mid);
		},

		excludes = [
			"secure",
			"atom",
			"cometd",
			"data/(demos|ItemExplorer|OpenSearchStore|StoreExplorer|restListener)",
			"drawing",
			"editor/plugins/(ResizeTableColumn|SpellCheck)",
			"embed/(Object|Quicktime|IE)",
			"flash",
			"form/(BusyButton|DateTextBox|DropDownSelect|DropDownStack|FileInputBlind|FilePickerTextBox|ListInput|Manager|manager|MultiComboBox|PasswordValidator|RadioStack|Rating|TimeSpinner|_FormSelectWidget|_HasDropDown|_SelectStackMixin)",
			"gantt",
			"help",
			"html/_base",
			"image/(Gallery|SlideShow|ThumbnailPicker)",
			"jq",
			"jsonPath",
			"lang/(aspect|async|docs|observable|oo|typed|functional/(binrec|curry|linrec|listcomp|multirec|numrec|sequence|tailrec|util|zip))",
			"layout/(BorderContainer|ContentPane|DragPane|FloatingPane|RadioGroup|ResizeHandle|RotatorContainer|ScrollPane|TableContainer|dnd|ext-dijit)",
			"mobile/app/",
			"rails",
			"robot",
			"socket/Reconnect",
			"storage",
			"sql",
			"widget/(AnalogGauge|AutoRotator|BarGauge|Calendar|CalendarFx|CalendarViews|DataPresentation|DocTester|DynamicTooltip|FeedPortlet|FilePicker|FisheyeList|gauge|Iterator|Loader|Pager|Portlet|RollingList|Rotator|rotator|SortList|UpgradeBar|Wizard)",
			"wire",
			"xmpp",
			"NodeList"
		],

		excludeMids = {
			"dojox/html":1
		},

		excludesRe = new RegExp(("^dojox/(" + excludes.join("|") + ")").replace(/\//, "\\/")),

		usesDojoProvideEtAl = function(mid){
			return (mid in excludeMids) || excludesRe.test(mid);
		};

	return {
		resourceTags:{
			test: function(filename, mid){
				return testResourceRe.test(mid);
			},

			copyOnly: function(filename, mid){
				return copyOnly(mid);
			},

			amd: function(filename, mid){
				return !testResourceRe.test(mid) && !copyOnly(mid) && !usesDojoProvideEtAl(mid) && /\.js$/.test(filename);
			},

			miniExclude: function(filename, mid){
				return 0;
			}
		},

		trees:[
			[".", ".", /(\/\.)|(~$)/]
		]
	};
})()
