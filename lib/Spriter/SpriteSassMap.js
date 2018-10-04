/**
 * Create sass map from sprite object
 * @param sprites
 * @param mapName
 * @returns {string|*}
 * @constructor
 */
function SpriteSassMap(sprites, mapName) {
	this.outputString;
	var symbols = {
			n: '\n',
			tab: '\t',
			openMap: '(',
			closeMap: ')',
			var: '$',
			init: ': ',
			listDelimiter: ' ',
			comma: ',',
			semicolon: ';',
			quote: '"'
		};

	this.outputString = makeVar(mapName) + makeMap(sprites) + symbols.semicolon + symbols.n;

	function makeVar(str) {
		return symbols.var + str + symbols.init;
	}

	function makeMap(sprites, level) {

		var level = level || 0;

		var s;
		s = symbols.openMap + symbols.n; // (

		var kIndex = 0;
		for (var k in sprites) {
			kIndex++;
			s += repeater(symbols.tab, level + 1); // \t
			s += k + symbols.init; // :_

			s += makeValue(sprites[k], level);

			if (kIndex != Object.keys(sprites).length) {
				s += symbols.comma;
			}
			s += symbols.n;
		}

		s += repeater(symbols.tab, level) + symbols.closeMap;

		return s;
	}

	function makeList(a, level) {
		var s;

		s = symbols.openMap;

		for (var i = 0; i < a.length; i++) {
			s += makeValue(a[i], level) + symbols.listDelimiter;
		}

		s += symbols.closeMap;

		return s;
	}

	function makeValue(value, level) {
		var s;
		switch (typeof value) {
			case 'string':
				s = symbols.quote + value + symbols.quote;
				break;
			case 'number':
				s = value;
				break;
			case 'array':
				s = makeList(value);
				break;
			case 'object':
				s = makeMap(value, level + 1);
				break;
		}
		return s;
	}

	function repeater(string, times) {
		var s = '';
		for (var i = 0; i < times; i++) {
			s += string;
		}
		return s;
	}

	this.toString = function() {
		return this.outputString;
	}
}

module.exports = SpriteSassMap;