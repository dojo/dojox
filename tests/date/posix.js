dojo.provide("dojox.tests.date.posix");

dojo.require("dojox.date.posix");

tests.register("dojox.tests.date.posix", 
	[
	
	//FIXME: set up by loading 'en' resources
function test_date_strftime(t){
	var date = new Date(2006, 7, 11, 0, 55, 12, 3456);
	t.is("06/08/11", dojox.date.posix.strftime(date, "%y/%m/%d"));

	var dt = null; // Date to test
	var fmt = ''; // Format to test
	var res = ''; // Expected result
	
	dt = new Date(2006, 0, 1, 18, 23);
	fmt = '%a';
	res = 'Sun';
	t.is(res, dojox.date.posix.strftime(dt, fmt, 'en'));
	
	fmt = '%A';
	res = 'Sunday';
	t.is(res, dojox.date.posix.strftime(dt, fmt, 'en'));
	
	fmt = '%b';
	res = 'Jan';
	t.is(res, dojox.date.posix.strftime(dt, fmt, 'en'));
	
	fmt = '%B';
	res = 'January';
	t.is(res, dojox.date.posix.strftime(dt, fmt, 'en'));

	fmt = '%c';
	res = 'Sunday, January 1, 2006 6:23:00 PM';
	t.is(res, dojox.date.posix.strftime(dt, fmt).substring(0, res.length));
	
	fmt = '%C';
	res = '20';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
	
	fmt = '%d';
	res = '01';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
	
	fmt = '%D';
	res = '01/01/06';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
	
	fmt = '%e';
	res = ' 1';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
	
	fmt = '%h';
	res = 'Jan';
	t.is(res, dojox.date.posix.strftime(dt, fmt, 'en'));
	
	fmt = '%H';
	res = '18';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
	
	fmt = '%I';
	res = '06';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
	
	fmt = '%j';
	res = '001';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
	
	fmt = '%k';
	res = '18';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
	
	fmt = '%l';
	res = ' 6';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
	
	fmt = '%m';
	res = '01';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
	
	fmt = '%M';
	res = '23';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
	
	fmt = '%p';
	res = 'PM';
	t.is(res, dojox.date.posix.strftime(dt, fmt, 'en'));
	
	fmt = '%r';
	res = '06:23:00 PM';
	t.is(res, dojox.date.posix.strftime(dt, fmt, 'en'));
	
	fmt = '%R';
	res = '18:23';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
	
	fmt = '%S';
	res = '00';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
	
	fmt = '%T';
	res = '18:23:00';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
	
	fmt = '%u';
	res = '7';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
	
	fmt = '%w';
	res = '0';
	t.is(res, dojox.date.posix.strftime(dt, fmt));

	fmt = '%x';
	res = 'Sunday, January 1, 2006';
	t.is(res, dojox.date.posix.strftime(dt, fmt, 'en'));

	fmt = '%X';
	res = '6:23:00 PM';
	t.is(res, dojox.date.posix.strftime(dt, fmt, 'en').substring(0,res.length));
	
	fmt = '%y';
	res = '06';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
	
	fmt = '%Y';
	res = '2006';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
	
	fmt = '%%';
	res = '%';
	t.is(res, dojox.date.posix.strftime(dt, fmt));
}
	]
);
