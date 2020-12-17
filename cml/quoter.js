exports.quote = quote

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
