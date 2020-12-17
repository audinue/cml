var cssmCompiler = require('./cssm-compiler.js')
var dumper = require('./dumper.js')

var context = cssmCompiler.Context()

alert(dumper.dump(cssmCompiler.compile(
	'.foo { color: red }'
	+ '.bar { background: url("./zaa.png") }'
	+ '.Baz { color: blue }',
	location.href,
	context
)))

alert(dumper.dump(context))
