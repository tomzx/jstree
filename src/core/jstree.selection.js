+function($) {
	'use strict';

	$.extend($.jstree.core.prototype, {
		/**
		 * select a node
		 * @name select_node(obj [, supress_event, prevent_open])
		 * @param {mixed} obj an array can be used to select multiple nodes
		 * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
		 * @param {Boolean} prevent_open if set to `true` parents of the selected node won't be opened
		 * @trigger select_node.jstree, changed.jstree
		 */
		select_node: function (obj, supress_event, prevent_open, e) {
			var dom, t1, t2, th;
			if ($.isArray(obj)) {
				obj = obj.slice();
				for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.select_node(obj[t1], supress_event, prevent_open, e);
				}
				return true;
			}
			obj = this.get_node(obj);
			if (!obj || obj.id === '#') {
				return false;
			}
			dom = this.get_node(obj, true);
			if (!obj.state.selected) {
				obj.state.selected = true;
				this._data.core.selected.push(obj.id);
				if (!prevent_open) {
					dom = this._open_to(obj);
				}
				if (dom && dom.length) {
					dom.children('.jstree-anchor').addClass('jstree-clicked');
				}
				/**
				 * triggered when an node is selected
				 * @event
				 * @name select_node.jstree
				 * @param {Object} node
				 * @param {Array} selected the current selection
				 * @param {Object} event the event (if any) that triggered this select_node
				 */
				this.trigger('select_node', {
					'node': obj,
					'selected': this._data.core.selected,
					'event': e
				});
				if (!supress_event) {
					/**
					 * triggered when selection changes
					 * @event
					 * @name changed.jstree
					 * @param {Object} node
					 * @param {Object} action the action that caused the selection to change
					 * @param {Array} selected the current selection
					 * @param {Object} event the event (if any) that triggered this changed event
					 */
					this.trigger('changed', {
						'action': 'select_node',
						'node': obj,
						'selected': this._data.core.selected,
						'event': e
					});
				}
			}
		},
		/**
		 * deselect a node
		 * @name deselect_node(obj [, supress_event])
		 * @param {mixed} obj an array can be used to deselect multiple nodes
		 * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
		 * @trigger deselect_node.jstree, changed.jstree
		 */
		deselect_node: function (obj, supress_event, e) {
			var t1, t2, dom;
			if ($.isArray(obj)) {
				obj = obj.slice();
				for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.deselect_node(obj[t1], supress_event, e);
				}
				return true;
			}
			obj = this.get_node(obj);
			if (!obj || obj.id === '#') {
				return false;
			}
			dom = this.get_node(obj, true);
			if (obj.state.selected) {
				obj.state.selected = false;
				this._data.core.selected = $.vakata.array_remove_item(this._data.core.selected, obj.id);
				if (dom.length) {
					dom.children('.jstree-anchor').removeClass('jstree-clicked');
				}
				/**
				 * triggered when an node is deselected
				 * @event
				 * @name deselect_node.jstree
				 * @param {Object} node
				 * @param {Array} selected the current selection
				 * @param {Object} event the event (if any) that triggered this deselect_node
				 */
				this.trigger('deselect_node', {
					'node': obj,
					'selected': this._data.core.selected,
					'event': e
				});
				if (!supress_event) {
					this.trigger('changed', {
						'action': 'deselect_node',
						'node': obj,
						'selected': this._data.core.selected,
						'event': e
					});
				}
			}
		},
		/**
		 * select all nodes in the tree
		 * @name select_all([supress_event])
		 * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
		 * @trigger select_all.jstree, changed.jstree
		 */
		select_all: function (supress_event) {
			var tmp = this._data.core.selected.concat([]),
				i, j;
			this._data.core.selected = this._model.data['#'].children_d.concat();
			for (i = 0, j = this._data.core.selected.length; i < j; i++) {
				if (this._model.data[this._data.core.selected[i]]) {
					this._model.data[this._data.core.selected[i]].state.selected = true;
				}
			}
			this.redraw(true);
			/**
			 * triggered when all nodes are selected
			 * @event
			 * @name select_all.jstree
			 * @param {Array} selected the current selection
			 */
			this.trigger('select_all', {
				'selected': this._data.core.selected
			});
			if (!supress_event) {
				this.trigger('changed', {
					'action': 'select_all',
					'selected': this._data.core.selected,
					'old_selection': tmp
				});
			}
		},
		/**
		 * deselect all selected nodes
		 * @name deselect_all([supress_event])
		 * @param {Boolean} supress_event if set to `true` the `changed.jstree` event won't be triggered
		 * @trigger deselect_all.jstree, changed.jstree
		 */
		deselect_all: function (supress_event) {
			var tmp = this._data.core.selected.concat([]),
				i, j;
			for (i = 0, j = this._data.core.selected.length; i < j; i++) {
				if (this._model.data[this._data.core.selected[i]]) {
					this._model.data[this._data.core.selected[i]].state.selected = false;
				}
			}
			this._data.core.selected = [];
			this.element.find('.jstree-clicked').removeClass('jstree-clicked');
			/**
			 * triggered when all nodes are deselected
			 * @event
			 * @name deselect_all.jstree
			 * @param {Object} node the previous selection
			 * @param {Array} selected the current selection
			 */
			this.trigger('deselect_all', {
				'selected': this._data.core.selected,
				'node': tmp
			});
			if (!supress_event) {
				this.trigger('changed', {
					'action': 'deselect_all',
					'selected': this._data.core.selected,
					'old_selection': tmp
				});
			}
		},
		/**
		 * checks if a node is selected
		 * @name is_selected(obj)
		 * @param  {mixed}  obj
		 * @return {Boolean}
		 */
		is_selected: function (obj) {
			obj = this.get_node(obj);
			if (!obj || obj.id === '#') {
				return false;
			}
			return obj.state.selected;
		},
		/**
		 * get an array of all selected nodes
		 * @name get_selected([full])
		 * @param  {mixed}  full if set to `true` the returned array will consist of the full node objects, otherwise - only IDs will be returned
		 * @return {Array}
		 */
		get_selected: function (full) {
			return full ? $.map(this._data.core.selected, $.proxy(function (i) {
				return this.get_node(i);
			}, this)) : this._data.core.selected;
		},
		/**
		 * get an array of all top level selected nodes (ignoring children of selected nodes)
		 * @name get_top_selected([full])
		 * @param  {mixed}  full if set to `true` the returned array will consist of the full node objects, otherwise - only IDs will be returned
		 * @return {Array}
		 */
		get_top_selected: function (full) {
			var tmp = this.get_selected(true),
				obj = {}, i, j, k, l;
			for (i = 0, j = tmp.length; i < j; i++) {
				obj[tmp[i].id] = tmp[i];
			}
			for (i = 0, j = tmp.length; i < j; i++) {
				for (k = 0, l = tmp[i].children_d.length; k < l; k++) {
					if (obj[tmp[i].children_d[k]]) {
						delete obj[tmp[i].children_d[k]];
					}
				}
			}
			tmp = [];
			for (i in obj) {
				if (obj.hasOwnProperty(i)) {
					tmp.push(i);
				}
			}
			return full ? $.map(tmp, $.proxy(function (i) {
				return this.get_node(i);
			}, this)) : tmp;
		},
		/**
		 * get an array of all bottom level selected nodes (ignoring selected parents)
		 * @name get_top_selected([full])
		 * @param  {mixed}  full if set to `true` the returned array will consist of the full node objects, otherwise - only IDs will be returned
		 * @return {Array}
		 */
		get_bottom_selected: function (full) {
			var tmp = this.get_selected(true),
				obj = [],
				i, j;
			for (i = 0, j = tmp.length; i < j; i++) {
				if (!tmp[i].children.length) {
					obj.push(tmp[i].id);
				}
			}
			return full ? $.map(obj, $.proxy(function (i) {
				return this.get_node(i);
			}, this)) : obj;
		},
	});
}(jQuery);