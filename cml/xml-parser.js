exports.parse = parse

function parse (xml) {
	if (window.DOMParser) {
		return new DOMParser().parseFromString(xml, 'text/xml')
	} else {
		var doc = new ActiveXObject('Microsoft.XMLDOM')
		doc.async = false
		doc.loadXML(xml)
		return doc
	}
}
