<?php
	if (!$_REQUEST["message"]){
		print "ERROR: message property not found";
	}else{
		//Escape it, just to be safe
		print htmlentities($_REQUEST["message"]);
	}
?>
