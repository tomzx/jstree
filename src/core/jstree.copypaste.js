+function($) {
	'use strict';

	$.extend($.jstree.core.prototype, {
		/**
		 * cut a node (a later call to `paste(obj)` would move the node)
		 * @name cut(obj)
		 * @param  {mixed} obj multiple objects can be passed using an array
		 * @trigger cut.jstree
		 */
		cut: function (obj) {
			if (!obj) {
				obj = this._data.core.selected.concat();
			}
			if (!$.isArray(obj)) {
				obj = [obj];
			}
			if (!obj.length) {
				return false;
			}
			var tmp = [],
				o, t1, t2;
			for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
				o = this.get_node(obj[t1]);
				if (o && o.id && o.id !== '#') {
					tmp.push(o);
				}
			}
			if (!tmp.length) {
				return false;
			}
			$.jstree._internal.ccp_node = tmp;
			$.jstree._internal.ccp_inst = this;
			$.jstree._internal.ccp_mode = 'move_node';
			/**
			 * triggered when nodes are added to the buffer for moving
			 * @event
			 * @name cut.jstree
			 * @param {Array} node
			 */
			this.trigger('cut', {
				"node": obj
			});
		},
		/**
		 * copy a node (a later call to `paste(obj)` would copy the node)
		 * @name copy(obj)
		 * @param  {mixed} obj multiple objects can be passed using an array
		 * @trigger copy.jstre
		 */
		copy: function (obj) {
			if (!obj) {
				obj = this._data.core.selected.concat();
			}
			if (!$.isArray(obj)) {
				obj = [obj];
			}
			if (!obj.length) {
				return false;
			}
			var tmp = [],
				o, t1, t2;
			for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
				o = this.get_node(obj[t1]);
				if (o && o.id && o.id !== '#') {
					tmp.push(o);
				}
			}
			if (!tmp.length) {
				return false;
			}
			$.jstree._internal.ccp_node = tmp;
			$.jstree._internal.ccp_inst = this;
			$.jstree._internal.ccp_mode = 'copy_node';
			/**
			 * triggered when nodes are added to the buffer for copying
			 * @event
			 * @name copy.jstree
			 * @param {Array} node
			 */
			this.trigger('copy', {
				"node": obj
			});
		},
		/**
		 * get the current buffer (any nodes that are waiting for a paste operation)
		 * @name get_buffer()
		 * @return {Object} an object consisting of `mode` ("copy_node" or "move_node"), `node` (an array of objects) and `inst` (the instance)
		 */
		get_buffer: function () {
			return {
				'mode': $.jstree._internal.ccp_mode,
				'node': $.jstree._internal.ccp_node,
				'inst': $.jstree._internal.ccp_inst
			};
		},
		/**
		 * check if there is something in the buffer to paste
		 * @name can_paste()
		 * @return {Boolean}
		 */
		can_paste: function () {
			return $.jstree._internal.ccp_mode !== false && $.jstree._internal.ccp_node !== false; // && $.jstree._internal.ccp_inst._model.data[$.jstree._internal.ccp_node];
		},
		/**
		 * copy or move the previously cut or copied nodes to a new parent
		 * @name paste(obj [, pos])
		 * @param  {mixed} obj the new parent
		 * @param  {mixed} pos the position to insert at (besides integer, "first" and "last" are supported), defaults to integer `0`
		 * @trigger paste.jstree
		 */
		paste: function (obj, pos) {
			obj = this.get_node(obj);
			if (!obj || !$.jstree._internal.ccp_mode || !$.jstree._internal.ccp_mode.match(/^(copy_node|move_node)$/) || !$.jstree._internal.ccp_node) {
				return false;
			}
			if (this[$.jstree._internal.ccp_mode]($.jstree._internal.ccp_node, obj, pos)) {
				/**
				 * triggered when paste is invoked
				 * @event
				 * @name paste.jstree
				 * @param {String} parent the ID of the receiving node
				 * @param {Array} node the nodes in the buffer
				 * @param {String} mode the performed operation - "copy_node" or "move_node"
				 */
				this.trigger('paste', {
					"parent": obj.id,
					"node": $.jstree._internal.ccp_node,
					"mode": $.jstree._internal.ccp_mode
				});
			}
			$.jstree._internal.ccp_node = false;
			$.jstree._internal.ccp_mode = false;
			$.jstree._internal.ccp_inst = false;
		},
	});
}(jQuery);