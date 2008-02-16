<?php

header("Content-Type", "text/json");

$allItems = array(
	array('id'=>0, 'name'=>"Alabama", 'label'=>"<img src='images/Alabama.jpg'/>Alabama", 'abbreviation'=>"AL"),
	array('id'=>1, 'name'=>"Alaska", 'label'=>"Alaska", 'abbreviation'=>"AK"),
	array('id'=>2, 'name'=>"American Samoa", 'label'=>"American Samoa", 'abbreviation'=>"AS"),
	array('id'=>3, 'name'=>"Arizona", 'label'=>"Arizona", 'abbreviation'=>"AZ"),
	array('id'=>4, 'name'=>"Arkansas", 'label'=>"Arkansas", 'abbreviation'=>"AR"),
	array('id'=>5, 'name'=>"Armed Forces Europe", 'label'=>"Armed Forces Europe", 'abbreviation'=>"AE"),
	array('id'=>6, 'name'=>"Armed Forces Pacific", 'label'=>"Armed Forces Pacific", 'abbreviation'=>"AP"),
	array('id'=>7, 'name'=>"Armed Forces the Americas", 'label'=>"Armed Forces the Americas", 'abbreviation'=>"AA"),
	array('id'=>8, 'name'=>"California", 'label'=>"California", 'abbreviation'=>"CA"),
	array('id'=>9, 'name'=>"Colorado", 'label'=>"Colorado", 'abbreviation'=>"CO"),
	array('id'=>10, 'name'=>"Connecticut", 'label'=>"Connecticut", 'abbreviation'=>"CT"),
	array('id'=>11, 'name'=>"Delaware", 'label'=>"Delaware", 'abbreviation'=>"DE"),
	array('id'=>12, 'name'=>"District of Columbia", 'label'=>"District of Columbia", 'abbreviation'=>"DC"),
	array('id'=>13, 'name'=>"Federated States of Micronesia", 'label'=>"Federated States of Micronesia", 'abbreviation'=>"FM"),
	array('id'=>14, 'name'=>"Florida", 'label'=>"Florida", 'abbreviation'=>"FL"),
	array('id'=>15, 'name'=>"Georgia", 'label'=>"Georgia", 'abbreviation'=>"GA"),
	array('id'=>16, 'name'=>"Guam", 'label'=>"Guam", 'abbreviation'=>"GU"),
	array('id'=>17, 'name'=>"Hawaii", 'label'=>"Hawaii", 'abbreviation'=>"HI"),
	array('id'=>18, 'name'=>"Idaho", 'label'=>"Idaho", 'abbreviation'=>"ID"),
	array('id'=>19, 'name'=>"Illinois", 'label'=>"Illinois", 'abbreviation'=>"IL"),
	array('id'=>20, 'name'=>"Indiana", 'label'=>"Indiana", 'abbreviation'=>"IN"),
	array('id'=>21, 'name'=>"Iowa", 'label'=>"Iowa", 'abbreviation'=>"IA"),
	array('id'=>22, 'name'=>"Kansas", 'label'=>"Kansas", 'abbreviation'=>"KS"),
	array('id'=>23, 'name'=>"Kentucky", 'label'=>"Kentucky", 'abbreviation'=>"KY"),
	array('id'=>24, 'name'=>"Louisiana", 'label'=>"Louisiana", 'abbreviation'=>"LA"),
	array('id'=>25, 'name'=>"Maine", 'label'=>"Maine", 'abbreviation'=>"ME"),
	array('id'=>26, 'name'=>"Marshall Islands", 'label'=>"Marshall Islands", 'abbreviation'=>"MH"),
	array('id'=>27, 'name'=>"Maryland", 'label'=>"Maryland", 'abbreviation'=>"MD"),
	array('id'=>28, 'name'=>"Massachusetts", 'label'=>"Massachusetts", 'abbreviation'=>"MA"),
	array('id'=>29, 'name'=>"Michigan", 'label'=>"Michigan", 'abbreviation'=>"MI"),
	array('id'=>30, 'name'=>"Minnesota", 'label'=>"Minnesota", 'abbreviation'=>"MN"),
	array('id'=>31, 'name'=>"Mississippi", 'label'=>"Mississippi", 'abbreviation'=>"MS"),
	array('id'=>32, 'name'=>"Missouri", 'label'=>"Missouri", 'abbreviation'=>"MO"),
	array('id'=>33, 'name'=>"Montana", 'label'=>"Montana", 'abbreviation'=>"MT"),
	array('id'=>34, 'name'=>"Nebraska", 'label'=>"Nebraska", 'abbreviation'=>"NE"),
	array('id'=>35, 'name'=>"Nevada", 'label'=>"Nevada", 'abbreviation'=>"NV"),
	array('id'=>36, 'name'=>"New Hampshire", 'label'=>"New Hampshire", 'abbreviation'=>"NH"),
	array('id'=>37, 'name'=>"New Jersey", 'label'=>"New Jersey", 'abbreviation'=>"NJ"),
	array('id'=>38, 'name'=>"New Mexico", 'label'=>"New Mexico", 'abbreviation'=>"NM"),
	array('id'=>39, 'name'=>"New York", 'label'=>"New York", 'abbreviation'=>"NY"),
	array('id'=>40, 'name'=>"North Carolina", 'label'=>"North Carolina", 'abbreviation'=>"NC"),
	array('id'=>41, 'name'=>"North Dakota", 'label'=>"North Dakota", 'abbreviation'=>"ND"),
	array('id'=>42, 'name'=>"Northern Mariana Islands", 'label'=>"Northern Mariana Islands", 'abbreviation'=>"MP"),
	array('id'=>43, 'name'=>"Ohio", 'label'=>"Ohio", 'abbreviation'=>"OH"),
	array('id'=>44, 'name'=>"Oklahoma", 'label'=>"Oklahoma", 'abbreviation'=>"OK"),
	array('id'=>45, 'name'=>"Oregon", 'label'=>"Oregon", 'abbreviation'=>"OR"),
	array('id'=>46, 'name'=>"Pennsylvania", 'label'=>"Pennsylvania", 'abbreviation'=>"PA"),
	array('id'=>47, 'name'=>"Puerto Rico", 'label'=>"Puerto Rico", 'abbreviation'=>"PR"),
	array('id'=>48, 'name'=>"Rhode Island", 'label'=>"Rhode Island", 'abbreviation'=>"RI"),
	array('id'=>49, 'name'=>"South Carolina", 'label'=>"South Carolina", 'abbreviation'=>"SC"),
	array('id'=>50, 'name'=>"South Dakota", 'label'=>"South Dakota", 'abbreviation'=>"SD"),
	array('id'=>51, 'name'=>"Tennessee", 'label'=>"Tennessee", 'abbreviation'=>"TN"),
	array('id'=>52, 'name'=>"Texas", 'label'=>"Texas", 'abbreviation'=>"TX"),
	array('id'=>53, 'name'=>"Utah", 'label'=>"Utah", 'abbreviation'=>"UT"),
	array('id'=>54, 'name'=>"Vermont", 'label'=>"Vermont", 'abbreviation'=>"VT"),
	array('id'=>55, 'name'=> "Virgin Islands, U.S.", 'label'=>"Virgin Islands, U.S.", 'abbreviation'=>"VI"),
	array('id'=>56, 'name'=>"Virginia", 'label'=>"Virginia", 'abbreviation'=>"VA"),
	array('id'=>57, 'name'=>"Washington", 'label'=>"Washington", 'abbreviation'=>"WA"),
	array('id'=>58, 'name'=>"West Virginia", 'label'=>"West Virginia", 'abbreviation'=>"WV"),
	array('id'=>59, 'name'=>"Wisconsin", 'label'=>"Wisconsin", 'abbreviation'=>"WI"),
	array('id'=>60, 'name'=>"Wyoming", 'label'=>"Wyoming", 'abbreviation'=>"WY"),
);

$q = "";
if (array_key_exists("q", $_REQUEST)) {
	$q = $_REQUEST['q'];
}else if (array_key_exists("name", $_REQUEST)) {
	$q = $_REQUEST['name'];
}

if (strlen($q) && $q[strlen($q)-1]=="*") {
	$q = substr($q, 0, strlen($q)-1);
}
$ret = array();
foreach ($allItems as $item) {
	if (!$q || strpos(strtolower($item['name']), strtolower($q))===0) {
		$ret[] = $item;
	}
}

// Handle sorting
if (array_key_exists("sort", $_REQUEST)) {
	$sort = $_REQUEST['sort'];
	// Check if $sort starts with "-" then we have a DESC sort.
	$desc = strpos($sort, '-')===0 ? true : false;
	$sort = strpos($sort, '-')===0 ? substr($sort, 1) : $sort;
	if (in_array($sort, array_keys($ret[0]))) {
		$toSort = array();
		foreach ($ret as $i) $toSort[$i[$sort]] = $i;
		if ($desc) krsort($toSort); else ksort($toSort);
		$newRet = array();
		foreach ($toSort as $i) $newRet[] = $i;
		$ret = $newRet;
	}
}


// Handle total number of matches as a return, regardless of page size, but taking the filtering into account (if taken place).
$numRows = count($ret);

// Handle paging, if given.
if (array_key_exists("start", $_REQUEST)) {
	$ret = array_slice($ret, $_REQUEST['start']);
}
if (array_key_exists("count", $_REQUEST)) {
	$ret = array_slice($ret, 0, $_REQUEST['count']);
}

print '/*'.json_encode(array('numRows'=>$numRows, 'items'=>$ret)).'*/';
