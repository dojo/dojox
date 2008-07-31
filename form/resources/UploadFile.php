<?php

$upload_path = "../resources/"; 	//relative to this file
$download_path = "../resources/";	// relative to the HTML file

move_uploaded_file($_FILES['Filedata']['tmp_name'],  $upload_path . $_FILES['Filedata']['name']);
$file = $upload_path . $_FILES['Filedata']['name'];

$type = exif_imagetype($file);
list($width, $height) = getimagesize($file);
//$type2 = exif_imagetype($_FILES['Filedata']['tmp_name']);

error_log("file: " . $file );
error_log("type: " . $type );
//error_log("type2: " . $type2 );

error_log("temp: " . $_FILES['Filedata']['tmp_name']);
error_log("file: " . "./images/".$_FILES['Filedata']['name']);

$data ='file='.$file.',width='.$width.',height='.$height;
echo($data);

?>