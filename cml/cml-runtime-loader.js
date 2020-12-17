var bundle = require('./cml-runtime.bundle')

exports.load = load

function load (id, callback) {
	if (id === 'cml') {
		callback(bundle['default'])
	} else {
		callback()
	}
}
