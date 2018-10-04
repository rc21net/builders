'use strict';

var DefaultAssembler = {};

DefaultAssembler.assemble = function(assets) {
	var assembly = {
		code: '',
		map: ''
	};

	assets.forEach(function(asset) {
		assembly.code += asset.compiledText;
	});
	return assembly;
};

module.exports = DefaultAssembler;