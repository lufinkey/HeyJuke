
global.Buffer = require('buffer').Buffer;
global.process = require('react-native-process-shim');

String.prototype.startsWith = function(searchString, position) {
	position = (position != null) ? position : 0;
	return (this.substring(position, searchString.length) === searchString);
}
