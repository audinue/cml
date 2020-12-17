var cssmCompiler = require('./cssm-compiler.js')
var xmlParser = require('./xml-parser.js')
var quoter = require('./quoter.js')
var dumper = require('./dumper.js')

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
