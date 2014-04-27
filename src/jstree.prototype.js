+function($) {
	'use strict';

	$.jstree.core.prototype = {
		/**
		 * used to decorate an instance with a plugin. Used internally.
		 * @private
		 * @name plugin(deco [, opts])
		 * @param  {String} deco the plugin to decorate with
		 * @param  {Object} opts options for the plugin
		 * @return {jsTree}
		 */
		plugin: function (deco, opts) {
			var Child = $.jstree.plugins[deco];
			if (Child) {
				this._data[deco] = {};
				Child.prototype = this;
				return new Child(opts, this);
			}
			return this;
		},
		/**
		 * used to decorate an instance with a plugin. Used internally.
		 * @private
		 * @name init(el, optons)
		 * @param {DOMElement|jQuery|String} el the element we are transforming
		 * @param {Object} options options for this instance
		 * @trigger init.jstree, loading.jstree, loaded.jstree, ready.jstree, changed.jstree
		 */
		init: function (el, options) {
			this._model = {
				data: {
					'#': {
						id: '#',
						parent: null,
						parents: [],
						children: [],
						children_d: [],
						state: {
							loaded: false
						}
					}
				},
				changed: [],
				force_full_redraw: false,
				redraw_timeout: false,
				default_state: {
					loaded: true,
					opened: false,
					selected: false,
					disabled: false
				}
			};

			this.element = $(el).addClass('jstree jstree-' + this._id);
			this.settings = options;
			this.element.bind("destroyed", $.proxy(this.teardown, this));

			this._data.core.ready = false;
			this._data.core.loaded = false;
			this._data.core.rtl = (this.element.css("direction") === "rtl");
			this.element[this._data.core.rtl ? 'addClass' : 'removeClass']("jstree-rtl");
			this.element.attr('role', 'tree');

			this.bind();
			/**
			 * triggered after all events are bound
			 * @event
			 * @name init.jstree
			 */
			this.trigger("init");

			this._data.core.original_container_html = this.element.find(" > ul > li").clone(true);
			this._data.core.original_container_html
				.find("li").addBack()
				.contents().filter(function () {
					return this.nodeType === 3 && (!this.nodeValue || /^\s+$/.test(this.nodeValue));
				})
				.remove();
			this.element.html("<" + "ul class='jstree-container-ul'><" + "li class='jstree-initial-node jstree-loading jstree-leaf jstree-last'><i class='jstree-icon jstree-ocl'></i><" + "a class='jstree-anchor' href='#'><i class='jstree-icon jstree-themeicon-hidden'></i>" + this.get_string("Loading ...") + "</a></li></ul>");
			this._data.core.li_height = this.get_container_ul().children("li:eq(0)").height() || 18;
			/**
			 * triggered after the loading text is shown and before loading starts
			 * @event
			 * @name loading.jstree
			 */
			this.trigger("loading");
			this.load_node('#');
		},
		/**
		 * destroy an instance
		 * @name destroy()
		 */
		destroy: function () {
			this.element.unbind("destroyed", this.teardown);
			this.teardown();
		},
		/**
		 * part of the destroying of an instance. Used internally.
		 * @private
		 * @name teardown()
		 */
		teardown: function () {
			this.unbind();
			this.element
				.removeClass('jstree')
				.removeData('jstree')
				.find("[class^='jstree']")
				.addBack()
				.attr("class", function () {
					return this.className.replace(/jstree[^ ]*|$/ig, '');
				});
			this.element = null;
		},
		/**
		 * bind all events. Used internally.
		 * @private
		 * @name bind()
		 */
		bind: function () {
			this.element
				.on("dblclick.jstree", function () {
					if (document.selection && document.selection.empty) {
						document.selection.empty();
					} else {
						if (window.getSelection) {
							var sel = window.getSelection();
							try {
								sel.removeAllRanges();
								sel.collapse();
							} catch (ignore) {}
						}
					}
				})
				.on("click.jstree", ".jstree-ocl", $.proxy(function (e) {
					this.toggle_node(e.target);
				}, this))
				.on("click.jstree", ".jstree-anchor", $.proxy(function (e) {
					e.preventDefault();
					$(e.currentTarget).focus();
					this.activate_node(e.currentTarget, e);
				}, this))
				.on('keydown.jstree', '.jstree-anchor', $.proxy(function (e) {
					if (e.target.tagName === "INPUT") {
						return true;
					}
					var o = null;
					switch (e.which) {
					case 13:
					case 32:
						e.type = "click";
						$(e.currentTarget).trigger(e);
						break;
					case 37:
						e.preventDefault();
						if (this.is_open(e.currentTarget)) {
							this.close_node(e.currentTarget);
						} else {
							o = this.get_prev_dom(e.currentTarget);
							if (o && o.length) {
								o.children('.jstree-anchor').focus();
							}
						}
						break;
					case 38:
						e.preventDefault();
						o = this.get_prev_dom(e.currentTarget);
						if (o && o.length) {
							o.children('.jstree-anchor').focus();
						}
						break;
					case 39:
						e.preventDefault();
						if (this.is_closed(e.currentTarget)) {
							this.open_node(e.currentTarget, function (o) {
								this.get_node(o, true).children('.jstree-anchor').focus();
							});
						} else {
							o = this.get_next_dom(e.currentTarget);
							if (o && o.length) {
								o.children('.jstree-anchor').focus();
							}
						}
						break;
					case 40:
						e.preventDefault();
						o = this.get_next_dom(e.currentTarget);
						if (o && o.length) {
							o.children('.jstree-anchor').focus();
						}
						break;
						// delete
					case 46:
						e.preventDefault();
						o = this.get_node(e.currentTarget);
						if (o && o.id && o.id !== '#') {
							o = this.is_selected(o) ? this.get_selected() : o;
							// this.delete_node(o);
						}
						break;
						// f2
					case 113:
						e.preventDefault();
						o = this.get_node(e.currentTarget);
						/*!
								if(o && o.id && o.id !== '#') {
									// this.edit(o);
								}
								*/
						break;
					default:
						// console.log(e.which);
						break;
					}
				}, this))
				.on("load_node.jstree", $.proxy(function (e, data) {
					if (data.status) {
						if (data.node.id === '#' && !this._data.core.loaded) {
							this._data.core.loaded = true;
							/**
							 * triggered after the root node is loaded for the first time
							 * @event
							 * @name loaded.jstree
							 */
							this.trigger("loaded");
						}
						if (!this._data.core.ready && !this.get_container_ul().find('.jstree-loading:eq(0)').length) {
							this._data.core.ready = true;
							if (this._data.core.selected.length) {
								if (this.settings.core.expand_selected_onload) {
									var tmp = [],
										i, j;
									for (i = 0, j = this._data.core.selected.length; i < j; i++) {
										tmp = tmp.concat(this._model.data[this._data.core.selected[i]].parents);
									}
									tmp = $.vakata.array_unique(tmp);
									for (i = 0, j = tmp.length; i < j; i++) {
										this.open_node(tmp[i], false, 0);
									}
								}
								this.trigger('changed', {
									'action': 'ready',
									'selected': this._data.core.selected
								});
							}
							/**
							 * triggered after all nodes are finished loading
							 * @event
							 * @name ready.jstree
							 */
							setTimeout($.proxy(function () {
								this.trigger("ready");
							}, this), 0);
						}
					}
				}, this))
				// THEME RELATED
				.on("init.jstree", $.proxy(function () {
					var s = this.settings.core.themes;
					this._data.core.themes.dots = s.dots;
					this._data.core.themes.stripes = s.stripes;
					this._data.core.themes.icons = s.icons;
					this.set_theme(s.name || "default", s.url);
					this.set_theme_variant(s.variant);
				}, this))
				.on("loading.jstree", $.proxy(function () {
					this[this._data.core.themes.dots ? "show_dots" : "hide_dots"]();
					this[this._data.core.themes.icons ? "show_icons" : "hide_icons"]();
					this[this._data.core.themes.stripes ? "show_stripes" : "hide_stripes"]();
				}, this))
				.on('focus.jstree', '.jstree-anchor', $.proxy(function (e) {
					this.element.find('.jstree-hovered').not(e.currentTarget).mouseleave();
					$(e.currentTarget).mouseenter();
				}, this))
				.on('mouseenter.jstree', '.jstree-anchor', $.proxy(function (e) {
					this.hover_node(e.currentTarget);
				}, this))
				.on('mouseleave.jstree', '.jstree-anchor', $.proxy(function (e) {
					this.dehover_node(e.currentTarget);
				}, this));
		},
		/**
		 * part of the destroying of an instance. Used internally.
		 * @private
		 * @name unbind()
		 */
		unbind: function () {
			this.element.off('.jstree');
			$(document).off('.jstree-' + this._id);
		},
		/**
		 * trigger an event. Used internally.
		 * @private
		 * @name trigger(ev [, data])
		 * @param  {String} ev the name of the event to trigger
		 * @param  {Object} data additional data to pass with the event
		 */
		trigger: function (ev, data) {
			if (!data) {
				data = {};
			}
			data.instance = this;
			this.element.triggerHandler(ev.replace('.jstree', '') + '.jstree', data);
		},
		/**
		 * returns the jQuery extended instance container
		 * @name get_container()
		 * @return {jQuery}
		 */
		get_container: function () {
			return this.element;
		},
		/**
		 * returns the jQuery extended main UL node inside the instance container. Used internally.
		 * @private
		 * @name get_container_ul()
		 * @return {jQuery}
		 */
		get_container_ul: function () {
			return this.element.children("ul:eq(0)");
		},
		/**
		 * gets string replacements (localization). Used internally.
		 * @private
		 * @name get_string(key)
		 * @param  {String} key
		 * @return {String}
		 */
		get_string: function (key) {
			var a = this.settings.core.strings;
			if ($.isFunction(a)) {
				return a.call(this, key);
			}
			if (a && a[key]) {
				return a[key];
			}
			return key;
		},
		/**
		 * gets the first child of a DOM node. Used internally.
		 * @private
		 * @name _firstChild(dom)
		 * @param  {DOMElement} dom
		 * @return {DOMElement}
		 */
		_firstChild: function (dom) {
			dom = dom ? dom.firstChild : null;
			while (dom !== null && dom.nodeType !== 1) {
				dom = dom.nextSibling;
			}
			return dom;
		},
		/**
		 * gets the next sibling of a DOM node. Used internally.
		 * @private
		 * @name _nextSibling(dom)
		 * @param  {DOMElement} dom
		 * @return {DOMElement}
		 */
		_nextSibling: function (dom) {
			dom = dom ? dom.nextSibling : null;
			while (dom !== null && dom.nodeType !== 1) {
				dom = dom.nextSibling;
			}
			return dom;
		},
		/**
		 * gets the previous sibling of a DOM node. Used internally.
		 * @private
		 * @name _previousSibling(dom)
		 * @param  {DOMElement} dom
		 * @return {DOMElement}
		 */
		_previousSibling: function (dom) {
			dom = dom ? dom.previousSibling : null;
			while (dom !== null && dom.nodeType !== 1) {
				dom = dom.previousSibling;
			}
			return dom;
		},
		/**
		 * get the JSON representation of a node (or the actual jQuery extended DOM node) by using any input (child DOM element, ID string, selector, etc)
		 * @name get_node(obj [, as_dom])
		 * @param  {mixed} obj
		 * @param  {Boolean} as_dom
		 * @return {Object|jQuery}
		 */
		get_node: function (obj, as_dom) {
			if (obj && obj.id) {
				obj = obj.id;
			}
			var dom;
			try {
				if (this._model.data[obj]) {
					obj = this._model.data[obj];
				} else if (((dom = $(obj, this.element)).length || (dom = $('#' + obj.replace($.jstree.idregex, '\\$&'), this.element)).length) && this._model.data[dom.closest('li').attr('id')]) {
					obj = this._model.data[dom.closest('li').attr('id')];
				} else if ((dom = $(obj, this.element)).length && dom.hasClass('jstree')) {
					obj = this._model.data['#'];
				} else {
					return false;
				}

				if (as_dom) {
					obj = obj.id === '#' ? this.element : $('#' + obj.id.replace($.jstree.idregex, '\\$&'), this.element);
				}
				return obj;
			} catch (ex) {
				return false;
			}
		},
		/**
		 * get the path to a node, either consisting of node texts, or of node IDs, optionally glued together (otherwise an array)
		 * @name get_path(obj [, glue, ids])
		 * @param  {mixed} obj the node
		 * @param  {String} glue if you want the path as a string - pass the glue here (for example '/'), if a falsy value is supplied here, an array is returned
		 * @param  {Boolean} ids if set to true build the path using ID, otherwise node text is used
		 * @return {mixed}
		 */
		get_path: function (obj, glue, ids) {
			obj = obj.parents ? obj : this.get_node(obj);
			if (!obj || obj.id === '#' || !obj.parents) {
				return false;
			}
			var i, j, p = [];
			p.push(ids ? obj.id : obj.text);
			for (i = 0, j = obj.parents.length; i < j; i++) {
				p.push(ids ? obj.parents[i] : this.get_text(obj.parents[i]));
			}
			p = p.reverse().slice(1);
			return glue ? p.join(glue) : p;
		},
		/**
		 * get the next visible node that is below the `obj` node. If `strict` is set to `true` only sibling nodes are returned.
		 * @name get_next_dom(obj [, strict])
		 * @param  {mixed} obj
		 * @param  {Boolean} strict
		 * @return {jQuery}
		 */
		get_next_dom: function (obj, strict) {
			var tmp;
			obj = this.get_node(obj, true);
			if (obj[0] === this.element[0]) {
				tmp = this._firstChild(this.get_container_ul()[0]);
				return tmp ? $(tmp) : false;
			}
			if (!obj || !obj.length) {
				return false;
			}
			if (strict) {
				tmp = this._nextSibling(obj[0]);
				return tmp ? $(tmp) : false;
			}
			if (obj.hasClass("jstree-open")) {
				tmp = this._firstChild(obj.children('ul')[0]);
				return tmp ? $(tmp) : false;
			}
			if ((tmp = this._nextSibling(obj[0])) !== null) {
				return $(tmp);
			}
			return obj.parentsUntil(".jstree", "li").next("li").eq(0);
		},
		/**
		 * get the previous visible node that is above the `obj` node. If `strict` is set to `true` only sibling nodes are returned.
		 * @name get_prev_dom(obj [, strict])
		 * @param  {mixed} obj
		 * @param  {Boolean} strict
		 * @return {jQuery}
		 */
		get_prev_dom: function (obj, strict) {
			var tmp;
			obj = this.get_node(obj, true);
			if (obj[0] === this.element[0]) {
				tmp = this.get_container_ul()[0].lastChild;
				return tmp ? $(tmp) : false;
			}
			if (!obj || !obj.length) {
				return false;
			}
			if (strict) {
				tmp = this._previousSibling(obj[0]);
				return tmp ? $(tmp) : false;
			}
			if ((tmp = this._previousSibling(obj[0])) !== null) {
				obj = $(tmp);
				while (obj.hasClass("jstree-open")) {
					obj = obj.children("ul:eq(0)").children("li:last");
				}
				return obj;
			}
			tmp = obj[0].parentNode.parentNode;
			return tmp && tmp.tagName === 'LI' ? $(tmp) : false;
		},
		/**
		 * get the parent ID of a node
		 * @name get_parent(obj)
		 * @param  {mixed} obj
		 * @return {String}
		 */
		get_parent: function (obj) {
			obj = this.get_node(obj);
			if (!obj || obj.id === '#') {
				return false;
			}
			return obj.parent;
		},
		/**
		 * get a jQuery collection of all the children of a node (node must be rendered)
		 * @name get_children_dom(obj)
		 * @param  {mixed} obj
		 * @return {jQuery}
		 */
		get_children_dom: function (obj) {
			obj = this.get_node(obj, true);
			if (obj[0] === this.element[0]) {
				return this.get_container_ul().children("li");
			}
			if (!obj || !obj.length) {
				return false;
			}
			return obj.children("ul").children("li");
		},
		/**
		 * checks if a node has children
		 * @name is_parent(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_parent: function (obj) {
			obj = this.get_node(obj);
			return obj && (obj.state.loaded === false || obj.children.length > 0);
		},
		/**
		 * checks if a node is loaded (its children are available)
		 * @name is_loaded(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_loaded: function (obj) {
			obj = this.get_node(obj);
			return obj && obj.state.loaded;
		},
		/**
		 * check if a node is currently loading (fetching children)
		 * @name is_loading(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_loading: function (obj) {
			obj = this.get_node(obj);
			return obj && obj.state && obj.state.loading;
		},
		/**
		 * check if a node is opened
		 * @name is_open(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_open: function (obj) {
			obj = this.get_node(obj);
			return obj && obj.state.opened;
		},
		/**
		 * check if a node is in a closed state
		 * @name is_closed(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_closed: function (obj) {
			obj = this.get_node(obj);
			return obj && this.is_parent(obj) && !obj.state.opened;
		},
		/**
		 * check if a node has no children
		 * @name is_leaf(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_leaf: function (obj) {
			return !this.is_parent(obj);
		},
		/**
		 * loads a node (fetches its children using the `core.data` setting). Multiple nodes can be passed to by using an array.
		 * @name load_node(obj [, callback])
		 * @param  {mixed} obj
		 * @param  {function} callback a function to be executed once loading is conplete, the function is executed in the instance's scope and receives two arguments - the node and a boolean status
		 * @return {Boolean}
		 * @trigger load_node.jstree
		 */
		load_node: function (obj, callback) {
			var t1, t2, k, l, i, j, c;
			if ($.isArray(obj)) {
				obj = obj.slice();
				for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.load_node(obj[t1], callback);
				}
				return true;
			}
			obj = this.get_node(obj);
			if (!obj) {
				if (callback) {
					callback.call(this, obj, false);
				}
				return false;
			}
			if (obj.state.loaded) {
				obj.state.loaded = false;
				for (k = 0, l = obj.children_d.length; k < l; k++) {
					for (i = 0, j = obj.parents.length; i < j; i++) {
						this._model.data[obj.parents[i]].children_d = $.vakata.array_remove_item(this._model.data[obj.parents[i]].children_d, obj.children_d[k]);
					}
					if (this._model.data[obj.children_d[k]].state.selected) {
						c = true;
						this._data.core.selected = $.vakata.array_remove_item(this._data.core.selected, obj.children_d[k]);
					}
					delete this._model.data[obj.children_d[k]];
				}
				obj.children = [];
				obj.children_d = [];
				if (c) {
					this.trigger('changed', {
						'action': 'load_node',
						'node': obj,
						'selected': this._data.core.selected
					});
				}
			}
			obj.state.loading = true;
			this.get_node(obj, true).addClass("jstree-loading");
			this._load_node(obj, $.proxy(function (status) {
				obj.state.loading = false;
				obj.state.loaded = status;
				var dom = this.get_node(obj, true);
				if (obj.state.loaded && !obj.children.length && dom && dom.length && !dom.hasClass('jstree-leaf')) {
					dom.removeClass('jstree-closed jstree-open').addClass('jstree-leaf');
				}
				dom.removeClass("jstree-loading");
				/**
				 * triggered after a node is loaded
				 * @event
				 * @name load_node.jstree
				 * @param {Object} node the node that was loading
				 * @param {Boolean} status was the node loaded successfully
				 */
				this.trigger('load_node', {
					"node": obj,
					"status": status
				});
				if (callback) {
					callback.call(this, obj, status);
				}
			}, this));
			return true;
		},
		/**
		 * handles the actual loading of a node. Used only internally.
		 * @private
		 * @name _load_node(obj [, callback])
		 * @param  {mixed} obj
		 * @param  {function} callback a function to be executed once loading is conplete, the function is executed in the instance's scope and receives one argument - a boolean status
		 * @return {Boolean}
		 */
		_load_node: function (obj, callback) {
			var s = this.settings.core.data,
				t;
			// use original HTML
			if (!s) {
				return callback.call(this, obj.id === '#' ? this._append_html_data(obj, this._data.core.original_container_html.clone(true)) : false);
			}
			if ($.isFunction(s)) {
				return s.call(this, obj, $.proxy(function (d) {
					return d === false ? callback.call(this, false) : callback.call(this, this[typeof d === 'string' ? '_append_html_data' : '_append_json_data'](obj, typeof d === 'string' ? $(d) : d));
				}, this));
			}
			if (typeof s === 'object') {
				if (s.url) {
					s = $.extend(true, {}, s);
					if ($.isFunction(s.url)) {
						s.url = s.url.call(this, obj);
					}
					if ($.isFunction(s.data)) {
						s.data = s.data.call(this, obj);
					}
					return $.ajax(s)
						.done($.proxy(function (d, t, x) {
							var type = x.getResponseHeader('Content-Type');
							if (type.indexOf('json') !== -1 || typeof d === "object") {
								return callback.call(this, this._append_json_data(obj, d));
							}
							if (type.indexOf('html') !== -1 || typeof d === "string") {
								return callback.call(this, this._append_html_data(obj, $(d)));
							}
							this._data.core.last_error = {
								'error': 'ajax',
								'plugin': 'core',
								'id': 'core_04',
								'reason': 'Could not load node',
								'data': JSON.stringify({
									'id': obj.id,
									'xhr': x
								})
							};
							return callback.call(this, false);
						}, this))
						.fail($.proxy(function (f) {
							callback.call(this, false);
							this._data.core.last_error = {
								'error': 'ajax',
								'plugin': 'core',
								'id': 'core_04',
								'reason': 'Could not load node',
								'data': JSON.stringify({
									'id': obj.id,
									'xhr': f
								})
							};
							this.settings.core.error.call(this, this._data.core.last_error);
						}, this));
				}
				t = ($.isArray(s) || $.isPlainObject(s)) ? JSON.parse(JSON.stringify(s)) : s;
				if (obj.id !== "#") {
					this._data.core.last_error = {
						'error': 'nodata',
						'plugin': 'core',
						'id': 'core_05',
						'reason': 'Could not load node',
						'data': JSON.stringify({
							'id': obj.id
						})
					};
				}
				return callback.call(this, (obj.id === "#" ? this._append_json_data(obj, t) : false));
			}
			if (typeof s === 'string') {
				if (obj.id !== "#") {
					this._data.core.last_error = {
						'error': 'nodata',
						'plugin': 'core',
						'id': 'core_06',
						'reason': 'Could not load node',
						'data': JSON.stringify({
							'id': obj.id
						})
					};
				}
				return callback.call(this, (obj.id === "#" ? this._append_html_data(obj, $(s)) : false));
			}
			return callback.call(this, false);
		},
		/**
		 * adds a node to the list of nodes to redraw. Used only internally.
		 * @private
		 * @name _node_changed(obj [, callback])
		 * @param  {mixed} obj
		 */
		_node_changed: function (obj) {
			obj = this.get_node(obj);
			if (obj) {
				this._model.changed.push(obj.id);
			}
		},
		/**
		 * appends HTML content to the tree. Used internally.
		 * @private
		 * @name _append_html_data(obj, data)
		 * @param  {mixed} obj the node to append to
		 * @param  {String} data the HTML string to parse and append
		 * @return {Boolean}
		 * @trigger model.jstree, changed.jstree
		 */
		_append_html_data: function (dom, data) {
			dom = this.get_node(dom);
			dom.children = [];
			dom.children_d = [];
			var dat = data.is('ul') ? data.children() : data,
				par = dom.id,
				chd = [],
				dpc = [],
				m = this._model.data,
				p = m[par],
				s = this._data.core.selected.length,
				tmp, i, j;
			dat.each($.proxy(function (i, v) {
				tmp = this._parse_model_from_html($(v), par, p.parents.concat());
				if (tmp) {
					chd.push(tmp);
					dpc.push(tmp);
					if (m[tmp].children_d.length) {
						dpc = dpc.concat(m[tmp].children_d);
					}
				}
			}, this));
			p.children = chd;
			p.children_d = dpc;
			for (i = 0, j = p.parents.length; i < j; i++) {
				m[p.parents[i]].children_d = m[p.parents[i]].children_d.concat(dpc);
			}
			/**
			 * triggered when new data is inserted to the tree model
			 * @event
			 * @name model.jstree
			 * @param {Array} nodes an array of node IDs
			 * @param {String} parent the parent ID of the nodes
			 */
			this.trigger('model', {
				"nodes": dpc,
				'parent': par
			});
			if (par !== '#') {
				this._node_changed(par);
				this.redraw();
			} else {
				this.get_container_ul().children('.jstree-initial-node').remove();
				this.redraw(true);
			}
			if (this._data.core.selected.length !== s) {
				this.trigger('changed', {
					'action': 'model',
					'selected': this._data.core.selected
				});
			}
			return true;
		},
		/**
		 * appends JSON content to the tree. Used internally.
		 * @private
		 * @name _append_json_data(obj, data)
		 * @param  {mixed} obj the node to append to
		 * @param  {String} data the JSON object to parse and append
		 * @return {Boolean}
		 */
		_append_json_data: function (dom, data) {
			dom = this.get_node(dom);
			dom.children = [];
			dom.children_d = [];
			var dat = data,
				par = dom.id,
				chd = [],
				dpc = [],
				m = this._model.data,
				p = m[par],
				s = this._data.core.selected.length,
				tmp, i, j;
			// *%$@!!!
			if (dat.d) {
				dat = dat.d;
				if (typeof dat === "string") {
					dat = JSON.parse(dat);
				}
			}
			if (!$.isArray(dat)) {
				dat = [dat];
			}
			if (dat.length && dat[0].id !== undefined && dat[0].parent !== undefined) {
				// Flat JSON support (for easy import from DB):
				// 1) convert to object (foreach)
				for (i = 0, j = dat.length; i < j; i++) {
					if (!dat[i].children) {
						dat[i].children = [];
					}
					m[dat[i].id.toString()] = dat[i];
				}
				// 2) populate children (foreach)
				for (i = 0, j = dat.length; i < j; i++) {
					m[dat[i].parent.toString()].children.push(dat[i].id.toString());
					// populate parent.children_d
					p.children_d.push(dat[i].id.toString());
				}
				// 3) normalize && populate parents and children_d with recursion
				for (i = 0, j = p.children.length; i < j; i++) {
					tmp = this._parse_model_from_flat_json(m[p.children[i]], par, p.parents.concat());
					dpc.push(tmp);
					if (m[tmp].children_d.length) {
						dpc = dpc.concat(m[tmp].children_d);
					}
				}
				// ?) three_state selection - p.state.selected && t - (if three_state foreach(dat => ch) -> foreach(parents) if(parent.selected) child.selected = true;
			} else {
				for (i = 0, j = dat.length; i < j; i++) {
					tmp = this._parse_model_from_json(dat[i], par, p.parents.concat());
					if (tmp) {
						chd.push(tmp);
						dpc.push(tmp);
						if (m[tmp].children_d.length) {
							dpc = dpc.concat(m[tmp].children_d);
						}
					}
				}
				p.children = chd;
				p.children_d = dpc;
				for (i = 0, j = p.parents.length; i < j; i++) {
					m[p.parents[i]].children_d = m[p.parents[i]].children_d.concat(dpc);
				}
			}
			this.trigger('model', {
				"nodes": dpc,
				'parent': par
			});

			if (par !== '#') {
				this._node_changed(par);
				this.redraw();
			} else {
				// this.get_container_ul().children('.jstree-initial-node').remove();
				this.redraw(true);
			}
			if (this._data.core.selected.length !== s) {
				this.trigger('changed', {
					'action': 'model',
					'selected': this._data.core.selected
				});
			}
			return true;
		},
		/**
		 * redraws all nodes that need to be redrawn. Used internally.
		 * @private
		 * @name _redraw()
		 * @trigger redraw.jstree
		 */
		_redraw: function () {
			var nodes = this._model.force_full_redraw ? this._model.data['#'].children.concat([]) : this._model.changed.concat([]),
				f = document.createElement('UL'),
				tmp, i, j;
			for (i = 0, j = nodes.length; i < j; i++) {
				tmp = this.redraw_node(nodes[i], true, this._model.force_full_redraw);
				if (tmp && this._model.force_full_redraw) {
					f.appendChild(tmp);
				}
			}
			if (this._model.force_full_redraw) {
				f.className = this.get_container_ul()[0].className;
				this.element.empty().append(f);
				//this.get_container_ul()[0].appendChild(f);
			}
			this._model.force_full_redraw = false;
			this._model.changed = [];
			/**
			 * triggered after nodes are redrawn
			 * @event
			 * @name redraw.jstree
			 * @param {array} nodes the redrawn nodes
			 */
			this.trigger('redraw', {
				"nodes": nodes
			});
		},
		/**
		 * redraws all nodes that need to be redrawn or optionally - the whole tree
		 * @name redraw([full])
		 * @param {Boolean} full if set to `true` all nodes are redrawn.
		 */
		redraw: function (full) {
			if (full) {
				this._model.force_full_redraw = true;
			}
			//if(this._model.redraw_timeout) {
			//	clearTimeout(this._model.redraw_timeout);
			//}
			//this._model.redraw_timeout = setTimeout($.proxy(this._redraw, this),0);
			this._redraw();
		},
		/**
		 * redraws a single node. Used internally.
		 * @private
		 * @name redraw_node(node, deep, is_callback)
		 * @param {mixed} node the node to redraw
		 * @param {Boolean} deep should child nodes be redrawn too
		 * @param {Boolean} is_callback is this a recursion call
		 */
		redraw_node: function (node, deep, is_callback) {
			var obj = this.get_node(node),
				par = false,
				ind = false,
				old = false,
				i = false,
				j = false,
				k = false,
				c = '',
				d = document,
				m = this._model.data,
				f = false,
				s = false;
			if (!obj) {
				return false;
			}
			if (obj.id === '#') {
				return this.redraw(true);
			}
			deep = deep || obj.children.length === 0;
			node = !document.querySelector ? document.getElementById(obj.id) : this.element[0].querySelector('#' + ("0123456789".indexOf(obj.id[0]) !== -1 ? '\\3' + obj.id[0] + ' ' + obj.id.substr(1).replace($.jstree.idregex, '\\$&') : obj.id.replace($.jstree.idregex, '\\$&'))); //, this.element);
			if (!node) {
				deep = true;
				//node = d.createElement('LI');
				if (!is_callback) {
					par = obj.parent !== '#' ? $('#' + obj.parent.replace($.jstree.idregex, '\\$&'), this.element)[0] : null;
					if (par !== null && (!par || !m[obj.parent].state.opened)) {
						return false;
					}
					ind = $.inArray(obj.id, par === null ? m['#'].children : m[obj.parent].children);
				}
			} else {
				node = $(node);
				if (!is_callback) {
					par = node.parent().parent()[0];
					if (par === this.element[0]) {
						par = null;
					}
					ind = node.index();
				}
				// m[obj.id].data = node.data(); // use only node's data, no need to touch jquery storage
				if (!deep && obj.children.length && !node.children('ul').length) {
					deep = true;
				}
				if (!deep) {
					old = node.children('UL')[0];
				}
				s = node.attr('aria-selected');
				f = node.children('.jstree-anchor')[0] === document.activeElement;
				node.remove();
				//node = d.createElement('LI');
				//node = node[0];
			}
			node = $.jstree._internal.clone_node.cloneNode(true);
			// node is DOM, deep is boolean

			c = 'jstree-node ';
			for (i in obj.li_attr) {
				if (obj.li_attr.hasOwnProperty(i)) {
					if (i === 'id') {
						continue;
					}
					if (i !== 'class') {
						node.setAttribute(i, obj.li_attr[i]);
					} else {
						c += obj.li_attr[i];
					}
				}
			}
			if (s && s !== "false") {
				node.setAttribute('aria-selected', true);
			}
			if (obj.state.loaded && !obj.children.length) {
				c += ' jstree-leaf';
			} else {
				c += obj.state.opened && obj.state.loaded ? ' jstree-open' : ' jstree-closed';
				node.setAttribute('aria-expanded', (obj.state.opened && obj.state.loaded));
			}
			if (obj.parent !== null && m[obj.parent].children[m[obj.parent].children.length - 1] === obj.id) {
				c += ' jstree-last';
			}
			node.id = obj.id;
			node.className = c;
			c = (obj.state.selected ? ' jstree-clicked' : '') + (obj.state.disabled ? ' jstree-disabled' : '');
			for (j in obj.a_attr) {
				if (obj.a_attr.hasOwnProperty(j)) {
					if (j === 'href' && obj.a_attr[j] === '#') {
						continue;
					}
					if (j !== 'class') {
						node.childNodes[1].setAttribute(j, obj.a_attr[j]);
					} else {
						c += ' ' + obj.a_attr[j];
					}
				}
			}
			if (c.length) {
				node.childNodes[1].className = 'jstree-anchor ' + c;
			}
			if ((obj.icon && obj.icon !== true) || obj.icon === false) {
				if (obj.icon === false) {
					node.childNodes[1].childNodes[0].className += ' jstree-themeicon-hidden';
				} else if (obj.icon.indexOf('/') === -1 && obj.icon.indexOf('.') === -1) {
					node.childNodes[1].childNodes[0].className += ' ' + obj.icon + ' jstree-themeicon-custom';
				} else {
					node.childNodes[1].childNodes[0].style.backgroundImage = 'url(' + obj.icon + ')';
					node.childNodes[1].childNodes[0].style.backgroundPosition = 'center center';
					node.childNodes[1].childNodes[0].style.backgroundSize = 'auto';
					node.childNodes[1].childNodes[0].className += ' jstree-themeicon-custom';
				}
			}
			//node.childNodes[1].appendChild(d.createTextNode(obj.text));
			node.childNodes[1].innerHTML += obj.text;
			// if(obj.data) { $.data(node, obj.data); } // always work with node's data, no need to touch jquery store

			if (deep && obj.children.length && obj.state.opened && obj.state.loaded) {
				k = d.createElement('UL');
				k.setAttribute('role', 'group');
				k.className = 'jstree-children';
				for (i = 0, j = obj.children.length; i < j; i++) {
					k.appendChild(this.redraw_node(obj.children[i], deep, true));
				}
				node.appendChild(k);
			}
			if (old) {
				node.appendChild(old);
			}
			if (!is_callback) {
				// append back using par / ind
				if (!par) {
					par = this.element[0];
				}
				if (!par.getElementsByTagName('UL').length) {
					i = d.createElement('UL');
					i.setAttribute('role', 'group');
					i.className = 'jstree-children';
					par.appendChild(i);
					par = i;
				} else {
					par = par.getElementsByTagName('UL')[0];
				}

				if (ind < par.childNodes.length) {
					par.insertBefore(node, par.childNodes[ind]);
				} else {
					par.appendChild(node);
				}
				if (f) {
					node.childNodes[1].focus();
				}
			}
			if (obj.state.opened && !obj.state.loaded) {
				obj.state.opened = false;
				setTimeout($.proxy(function () {
					this.open_node(obj.id, false, 0);
				}, this), 0);
			}
			return node;
		},
		/**
		 * opens a node, revaling its children. If the node is not loaded it will be loaded and opened once ready.
		 * @name open_node(obj [, callback, animation])
		 * @param {mixed} obj the node to open
		 * @param {Function} callback a function to execute once the node is opened
		 * @param {Number} animation the animation duration in milliseconds when opening the node (overrides the `core.animation` setting). Use `false` for no animation.
		 * @trigger open_node.jstree, after_open.jstree, before_open.jstree
		 */
		open_node: function (obj, callback, animation) {
			var t1, t2, d, t;
			if ($.isArray(obj)) {
				obj = obj.slice();
				for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.open_node(obj[t1], callback, animation);
				}
				return true;
			}
			obj = this.get_node(obj);
			if (!obj || obj.id === '#') {
				return false;
			}
			animation = animation === undefined ? this.settings.core.animation : animation;
			if (!this.is_closed(obj)) {
				if (callback) {
					callback.call(this, obj, false);
				}
				return false;
			}
			if (!this.is_loaded(obj)) {
				if (this.is_loading(obj)) {
					return setTimeout($.proxy(function () {
						this.open_node(obj, callback, animation);
					}, this), 500);
				}
				this.load_node(obj, function (o, ok) {
					return ok ? this.open_node(o, callback, animation) : (callback ? callback.call(this, o, false) : false);
				});
			} else {
				d = this.get_node(obj, true);
				t = this;
				if (d.length) {
					if (obj.children.length && !this._firstChild(d.children('ul')[0])) {
						obj.state.opened = true;
						this.redraw_node(obj, true);
						d = this.get_node(obj, true);
					}
					if (!animation) {
						this.trigger('before_open', {
							"node": obj
						});
						d[0].className = d[0].className.replace('jstree-closed', 'jstree-open');
						d[0].setAttribute("aria-expanded", true);
					} else {
						this.trigger('before_open', {
							"node": obj
						});
						d
							.children("ul").css("display", "none").end()
							.removeClass("jstree-closed").addClass("jstree-open").attr("aria-expanded", true)
							.children("ul").stop(true, true)
							.slideDown(animation, function () {
								this.style.display = "";
								t.trigger("after_open", {
									"node": obj
								});
							});
					}
				}
				obj.state.opened = true;
				if (callback) {
					callback.call(this, obj, true);
				}
				if (!d.length) {
					/**
					 * triggered when a node is about to be opened (if the node is supposed to be in the DOM, it will be, but it won't be visible yet)
					 * @event
					 * @name before_open.jstree
					 * @param {Object} node the opened node
					 */
					this.trigger('before_open', {
						"node": obj
					});
				}
				/**
				 * triggered when a node is opened (if there is an animation it will not be completed yet)
				 * @event
				 * @name open_node.jstree
				 * @param {Object} node the opened node
				 */
				this.trigger('open_node', {
					"node": obj
				});
				if (!animation || !d.length) {
					/**
					 * triggered when a node is opened and the animation is complete
					 * @event
					 * @name after_open.jstree
					 * @param {Object} node the opened node
					 */
					this.trigger("after_open", {
						"node": obj
					});
				}
			}
		},
		/**
		 * opens every parent of a node (node should be loaded)
		 * @name _open_to(obj)
		 * @param {mixed} obj the node to reveal
		 * @private
		 */
		_open_to: function (obj) {
			obj = this.get_node(obj);
			if (!obj || obj.id === '#') {
				return false;
			}
			var i, j, p = obj.parents;
			for (i = 0, j = p.length; i < j; i += 1) {
				if (i !== '#') {
					this.open_node(p[i], false, 0);
				}
			}
			return $('#' + obj.id.replace($.jstree.idregex, '\\$&'), this.element);
		},
		/**
		 * closes a node, hiding its children
		 * @name close_node(obj [, animation])
		 * @param {mixed} obj the node to close
		 * @param {Number} animation the animation duration in milliseconds when closing the node (overrides the `core.animation` setting). Use `false` for no animation.
		 * @trigger close_node.jstree, after_close.jstree
		 */
		close_node: function (obj, animation) {
			var t1, t2, t, d;
			if ($.isArray(obj)) {
				obj = obj.slice();
				for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.close_node(obj[t1], animation);
				}
				return true;
			}
			obj = this.get_node(obj);
			if (!obj || obj.id === '#') {
				return false;
			}
			if (this.is_closed(obj)) {
				return false;
			}
			animation = animation === undefined ? this.settings.core.animation : animation;
			t = this;
			d = this.get_node(obj, true);
			if (d.length) {
				if (!animation) {
					d[0].className = d[0].className.replace('jstree-open', 'jstree-closed');
					d.attr("aria-expanded", false).children('ul').remove();
				} else {
					d
						.children("ul").attr("style", "display:block !important").end()
						.removeClass("jstree-open").addClass("jstree-closed").attr("aria-expanded", false)
						.children("ul").stop(true, true).slideUp(animation, function () {
							this.style.display = "";
							d.children('ul').remove();
							t.trigger("after_close", {
								"node": obj
							});
						});
				}
			}
			obj.state.opened = false;
			/**
			 * triggered when a node is closed (if there is an animation it will not be complete yet)
			 * @event
			 * @name close_node.jstree
			 * @param {Object} node the closed node
			 */
			this.trigger('close_node', {
				"node": obj
			});
			if (!animation || !d.length) {
				/**
				 * triggered when a node is closed and the animation is complete
				 * @event
				 * @name after_close.jstree
				 * @param {Object} node the closed node
				 */
				this.trigger("after_close", {
					"node": obj
				});
			}
		},
		/**
		 * toggles a node - closing it if it is open, opening it if it is closed
		 * @name toggle_node(obj)
		 * @param {mixed} obj the node to toggle
		 */
		toggle_node: function (obj) {
			var t1, t2;
			if ($.isArray(obj)) {
				obj = obj.slice();
				for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.toggle_node(obj[t1]);
				}
				return true;
			}
			if (this.is_closed(obj)) {
				return this.open_node(obj);
			}
			if (this.is_open(obj)) {
				return this.close_node(obj);
			}
		},
		/**
		 * opens all nodes within a node (or the tree), revaling their children. If the node is not loaded it will be loaded and opened once ready.
		 * @name open_all([obj, animation, original_obj])
		 * @param {mixed} obj the node to open recursively, omit to open all nodes in the tree
		 * @param {Number} animation the animation duration in milliseconds when opening the nodes, the default is no animation
		 * @param {jQuery} reference to the node that started the process (internal use)
		 * @trigger open_all.jstree
		 */
		open_all: function (obj, animation, original_obj) {
			if (!obj) {
				obj = '#';
			}
			obj = this.get_node(obj);
			if (!obj) {
				return false;
			}
			var dom = obj.id === '#' ? this.get_container_ul() : this.get_node(obj, true),
				i, j, _this;
			if (!dom.length) {
				for (i = 0, j = obj.children_d.length; i < j; i++) {
					if (this.is_closed(this._model.data[obj.children_d[i]])) {
						this._model.data[obj.children_d[i]].state.opened = true;
					}
				}
				return this.trigger('open_all', {
					"node": obj
				});
			}
			original_obj = original_obj || dom;
			_this = this;
			dom = this.is_closed(obj) ? dom.find('li.jstree-closed').addBack() : dom.find('li.jstree-closed');
			dom.each(function () {
				_this.open_node(
					this,
					function (node, status) {
						if (status && this.is_parent(node)) {
							this.open_all(node, animation, original_obj);
						}
					},
					animation || 0
				);
			});
			if (original_obj.find('li.jstree-closed').length === 0) {
				/**
				 * triggered when an `open_all` call completes
				 * @event
				 * @name open_all.jstree
				 * @param {Object} node the opened node
				 */
				this.trigger('open_all', {
					"node": this.get_node(original_obj)
				});
			}
		},
		/**
		 * closes all nodes within a node (or the tree), revaling their children
		 * @name close_all([obj, animation])
		 * @param {mixed} obj the node to close recursively, omit to close all nodes in the tree
		 * @param {Number} animation the animation duration in milliseconds when closing the nodes, the default is no animation
		 * @trigger close_all.jstree
		 */
		close_all: function (obj, animation) {
			if (!obj) {
				obj = '#';
			}
			obj = this.get_node(obj);
			if (!obj) {
				return false;
			}
			var dom = obj.id === '#' ? this.get_container_ul() : this.get_node(obj, true),
				_this = this,
				i, j;
			if (!dom.length) {
				for (i = 0, j = obj.children_d.length; i < j; i++) {
					this._model.data[obj.children_d[i]].state.opened = false;
				}
				return this.trigger('close_all', {
					"node": obj
				});
			}
			dom = this.is_open(obj) ? dom.find('li.jstree-open').addBack() : dom.find('li.jstree-open');
			dom.vakata_reverse().each(function () {
				_this.close_node(this, animation || 0);
			});
			/**
			 * triggered when an `close_all` call completes
			 * @event
			 * @name close_all.jstree
			 * @param {Object} node the closed node
			 */
			this.trigger('close_all', {
				"node": obj
			});
		},
		/**
		 * checks if a node is disabled (not selectable)
		 * @name is_disabled(obj)
		 * @param  {mixed} obj
		 * @return {Boolean}
		 */
		is_disabled: function (obj) {
			obj = this.get_node(obj);
			return obj && obj.state && obj.state.disabled;
		},
		/**
		 * enables a node - so that it can be selected
		 * @name enable_node(obj)
		 * @param {mixed} obj the node to enable
		 * @trigger enable_node.jstree
		 */
		enable_node: function (obj) {
			var t1, t2;
			if ($.isArray(obj)) {
				obj = obj.slice();
				for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.enable_node(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if (!obj || obj.id === '#') {
				return false;
			}
			obj.state.disabled = false;
			this.get_node(obj, true).children('.jstree-anchor').removeClass('jstree-disabled');
			/**
			 * triggered when an node is enabled
			 * @event
			 * @name enable_node.jstree
			 * @param {Object} node the enabled node
			 */
			this.trigger('enable_node', {
				'node': obj
			});
		},
		/**
		 * disables a node - so that it can not be selected
		 * @name disable_node(obj)
		 * @param {mixed} obj the node to disable
		 * @trigger disable_node.jstree
		 */
		disable_node: function (obj) {
			var t1, t2;
			if ($.isArray(obj)) {
				obj = obj.slice();
				for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.disable_node(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if (!obj || obj.id === '#') {
				return false;
			}
			obj.state.disabled = true;
			this.get_node(obj, true).children('.jstree-anchor').addClass('jstree-disabled');
			/**
			 * triggered when an node is disabled
			 * @event
			 * @name disable_node.jstree
			 * @param {Object} node the disabled node
			 */
			this.trigger('disable_node', {
				'node': obj
			});
		},
		/**
		 * called when a node is selected by the user. Used internally.
		 * @private
		 * @name activate_node(obj, e)
		 * @param {mixed} obj the node
		 * @param {Object} e the related event
		 * @trigger activate_node.jstree
		 */
		activate_node: function (obj, e) {
			if (this.is_disabled(obj)) {
				return false;
			}

			// ensure last_clicked is still in the DOM, make it fresh (maybe it was moved?) and make sure it is still selected, if not - make last_clicked the last selected node
			this._data.core.last_clicked = this._data.core.last_clicked && this._data.core.last_clicked.id !== undefined ? this.get_node(this._data.core.last_clicked.id) : null;
			if (this._data.core.last_clicked && !this._data.core.last_clicked.state.selected) {
				this._data.core.last_clicked = null;
			}
			if (!this._data.core.last_clicked && this._data.core.selected.length) {
				this._data.core.last_clicked = this.get_node(this._data.core.selected[this._data.core.selected.length - 1]);
			}

			if (!this.settings.core.multiple || (!e.metaKey && !e.ctrlKey && !e.shiftKey) || (e.shiftKey && (!this._data.core.last_clicked || !this.get_parent(obj) || this.get_parent(obj) !== this._data.core.last_clicked.parent))) {
				if (!this.settings.core.multiple && (e.metaKey || e.ctrlKey || e.shiftKey) && this.is_selected(obj)) {
					this.deselect_node(obj, false, false, e);
				} else {
					this.deselect_all(true);
					this.select_node(obj, false, false, e);
					this._data.core.last_clicked = this.get_node(obj);
				}
			} else {
				if (e.shiftKey) {
					var o = this.get_node(obj).id,
						l = this._data.core.last_clicked.id,
						p = this.get_node(this._data.core.last_clicked.parent).children,
						c = false,
						i, j;
					for (i = 0, j = p.length; i < j; i += 1) {
						// separate IFs work whem o and l are the same
						if (p[i] === o) {
							c = !c;
						}
						if (p[i] === l) {
							c = !c;
						}
						if (c || p[i] === o || p[i] === l) {
							this.select_node(p[i], false, false, e);
						} else {
							this.deselect_node(p[i], false, false, e);
						}
					}
				} else {
					if (!this.is_selected(obj)) {
						this.select_node(obj, false, false, e);
					} else {
						this.deselect_node(obj, false, false, e);
					}
				}
			}
			/**
			 * triggered when an node is clicked or intercated with by the user
			 * @event
			 * @name activate_node.jstree
			 * @param {Object} node
			 */
			this.trigger('activate_node', {
				'node': this.get_node(obj)
			});
		},
		/**
		 * applies the hover state on a node, called when a node is hovered by the user. Used internally.
		 * @private
		 * @name hover_node(obj)
		 * @param {mixed} obj
		 * @trigger hover_node.jstree
		 */
		hover_node: function (obj) {
			obj = this.get_node(obj, true);
			if (!obj || !obj.length || obj.children('.jstree-hovered').length) {
				return false;
			}
			var o = this.element.find('.jstree-hovered'),
				t = this.element;
			if (o && o.length) {
				this.dehover_node(o);
			}

			obj.children('.jstree-anchor').addClass('jstree-hovered');
			/**
			 * triggered when an node is hovered
			 * @event
			 * @name hover_node.jstree
			 * @param {Object} node
			 */
			this.trigger('hover_node', {
				'node': this.get_node(obj)
			});
			setTimeout(function () {
				t.attr('aria-activedescendant', obj[0].id);
				obj.attr('aria-selected', true);
			}, 0);
		},
		/**
		 * removes the hover state from a nodecalled when a node is no longer hovered by the user. Used internally.
		 * @private
		 * @name dehover_node(obj)
		 * @param {mixed} obj
		 * @trigger dehover_node.jstree
		 */
		dehover_node: function (obj) {
			obj = this.get_node(obj, true);
			if (!obj || !obj.length || !obj.children('.jstree-hovered').length) {
				return false;
			}
			obj.attr('aria-selected', false).children('.jstree-anchor').removeClass('jstree-hovered');
			/**
			 * triggered when an node is no longer hovered
			 * @event
			 * @name dehover_node.jstree
			 * @param {Object} node
			 */
			this.trigger('dehover_node', {
				'node': this.get_node(obj)
			});
		},
		/**
		 * gets the current state of the tree so that it can be restored later with `set_state(state)`. Used internally.
		 * @name get_state()
		 * @private
		 * @return {Object}
		 */
		get_state: function () {
			var state = {
				'core': {
					'open': [],
					'scroll': {
						'left': this.element.scrollLeft(),
						'top': this.element.scrollTop()
					},
					/*!
					'themes' : {
						'name' : this.get_theme(),
						'icons' : this._data.core.themes.icons,
						'dots' : this._data.core.themes.dots
					},
					*/
					'selected': []
				}
			}, i;
			for (i in this._model.data) {
				if (this._model.data.hasOwnProperty(i)) {
					if (i !== '#') {
						if (this._model.data[i].state.opened) {
							state.core.open.push(i);
						}
						if (this._model.data[i].state.selected) {
							state.core.selected.push(i);
						}
					}
				}
			}
			return state;
		},
		/**
		 * sets the state of the tree. Used internally.
		 * @name set_state(state [, callback])
		 * @private
		 * @param {Object} state the state to restore
		 * @param {Function} callback an optional function to execute once the state is restored.
		 * @trigger set_state.jstree
		 */
		set_state: function (state, callback) {
			if (state) {
				if (state.core) {
					var res, n, t, _this;
					if (state.core.open) {
						if (!$.isArray(state.core.open)) {
							delete state.core.open;
							this.set_state(state, callback);
							return false;
						}
						res = true;
						n = false;
						t = this;
						$.each(state.core.open.concat([]), function (i, v) {
							n = t.get_node(v);
							if (n) {
								if (t.is_loaded(v)) {
									if (t.is_closed(v)) {
										t.open_node(v, false, 0);
									}
									if (state && state.core && state.core.open) {
										$.vakata.array_remove_item(state.core.open, v);
									}
								} else {
									if (!t.is_loading(v)) {
										t.open_node(v, $.proxy(function (o, s) {
											if (!s && state && state.core && state.core.open) {
												$.vakata.array_remove_item(state.core.open, o.id);
											}
											this.set_state(state, callback);
										}, t), 0);
									}
									// there will be some async activity - so wait for it
									res = false;
								}
							}
						});
						if (res) {
							delete state.core.open;
							this.set_state(state, callback);
						}
						return false;
					}
					if (state.core.scroll) {
						if (state.core.scroll && state.core.scroll.left !== undefined) {
							this.element.scrollLeft(state.core.scroll.left);
						}
						if (state.core.scroll && state.core.scroll.top !== undefined) {
							this.element.scrollTop(state.core.scroll.top);
						}
						delete state.core.scroll;
						this.set_state(state, callback);
						return false;
					}
					/*!
					if(state.core.themes) {
						if(state.core.themes.name) {
							this.set_theme(state.core.themes.name);
						}
						if(typeof state.core.themes.dots !== 'undefined') {
							this[ state.core.themes.dots ? "show_dots" : "hide_dots" ]();
						}
						if(typeof state.core.themes.icons !== 'undefined') {
							this[ state.core.themes.icons ? "show_icons" : "hide_icons" ]();
						}
						delete state.core.themes;
						delete state.core.open;
						this.set_state(state, callback);
						return false;
					}
					*/
					if (state.core.selected) {
						_this = this;
						this.deselect_all();
						$.each(state.core.selected, function (i, v) {
							_this.select_node(v);
						});
						delete state.core.selected;
						this.set_state(state, callback);
						return false;
					}
					if ($.isEmptyObject(state.core)) {
						delete state.core;
						this.set_state(state, callback);
						return false;
					}
				}
				if ($.isEmptyObject(state)) {
					state = null;
					if (callback) {
						callback.call(this);
					}
					/**
					 * triggered when a `set_state` call completes
					 * @event
					 * @name set_state.jstree
					 */
					this.trigger('set_state');
					return false;
				}
				return true;
			}
			return false;
		},
		/**
		 * refreshes the tree - all nodes are reloaded with calls to `load_node`.
		 * @name refresh()
		 * @param {Boolean} skip_loading an option to skip showing the loading indicator
		 * @trigger refresh.jstree
		 */
		refresh: function (skip_loading) {
			this._data.core.state = this.get_state();
			this._cnt = 0;
			this._model.data = {
				'#': {
					id: '#',
					parent: null,
					parents: [],
					children: [],
					children_d: [],
					state: {
						loaded: false
					}
				}
			};
			var c = this.get_container_ul()[0].className;
			if (!skip_loading) {
				this.element.html("<" + "ul class='jstree-container-ul'><" + "li class='jstree-initial-node jstree-loading jstree-leaf jstree-last'><i class='jstree-icon jstree-ocl'></i><" + "a class='jstree-anchor' href='#'><i class='jstree-icon jstree-themeicon-hidden'></i>" + this.get_string("Loading ...") + "</a></li></ul>");
			}
			this.load_node('#', function (o, s) {
				if (s) {
					this.get_container_ul()[0].className = c;
					this.set_state($.extend(true, {}, this._data.core.state), function () {
						/**
						 * triggered when a `refresh` call completes
						 * @event
						 * @name refresh.jstree
						 */
						this.trigger('refresh');
					});
				}
				this._data.core.state = null;
			});
		},
		/**
		 * set (change) the ID of a node
		 * @name set_id(obj, id)
		 * @param  {mixed} obj the node
		 * @param  {String} id the new ID
		 * @return {Boolean}
		 */
		set_id: function (obj, id) {
			obj = this.get_node(obj);
			if (!obj || obj.id === '#') {
				return false;
			}
			var i, j, m = this._model.data;
			id = id.toString();
			// update parents (replace current ID with new one in children and children_d)
			m[obj.parent].children[$.inArray(obj.id, m[obj.parent].children)] = id;
			for (i = 0, j = obj.parents.length; i < j; i++) {
				m[obj.parents[i]].children_d[$.inArray(obj.id, m[obj.parents[i]].children_d)] = id;
			}
			// update children (replace current ID with new one in parent and parents)
			for (i = 0, j = obj.children.length; i < j; i++) {
				m[obj.children[i]].parent = id;
			}
			for (i = 0, j = obj.children_d.length; i < j; i++) {
				m[obj.children_d[i]].parents[$.inArray(obj.id, m[obj.children_d[i]].parents)] = id;
			}
			i = $.inArray(obj.id, this._data.core.selected);
			if (i !== -1) {
				this._data.core.selected[i] = id;
			}
			// update model and obj itself (obj.id, this._model.data[KEY])
			i = this.get_node(obj.id, true);
			if (i) {
				i.attr('id', id);
			}
			delete m[obj.id];
			obj.id = id;
			m[id] = obj;
			return true;
		},
		/**
		 * get the text value of a node
		 * @name get_text(obj)
		 * @param  {mixed} obj the node
		 * @return {String}
		 */
		get_text: function (obj) {
			obj = this.get_node(obj);
			return (!obj || obj.id === '#') ? false : obj.text;
		},
		/**
		 * set the text value of a node. Used internally, please use `rename_node(obj, val)`.
		 * @private
		 * @name set_text(obj, val)
		 * @param  {mixed} obj the node, you can pass an array to set the text on multiple nodes
		 * @param  {String} val the new text value
		 * @return {Boolean}
		 * @trigger set_text.jstree
		 */
		set_text: function (obj, val) {
			var t1, t2, dom, tmp;
			if ($.isArray(obj)) {
				obj = obj.slice();
				for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.set_text(obj[t1], val);
				}
				return true;
			}
			obj = this.get_node(obj);
			if (!obj || obj.id === '#') {
				return false;
			}
			obj.text = val;
			dom = this.get_node(obj, true);
			if (dom.length) {
				dom = dom.children(".jstree-anchor:eq(0)");
				tmp = dom.children("I").clone();
				dom.html(val).prepend(tmp);
				/**
				 * triggered when a node text value is changed
				 * @event
				 * @name set_text.jstree
				 * @param {Object} obj
				 * @param {String} text the new value
				 */
				this.trigger('set_text', {
					"obj": obj,
					"text": val
				});
			}
			return true;
		},
		/**
		 * gets a JSON representation of a node (or the whole tree)
		 * @name get_json([obj, options])
		 * @param  {mixed} obj
		 * @param  {Object} options
		 * @param  {Boolean} options.no_state do not return state information
		 * @param  {Boolean} options.no_id do not return ID
		 * @param  {Boolean} options.no_children do not include children
		 * @param  {Boolean} options.no_data do not include node data
		 * @param  {Boolean} options.flat return flat JSON instead of nested
		 * @return {Object}
		 */
		get_json: function (obj, options, flat) {
			obj = this.get_node(obj || '#');
			if (!obj) {
				return false;
			}
			if (options && options.flat && !flat) {
				flat = [];
			}
			var tmp = {
				'id': obj.id,
				'text': obj.text,
				'icon': this.get_icon(obj),
				'li_attr': obj.li_attr,
				'a_attr': obj.a_attr,
				'state': {},
				'data': options && options.no_data ? false : obj.data
				//( this.get_node(obj, true).length ? this.get_node(obj, true).data() : obj.data ),
			}, i, j;
			if (options && options.flat) {
				tmp.parent = obj.parent;
			} else {
				tmp.children = [];
			}
			if (!options || !options.no_state) {
				for (i in obj.state) {
					if (obj.state.hasOwnProperty(i)) {
						tmp.state[i] = obj.state[i];
					}
				}
			}
			if (options && options.no_id) {
				delete tmp.id;
				if (tmp.li_attr && tmp.li_attr.id) {
					delete tmp.li_attr.id;
				}
			}
			if (options && options.flat && obj.id !== '#') {
				flat.push(tmp);
			}
			if (!options || !options.no_children) {
				for (i = 0, j = obj.children.length; i < j; i++) {
					if (options && options.flat) {
						this.get_json(obj.children[i], options, flat);
					} else {
						tmp.children.push(this.get_json(obj.children[i], options));
					}
				}
			}
			return options && options.flat ? flat : (obj.id === '#' ? tmp.children : tmp);
		},
		/**
		 * create a new node (do not confuse with load_node)
		 * @name create_node([obj, node, pos, callback, is_loaded])
		 * @param  {mixed}   par       the parent node (to create a root node use either "#" (string) or `null`)
		 * @param  {mixed}   node      the data for the new node (a valid JSON object, or a simple string with the name)
		 * @param  {mixed}   pos       the index at which to insert the node, "first" and "last" are also supported, default is "last"
		 * @param  {Function} callback a function to be called once the node is created
		 * @param  {Boolean} is_loaded internal argument indicating if the parent node was succesfully loaded
		 * @return {String}            the ID of the newly create node
		 * @trigger model.jstree, create_node.jstree
		 */
		create_node: function (par, node, pos, callback, is_loaded) {
			if (par === null) {
				par = "#";
			}
			par = this.get_node(par);
			if (!par) {
				return false;
			}
			pos = pos === undefined ? "last" : pos;
			if (!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
				return this.load_node(par, function () {
					this.create_node(par, node, pos, callback, true);
				});
			}
			if (!node) {
				node = {
					"text": this.get_string('New node')
				};
			}
			if (node.text === undefined) {
				node.text = this.get_string('New node');
			}
			var tmp, dpc, i, j;

			if (par.id === '#') {
				if (pos === "before") {
					pos = "first";
				}
				if (pos === "after") {
					pos = "last";
				}
			}
			switch (pos) {
			case "before":
				tmp = this.get_node(par.parent);
				pos = $.inArray(par.id, tmp.children);
				par = tmp;
				break;
			case "after":
				tmp = this.get_node(par.parent);
				pos = $.inArray(par.id, tmp.children) + 1;
				par = tmp;
				break;
			case "inside":
			case "first":
				pos = 0;
				break;
			case "last":
				pos = par.children.length;
				break;
			default:
				if (!pos) {
					pos = 0;
				}
				break;
			}
			if (pos > par.children.length) {
				pos = par.children.length;
			}
			if (!node.id) {
				node.id = true;
			}
			if (!this.check("create_node", node, par, pos)) {
				this.settings.core.error.call(this, this._data.core.last_error);
				return false;
			}
			if (node.id === true) {
				delete node.id;
			}
			node = this._parse_model_from_json(node, par.id, par.parents.concat());
			if (!node) {
				return false;
			}
			tmp = this.get_node(node);
			dpc = [];
			dpc.push(node);
			dpc = dpc.concat(tmp.children_d);
			this.trigger('model', {
				"nodes": dpc,
				"parent": par.id
			});

			par.children_d = par.children_d.concat(dpc);
			for (i = 0, j = par.parents.length; i < j; i++) {
				this._model.data[par.parents[i]].children_d = this._model.data[par.parents[i]].children_d.concat(dpc);
			}
			node = tmp;
			tmp = [];
			for (i = 0, j = par.children.length; i < j; i++) {
				tmp[i >= pos ? i + 1 : i] = par.children[i];
			}
			tmp[pos] = node.id;
			par.children = tmp;

			this.redraw_node(par, true);
			if (callback) {
				callback.call(this, this.get_node(node));
			}
			/**
			 * triggered when a node is created
			 * @event
			 * @name create_node.jstree
			 * @param {Object} node
			 * @param {String} parent the parent's ID
			 * @param {Number} position the position of the new node among the parent's children
			 */
			this.trigger('create_node', {
				"node": this.get_node(node),
				"parent": par.id,
				"position": pos
			});
			return node.id;
		},
		/**
		 * set the text value of a node
		 * @name rename_node(obj, val)
		 * @param  {mixed} obj the node, you can pass an array to rename multiple nodes to the same name
		 * @param  {String} val the new text value
		 * @return {Boolean}
		 * @trigger rename_node.jstree
		 */
		rename_node: function (obj, val) {
			var t1, t2, old;
			if ($.isArray(obj)) {
				obj = obj.slice();
				for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.rename_node(obj[t1], val);
				}
				return true;
			}
			obj = this.get_node(obj);
			if (!obj || obj.id === '#') {
				return false;
			}
			old = obj.text;
			if (!this.check("rename_node", obj, this.get_parent(obj), val)) {
				this.settings.core.error.call(this, this._data.core.last_error);
				return false;
			}
			this.set_text(obj, val); // .apply(this, Array.prototype.slice.call(arguments))
			/**
			 * triggered when a node is renamed
			 * @event
			 * @name rename_node.jstree
			 * @param {Object} node
			 * @param {String} text the new value
			 * @param {String} old the old value
			 */
			this.trigger('rename_node', {
				"node": obj,
				"text": val,
				"old": old
			});
			return true;
		},
		/**
		 * remove a node
		 * @name delete_node(obj)
		 * @param  {mixed} obj the node, you can pass an array to delete multiple nodes
		 * @return {Boolean}
		 * @trigger delete_node.jstree, changed.jstree
		 */
		delete_node: function (obj) {
			var t1, t2, par, pos, tmp, i, j, k, l, c;
			if ($.isArray(obj)) {
				obj = obj.slice();
				for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.delete_node(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if (!obj || obj.id === '#') {
				return false;
			}
			par = this.get_node(obj.parent);
			pos = $.inArray(obj.id, par.children);
			c = false;
			if (!this.check("delete_node", obj, par, pos)) {
				this.settings.core.error.call(this, this._data.core.last_error);
				return false;
			}
			if (pos !== -1) {
				par.children = $.vakata.array_remove(par.children, pos);
			}
			tmp = obj.children_d.concat([]);
			tmp.push(obj.id);
			for (k = 0, l = tmp.length; k < l; k++) {
				for (i = 0, j = obj.parents.length; i < j; i++) {
					pos = $.inArray(tmp[k], this._model.data[obj.parents[i]].children_d);
					if (pos !== -1) {
						this._model.data[obj.parents[i]].children_d = $.vakata.array_remove(this._model.data[obj.parents[i]].children_d, pos);
					}
				}
				if (this._model.data[tmp[k]].state.selected) {
					c = true;
					pos = $.inArray(tmp[k], this._data.core.selected);
					if (pos !== -1) {
						this._data.core.selected = $.vakata.array_remove(this._data.core.selected, pos);
					}
				}
			}
			/**
			 * triggered when a node is deleted
			 * @event
			 * @name delete_node.jstree
			 * @param {Object} node
			 * @param {String} parent the parent's ID
			 */
			this.trigger('delete_node', {
				"node": obj,
				"parent": par.id
			});
			if (c) {
				this.trigger('changed', {
					'action': 'delete_node',
					'node': obj,
					'selected': this._data.core.selected,
					'parent': par.id
				});
			}
			for (k = 0, l = tmp.length; k < l; k++) {
				delete this._model.data[tmp[k]];
			}
			this.redraw_node(par, true);
			return true;
		},
		/**
		 * check if an operation is premitted on the tree. Used internally.
		 * @private
		 * @name check(chk, obj, par, pos)
		 * @param  {String} chk the operation to check, can be "create_node", "rename_node", "delete_node", "copy_node" or "move_node"
		 * @param  {mixed} obj the node
		 * @param  {mixed} par the parent
		 * @param  {mixed} pos the position to insert at, or if "rename_node" - the new name
		 * @param  {mixed} more some various additional information, for example if a "move_node" operations is triggered by DND this will be the hovered node
		 * @return {Boolean}
		 */
		check: function (chk, obj, par, pos, more) {
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = par && par.id ? par : this.get_node(par);
			var tmp = chk.match(/^move_node|copy_node|create_node$/i) ? par : obj,
				chc = this.settings.core.check_callback;
			if (chk === "move_node" || chk === "copy_node") {
				if (obj.id === par.id || $.inArray(obj.id, par.children) === pos || $.inArray(par.id, obj.children_d) !== -1) {
					this._data.core.last_error = {
						'error': 'check',
						'plugin': 'core',
						'id': 'core_01',
						'reason': 'Moving parent inside child',
						'data': JSON.stringify({
							'chk': chk,
							'pos': pos,
							'obj': obj && obj.id ? obj.id : false,
							'par': par && par.id ? par.id : false
						})
					};
					return false;
				}
			}
			tmp = this.get_node(tmp, true);
			if (tmp.length) {
				tmp = tmp.data('jstree');
			}
			if (tmp && tmp.functions && (tmp.functions[chk] === false || tmp.functions[chk] === true)) {
				if (tmp.functions[chk] === false) {
					this._data.core.last_error = {
						'error': 'check',
						'plugin': 'core',
						'id': 'core_02',
						'reason': 'Node data prevents function: ' + chk,
						'data': JSON.stringify({
							'chk': chk,
							'pos': pos,
							'obj': obj && obj.id ? obj.id : false,
							'par': par && par.id ? par.id : false
						})
					};
				}
				return tmp.functions[chk];
			}
			if (chc === false || ($.isFunction(chc) && chc.call(this, chk, obj, par, pos, more) === false) || (chc && chc[chk] === false)) {
				this._data.core.last_error = {
					'error': 'check',
					'plugin': 'core',
					'id': 'core_03',
					'reason': 'User config for core.check_callback prevents function: ' + chk,
					'data': JSON.stringify({
						'chk': chk,
						'pos': pos,
						'obj': obj && obj.id ? obj.id : false,
						'par': par && par.id ? par.id : false
					})
				};
				return false;
			}
			return true;
		},
		/**
		 * get the last error
		 * @name last_error()
		 * @return {Object}
		 */
		last_error: function () {
			return this._data.core.last_error;
		},
		/**
		 * move a node to a new parent
		 * @name move_node(obj, par [, pos, callback, is_loaded])
		 * @param  {mixed} obj the node to move, pass an array to move multiple nodes
		 * @param  {mixed} par the new parent
		 * @param  {mixed} pos the position to insert at (besides integer values, "first" and "last" are supported, as well as "before" and "after"), defaults to integer `0`
		 * @param  {function} callback a function to call once the move is completed, receives 3 arguments - the node, the new parent and the position
		 * @param  {Boolean} internal parameter indicating if the parent node has been loaded
		 * @trigger move_node.jstree
		 */
		move_node: function (obj, par, pos, callback, is_loaded) {
			var t1, t2, old_par, new_par, old_ins, is_multi, dpc, tmp, i, j, k, l, p;
			if ($.isArray(obj)) {
				obj = obj.reverse().slice();
				for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.move_node(obj[t1], par, pos, callback, is_loaded);
				}
				return true;
			}
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = this.get_node(par);
			pos = pos === undefined ? 0 : pos;

			if (!par || !obj || obj.id === '#') {
				return false;
			}
			if (!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
				return this.load_node(par, function () {
					this.move_node(obj, par, pos, callback, true);
				});
			}

			old_par = (obj.parent || '#').toString();
			new_par = (!pos.toString().match(/^(before|after)$/) || par.id === '#') ? par : this.get_node(par.parent);
			old_ins = this._model.data[obj.id] ? this : $.jstree.reference(obj.id);
			is_multi = !old_ins || !old_ins._id || (this._id !== old_ins._id);
			if (is_multi) {
				if (this.copy_node(obj, par, pos, callback, is_loaded)) {
					if (old_ins) {
						old_ins.delete_node(obj);
					}
					return true;
				}
				return false;
			}
			//var m = this._model.data;
			if (new_par.id === '#') {
				if (pos === "before") {
					pos = "first";
				}
				if (pos === "after") {
					pos = "last";
				}
			}
			switch (pos) {
			case "before":
				pos = $.inArray(par.id, new_par.children);
				break;
			case "after":
				pos = $.inArray(par.id, new_par.children) + 1;
				break;
			case "inside":
			case "first":
				pos = 0;
				break;
			case "last":
				pos = new_par.children.length;
				break;
			default:
				if (!pos) {
					pos = 0;
				}
				break;
			}
			if (pos > new_par.children.length) {
				pos = new_par.children.length;
			}
			if (!this.check("move_node", obj, new_par, pos, {
				'core': true,
				'is_multi': (old_ins && old_ins._id && old_ins._id !== this._id),
				'is_foreign': (!old_ins || !old_ins._id)
			})) {
				this.settings.core.error.call(this, this._data.core.last_error);
				return false;
			}
			// Same parent
			if (obj.parent === new_par.id) {
				dpc = new_par.children.concat();
				tmp = $.inArray(obj.id, dpc);
				if (tmp !== -1) {
					dpc = $.vakata.array_remove(dpc, tmp);
				}
				tmp = [];
				for (i = 0, j = dpc.length; i < j; i++) {
					tmp[i >= pos ? i + 1 : i] = dpc[i];
				}
				tmp[pos] = obj.id;
				new_par.children = tmp;
				this._node_changed(new_par.id);
				this.redraw(new_par.id === '#');
			} else {
				// clean old parent and up
				tmp = obj.children_d.concat();
				tmp.push(obj.id);
				for (i = 0, j = obj.parents.length; i < j; i++) {
					dpc = [];
					p = old_ins._model.data[obj.parents[i]].children_d;
					for (k = 0, l = p.length; k < l; k++) {
						if ($.inArray(p[k], tmp) === -1) {
							dpc.push(p[k]);
						}
					}
					old_ins._model.data[obj.parents[i]].children_d = dpc;
				}
				old_ins._model.data[old_par].children = $.vakata.array_remove_item(old_ins._model.data[old_par].children, obj.id);

				// insert into new parent and up
				for (i = 0, j = new_par.parents.length; i < j; i++) {
					this._model.data[new_par.parents[i]].children_d = this._model.data[new_par.parents[i]].children_d.concat(tmp);
				}
				dpc = [];
				for (i = 0, j = new_par.children.length; i < j; i++) {
					dpc[i >= pos ? i + 1 : i] = new_par.children[i];
				}
				dpc[pos] = obj.id;
				new_par.children = dpc;
				new_par.children_d.push(obj.id);
				new_par.children_d = new_par.children_d.concat(obj.children_d);

				// update object
				obj.parent = new_par.id;
				tmp = new_par.parents.concat();
				tmp.unshift(new_par.id);
				p = obj.parents.length;
				obj.parents = tmp;

				// update object children
				tmp = tmp.concat();
				for (i = 0, j = obj.children_d.length; i < j; i++) {
					this._model.data[obj.children_d[i]].parents = this._model.data[obj.children_d[i]].parents.slice(0, p * -1);
					Array.prototype.push.apply(this._model.data[obj.children_d[i]].parents, tmp);
				}

				this._node_changed(old_par);
				this._node_changed(new_par.id);
				this.redraw(old_par === '#' || new_par.id === '#');
			}
			if (callback) {
				callback.call(this, obj, new_par, pos);
			}
			/**
			 * triggered when a node is moved
			 * @event
			 * @name move_node.jstree
			 * @param {Object} node
			 * @param {String} parent the parent's ID
			 * @param {Number} position the position of the node among the parent's children
			 * @param {String} old_parent the old parent of the node
			 * @param {Boolean} is_multi do the node and new parent belong to different instances
			 * @param {jsTree} old_instance the instance the node came from
			 * @param {jsTree} new_instance the instance of the new parent
			 */
			this.trigger('move_node', {
				"node": obj,
				"parent": new_par.id,
				"position": pos,
				"old_parent": old_par,
				'is_multi': (old_ins && old_ins._id && old_ins._id !== this._id),
				'is_foreign': (!old_ins || !old_ins._id),
				'old_instance': old_ins,
				'new_instance': this
			});
			return true;
		},
		/**
		 * copy a node to a new parent
		 * @name copy_node(obj, par [, pos, callback, is_loaded])
		 * @param  {mixed} obj the node to copy, pass an array to copy multiple nodes
		 * @param  {mixed} par the new parent
		 * @param  {mixed} pos the position to insert at (besides integer values, "first" and "last" are supported, as well as "before" and "after"), defaults to integer `0`
		 * @param  {function} callback a function to call once the move is completed, receives 3 arguments - the node, the new parent and the position
		 * @param  {Boolean} internal parameter indicating if the parent node has been loaded
		 * @trigger model.jstree copy_node.jstree
		 */
		copy_node: function (obj, par, pos, callback, is_loaded) {
			var t1, t2, dpc, tmp, i, j, node, old_par, new_par, old_ins, is_multi;
			if ($.isArray(obj)) {
				obj = obj.reverse().slice();
				for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.copy_node(obj[t1], par, pos, callback, is_loaded);
				}
				return true;
			}
			obj = obj && obj.id ? obj : this.get_node(obj);
			par = this.get_node(par);
			pos = pos === undefined ? 0 : pos;

			if (!par || !obj || obj.id === '#') {
				return false;
			}
			if (!pos.toString().match(/^(before|after)$/) && !is_loaded && !this.is_loaded(par)) {
				return this.load_node(par, function () {
					this.copy_node(obj, par, pos, callback, true);
				});
			}

			old_par = (obj.parent || '#').toString();
			new_par = (!pos.toString().match(/^(before|after)$/) || par.id === '#') ? par : this.get_node(par.parent);
			old_ins = this._model.data[obj.id] ? this : $.jstree.reference(obj.id);
			is_multi = !old_ins || !old_ins._id || (this._id !== old_ins._id);
			if (new_par.id === '#') {
				if (pos === "before") {
					pos = "first";
				}
				if (pos === "after") {
					pos = "last";
				}
			}
			switch (pos) {
			case "before":
				pos = $.inArray(par.id, new_par.children);
				break;
			case "after":
				pos = $.inArray(par.id, new_par.children) + 1;
				break;
			case "inside":
			case "first":
				pos = 0;
				break;
			case "last":
				pos = new_par.children.length;
				break;
			default:
				if (!pos) {
					pos = 0;
				}
				break;
			}
			if (pos > new_par.children.length) {
				pos = new_par.children.length;
			}
			if (!this.check("copy_node", obj, new_par, pos, {
				'core': true,
				'is_multi': (old_ins && old_ins._id && old_ins._id !== this._id),
				'is_foreign': (!old_ins || !old_ins._id)
			})) {
				this.settings.core.error.call(this, this._data.core.last_error);
				return false;
			}
			node = old_ins ? old_ins.get_json(obj, {
				no_id: true,
				no_data: true,
				no_state: true
			}) : obj;
			if (!node) {
				return false;
			}
			if (node.id === true) {
				delete node.id;
			}
			node = this._parse_model_from_json(node, new_par.id, new_par.parents.concat());
			if (!node) {
				return false;
			}
			tmp = this.get_node(node);
			if (obj && obj.state && obj.state.loaded === false) {
				tmp.state.loaded = false;
			}
			dpc = [];
			dpc.push(node);
			dpc = dpc.concat(tmp.children_d);
			this.trigger('model', {
				"nodes": dpc,
				"parent": new_par.id
			});

			// insert into new parent and up
			for (i = 0, j = new_par.parents.length; i < j; i++) {
				this._model.data[new_par.parents[i]].children_d = this._model.data[new_par.parents[i]].children_d.concat(dpc);
			}
			dpc = [];
			for (i = 0, j = new_par.children.length; i < j; i++) {
				dpc[i >= pos ? i + 1 : i] = new_par.children[i];
			}
			dpc[pos] = tmp.id;
			new_par.children = dpc;
			new_par.children_d.push(tmp.id);
			new_par.children_d = new_par.children_d.concat(tmp.children_d);

			this._node_changed(new_par.id);
			this.redraw(new_par.id === '#');
			if (callback) {
				callback.call(this, tmp, new_par, pos);
			}
			/**
			 * triggered when a node is copied
			 * @event
			 * @name copy_node.jstree
			 * @param {Object} node the copied node
			 * @param {Object} original the original node
			 * @param {String} parent the parent's ID
			 * @param {Number} position the position of the node among the parent's children
			 * @param {String} old_parent the old parent of the node
			 * @param {Boolean} is_multi do the node and new parent belong to different instances
			 * @param {jsTree} old_instance the instance the node came from
			 * @param {jsTree} new_instance the instance of the new parent
			 */
			this.trigger('copy_node', {
				"node": tmp,
				"original": obj,
				"parent": new_par.id,
				"position": pos,
				"old_parent": old_par,
				'is_multi': (old_ins && old_ins._id && old_ins._id !== this._id),
				'is_foreign': (!old_ins || !old_ins._id),
				'old_instance': old_ins,
				'new_instance': this
			});
			return tmp.id;
		},

		/**
		 * put a node in edit mode (input field to rename the node)
		 * @name edit(obj [, default_text])
		 * @param  {mixed} obj
		 * @param  {String} default_text the text to populate the input with (if omitted the node text value is used)
		 */
		edit: function (obj, default_text) {
			obj = this._open_to(obj);
			if (!obj || !obj.length) {
				return false;
			}
			var rtl = this._data.core.rtl,
				w = this.element.width(),
				a = obj.children('.jstree-anchor'),
				s = $('<span>'),
				/*!
				oi = obj.children("i:visible"),
				ai = a.children("i:visible"),
				w1 = oi.width() * oi.length,
				w2 = ai.width() * ai.length,
				*/
				t = typeof default_text === 'string' ? default_text : this.get_text(obj),
				h1 = $("<" + "div />", {
					css: {
						"position": "absolute",
						"top": "-200px",
						"left": (rtl ? "0px" : "-1000px"),
						"visibility": "hidden"
					}
				}).appendTo("body"),
				h2 = $("<" + "input />", {
					"value": t,
					"class": "jstree-rename-input",
					// "size" : t.length,
					"css": {
						"padding": "0",
						"border": "1px solid silver",
						"box-sizing": "border-box",
						"display": "inline-block",
						"height": (this._data.core.li_height) + "px",
						"lineHeight": (this._data.core.li_height) + "px",
						"width": "150px" // will be set a bit further down
					},
					"blur": $.proxy(function () {
						var i = s.children(".jstree-rename-input"),
							v = i.val();
						if (v === "") {
							v = t;
						}
						h1.remove();
						s.replaceWith(a);
						s.remove();
						this.set_text(obj, t);
						if (this.rename_node(obj, v) === false) {
							this.set_text(obj, t); // move this up? and fix #483
						}
					}, this),
					"keydown": function (event) {
						var key = event.which;
						if (key === 27) {
							this.value = t;
						}
						if (key === 27 || key === 13 || key === 37 || key === 38 || key === 39 || key === 40 || key === 32) {
							event.stopImmediatePropagation();
						}
						if (key === 27 || key === 13) {
							event.preventDefault();
							this.blur();
						}
					},
					"click": function (e) {
						e.stopImmediatePropagation();
					},
					"mousedown": function (e) {
						e.stopImmediatePropagation();
					},
					"keyup": function (event) {
						h2.width(Math.min(h1.text("pW" + this.value).width(), w));
					},
					"keypress": function (event) {
						if (event.which === 13) {
							return false;
						}
					}
				}),
				fn = {
					fontFamily: a.css('fontFamily') || '',
					fontSize: a.css('fontSize') || '',
					fontWeight: a.css('fontWeight') || '',
					fontStyle: a.css('fontStyle') || '',
					fontStretch: a.css('fontStretch') || '',
					fontVariant: a.css('fontVariant') || '',
					letterSpacing: a.css('letterSpacing') || '',
					wordSpacing: a.css('wordSpacing') || ''
				};
			this.set_text(obj, "");
			s.attr('class', a.attr('class')).append(a.contents().clone()).append(h2);
			a.replaceWith(s);
			h1.css(fn);
			h2.css(fn).width(Math.min(h1.text("pW" + h2[0].value).width(), w))[0].select();
		},
	};
}(jQuery);