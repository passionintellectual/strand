/**
 * @license
 * Copyright (c) 2015 MediaMath Inc. All rights reserved.
 * This code may only be used under the BSD style license found at http://mediamath.github.io/strand/LICENSE.txt

*/
(function (scope) {

	function _isType(value, type) {
		return Object.prototype.toString.call(value).toLowerCase() === "[object "+type.toLowerCase()+"]";
	}

	function _clone(list) {
		if (list)
		return Array.prototype.slice.call(list);
	}

	function _getElementList(elementList, context) {
		context = context || document;

		if (_isType(elementList, "string") && context) {
			elementList = context.querySelectorAll(elementList);
		}
		return _clone(elementList);
	}

	function _filterAttributes(attribute, ignoreList) {
		if (!ignoreList) {
			return true;
		}
		return ignoreList.indexOf(attribute.name) === -1;
	}

	function _objectifyAttributes(element, ignoreList, includeInner) {
		var o = {},
			attr = _clone(element.attributes);
			if (attr) {
				attr.forEach(function(attribute) {
					if (_filterAttributes(attribute, ignoreList)) {
						try {
							o[attribute.name] = JSON.parse(attribute.value);
						} catch(e) {
							if (attribute.value === "") {
								o[attribute.name] = true; //assuming boolean
							} else {
								o[attribute.name] = attribute.value;
							}
						}
					}
				});
				if (element.innerHTML && includeInner) {
					o.inner = element.innerHTML;
				}
			}
		return o;
	}

	function _uniqueMerge() {
		var o = {},
		args = _clone(arguments);
		args.forEach(function(arg) {
			if (arg.length > 0)
				_pack(arg, o);
		});
		return _unpack(o);
	}

	function _pack(arr, obj) {
		if (arr.length === 0) return {};
		var i,
			o = obj || {},
			temp;
		for (i = arr.length - 1; i >= 0; i--) {
			temp = arr[i];
			o[temp.name] = temp.value;
		}
		return o;
	}

	function _unpack(obj) {
		var o = [];
		for(var i in obj) {
			o.push({
				name: i,
				value: obj[i]
			});
		}
		return o;
	}

	function _copy() {
		var args = _clone(arguments);
		var init = args.length > 1 ? args.shift() : {};
		return args.reduce(function(prev, cur) {
			if (_isType(cur,"object")) {
				for(var i in cur) {
					prev[i] = cur[i];
				}
			}
			return prev;
		}, init);
	}

	function _nodeInnerValue(nodeObj) {
		return nodeObj.value || nodeObj.inner;
	}

	function _nodeToParam(nodeObj) {
		return {
			name:nodeObj.name,
			value:_nodeInnerValue(nodeObj)
		};
	}

	function _compoundObserver(obj, observer) {
		for(var i in obj) {
			if (obj.hasOwnProperty(i)) {
				observer.addPath(obj, i);
				if (_isType(obj[i], "object")) {
					_compoundObserver(obj[i], observer);
				}
			}
		}
		return observer;
	}

	var DataUtils  = {

		clone: _clone,
		copy: _copy,
		isType: _isType,

		param: function(name, value) {
			return {
				name: name,
				value: value
			};
		},

		packParams: _pack,

		unpackParams: _unpack,

		// uniqueMergeParams: function() {
		// 	return _uniqueMerge.apply(this, arguments);
		// },

		uniqueMergeParams: _uniqueMerge,

		objectifyDistributedNodes: function(elementList, ignoreList) {

			function elements(n) {
				return n.nodeType === Node.ELEMENT_NODE;
			}

			elementList = _clone(elementList)
				.filter(elements);

			return elementList.reduce( function reducer(o, element) {
				var name = element.nodeName.toLowerCase();
				if (o[name] === undefined) o[name] = [];
				if (element.children.length > 0) {
					o[name] = _clone(element.children).reduce(reducer, {});
				} else {
					o[name].push( _objectifyAttributes(element, null, true) );
				}
				return o;
			}, {});
		},

		nodeInnerValue: _nodeInnerValue,
		nodeToParam: _nodeToParam,

		mergeParamLists: function() {
			var i,
				j,
				param,
				seen = {},
				o = [],
				list = [],
				args = _clone(arguments);

			for (i = args.length - 1; i >= 0; i--) {
				list = args[i];
				if (list && list.length) {
					for (j = list.length - 1; j >= 0; j--) {
						param = list[j];
						if (param && !seen[param.name || param]) {
							o.push(param);
							seen[param.name || param] = true;
						}
					}
				}
			}
			return o.reverse();
		},
	};

	scope.DataUtils = DataUtils;

})(window.StrandLib = window.StrandLib || {});
