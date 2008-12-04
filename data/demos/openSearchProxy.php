<?php
// A simple proxy for testing the OpenSearchStore
// Note, this simple proxy requires a curl-enabled PHP install
if(!$_GET['url']){ return; }

$url = str_replace(array(';;;;', '%%%%'), array('?', '&'), $_GET['url']);
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$results = curl_exec($ch);
header('HTTP/1.1 ' . curl_getinfo($ch, CURLINFO_HTTP_CODE) . ' OK');
if($_GET['osd'] === 'true'){
	$xml = new SimpleXMLElement($results);
	if($xml->Url){
		foreach($xml->Url as $url){
			$url['template'] = $_SERVER['SCRIPT_NAME'].'?url='.str_replace(array('?', '&'), array(';;;;', '%%%%'), $url['template']);
		}
		header('Content-Type: text/xml');
		print $xml->asXML();
	}
}else{
	header('Content-Type: '.curl_getinfo($ch, CURLINFO_CONTENT_TYPE));
	print $results;
}