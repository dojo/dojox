dojo.provide("dojox.json.tests.ref");
dojo.require("dojox.json.ref");

doh.register("dojox.json.tests.ref", [
	function fromRefJson(t) {
			var testStr = '{a:{$ref:"$"},id:"root",c:{d:"e",f:{$ref:"root.c"}},b:{$ref:"$.c"}}';

			var mirrorObj = dojox.json.ref.fromJson(testStr);
			t.assertEqual(mirrorObj, mirrorObj.a);
			t.assertEqual(mirrorObj.c, mirrorObj.c.f);
			t.assertEqual(mirrorObj.c, mirrorObj.b);
	},
	function toAndFromRefJson(t) {
			var testObj = {a:{},b:{c:{}}};
			testObj.a.d= testObj;
			testObj.b.g=testObj.a;
			testObj.b.c.f = testObj.b;
			testObj.b.h=testObj.a;
			var mirrorObj = dojox.json.ref.fromJson(dojox.json.ref.toJson(testObj));
			t.assertEqual(mirrorObj.a.d, mirrorObj);
			t.assertEqual(mirrorObj.b.g, mirrorObj.a);
			t.assertEqual(mirrorObj.b.c.f, mirrorObj.b);
			t.assertEqual(mirrorObj.b.h, mirrorObj.a);
	}
]);
