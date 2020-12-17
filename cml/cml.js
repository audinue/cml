(function(f){var M={};function r(i){var m=M[i];if(!m){m=M[i]={exports:{}};f[i](m,m.exports,r)}return m.exports}if(typeof module==="object"&&module.exports){module.exports=r(0)}else{r(0)}})([function(module,exports,require){var moduleBundler = require(1)
var cssmCompiler = require(2)
var cmlRuntimeLoader = require(3)
var cmlLoader = require(4)
var textLoader = require(5)
var bootstrapGenerator = require(6)
var resolver = require(7)

var main = getMain()
if (!main) {
	throw new Error('Missing main.')
} else {
	var context = cssmCompiler.Context()
	moduleBundler.bundle('bootstrap', [
		loadBootstrap,
		cmlRuntimeLoader.load,
		cmlLoader.create(context),
		textLoader.load
	], function (code) {
		var css = context.styles.join('')
		var style = document.createElement('style')
		var head = document.head || document.getElementsByTagName('head')[0]
		head.appendChild(style)
		if (style.styleSheet) {
			style.styleSheet.cssText = css
		} else {
			style.appendChild(document.createTextNode(css))
		}
		new Function(code)()
	})
}

function loadBootstrap (id, callback) {
	if (id === 'bootstrap') {
		callback(
			bootstrapGenerator.generate(
				resolver.resolve(main, location.href)
			)
		)
	} else {
		callback()
	}
}

function getMain () {
	var scripts = document.getElementsByTagName('script')
	for (var i = scripts.length - 1; i > -1; i--) {
		var script = scripts[i]
		var main = script.getAttribute('main')
		if (main) {
			return main
		}
	}
	return null
}

},function(module,exports,require){var resolver = require(7)

exports.bundle = bundle

function bundle (id, loaders, callback) {
	var factories = {}
	var counter = { map: {}, count: 1 }
	counter.map[id] = 0
	preload(id, loaders, factories, counter, {}, function () {
		var modules = Array(counter.count)
		for (var id in factories) {
			modules[counter.map[id]] = factories[id]
		}
		callback('(function(f){'
			+ 'var M={};'
			+ 'function r(i){'
				+ 'var m=M[i];'
				+ 'if(!m){'
					+ 'm=M[i]={exports:{}};'
					+ 'f[i](m,m.exports,r)'
				+ '}'
				+ 'return m.exports'
			+ '}'
			+ 'if(typeof module==="object"&&module.exports){'
				+ 'module.exports=r(0)'
			+ '}else{'
				+ 'r(0)'
			+ '}'
		+ '})([' + modules + '])')
	})
}

function preload (id, loaders, factories, counter, preloading, callback) {
	if (id in preloading) {
		callback()
	} else {
		preloading[id] = true
		load(id, loaders, 0, function (code) {
			var module = transform(id, code, counter)
			factories[id] = module.factory
			if (module.children.length === 0) {
				callback()
			} else {
				var preloaded = 0
				for (var i = 0; i < module.children.length; i++) {
					preload(module.children[i], loaders, factories, counter, preloading, function () {
						if (++preloaded === module.children.length) {
							callback()
						}
					})
				}
			}
		})
	}
}

function load (id, loaders, i, callback) {
	if (i < loaders.length) {
		loaders[i](id, function (code) {
			if (code === undefined) {
				load(id, loaders, i + 1, callback)
			} else {
				callback(code)
			}
		})
	} else {
		throw new Error('No loader for "' + id + '"')
	}
}

function transform (id, code, counter) {
	var children = []
	var regExp = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"])*"|'(?:\\.|[^'])*')|\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g
	var factory = 'function(module,exports,require){'
		+ code.replace(regExp, function (substring, skip, path) {
			if (skip) {
				return skip
			} else {
				var child = resolver.resolve(path, id)
				children.push(child)
				var index = child in counter.map
					? counter.map[child]
					: counter.map[child] = counter.count++
				return 'require(' + index + ')'
			}
		})
		+ '\n}'
	return { 
		factory: factory,
		children: children 
	}
}

},function(module,exports,require){var resolver = require(7)

exports.Context = Context
exports.compile = compile

function Context () {
	return {
		styles: []
	}
}

function compile (css, id, context) {
	var classes = {}
	var animations = {}
	var components = []
	var regExp = /(\/\*[\s\S]*\*\/)|([a-z0-9_-]+)?\.([a-z0-9_-]+)|@keyframes\s+([a-z0-9_-]+)|url\s*\(\s*['"]?([^'")]+)['"]?\)/ig
	var style = css
		.replace(
			regExp,
			function (substring, comment, tag, className, animationName, path) {
				if (comment) {
					return comment
				} else if (className) {
					var classId = classes[className]
					if (!classId) {
						classId = classes[className] = generateId(className)
					}
					if (/^[A-Z]/.test(className)) {
						components.push({
							tag: tag || 'div',
							name: className,
							id: classId
						})
					}
					return (tag || '') + '.' + classId
				} else if (animationName) {
					var animationId = animations[animationName]
					if (!animationId) {
						animationId = animations[animationName] = generateId(animationName)
					}
					return '@keyframes ' + animationId
				} else {
					return 'url(' + resolver.resolve(path, id) + ')'
				}
			}
		)
		.replace(
			/(\/\*[\s\S]*\*\/)|(animation(?:-name)?\s*:\s*)([a-z0-9_-]+)/ig,
			function (substring, comment, prefix, animationName) {
				if (comment) {
					return comment
				} else {
					if (animationName in animations) {
						return prefix + animations[animationName]
					} else {
						return prefix + animationName
					}
				}
			}
		)
	context.styles.push(style)
	return {
		classes: classes,
		animations: animations,
		components: components
	}
}

function generateId (prefix) {
	var id = [prefix]
	for (var i = 0; i < 8; i++) {
		id.push(Math.floor(Math.random() * 256).toString(36))
	}
	return id.join('')
}

},function(module,exports,require){var bundle = require(9)

exports.load = load

function load (id, callback) {
	if (id === 'cml') {
		callback(bundle['default'])
	} else {
		callback()
	}
}

},function(module,exports,require){var textLoader = require(5)
var cmlTransformer = require(8)

exports.create = create

function create (context) {
	return function (id, callback) {
		if (/\.cml$/.test(id)) {
			textLoader.load(id, function (text) {
				callback(cmlTransformer.transform(text, id, context))
			})
		} else {
			callback()
		}
	}
}

},function(module,exports,require){exports.load = load

function load (id, callback) {
	var xhr
	if (window.XMLHttpRequest) {
		xhr = new XMLHttpRequest()
	} else {
		xhr = new ActiveXObject('Microsoft.XMLHTTP')
	}
	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			callback(xhr.responseText)
		}
	}
	xhr.open('GET', id, true)
	xhr.send(null)
}

},function(module,exports,require){var quoter = require(10)

exports.generate = generate

function generate (main) {
	return 'var m=require(' + quoter.quote(main) + ');'
		+ 'var C=require("cml");'
		+ 'C.ready(function(){'
			+ 'C.mount(document.body,function(){'
				+ 'return C.h(m["default"])'
			+ '},C.context)'
		+ '})'
}

},function(module,exports,require){exports.resolve = resolve

function resolve (path, base) {
	if (path.charAt(0) === '.') {
		path = base.replace(/[^/]+$/, '') + path
		path = path.replace(/[^/]+\/\.\.\/|\.\//g, '')
	} else if (path.charAt(0) === '/') {
		var match = base.match(/https?:\/\/[^\/]+/)
		if (match) {
			path = match[0] + path
		} else {
			path = path.substr(1)
		}
	}
	return path
}

},function(module,exports,require){var cssmCompiler = require(2)
var xmlParser = require(11)
var quoter = require(10)
var dumper = require(12)

var ELEMENT = 1
var TEXT = 3

exports.transform = transform

function transform (cml, id, context) {
	return Module(
		xmlParser.parse('<component>' + cml + '</component>').documentElement,
		id,
		context
	)
}

function Module (module, id, context) {
	var code = 'var Cml=' + ['require'] + '("cml");'
	code += ModuleStyles(module.childNodes, id, context)
	code += ModuleComponents(module.childNodes, id, context)
	code += DefaultComponent(module, id, context)
	code += ModuleScripts(module.childNodes)
	return code
}

function ModuleStyles (children, id, context) {
	var css = ''
	for (var i = 0; i < children.length; i++) {
		var child = children[i]
		if (child.nodeName === 'style') {
			var scope = child.getAttribute('scope')
			if (scope === 'module') {
				css += child.firstChild.nodeValue
			}
		}
	}
	var result = cssmCompiler.compile(css, id, context)
	var code = 'var classes=' + dumper.dump(result.classes) + ',classes0=classes;'
		+ 'var animations=' + dumper.dump(result.animations) + ',animations0=animations;'
	for (i = 0; i < result.components.length; i++) {
		var component = result.components[i]
		code += 'exports.' + component.name + '=' + component.name + ';'
			+ 'function ' + component.name + '(){'
				+ 'return function(props,children){'
					+ 'props["class"]=props["class"]'
						+ '?props["class"]+" "+' + quoter.quote(component.id) 
						+ ':' + quoter.quote(component.id) + ';'
					+ 'return Cml.h(' + quoter.quote(component.tag) + ',props,children)'
				+ '}'
			+ '}'
	}
	return code
}

function ModuleComponents (children, id, context) {
	var code = ''
	for (var i = 0; i < children.length; i++) {
		var child = children[i]
		if (child.nodeName === 'component') {
			var scope = child.getAttribute('scope')
			if (scope === 'module') {
				var name = child.getAttribute('name')
				code += 'exports.' + name + '=' + name + ';'
				code += Component(child, id, context, 1)
			}
		}
	}
	return code
}

function DefaultComponent (module, id, context) {
	return 'exports["default"]=' + Component(module, id, context, 1)
}

function Component (component, id, context, level) {
	var code = 'function'
	var name = component.getAttribute('name')
	if (name) {
		code += ' ' + name
	}
	code += '(){'
	code += CreateStyles(component.childNodes, id, context, level)
	code += CreateComponents(component.childNodes, id, context, level + 1)
	code += CreateScripts(component.childNodes)
	code += 'return function(props,children){'
	code += RenderScripts(component.childNodes)
	code += 'return['
	code += Children(component.childNodes)
	code += ']}}'
	return code
}

function CreateStyles (children, id, context, level) {
	var css = ''
	for (var i = 0; i < children.length; i++) {
		var child = children[i]
		if (child.nodeName === 'style') {
			var scope = child.getAttribute('scope')
			if (!scope || scope === 'create') {
				css += child.firstChild.nodeValue
			}
		}
	}
	var result = cssmCompiler.compile(css, id, context)
	var code = 'var classes=Cml.assign({},classes' + (level - 1) + ',' + dumper.dump(result.classes) + '),classes' + level + '=classes;'
		+ 'var animations=Cml.assign({},animations' + (level - 1) + ',' + dumper.dump(result.animations) + '),animations' + level + '=animations;'
	for (i = 0; i < result.components.length; i++) {
		var component = result.components[i]
		code += 'function ' + component.name + '(){'
				+ 'return function(props,children){'
					+ 'props["class"]=props["class"]'
						+ '?props["class"]+" "+' + quoter.quote(component.id) 
						+ ':' + quoter.quote(component.id) + ';'
					+ 'return Cml.h(' + quoter.quote(component.tag) + ',props,children)'
				+ '}'
			+ '}'
	}
	return code
}

function CreateComponents (children, id, context, level) {
	var code = ''
	for (var i = 0; i < children.length; i++) {
		var child = children[i]
		if (child.nodeName === 'component') {
			var scope = child.getAttribute('scope')
			if (!scope || scope === 'create') {
				code += Component(child, id, context, level)
			}
		}
	}
	return code
}

function ModuleScripts (children) {
	var code = ''
	for (var i = 0; i < children.length; i++) {
		var child = children[i]
		if (child.nodeName === 'script') {
			var scope = child.getAttribute('scope')
			if (scope === 'module') {
				code += child.firstChild.nodeValue + ';\n'
			}
		}
	}
	return code
}

function CreateScripts (children) {
	var code = ''
	for (var i = 0; i < children.length; i++) {
		var child = children[i]
		if (child.nodeName === 'script') {
			var scope = child.getAttribute('scope')
			if (!scope || scope === 'create') {
				code += child.firstChild.nodeValue + ';\n'
			}
		}
	}
	return code
}

function RenderScripts (children) {
	var code = ''
	for (var i = 0; i < children.length; i++) {
		var child = children[i]
		if (child.nodeName === 'script') {
			var scope = child.getAttribute('scope')
			if (scope === 'render') {
				code += child.firstChild.nodeValue + ';\n'
			}
		}
	}
	return code
}

function Children (children) {
	var result = []
	for (var i = 0; i < children.length; i++) {
		var child = children[i]
		if (!/^(component|style|script)$/.test(child.nodeName)) {
			if (child.nodeType === ELEMENT) {
				Element(child, result)
			} else if (child.nodeType === TEXT) {
				Text(child, result)
			}
		}
	}
	return result
}

function Element (element, result) {
	var code = ''
	code += If(element)
	code += EachBegin(element)
	code += 'Cml.h('
	if (/^[A-Z]|\./.test(element.nodeName)) {
		code += element.nodeName
	} else {
		code += quoter.quote(element.nodeName)
	}
	code += ',{'
	code += Attributes(element.attributes)
	code += '},['
	code += Children(element.childNodes)
	code += '])'
	code += EachEnd(element)
	result.push(code)
}

function If (element) {
	var query = element.getAttribute('if')
	if (query) {
		return '(' + query + ')&&'
	} else {
		return ''
	}
}

function EachBegin (element) {
	var query = element.getAttribute('each')
	if (query) {
		var match = query.match(/^\s*([a-z0-9_]+(?:\s*,\s*[a-z0-9_]+)?)\s+in\s+(.+)/i)
		if (match) {
			return 'Cml.each(' + match[2] + ',function(' + match[1] + '){'
				+ 'return '
		} else {
			throw new Error('Invalid each query: ' + query)			
		}
	} else {
		return ''
	}
}

function EachEnd (element) {
	var query = element.getAttribute('each')
	if (query) {
		return '})'
	} else {
		return ''
	}
}

function Attributes (attributes) {
	var result = []
	for (var i = 0; i < attributes.length; i++) {
		var attribute = attributes[i]
		if (!/^(if|each)$/.test(attribute.name)) {
			var code
			if (/^on/.test(attribute.name)) {
				code = Event(attribute)
			} else {
				code = Attribute(attribute)
			}
			result.push(code)
		}
	}
	return result
}

function Event (attribute) {
	return attribute.name + ':function(event){' + attribute.value + '}'
}

function Attribute (attribute) {
	var code = quoter.quote(attribute.name) + ':'
	if (attribute.name === 'class') {
		code += 'Cml.replaceClass(classes,'
	} else if (attribute.name === 'style') {
		code += 'Cml.replaceAnimation(animations,'
	}
	if (attribute.value === '') {
		code += '""'
	} else {
		var result = []
		Text(attribute, result)
		code += result.join('+')
	}
	if (attribute.name === 'class' || attribute.name === 'style') {
		code += ')'
	}
	return code
}

function Text (text, result) {
	var regExp = /{{([\s\S]+?)}}/g
	var string = text.nodeValue
	var last
	while (true) {
		last = regExp.lastIndex
		var match = regExp.exec(string)
		if (match === null) {
			break
		}
		var before = string.substring(last, match.index)
		if (before !== '') {
			result.push(quoter.quote(before))			
		}
		result.push(match[1])
	}
	var after = string.substring(last)
	if (after !== '') {
		result.push(quoter.quote(after))		
	}
}

},function(module,exports,require){exports["default"]="(function(f){var M={};function r(i){var m=M[i];if(!m){m=M[i]={exports:{}};f[i](m,m.exports,r)}return m.exports}if(typeof module===\"object\"&&module.exports){module.exports=r(0)}else{r(0)}})([function(module,exports,require){var virtualDom = require(1)\nvar util = require(2)\n\nvar context = virtualDom.Context()\n\nexports.context = context\nexports.update = update\n\nexports.h = virtualDom.h\nexports.mount = virtualDom.mount\nexports.ready = util.ready\nexports.each = util.each\nexports.assign = util.assign\nexports.replaceClass = util.replaceClass\nexports.replaceAnimation = util.replaceAnimation\n\nfunction update () {\n	virtualDom.update(context)\n}\n\n},function(module,exports,require){exports.h = h\nexports.Context = Context\nexports.mount = mount\nexports.update = update\n\nvar COMPONENT = 1\nvar ELEMENT = 2\nvar TEXT = 3\n\nfunction h (tag, props, children) {\n	props = props || {}\n	children = [].slice.call(arguments, 2)\n	if (arguments.length > 1 && !(props instanceof Object && !(props instanceof Element))) {\n		children.unshift(props)\n		props = {}\n	}\n	return new Element(tag, props, flatten(children, []))\n}\n\nfunction flatten (children, result) {\n	for (var i = 0; i < children.length; i++) {\n		var child = children[i]\n		if (child instanceof Array) {\n			flatten(child, result)\n		} else {\n			if (!(child instanceof Element)) {\n				child = new Element(TEXT, child === null || child === undefined ? '' : child)\n			}\n			result.push(child)\n		}\n	}\n	return result\n}\n\nfunction Element (tag, props, children) {\n	this.tag = tag\n	this.props = props\n	this.children = children\n	this.type = tag === 3 ? TEXT : typeof tag === 'string' ? ELEMENT : COMPONENT\n	this.render = null\n	this.rendered = null\n}\n\nfunction patch (previousNodes, nextNodes, node, current, context) {\n	for (var i = 0; i < nextNodes.length; i++) {\n		if (i < previousNodes.length) {\n			var previous = previousNodes[i]\n			var next = nextNodes[i]\n			if (previous.tag !== next.tag) {\n				remove(previous)\n				if (!current.value) {\n					append(nextNodes, i, node, context)\n					break\n				} else {\n					var realized = realize(next, [], context)\n					for (var j = 0; j < realized.length; j++) {\n						node.insertBefore(realized[j], current.value)\n					}\n				}\n			} else {\n				if (previous.type === COMPONENT) {\n					next.render = previous.render\n					next.rendered = flatten([\n						next.render(next.props, next.children)\n					], [])\n					patch(previous.rendered, next.rendered, node, current, context)\n				} else if (previous.type === ELEMENT) {\n					for (var name in next.props) {\n						var value = next.props[name]\n						if (previous.props[name] !== value) {\n							if (name.substr(0, 2) === 'on') {\n								current.value[name] = function (value) {\n									return function (event) {\n										value.call(this, event)\n										update(context)\n									}\n								}(value)\n							} else {\n								current.value.setAttribute(name, value)\n							}\n						}\n					}\n					for (name in previous.props) {\n						if (!(name in next.props)) {\n							current.value.removeAttribute(name)\n						}\n					}\n					patch(previous.children, next.children, current.value, { value: current.value.firstChild }, context)\n					current.value = current.value.nextSibling\n				} else if (previous.type === TEXT) {\n					if (previous.props !== next.props) {\n						current.value.nodeValue = next.props\n					}\n					current.value = current.value.nextSibling\n				}\n			}\n		} else {\n			append(nextNodes, i, node, context)\n			break\n		}\n	}\n	if (previousNodes.length > nextNodes.length) {\n		while (current.value) {\n			var nextSibling = current.value.nextSibling\n			node.removeChild(current.value)\n			current.value = nextSibling\n		}\n	}\n}\n\nfunction append (next, start, node, context) {\n	for (var i = start; i < next.length; i++) {\n		var realized = realize(next[i], [], context)\n		for (var j = 0; j < realized.length; j++) {\n			node.appendChild(realized[j])\n		}\n	}\n}\n\nfunction remove (previous, node, current) {\n	if (previous.type === COMPONENT) {\n		for (var i = 0; i < previous.rendered.length; i++) {\n			node.removeChild(previous.rendered[i])\n		}\n	} else {\n		var nextSibling = current.value.nextSibling\n		node.removeChild(current.value)\n		current.value = nextSibling\n	}\n}\n\nfunction realize (node, result, context) {\n	var i\n	if (node.type === COMPONENT) {\n		node.render = node.tag()\n		node.rendered = flatten([node.render(node.props, node.children)], [])\n		for (i = 0; i < node.rendered.length; i++) {\n			realize(node.rendered[i], result, context)\n		}\n	} else if (node.type === ELEMENT) {\n		var element = document.createElement(node.tag)\n		for (var name in node.props) {\n			var value = node.props[name]\n			if (name.substr(0, 2) === 'on') {\n				element[name] = function (value) {\n					return function (event) {\n						value.call(this, event)\n						update(context)\n					}\n				}(value)\n			} else if (name === 'class') {\n				element.className = value\n			} else {\n				element.setAttribute(name, value)\n			}\n		}\n		for (i = 0; i < node.children.length; i++) {\n			var realized = realize(node.children[i], [], context)\n			for (var j = 0; j < realized.length; j++) {\n				element.appendChild(realized[j])\n			}\n		}\n		result.push(element)\n	} else  {\n		result.push(document.createTextNode(node.props))\n	}\n	return result\n}\n\nfunction Context () {\n	return { views: [], timeout: 0 }\n}\n\nfunction mount (root, render, context) {\n	root.innerHTML = ''\n	context.views.push({\n		root: root,\n		render: render,\n		rendered: []\n	})\n	update(context)\n}\n\nfunction update (context) {\n	clearTimeout(context.timeout)\n	context.timeout = setTimeout(function () {\n		for (var i = 0; i < context.views.length; i++) {\n			var view = context.views[i]\n			var rendered = flatten([\n				view.render()\n			], [])\n			patch(view.rendered, rendered, view.root, { value: view.root.firstChild }, context)\n			view.rendered = rendered\n		}\n	}, 16)\n}\n\n},function(module,exports,require){exports.ready = ready\nexports.each = each\nexports.assign = assign\nexports.replaceClass = replaceClass\nexports.replaceAnimation = replaceAnimation\n\nfunction ready (callback) {\n	if (document.readyState !== 'loading') {\n		callback()\n	} else if (document.addEventListener) {\n		document.addEventListener('DOMContentLoaded', callback, false)\n	} else {\n		attachEvent('onload', callback)\n	}\n}\n\nfunction each (array, callback) {\n	var result = []\n	for (var i = 0; i < array.length; i++) {\n		result.push(callback(array[i], i))\n	}\n	return result\n}\n\nfunction assign (target, source) {\n	var sources = [].slice.call(arguments, 1)\n	for (var i = 0; i < sources.length; i++) {\n		var source = sources[i]\n		for (var key in source) {\n			target[key] = source[key]\n		}\n	}\n	return target\n}\n\nfunction replaceClass (classes, string) {\n	string = String(string)\n	for (var name in classes) {\n		string = string.replace(new RegExp('\\\\b' + name + '\\\\b', 'g'), classes[name])\n	}\n	return string\n}\n\nfunction replaceAnimation (animations, string) {\n	string = String(string)\n	for (var name in animations) {\n		var regExp = new RegExp('(animation(?:-name)?\\\\s*:\\\\s*)\\\\b' + name + '\\\\b', 'g')\n		string = string.replace(regExp, '$1' + animations[name])\n	}\n	return string\n}\n\n}])"
},function(module,exports,require){exports.quote = quote

function quote (value) {
	value = value.replace(/[\\"\r\n]/g, function (char) {
		if (char === '\\') {
			return '\\\\'
		} else if (char === '"') {
			return '\\"'
		} else if (char === '\r') {
			return '\\r'
		} else if (char === '\n') {
			return '\\n'
		}
	})
	return '"' + value + '"'
}

},function(module,exports,require){exports.parse = parse

function parse (xml) {
	if (window.DOMParser) {
		return new DOMParser().parseFromString(xml, 'text/xml')
	} else {
		var doc = new ActiveXObject('Microsoft.XMLDOM')
		doc.async = false
		doc.loadXML(xml)
		return doc
	}
}

},function(module,exports,require){var quoter = require(10)

exports.dump = dump

function dump (value) {
	var output
	if (value instanceof Array) {
		output = '['
		for (var i = 0; i < value.length; i++) {
			if (i > 0) {
				output += ','
			}
			output += dump(value[i])
		}
		output += ']'
	} else if (value instanceof Object) {
		output = '{'
		var next = false
		for (var key in value) {
			if (next) {
				output += ','
			} else {
				next = true
			}
			output += quoter.quote(key) + ':' + dump(value[key])
		}
		output += '}'
	} else if (typeof value === 'string') {
		output = quoter.quote(value)
	} else {
		output = value
	}
	return output
}

}])