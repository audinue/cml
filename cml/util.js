exports.ready = ready
exports.each = each
exports.assign = assign
exports.replaceClass = replaceClass
exports.replaceAnimation = replaceAnimation

function ready (callback) {
	if (document.readyState !== 'loading') {
		callback()
	} else if (document.addEventListener) {
		document.addEventListener('DOMContentLoaded', callback, false)
	} else {
		attachEvent('onload', callback)
	}
}

function each (array, callback) {
	var result = []
	for (var i = 0; i < array.length; i++) {
		result.push(callback(array[i], i))
	}
	return result
}

function assign (target, source) {
	var sources = [].slice.call(arguments, 1)
	for (var i = 0; i < sources.length; i++) {
		var source = sources[i]
		for (var key in source) {
			target[key] = source[key]
		}
	}
	return target
}

function replaceClass (classes, string) {
	string = String(string)
	for (var name in classes) {
		string = string.replace(new RegExp('\\b' + name + '\\b', 'g'), classes[name])
	}
	return string
}

function replaceAnimation (animations, string) {
	string = String(string)
	for (var name in animations) {
		var regExp = new RegExp('(animation(?:-name)?\\s*:\\s*)\\b' + name + '\\b', 'g')
		string = string.replace(regExp, '$1' + animations[name])
	}
	return string
}
