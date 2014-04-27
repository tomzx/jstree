+function($) {
	'use strict';

	// helpers
	$.vakata = {};
	// reverse
	$.fn.vakata_reverse = [].reverse;
	// collect attributes
	$.vakata.attributes = function (node, with_values) {
		node = $(node)[0];
		var attr = with_values ? {} : [];
		if (node && node.attributes) {
			$.each(node.attributes, function (i, v) {
				if ($.inArray(v.nodeName.toLowerCase(), ['style', 'contenteditable', 'hasfocus', 'tabindex']) !== -1) {
					return;
				}
				if (v.nodeValue !== null && $.trim(v.nodeValue) !== '') {
					if (with_values) {
						attr[v.nodeName] = v.nodeValue;
					} else {
						attr.push(v.nodeName);
					}
				}
			});
		}
		return attr;
	};
	$.vakata.array_unique = function (array) {
		var a = [],
			i, j, l;
		for (i = 0, l = array.length; i < l; i++) {
			for (j = 0; j <= i; j++) {
				if (array[i] === array[j]) {
					break;
				}
			}
			if (j === i) {
				a.push(array[i]);
			}
		}
		return a;
	};
	// remove item from array
	$.vakata.array_remove = function (array, from, to) {
		var rest = array.slice((to || from) + 1 || array.length);
		array.length = from < 0 ? array.length + from : from;
		array.push.apply(array, rest);
		return array;
	};
	// remove item from array
	$.vakata.array_remove_item = function (array, item) {
		var tmp = $.inArray(item, array);
		return tmp !== -1 ? $.vakata.array_remove(array, tmp) : array;
	};
	// browser sniffing
	(function () {
		var browser = {},
			b_match = function (ua) {
				ua = ua.toLowerCase();

				var match = /(chrome)[ \/]([\w.]+)/.exec(ua) ||
					/(webkit)[ \/]([\w.]+)/.exec(ua) ||
					/(opera)(?:.*version|)[ \/]([\w.]+)/.exec(ua) ||
					/(msie) ([\w.]+)/.exec(ua) ||
					(ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec(ua)) || [];
				return {
					browser: match[1] || "",
					version: match[2] || "0"
				};
			},
			matched = b_match(window.navigator.userAgent);
		if (matched.browser) {
			browser[matched.browser] = true;
			browser.version = matched.version;
		}
		if (browser.chrome) {
			browser.webkit = true;
		} else if (browser.webkit) {
			browser.safari = true;
		}
		$.vakata.browser = browser;
	}());
	if ($.vakata.browser.msie && $.vakata.browser.version < 8) {
		$.jstree.defaults.core.animation = 0;
	}
}(jQuery);