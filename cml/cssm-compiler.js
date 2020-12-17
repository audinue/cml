var resolver = require('./resolver.js')

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
