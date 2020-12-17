var virtualDom = require('./virtual-dom.js')
var util = require('./util.js')

var context = virtualDom.Context()

exports.context = context
exports.update = update

exports.h = virtualDom.h
exports.mount = virtualDom.mount
exports.ready = util.ready
exports.each = util.each
exports.assign = util.assign
exports.replaceClass = util.replaceClass
exports.replaceAnimation = util.replaceAnimation

function update () {
	virtualDom.update(context)
}
