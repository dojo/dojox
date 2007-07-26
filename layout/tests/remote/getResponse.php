<?php
	// this file is just a bouncer for ContentPane.html test
	switch($_GET['mode']){
		case 'htmlPaths':
			echo "<img src='../images/testImage.gif' id='imgTest'/>
				<div id='inlineStyleTest' style='width:188px;height:125px;background-image:url(../images/testImage.gif)'></div>
				<style>@import 'getResponse.php?mode=importCss';</style>
				<link type='text/css' rel='stylesheet' href='getResponse.php?mode=linkCss'/>
				<div id='importCssTest'></div>
				<div id='linkCssTest'></div>
				";
			break;

		case 'importCss':
			header('Content-type: text/css; charset=utf-8');
			echo "#importCssTest {
					margin: 4px;
					border: 1px solid blue;
					width: 100px;
					height: 100px;
				}";
			break;

		case 'linkCss':
			header('Content-type: text/css; charset=utf-8');
			echo "#linkCssTest {
				margin: 4px;
				border: 2px dashed red;
				width: 100px;
				height: 100px;
			}";
			break;

		case 'remoteJsTrue':
			header('Content-type: text/javascript; charset=utf-8');
			echo "unTypedVarInDocScope = true;";
			break;

		case 'remoteJsFalse':
			header('Content-type: text/javascript; charset=utf-8');
			echo "unTypedVarInDocScope = false;";
			break;

		case 'bounceInput':
			echo file_get_contents("php://input");
			break;

		case 'bounceHeaders';
			if(function_exists("apache_request_headers")){
				$headers = apache_request_headers();
				foreach($headers as $header => $vlu){
					echo "$header=$vlu\n<br/>";
				}
			}else{
				// IIS, php as CGI etc gets here, messes formating, suboptimal
				$headers = preg_grep('/HTTP_/i', array_keys($_SERVER));
				foreach($headers as $header){
					$vlu = preg_replace(array('/^HTTP_/', '/_/'), array('', '-'), $header);
					echo "$vlu={$_SERVER[$header]}\n<br/>";
				}
			}
			break;

		default:
			echo "unkown mode {$_GET['mode']}";
	}
?>