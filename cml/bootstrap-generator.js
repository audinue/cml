var quoter = require('./quoter.js')

exports.generate = generate

function generate (main) {
	return 'var m=require(' + quoter.quote(main) + ');'
		+ 'var C=require("cml");'
		+ 'C.ready(function(){'
			+ 'C.mount(document.body,function(){'
				+ 'return C.h(m["default"])'
			+ '},C.context)'
		+ '})'
}
