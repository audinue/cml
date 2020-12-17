exports.load = load

function load (id, callback) {
	var xhr
	if (window.XMLHttpRequest) {
		xhr = new XMLHttpRequest()
	} else {
		xhr = new ActiveXObject('Microsoft.XMLHTTP')
	}
	xhr.onreadystatechange = function () {
		if (xhr.readyState === 4) {
			callback(xhr.responseText)
		}
	}
	xhr.open('GET', id, true)
	xhr.send(null)
}
