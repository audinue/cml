exports.h = h
exports.Context = Context
exports.mount = mount
exports.update = update

var COMPONENT = 1
var ELEMENT = 2
var TEXT = 3

function h (tag, props, children) {
	props = props || {}
	children = [].slice.call(arguments, 2)
	if (arguments.length > 1 && !(props instanceof Object && !(props instanceof Element))) {
		children.unshift(props)
		props = {}
	}
	return new Element(tag, props, flatten(children, []))
}

function flatten (children, result) {
	for (var i = 0; i < children.length; i++) {
		var child = children[i]
		if (child instanceof Array) {
			flatten(child, result)
		} else {
			if (!(child instanceof Element)) {
				child = new Element(TEXT, child === null || child === undefined ? '' : child)
			}
			result.push(child)
		}
	}
	return result
}

function Element (tag, props, children) {
	this.tag = tag
	this.props = props
	this.children = children
	this.type = tag === 3 ? TEXT : typeof tag === 'string' ? ELEMENT : COMPONENT
	this.render = null
	this.rendered = null
}

function patch (previousNodes, nextNodes, node, current, context) {
	for (var i = 0; i < nextNodes.length; i++) {
		if (i < previousNodes.length) {
			var previous = previousNodes[i]
			var next = nextNodes[i]
			if (previous.tag !== next.tag) {
				remove(previous)
				if (!current.value) {
					append(nextNodes, i, node, context)
					break
				} else {
					var realized = realize(next, [], context)
					for (var j = 0; j < realized.length; j++) {
						node.insertBefore(realized[j], current.value)
					}
				}
			} else {
				if (previous.type === COMPONENT) {
					next.render = previous.render
					next.rendered = flatten([
						next.render(next.props, next.children)
					], [])
					patch(previous.rendered, next.rendered, node, current, context)
				} else if (previous.type === ELEMENT) {
					for (var name in next.props) {
						var value = next.props[name]
						if (previous.props[name] !== value) {
							if (name.substr(0, 2) === 'on') {
								current.value[name] = function (value) {
									return function (event) {
										value.call(this, event)
										update(context)
									}
								}(value)
							} else {
								current.value.setAttribute(name, value)
							}
						}
					}
					for (name in previous.props) {
						if (!(name in next.props)) {
							current.value.removeAttribute(name)
						}
					}
					patch(previous.children, next.children, current.value, { value: current.value.firstChild }, context)
					current.value = current.value.nextSibling
				} else if (previous.type === TEXT) {
					if (previous.props !== next.props) {
						current.value.nodeValue = next.props
					}
					current.value = current.value.nextSibling
				}
			}
		} else {
			append(nextNodes, i, node, context)
			break
		}
	}
	if (previousNodes.length > nextNodes.length) {
		while (current.value) {
			var nextSibling = current.value.nextSibling
			node.removeChild(current.value)
			current.value = nextSibling
		}
	}
}

function append (next, start, node, context) {
	for (var i = start; i < next.length; i++) {
		var realized = realize(next[i], [], context)
		for (var j = 0; j < realized.length; j++) {
			node.appendChild(realized[j])
		}
	}
}

function remove (previous, node, current) {
	if (previous.type === COMPONENT) {
		for (var i = 0; i < previous.rendered.length; i++) {
			node.removeChild(previous.rendered[i])
		}
	} else {
		var nextSibling = current.value.nextSibling
		node.removeChild(current.value)
		current.value = nextSibling
	}
}

function realize (node, result, context) {
	var i
	if (node.type === COMPONENT) {
		node.render = node.tag()
		node.rendered = flatten([node.render(node.props, node.children)], [])
		for (i = 0; i < node.rendered.length; i++) {
			realize(node.rendered[i], result, context)
		}
	} else if (node.type === ELEMENT) {
		var element = document.createElement(node.tag)
		for (var name in node.props) {
			var value = node.props[name]
			if (name.substr(0, 2) === 'on') {
				element[name] = function (value) {
					return function (event) {
						value.call(this, event)
						update(context)
					}
				}(value)
			} else if (name === 'class') {
				element.className = value
			} else {
				element.setAttribute(name, value)
			}
		}
		for (i = 0; i < node.children.length; i++) {
			var realized = realize(node.children[i], [], context)
			for (var j = 0; j < realized.length; j++) {
				element.appendChild(realized[j])
			}
		}
		result.push(element)
	} else  {
		result.push(document.createTextNode(node.props))
	}
	return result
}

function Context () {
	return { views: [], timeout: 0 }
}

function mount (root, render, context) {
	root.innerHTML = ''
	context.views.push({
		root: root,
		render: render,
		rendered: []
	})
	update(context)
}

function update (context) {
	clearTimeout(context.timeout)
	context.timeout = setTimeout(function () {
		for (var i = 0; i < context.views.length; i++) {
			var view = context.views[i]
			var rendered = flatten([
				view.render()
			], [])
			patch(view.rendered, rendered, view.root, { value: view.root.firstChild }, context)
			view.rendered = rendered
		}
	}, 16)
}
