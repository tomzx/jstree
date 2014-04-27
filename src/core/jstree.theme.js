+function($) {
	'use strict';

	$.extend($.jstree.core.prototype, {
		/**
		 * changes the theme
		 * @name set_theme(theme_name [, theme_url])
		 * @param {String} theme_name the name of the new theme to apply
		 * @param {mixed} theme_url  the location of the CSS file for this theme. Omit or set to `false` if you manually included the file. Set to `true` to autoload from the `core.themes.dir` directory.
		 * @trigger set_theme.jstree
		 */
		set_theme: function (theme_name, theme_url) {
			if (!theme_name) {
				return false;
			}
			if (theme_url === true) {
				var dir = this.settings.core.themes.dir;
				if (!dir) {
					dir = $.jstree.path + '/themes';
				}
				theme_url = dir + '/' + theme_name + '/style.css';
			}
			if (theme_url && $.inArray(theme_url, $.jstree._internal.themes_loaded) === -1) {
				$('head').append('<' + 'link rel="stylesheet" href="' + theme_url + '" type="text/css" />');
				$.jstree._internal.themes_loaded.push(theme_url);
			}
			if (this._data.core.themes.name) {
				this.element.removeClass('jstree-' + this._data.core.themes.name);
			}
			this._data.core.themes.name = theme_name;
			this.element.addClass('jstree-' + theme_name);
			this.element[this.settings.core.themes.responsive ? 'addClass' : 'removeClass']('jstree-' + theme_name + '-responsive');
			/**
			 * triggered when a theme is set
			 * @event
			 * @name set_theme.jstree
			 * @param {String} theme the new theme
			 */
			this.trigger('set_theme', {
				'theme': theme_name
			});
		},
		/**
		 * gets the name of the currently applied theme name
		 * @name get_theme()
		 * @return {String}
		 */
		get_theme: function () {
			return this._data.core.themes.name;
		},
		/**
		 * changes the theme variant (if the theme has variants)
		 * @name set_theme_variant(variant_name)
		 * @param {String|Boolean} variant_name the variant to apply (if `false` is used the current variant is removed)
		 */
		set_theme_variant: function (variant_name) {
			if (this._data.core.themes.variant) {
				this.element.removeClass('jstree-' + this._data.core.themes.name + '-' + this._data.core.themes.variant);
			}
			this._data.core.themes.variant = variant_name;
			if (variant_name) {
				this.element.addClass('jstree-' + this._data.core.themes.name + '-' + this._data.core.themes.variant);
			}
		},
		/**
		 * gets the name of the currently applied theme variant
		 * @name get_theme()
		 * @return {String}
		 */
		get_theme_variant: function () {
			return this._data.core.themes.variant;
		},
		/**
		 * shows a striped background on the container (if the theme supports it)
		 * @name show_stripes()
		 */
		show_stripes: function () {
			this._data.core.themes.stripes = true;
			this.get_container_ul().addClass("jstree-striped");
		},
		/**
		 * hides the striped background on the container
		 * @name hide_stripes()
		 */
		hide_stripes: function () {
			this._data.core.themes.stripes = false;
			this.get_container_ul().removeClass("jstree-striped");
		},
		/**
		 * toggles the striped background on the container
		 * @name toggle_stripes()
		 */
		toggle_stripes: function () {
			if (this._data.core.themes.stripes) {
				this.hide_stripes();
			} else {
				this.show_stripes();
			}
		},
		/**
		 * shows the connecting dots (if the theme supports it)
		 * @name show_dots()
		 */
		show_dots: function () {
			this._data.core.themes.dots = true;
			this.get_container_ul().removeClass("jstree-no-dots");
		},
		/**
		 * hides the connecting dots
		 * @name hide_dots()
		 */
		hide_dots: function () {
			this._data.core.themes.dots = false;
			this.get_container_ul().addClass("jstree-no-dots");
		},
		/**
		 * toggles the connecting dots
		 * @name toggle_dots()
		 */
		toggle_dots: function () {
			if (this._data.core.themes.dots) {
				this.hide_dots();
			} else {
				this.show_dots();
			}
		},
		/**
		 * show the node icons
		 * @name show_icons()
		 */
		show_icons: function () {
			this._data.core.themes.icons = true;
			this.get_container_ul().removeClass("jstree-no-icons");
		},
		/**
		 * hide the node icons
		 * @name hide_icons()
		 */
		hide_icons: function () {
			this._data.core.themes.icons = false;
			this.get_container_ul().addClass("jstree-no-icons");
		},
		/**
		 * toggle the node icons
		 * @name toggle_icons()
		 */
		toggle_icons: function () {
			if (this._data.core.themes.icons) {
				this.hide_icons();
			} else {
				this.show_icons();
			}
		},
		/**
		 * set the node icon for a node
		 * @name set_icon(obj, icon)
		 * @param {mixed} obj
		 * @param {String} icon the new icon - can be a path to an icon or a className, if using an image that is in the current directory use a `./` prefix, otherwise it will be detected as a class
		 */
		set_icon: function (obj, icon) {
			var t1, t2, dom, old;
			if ($.isArray(obj)) {
				obj = obj.slice();
				for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.set_icon(obj[t1], icon);
				}
				return true;
			}
			obj = this.get_node(obj);
			if (!obj || obj.id === '#') {
				return false;
			}
			old = obj.icon;
			obj.icon = icon;
			dom = this.get_node(obj, true).children(".jstree-anchor").children(".jstree-themeicon");
			if (icon === false) {
				this.hide_icon(obj);
			} else if (icon === true) {
				dom.removeClass('jstree-themeicon-custom ' + old).css("background", "").removeAttr("rel");
			} else if (icon.indexOf("/") === -1 && icon.indexOf(".") === -1) {
				dom.removeClass(old).css("background", "");
				dom.addClass(icon + ' jstree-themeicon-custom').attr("rel", icon);
			} else {
				dom.removeClass(old).css("background", "");
				dom.addClass('jstree-themeicon-custom').css("background", "url('" + icon + "') center center no-repeat").attr("rel", icon);
			}
			return true;
		},
		/**
		 * get the node icon for a node
		 * @name get_icon(obj)
		 * @param {mixed} obj
		 * @return {String}
		 */
		get_icon: function (obj) {
			obj = this.get_node(obj);
			return (!obj || obj.id === '#') ? false : obj.icon;
		},
		/**
		 * hide the icon on an individual node
		 * @name hide_icon(obj)
		 * @param {mixed} obj
		 */
		hide_icon: function (obj) {
			var t1, t2;
			if ($.isArray(obj)) {
				obj = obj.slice();
				for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.hide_icon(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if (!obj || obj === '#') {
				return false;
			}
			obj.icon = false;
			this.get_node(obj, true).children("a").children(".jstree-themeicon").addClass('jstree-themeicon-hidden');
			return true;
		},
		/**
		 * show the icon on an individual node
		 * @name show_icon(obj)
		 * @param {mixed} obj
		 */
		show_icon: function (obj) {
			var t1, t2, dom;
			if ($.isArray(obj)) {
				obj = obj.slice();
				for (t1 = 0, t2 = obj.length; t1 < t2; t1++) {
					this.show_icon(obj[t1]);
				}
				return true;
			}
			obj = this.get_node(obj);
			if (!obj || obj === '#') {
				return false;
			}
			dom = this.get_node(obj, true);
			obj.icon = dom.length ? dom.children("a").children(".jstree-themeicon").attr('rel') : true;
			if (!obj.icon) {
				obj.icon = true;
			}
			dom.children("a").children(".jstree-themeicon").removeClass('jstree-themeicon-hidden');
			return true;
		}
	});
}(jQuery);