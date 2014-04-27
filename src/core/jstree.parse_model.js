+function($) {
	'use strict';

	$.extend($.jstree.core.prototype, {
		/**
		 * parses a node from a jQuery object and appends them to the in memory tree model. Used internally.
		 * @private
		 * @name _parse_model_from_html(d [, p, ps])
		 * @param  {jQuery} d the jQuery object to parse
		 * @param  {String} p the parent ID
		 * @param  {Array} ps list of all parents
		 * @return {String} the ID of the object added to the model
		 */
		_parse_model_from_html: function (d, p, ps) {
			if (!ps) {
				ps = [];
			} else {
				ps = [].concat(ps);
			}
			if (p) {
				ps.unshift(p);
			}
			var c, e, m = this._model.data,
				data = {
					id: false,
					text: false,
					icon: true,
					parent: p,
					parents: ps,
					children: [],
					children_d: [],
					data: null,
					state: {},
					li_attr: {
						id: false
					},
					a_attr: {
						href: '#'
					},
					original: false
				}, i, tmp, tid;
			for (i in this._model.default_state) {
				if (this._model.default_state.hasOwnProperty(i)) {
					data.state[i] = this._model.default_state[i];
				}
			}
			tmp = $.vakata.attributes(d, true);
			$.each(tmp, function (i, v) {
				v = $.trim(v);
				if (!v.length) {
					return true;
				}
				data.li_attr[i] = v;
				if (i === 'id') {
					data.id = v.toString();
				}
			});
			tmp = d.children('a').eq(0);
			if (tmp.length) {
				tmp = $.vakata.attributes(tmp, true);
				$.each(tmp, function (i, v) {
					v = $.trim(v);
					if (v.length) {
						data.a_attr[i] = v;
					}
				});
			}
			tmp = d.children("a:eq(0)").length ? d.children("a:eq(0)").clone() : d.clone();
			tmp.children("ins, i, ul").remove();
			tmp = tmp.html();
			tmp = $('<div />').html(tmp);
			data.text = tmp.html();
			tmp = d.data();
			data.data = tmp ? $.extend(true, {}, tmp) : null;
			data.state.opened = d.hasClass('jstree-open');
			data.state.selected = d.children('a').hasClass('jstree-clicked');
			data.state.disabled = d.children('a').hasClass('jstree-disabled');
			if (data.data && data.data.jstree) {
				for (i in data.data.jstree) {
					if (data.data.jstree.hasOwnProperty(i)) {
						data.state[i] = data.data.jstree[i];
					}
				}
			}
			tmp = d.children("a").children(".jstree-themeicon");
			if (tmp.length) {
				data.icon = tmp.hasClass('jstree-themeicon-hidden') ? false : tmp.attr('rel');
			}
			if (data.state.icon) {
				data.icon = data.state.icon;
			}
			tmp = d.children("ul").children("li");
			do {
				tid = 'j' + this._id + '_' + (++this._cnt);
			} while (m[tid]);
			data.id = data.li_attr.id ? data.li_attr.id.toString() : tid;
			if (tmp.length) {
				tmp.each($.proxy(function (i, v) {
					c = this._parse_model_from_html($(v), data.id, ps);
					e = this._model.data[c];
					data.children.push(c);
					if (e.children_d.length) {
						data.children_d = data.children_d.concat(e.children_d);
					}
				}, this));
				data.children_d = data.children_d.concat(data.children);
			} else {
				if (d.hasClass('jstree-closed')) {
					data.state.loaded = false;
				}
			}
			if (data.li_attr['class']) {
				data.li_attr['class'] = data.li_attr['class'].replace('jstree-closed', '').replace('jstree-open', '');
			}
			if (data.a_attr['class']) {
				data.a_attr['class'] = data.a_attr['class'].replace('jstree-clicked', '').replace('jstree-disabled', '');
			}
			m[data.id] = data;
			if (data.state.selected) {
				this._data.core.selected.push(data.id);
			}
			return data.id;
		},
		/**
		 * parses a node from a JSON object (used when dealing with flat data, which has no nesting of children, but has id and parent properties) and appends it to the in memory tree model. Used internally.
		 * @private
		 * @name _parse_model_from_flat_json(d [, p, ps])
		 * @param  {Object} d the JSON object to parse
		 * @param  {String} p the parent ID
		 * @param  {Array} ps list of all parents
		 * @return {String} the ID of the object added to the model
		 */
		_parse_model_from_flat_json: function (d, p, ps) {
			if (!ps) {
				ps = [];
			} else {
				ps = ps.concat();
			}
			if (p) {
				ps.unshift(p);
			}
			var tid = d.id.toString(),
				m = this._model.data,
				df = this._model.default_state,
				i, j, c, e,
				tmp = {
					id: tid,
					text: d.text || '',
					icon: d.icon !== undefined ? d.icon : true,
					parent: p,
					parents: ps,
					children: d.children || [],
					children_d: d.children_d || [],
					data: d.data,
					state: {},
					li_attr: {
						id: false
					},
					a_attr: {
						href: '#'
					},
					original: false
				};
			for (i in df) {
				if (df.hasOwnProperty(i)) {
					tmp.state[i] = df[i];
				}
			}
			if (d && d.data && d.data.jstree && d.data.jstree.icon) {
				tmp.icon = d.data.jstree.icon;
			}
			if (d && d.data) {
				tmp.data = d.data;
				if (d.data.jstree) {
					for (i in d.data.jstree) {
						if (d.data.jstree.hasOwnProperty(i)) {
							tmp.state[i] = d.data.jstree[i];
						}
					}
				}
			}
			if (d && typeof d.state === 'object') {
				for (i in d.state) {
					if (d.state.hasOwnProperty(i)) {
						tmp.state[i] = d.state[i];
					}
				}
			}
			if (d && typeof d.li_attr === 'object') {
				for (i in d.li_attr) {
					if (d.li_attr.hasOwnProperty(i)) {
						tmp.li_attr[i] = d.li_attr[i];
					}
				}
			}
			if (!tmp.li_attr.id) {
				tmp.li_attr.id = tid;
			}
			if (d && typeof d.a_attr === 'object') {
				for (i in d.a_attr) {
					if (d.a_attr.hasOwnProperty(i)) {
						tmp.a_attr[i] = d.a_attr[i];
					}
				}
			}
			if (d && d.children && d.children === true) {
				tmp.state.loaded = false;
				tmp.children = [];
				tmp.children_d = [];
			}
			m[tmp.id] = tmp;
			for (i = 0, j = tmp.children.length; i < j; i++) {
				c = this._parse_model_from_flat_json(m[tmp.children[i]], tmp.id, ps);
				e = m[c];
				tmp.children_d.push(c);
				if (e.children_d.length) {
					tmp.children_d = tmp.children_d.concat(e.children_d);
				}
			}
			delete d.data;
			delete d.children;
			m[tmp.id].original = d;
			if (tmp.state.selected) {
				this._data.core.selected.push(tmp.id);
			}
			return tmp.id;
		},
		/**
		 * parses a node from a JSON object and appends it to the in memory tree model. Used internally.
		 * @private
		 * @name _parse_model_from_json(d [, p, ps])
		 * @param  {Object} d the JSON object to parse
		 * @param  {String} p the parent ID
		 * @param  {Array} ps list of all parents
		 * @return {String} the ID of the object added to the model
		 */
		_parse_model_from_json: function (d, p, ps) {
			if (!ps) {
				ps = [];
			} else {
				ps = ps.concat();
			}
			if (p) {
				ps.unshift(p);
			}
			var tid = false,
				i, j, c, e, m = this._model.data,
				df = this._model.default_state,
				tmp;
			do {
				tid = 'j' + this._id + '_' + (++this._cnt);
			} while (m[tid]);

			tmp = {
				id: false,
				text: typeof d === 'string' ? d : '',
				icon: typeof d === 'object' && d.icon !== undefined ? d.icon : true,
				parent: p,
				parents: ps,
				children: [],
				children_d: [],
				data: null,
				state: {},
				li_attr: {
					id: false
				},
				a_attr: {
					href: '#'
				},
				original: false
			};
			for (i in df) {
				if (df.hasOwnProperty(i)) {
					tmp.state[i] = df[i];
				}
			}
			if (d && d.id) {
				tmp.id = d.id.toString();
			}
			if (d && d.text) {
				tmp.text = d.text;
			}
			if (d && d.data && d.data.jstree && d.data.jstree.icon) {
				tmp.icon = d.data.jstree.icon;
			}
			if (d && d.data) {
				tmp.data = d.data;
				if (d.data.jstree) {
					for (i in d.data.jstree) {
						if (d.data.jstree.hasOwnProperty(i)) {
							tmp.state[i] = d.data.jstree[i];
						}
					}
				}
			}
			if (d && typeof d.state === 'object') {
				for (i in d.state) {
					if (d.state.hasOwnProperty(i)) {
						tmp.state[i] = d.state[i];
					}
				}
			}
			if (d && typeof d.li_attr === 'object') {
				for (i in d.li_attr) {
					if (d.li_attr.hasOwnProperty(i)) {
						tmp.li_attr[i] = d.li_attr[i];
					}
				}
			}
			if (tmp.li_attr.id && !tmp.id) {
				tmp.id = tmp.li_attr.id.toString();
			}
			if (!tmp.id) {
				tmp.id = tid;
			}
			if (!tmp.li_attr.id) {
				tmp.li_attr.id = tmp.id;
			}
			if (d && typeof d.a_attr === 'object') {
				for (i in d.a_attr) {
					if (d.a_attr.hasOwnProperty(i)) {
						tmp.a_attr[i] = d.a_attr[i];
					}
				}
			}
			if (d && d.children && d.children.length) {
				for (i = 0, j = d.children.length; i < j; i++) {
					c = this._parse_model_from_json(d.children[i], tmp.id, ps);
					e = m[c];
					tmp.children.push(c);
					if (e.children_d.length) {
						tmp.children_d = tmp.children_d.concat(e.children_d);
					}
				}
				tmp.children_d = tmp.children_d.concat(tmp.children);
			}
			if (d && d.children && d.children === true) {
				tmp.state.loaded = false;
				tmp.children = [];
				tmp.children_d = [];
			}
			delete d.data;
			delete d.children;
			tmp.original = d;
			m[tmp.id] = tmp;
			if (tmp.state.selected) {
				this._data.core.selected.push(tmp.id);
			}
			return tmp.id;
		},
	});
}(jQuery);