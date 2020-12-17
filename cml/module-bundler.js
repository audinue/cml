var resolver = require('./resolver.js')

exports.bundle = bundle

function bundle (id, loaders, callback) {
	var factories = {}
	var counter = { map: {}, count: 1 }
	counter.map[id] = 0
	preload(id, loaders, factories, counter, {}, function () {
		var modules = Array(counter.count)
		for (var id in factories) {
			modules[counter.map[id]] = factories[id]
		}
		callback('(function(f){'
			+ 'var M={};'
			+ 'function r(i){'
				+ 'var m=M[i];'
				+ 'if(!m){'
					+ 'm=M[i]={exports:{}};'
					+ 'f[i](m,m.exports,r)'
				+ '}'
				+ 'return m.exports'
			+ '}'
			+ 'if(typeof module==="object"&&module.exports){'
				+ 'module.exports=r(0)'
			+ '}else{'
				+ 'r(0)'
			+ '}'
		+ '})([' + modules + '])')
	})
}

function preload (id, loaders, factories, counter, preloading, callback) {
	if (id in preloading) {
		callback()
	} else {
		preloading[id] = true
		load(id, loaders, 0, function (code) {
			var module = transform(id, code, counter)
			factories[id] = module.factory
			if (module.children.length === 0) {
				callback()
			} else {
				var preloaded = 0
				for (var i = 0; i < module.children.length; i++) {
					preload(module.children[i], loaders, factories, counter, preloading, function () {
						if (++preloaded === module.children.length) {
							callback()
						}
					})
				}
			}
		})
	}
}

function load (id, loaders, i, callback) {
	if (i < loaders.length) {
		loaders[i](id, function (code) {
			if (code === undefined) {
				load(id, loaders, i + 1, callback)
			} else {
				callback(code)
			}
		})
	} else {
		throw new Error('No loader for "' + id + '"')
	}
}

function transform (id, code, counter) {
	var children = []
	var regExp = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"])*"|'(?:\\.|[^'])*')|\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g
	var factory = 'function(module,exports,require){'
		+ code.replace(regExp, function (substring, skip, path) {
			if (skip) {
				return skip
			} else {
				var child = resolver.resolve(path, id)
				children.push(child)
				var index = child in counter.map
					? counter.map[child]
					: counter.map[child] = counter.count++
				return 'require(' + index + ')'
			}
		})
		+ '\n}'
	return { 
		factory: factory,
		children: children 
	}
}
