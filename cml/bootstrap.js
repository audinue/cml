var moduleBundler = require('./module-bundler.js')
var cssmCompiler = require('./cssm-compiler.js')
var cmlRuntimeLoader = require('./cml-runtime-loader.js')
var cmlLoader = require('./cml-loader.js')
var textLoader = require('./text-loader.js')
var bootstrapGenerator = require('./bootstrap-generator.js')
var resolver = require('./resolver.js')

var main = getMain()
if (!main) {
	throw new Error('Missing main.')
} else {
	var context = cssmCompiler.Context()
	moduleBundler.bundle('bootstrap', [
		loadBootstrap,
		cmlRuntimeLoader.load,
		cmlLoader.create(context),
		textLoader.load
	], function (code) {
		var css = context.styles.join('')
		var style = document.createElement('style')
		var head = document.head || document.getElementsByTagName('head')[0]
		head.appendChild(style)
		if (style.styleSheet) {
			style.styleSheet.cssText = css
		} else {
			style.appendChild(document.createTextNode(css))
		}
		new Function(code)()
	})
}

function loadBootstrap (id, callback) {
	if (id === 'bootstrap') {
		callback(
			bootstrapGenerator.generate(
				resolver.resolve(main, location.href)
			)
		)
	} else {
		callback()
	}
}

function getMain () {
	var scripts = document.getElementsByTagName('script')
	for (var i = scripts.length - 1; i > -1; i--) {
		var script = scripts[i]
		var main = script.getAttribute('main')
		if (main) {
			return main
		}
	}
	return null
}
