var fs = require('fs')
var http = require('http')
var moduleBundler = require('./module-bundler.js')
var resolver = require('./resolver.js')
var quoter = require('./quoter.js')

http
	.createServer(function (req, res) {
		if (req.url === '/') {
			fs.readdir(__dirname, function (err, files) {
				if (err) {
					throw err
				}
				var html = '<ul>'
				for (var i = 0; i < files.length; i++) {
					var file = files[i]
					if (/\.(html|js)$/.test(file)) {
						html += '<li>'
						html += '<a href="' + file + '">' + file + '</a>'
						html += '</li>'
					}
				}
				html += '</ul>'
				res.writeHead(200, { 'Content-Type': 'text/html' })
				res.end(html)
			})
		} else if (/\.js.source$/.test(req.url)) {
			moduleBundler.bundle(
				resolver.resolve('.' + req.url.replace(/\.source/, ''), '.'),
				[loadBundle, loadFile],
				function (js) {
					res.writeHead(200, { 'Content-Type': 'application/javascript' })
					res.end(js)
				}
			)
		} else if (/\.js$/.test(req.url)) {
			moduleBundler.bundle(
				resolver.resolve('.' + req.url, '.'),
				[loadBundle, loadFile],
				function (js) {
					var html = '<script>'
					html += js
					html += '</script>'
					res.writeHead(200, { 'Content-Type': 'text/html' })
					res.end(html)
				}
			)
		} else {
			loadFile('.' + req.url, function (data) {
				res.writeHead(200, { 'Content-Type': 'text/html' })
				res.end(data)
			})
		}
	})
	.listen(1234, function () {
		console.log('Listening on 1234')
	})

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
