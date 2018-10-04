String.prototype.endsWith = function (suffix) {
	return this.indexOf(suffix, this.length - suffix.length) !== -1;
};

String.prototype.endsWithAny = function (endings) {
	var string = this;
	return endings.some(function (ending) {
		return string.endsWith(ending);
	});
};

String.prototype.startsWith = function (string){
	return this.indexOf(string) === 0;
};

String.prototype.toBoolOrString = function () {
	return this === 'true' ? true : this === 'false' ? false : this.toString();
};

String.prototype.stripUtfBom = function() {
	var string = this.toString();
	if (string.charCodeAt(0) === 0xFEFF) {
		string = string.slice(1);
	}
	return string;
};

String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
};

module.exports = String;