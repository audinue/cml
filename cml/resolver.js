exports.resolve = resolve

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
