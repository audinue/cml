var textLoader = require('./text-loader.js')
var cmlTransformer = require('./cml-transformer.js')

exports.create = create

function create (context) {
	return function (id, callback) {
		if (/\.cml$/.test(id)) {
			textLoader.load(id, function (text) {
				callback(cmlTransformer.transform(text, id, context))
			})
		} else {
			callback()
		}
	}
}
