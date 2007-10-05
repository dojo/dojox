// example sample data and code
// some sample data
data = [ 
	[ "normal", false, "new", 'But are not followed by two hexadecimal', 29.91, 10, false ],
	[ "important", false, "new", 'Because a % sign always indicates', 9.33, -5, false ],
	[ "important", false, "read", 'Signs can be selectively', 19.34, 0, true ],
	[ "note", false, "read", 'However the reserved characters', 15.63, 0, true ],
	[ "normal", false, "replied", 'It is therefore necessary', 24.22, 5.50, true ],
	[ "important", false, "replied", 'To problems of corruption by', 9.12, -3, true ],
	[ "note", false, "replied", 'Which would simply be awkward in', 12.15, -4, false ]
];
for (var i=0; i<4; i++)
	data = data.concat(data);
model = new dojox.grid.data.table(null, data);

// simple display of row info; based on model observing.
modelChange = function() {
	var n = dojo.byId('rowCount');
	if (n)
		n.innerHTML = Number(model.getRowCount()) + ' row(s)';
}

