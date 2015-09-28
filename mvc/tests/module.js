define([
	"doh/runner",
	"dojo/_base/sniff",
	"./doh/atEquals",
	"./doh/computed",
	"./doh/equals",
	"./doh/wildcard",
	"./doh/_Controller",
	"./doh/ModelRefController",
	"./doh/StoreRefControllerTest",
	"./doh/WidgetList",
	"./doh/StatefulArray",
	"./doh/StatefulModelOptions"
], function(doh, has){
	try{
		var userArgs = window.location.search.replace(/[\?&](dojoUrl|testUrl|testModule)=[^&]*/g, "").replace(/^&/, "?");

		// DOH
		doh.registerUrl("WidgetList_tests.doh_mvc_mobile-demo", require.toUrl("dojox/mvc/tests/doh/WidgetList_tests/doh_mvc_mobile-demo.html" + userArgs), 999999);
		doh.registerUrl("WidgetList_tests.doh_mvc_DOMNode-search-results-repeat", require.toUrl("dojox/mvc/tests/doh/WidgetList_tests/doh_mvc_DOMNode-search-results-repeat.html" + userArgs), 999999);
		doh.registerUrl("WidgetList_tests.doh_mvc_new_ref-set-repeat", require.toUrl("dojox/mvc/tests/doh/WidgetList_tests/doh_mvc_new_ref-set-repeat.html" + userArgs), 999999);
		doh.registerUrl("WidgetList_tests.doh_mvc_performance_search-results-repeat", require.toUrl("dojox/mvc/tests/doh/WidgetList_tests/doh_mvc_performance_search-results-repeat.html" + userArgs), 999999);
		doh.registerUrl("WidgetList_tests.doh_mvc_programmatic-repeat-store", require.toUrl("dojox/mvc/tests/doh/WidgetList_tests/doh_mvc_programmatic-repeat-store.html" + userArgs), 999999);
		doh.registerUrl("WidgetList_tests.doh_mvc_repeat_select_cancel", require.toUrl("dojox/mvc/tests/doh/WidgetList_tests/doh_mvc_repeat_select_cancel.html" + userArgs), 999999);
		doh.registerUrl("WidgetList_tests.doh_mvc_repeat_select_manualsave", require.toUrl("dojox/mvc/tests/doh/WidgetList_tests/doh_mvc_repeat_select_manualsave.html" + userArgs), 999999);
		doh.registerUrl("WidgetList_tests.doh_mvc_search-results-repeat", require.toUrl("dojox/mvc/tests/doh/WidgetList_tests/doh_mvc_search-results-repeat.html" + userArgs), 999999);
		doh.registerUrl("WidgetList_tests.doh_mvc_search-results-repeat-store", require.toUrl("dojox/mvc/tests/doh/WidgetList_tests/doh_mvc_search-results-repeat-store.html" + userArgs), 999999);
		doh.registerUrl("WidgetList_tests.doh_new-mvc_label_and_totals", require.toUrl("dojox/mvc/tests/doh/WidgetList_tests/doh_new-mvc_label_and_totals.html" + userArgs), 999999);
		
		doh.registerUrl("dojox.mvc.tests.doh_mvc_new_shipto-billto-simple", require.toUrl("dojox/mvc/tests/doh/doh_mvc_new_shipto-billto-simple.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_mvc_new_ref-set-repeat", require.toUrl("dojox/mvc/tests/doh/doh_mvc_new_ref-set-repeat.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.multiattrib.doh_mvc_test_Toolbar", require.toUrl("dojox/mvc/tests/multiattrib/doh_mvc_test_Toolbar.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.multiattrib.doh_mvc_test_Toolbar_withCtrl", require.toUrl("dojox/mvc/tests/multiattrib/doh_mvc_test_Toolbar_withCtrl.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_mvc_search-results-repeat", require.toUrl("dojox/mvc/tests/doh/doh_mvc_search-results-repeat.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_new-mvc_input-output-simple", require.toUrl("dojox/mvc/tests/doh/doh_new-mvc_input-output-simple.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_new-mvc_label_and_totals", require.toUrl("dojox/mvc/tests/doh/doh_new-mvc_label_and_totals.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_mvc_mobile-demo", require.toUrl("dojox/mvc/tests/doh/doh_mvc_mobile-demo.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_mvc_zero-value-test", require.toUrl("dojox/mvc/tests/doh/doh_mvc_zero-value-test.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_mvc_binding-simple", require.toUrl("dojox/mvc/tests/doh/doh_mvc_binding-simple.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_mvc_shipto-billto-hierarchical", require.toUrl("dojox/mvc/tests/doh/doh_mvc_shipto-billto-hierarchical.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_mvc_ref-template-13263", require.toUrl("dojox/mvc/tests/doh/doh_mvc_ref-template-13263.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_async_mvc_14491-input-output", require.toUrl("dojox/mvc/tests/doh/doh_async_mvc_14491-input-output.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_mvc_form-kitchensink", require.toUrl("dojox/mvc/tests/doh/doh_mvc_form-kitchensink.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_mvc_programmatic-repeat-store", require.toUrl("dojox/mvc/tests/doh/doh_mvc_programmatic-repeat-store.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_mvc_search-results-repeat-store", require.toUrl("dojox/mvc/tests/doh/doh_mvc_search-results-repeat-store.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_mvc_template_repeat_exprchar", require.toUrl("dojox/mvc/tests/doh/doh_mvc_template_repeat_exprchar.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_mvc_validation-test-simple", require.toUrl("dojox/mvc/tests/doh/doh_mvc_validation-test-simple.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_mvc_date_test", require.toUrl("dojox/mvc/tests/doh/doh_mvc_date_test.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_mvc_repeat_select_manualsave", require.toUrl("dojox/mvc/tests/doh/doh_mvc_repeat_select_manualsave.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_mvc_repeat_select_cancel", require.toUrl("dojox/mvc/tests/doh/doh_mvc_repeat_select_cancel.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_mvc_sync-test", require.toUrl("dojox/mvc/tests/doh/doh_mvc_sync-test.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.doh_mvc_extension-per-widget", require.toUrl("dojox/mvc/tests/doh/doh_mvc_extension-per-widget.html" + userArgs), 999999);
		doh.registerUrl("doh_mvc_loan-stateful", require.toUrl("dojox/mvc/tests/doh/doh_mvc_loan-stateful.html" + userArgs), 999999);
		doh.registerUrl("doh_mvc_DOMNode_shipto-billto-simple", require.toUrl("dojox/mvc/tests/doh/doh_mvc_DOMNode_shipto-billto-simple.html" + userArgs), 999999);
		doh.registerUrl("doh_mvc_DOMNode-search-results-repeat", require.toUrl("dojox/mvc/tests/doh/doh_mvc_DOMNode-search-results-repeat.html" + userArgs), 999999);
		doh.registerUrl("doh_mvc_performance_search-results-repeat", require.toUrl("dojox/mvc/tests/doh/doh_mvc_performance_search-results-repeat.html" + userArgs), 999999);
		// DOH 1.7
		doh.registerUrl("dojox.mvc.tests.1.7.doh_mvc_shipto-billto-simple", require.toUrl("dojox/mvc/tests/1.7/doh/doh_mvc_shipto-billto-simple.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.1.7.doh_mvc_search-results-repeat", require.toUrl("dojox/mvc/tests/1.7/doh/doh_mvc_search-results-repeat.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.1.7.doh_mvc_search-results-repeat-store", require.toUrl("dojox/mvc/tests/1.7/doh/doh_mvc_search-results-repeat-store.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.1.7.doh_mvc_programmatic-repeat-store", require.toUrl("dojox/mvc/tests/1.7/doh/doh_mvc_programmatic-repeat-store.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.1.7.doh_mvc_binding-simple", require.toUrl("dojox/mvc/tests/1.7/doh/doh_mvc_binding-simple.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.1.7.doh_mvc_ref-set-repeat", require.toUrl("dojox/mvc/tests/1.7/doh/doh_mvc_ref-set-repeat.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.1.7.doh_mvc_billto-hierarchical", require.toUrl("dojox/mvc/tests/1.7/doh/doh_mvc_shipto-billto-hierarchical.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.1.7.doh_async_mvc_input-output-simple", require.toUrl("dojox/mvc/tests/1.7/doh/doh_async_mvc_input-output-simple.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.1.7.doh_async_mvc_zero-value-test", require.toUrl("dojox/mvc/tests/1.7/doh/doh_async_mvc_zero-value-test.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.1.7.doh_mvc_template_repeat_exprchar", require.toUrl("dojox/mvc/tests/1.7/doh/doh_mvc_template_repeat_exprchar.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.1.7.doh_mvc_form-kitchensink", require.toUrl("dojox/mvc/tests/1.7/doh/doh_mvc_form-kitchensink.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.1.7.doh_mvc_date_test", require.toUrl("dojox/mvc/tests/1.7/doh/doh_mvc_date_test.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.1.7.doh_mvc_validation-test-simple", require.toUrl("dojox/mvc/tests/1.7/doh/doh_mvc_validation-test-simple.html" + userArgs), 999999);
		doh.registerUrl("dojox.mvc.tests.1.7.doh_new-mvc_input-output-simple.html", require.toUrl("dojox/mvc/tests/doh/doh_new-mvc_input-output-simple.html" + userArgs), 999999);
		// Robot 1.7 tests have been removed, coverage is provided with the doh tests, and there 
		// have been too many problems with the running of the robot tests.
		// But the robot 1.7 tests are available with the dojox/mvc/tests/1.7/robot/runTestsFullSet.html
	}catch(e){
		doh.debug(e);
	}
});
