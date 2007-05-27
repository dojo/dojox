dojo.provide("dojox.crypto.tests.Blowfish");
dojo.require("dojox.crypto.Blowfish");

(function(){
	var message="The rain in Spain falls mainly on the plain.";
	var key="foobar";
	var base64Encrypted="WI5J5BPPVBuiTniVcl7KlIyNMmCosmKTU6a/ueyQuoUXyC5dERzwwdzfFsiU4vBw";
	var dxc=dojox.crypto;

	tests.register("dojox.crypto.tests.Blowfish", [
		function testEncrypt(t){
			t.assertEqual(base64Encrypted, dxc.Blowfish.encrypt(message, key));
		},
		function testDecrypt(t){
			t.assertEqual(message, dxc.Blowfish.decrypt(base64Encrypted, key));
		}
	]);
})();
