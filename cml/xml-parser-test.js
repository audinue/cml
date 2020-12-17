var xmlParser = require('./xml-parser.js')

alert(typeof Node)
alert(xmlParser.parse('<x><y>Hello world!</y></x>').documentElement.firstChild.firstChild.nodeType)
