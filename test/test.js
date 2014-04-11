/*
example data:

node1
-child1
-child2
node2
-child3
*/

var example_data = [
	{
		title: 'node1',
		id: 123,  // extra data
		children: [
			{ title: 'child1', id: 125 },
			{ title: 'child2', id: 126 }
		]
	},
	{
		title: 'node2',
		id: 124,
		children: [
			{ title: 'child3', id: 127 }
		]
	},
	{
		title: 'node3',
		id: 128,
	},
];

/*
example data 2:

main
-c1
-c2
*/

var example_data2 = [
	{
		title: 'main',
		children: [
			{ title: 'c1' },
			{ title: 'c2' }
		]
	}
];

var $tree = null;
var $jsTree = null;

var createJsTree = function(options) {
	options.core.error = function() { console.log('FAIL!'); }
	$jsTree = $tree.jstree(options).jstree(true);
};

var Node = function() {};
Node.previousPosition = function(position) {
	return Math.max(0, position - 1);
};
Node.nextPosition = function(position, max) {
	if (max !== undefined) {
		return Math.min(position + 1, max);
	} else {
		return position + 1;
	}
};
Node.getPosition = function(node) {
	var parent = $jsTree.get_node(node.parent);
	return _.findIndex(parent.children, function(other) {
		return other === node.id;
	});
};

module('jsTree', {
	setup: function() {
		$tree = $('<div id="test-tree"></div>');
		$('body').append($tree);
	},
	teardown: function() {
		//var $tree = $('#test-tree');
		// $jsTree && $jsTree.destroy();
		$tree && $tree.remove();
		// $jsTree = null;
		$tree = null;
	},
});

test('create jstree from data', function() {
	createJsTree({
		core: {
			data: example_data
		}
	});

	equal(
		$jsTree.get_node('#').children.length, 3,
		'number of children on level 1'
	);
});

test('move_node up', function() {
	createJsTree({
		core: {
			check_callback: true,
			data: example_data
		}
	});

	var child = $jsTree.get_node(126);

	ok(
		child,
		'Node 126 exists'
	);

	$jsTree.move_node(child, '#', 0);

	equal(
		Node.getPosition($jsTree.get_node(126)), 0,
		'Node moved to position 0'
	);
});

test('move_node up', function() {
	createJsTree({
		core: {
			check_callback: true,
			data: example_data
		}
	});

	var child = $jsTree.get_node(126);

	ok(
		child,
		'Node 126 exists'
	);

	$jsTree.move_node(child, '#', 1);

	equal(
		Node.getPosition($jsTree.get_node(126)), 1,
		'Node moved to position 1'
	);
});

test('move_node up', function() {
	createJsTree({
		core: {
			check_callback: true,
			data: example_data
		}
	});

	var child = $jsTree.get_node(126);

	ok(
		child,
		'Node 126 exists'
	);

	$jsTree.move_node(child, '#', 2);

	equal(
		Node.getPosition($jsTree.get_node(126)), 2,
		'Node moved to position 2'
	);
});

test('move_node down', function() {
	createJsTree({
		core: {
			check_callback: true,
			data: example_data
		}
	});

	var child = $jsTree.get_node(123);

	ok(
		child,
		'Node 123 exists'
	);

	$jsTree.move_node(child, '#', 1);

	equal(
		Node.getPosition($jsTree.get_node(123)), 1,
		'Node moved to position 1'
	);
});