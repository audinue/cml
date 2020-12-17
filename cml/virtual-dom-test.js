var h = require('./virtual-dom.js').h
var Context = require('./virtual-dom.js').Context
var mount = require('./virtual-dom.js').mount
var x = ''

function updateX () {
	x = this.value
}

function generate () {
	var result = []
	for (var i = 0; i < x.length; i++) {
		result.push(h('p', 'Item ', i))
	}
	return result
}

mount(document.body, function () {
	return [
		h('input', { onchange: updateX, onkeyup: updateX }),
		generate(),
		h('p', 'Hello ', x, '!')
	]
}, Context())
