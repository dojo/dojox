dojo.provide("dojox.encoding.tests.digests.SHA1");
dojo.require("dojox.encoding.digests.SHA1");

(function(){
	var message="abc";
	var base64="qZk+NkcGgWq6PiVxeFDCbJzQ2J0=";
	var hex="a9993e364706816aba3e25717850c26c9cd0d89d";
	var ded=dojox.encoding.digests;

	tests.register("dojox.encoding.tests.digests.SHA1", [
		function testBase64Compute(t){
			t.assertEqual(base64, ded.SHA1(message));
		},
		function testHexCompute(t){
			t.assertEqual(hex, ded.SHA1(message, ded.outputTypes.Hex)); 
		},
		function testStringCompute(t){
			t.assertEqual(s, ded.SHA1(message, ded.outputTypes.String)); 
		}
	]);
})();
