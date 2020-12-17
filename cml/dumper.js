var quoter = require('./quoter.js')

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
