/*!
 * jsTree 3.0.0
 * http://jstree.com/
 *
 * Copyright (c) 2013 Ivan Bozhanov (http://vakata.com)
 *
 * Licensed same as jquery - under the terms of the MIT License
 *   http://www.opensource.org/licenses/mit-license.php
 */

+function($) {
	'use strict';

	// prevent another load? maybe there is a better way?
	if ($.jstree) {
		return;
	}

	/**
	 * ### jsTree core functionality
	 */

	// internal variables
	var src = $('script:last').attr('src'),
		_d = document,
		_node = _d.createElement('LI'),
		_temp1, _temp2;

	_node.setAttribute('role', 'treeitem');
	_temp1 = _d.createElement('I');
	_temp1.className = 'jstree-icon jstree-ocl';
	_node.appendChild(_temp1);
	_temp1 = _d.createElement('A');
	_temp1.className = 'jstree-anchor';
	_temp1.setAttribute('href', '#');
	_temp2 = _d.createElement('I');
	_temp2.className = 'jstree-icon jstree-themeicon';
	_temp1.appendChild(_temp2);
	_node.appendChild(_temp1);
	_temp1 = _temp2 = null;

	/**
	 * holds all jstree related functions and variables, including the actual class and methods to create, access and manipulate instances.
	 * @name $.jstree
	 */
	$.jstree = {
		/**
		 * specifies the jstree version in use
		 * @name $.jstree.version
		 */
		version: '3.0.0-beta10',
		/**
		 * holds all the default options used when creating new instances
		 * @name $.jstree.defaults
		 */
		defaults: {
			/**
			 * configure which plugins will be active on an instance. Should be an array of strings, where each element is a plugin name. The default is `[]`
			 * @name $.jstree.defaults.plugins
			 */
			plugins: []
		},
		/**
		 * stores all loaded jstree plugins (used internally)
		 * @name $.jstree.plugins
		 */
		plugins: {},
		path: src && src.indexOf('/') !== -1 ? src.replace(/\/[^\/]+$/, '') : '',
		idregex: /[\\:&'".,=\- \/]/g,

		_internal: {
			instance_counter: 0,
			ccp_inst: false,
			ccp_node: false,
			ccp_mode: false,
			clone_node: _node,
			themes_loaded: [],
		}
	};

}(jQuery);