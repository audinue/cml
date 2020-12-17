var fs = require('fs')
var http = require('http')
var moduleBundler = require('./module-bundler.js')
var resolver = require('./resolver.js')
var quoter = require('./quoter.js')

moduleBundler.bundle(
	resolver.resolve('./bootstrap.js', '.'),
	[loadBundle, loadFile],
	function (js) {
		fs.writeFile('cml.js', js, function () {})
	}
)

function loadBundle (id, callback) {
	if (/\.bundle$/.test(id)) {
		moduleBundler.bundle(
			id.replace(/bundle$/, 'js'),
			[loadFile],
			function (js) {
				callback('exports["default"]=' + quoter.quote(js))
			}
		)
	} else {
		callback()
	}
}

function loadFile (id, callback) {
	fs.readFile(id, 'utf8', function (err, data) {
		if (err) {
			callback('throw new Error("Unable to load ' + id + '")')
		} else {
			callback(data)
		}
	})
}
