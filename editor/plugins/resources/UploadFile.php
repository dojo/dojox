<?php

// summary
//		Test file to handle image uploads
//		NOTE: This is obviously a PHP file, and thus you need PHP running for this to work
//		NOTE: Directories must have write permissions
//		NOTE: This code uses the GD library (to get image sizes), that sometimes is not pre-installed in a 
//				standard PHP build. 

//EDIT ME: According to your local directory structure.
// NOTE: Folders must have write permissions
$upload_path = "../resources/"; 	// where image will be uploaded, relative to this file
$download_path = "../resources/";	// same folder as above, but relative to the HTML file

// NOTE: maintain this path for JSON services
require("../../../../dojo/tests/resources/JSON.php");
$json = new Services_JSON();

$file_name = basename( $_FILES['uploadedfile']['name']); 
$upload_file = $upload_path . $file_name;
$download_file = $download_path . $file_name;

list($width, $height) = getimagesize($_FILES['uploadedfile']['tmp_name']);

if(move_uploaded_file($_FILES['uploadedfile']['tmp_name'], $upload_file)) {
  $realstatus = "success";
} else{
  $realstatus = "fail";
}

if(is_array($_FILES)){
	$ar = array(
		'request' => $_REQUEST,
		'postvars' => $_POST,
		'details' => $_FILES,
		'width' => $width,
		'height' => $height,
		'status' => "success",
		'realstatus' => $realstatus,
		
		'filename' => $file_name,
		'uploadfile' => $upload_path . $file_name,
		'downloadpath' => $download_path,
		'downloadfile' => ($download_path . $file_name)
	);

}else{
	$ar = array(
		'status' => "failed",
		'details' => ""
	);
}

// you have to wrap iframeIO stuff in textareas
$data = $json->encode($ar);
?>
<textarea><?php print $data; ?></textarea>
